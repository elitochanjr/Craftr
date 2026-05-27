import sharp from "sharp";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "public", "icons", "icon.svg");
const svgBuffer = readFileSync(svgPath);

async function generate(size, outName) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(root, "public", "icons", outName));
  console.log(`✓ Generated ${outName}`);
}

await generate(192, "icon-192.png");
await generate(512, "icon-512.png");
await generate(180, "apple-touch-icon.png");
