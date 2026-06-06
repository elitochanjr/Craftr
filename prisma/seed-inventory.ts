import XLSX from "xlsx";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import "dotenv/config";
import path from "path";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type Row = (string | number)[];

async function upsertCategory(name: string): Promise<string> {
  const cat = await prisma.category.upsert({
    where: { name },
    update: {},
    create: { name },
  });
  return cat.id;
}

async function createItem(data: {
  name: string;
  quantity: number;
  unit: string;
  categoryId: string;
  packSize?: number | null;
  notes?: string | null;
}): Promise<boolean> {
  const existing = await prisma.item.findFirst({
    where: { name: data.name, categoryId: data.categoryId },
  });
  if (existing) return false;
  await prisma.item.create({ data });
  return true;
}

async function importPaper(workbook: XLSX.WorkBook) {
  console.log("\n📄 Paper...");
  const categoryId = await upsertCategory("Paper");
  const rows = XLSX.utils.sheet_to_json<Row>(workbook.Sheets["Paper"], {
    header: 1,
    defval: "",
  });

  let created = 0;
  let skipped = 0;

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const name = String(row[0] ?? "").trim();
    if (!name) continue;

    const sheetsPerPack = Number(row[1]) || null;      // col B
    const totalPacks    = Number(row[6]) || 0;         // col G
    const unusedTotal   = Number(row[7]) || 0;         // col H — closed packs only
    const openSheets    = Number(row[3]) || 0;         // col D — sheets from open packs
    const notes         = String(row[9] ?? "").trim() || null;

    // OPP plastic packaging has no sheetsPerPack — track in packs
    const isPackOnly = !sheetsPerPack;
    const unit     = isPackOnly ? "pack" : "sheet";
    const packSize = isPackOnly ? null : sheetsPerPack;
    // true total = closed-pack sheets + any sheets remaining in open packs
    const quantity = isPackOnly ? totalPacks : unusedTotal + openSheets;

    const ok = await createItem({ name, quantity, unit, categoryId, packSize, notes });
    if (ok) {
      console.log(`  + ${name} (${quantity} ${unit}${packSize ? `, ${packSize}/pack` : ""})`);
      created++;
    } else {
      skipped++;
    }
  }

  return { created, skipped };
}

async function importMachines(workbook: XLSX.WorkBook) {
  console.log("\n🔧 Machines...");
  const rows = XLSX.utils.sheet_to_json<Row>(workbook.Sheets["Machine"], {
    header: 1,
    defval: "",
  });

  let created = 0;
  let skipped = 0;

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const name = String(row[0] ?? "").trim();
    if (!name) continue;

    const type = String(row[1] ?? "").trim() || "Tools";
    const quantity = Number(row[2]) || 1;
    const functioning = String(row[3] ?? "").trim().toLowerCase();
    const notes = functioning === "no" ? "Not functioning" : null;

    const categoryId = await upsertCategory("Tools");
    const ok = await createItem({ name, quantity, unit: "unit", categoryId, notes });
    if (ok) {
      console.log(`  + [${type}] ${name}`);
      created++;
    } else {
      skipped++;
    }
  }

  return { created, skipped };
}

async function importMiscellaneous(workbook: XLSX.WorkBook) {
  console.log("\n📦 Miscellaneous...");
  const rows = XLSX.utils.sheet_to_json<Row>(workbook.Sheets["Miscellanous"], {
    header: 1,
    defval: "",
  });

  let created = 0;
  let skipped = 0;

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const name = String(row[0] ?? "").trim();
    if (!name) continue;

    const type = String(row[1] ?? "").trim() || "Miscellaneous";
    const quantity = Number(row[2]) || 1;

    const categoryId = await upsertCategory(type);
    const ok = await createItem({ name, quantity, unit: "unit", categoryId });
    if (ok) {
      console.log(`  + [${type}] ${name}`);
      created++;
    } else {
      skipped++;
    }
  }

  return { created, skipped };
}

async function main() {
  const filePath = path.resolve("HappyNess-Originals-Inventory.xlsx");
  console.log(`Reading: ${filePath}`);
  const workbook = XLSX.readFile(filePath);

  const paper = await importPaper(workbook);
  const machines = await importMachines(workbook);
  const misc = await importMiscellaneous(workbook);

  const total = {
    created: paper.created + machines.created + misc.created,
    skipped: paper.skipped + machines.skipped + misc.skipped,
  };

  console.log(
    `\n✅ Done — created: ${total.created}, skipped (already exist): ${total.skipped}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
