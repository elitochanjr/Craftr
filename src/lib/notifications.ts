import { prisma } from "@/lib/prisma";
import { sendLowStockEmail } from "@/lib/email";

/**
 * Creates low-stock notifications for all users when an item crosses below its
 * threshold. Only fires when the event itself causes the crossing (oldQty >=
 * threshold AND newQty < threshold), so repeated usage below threshold doesn't
 * spam notifications. Notifications reset naturally when items are restocked
 * above threshold and then drop below again.
 */
export async function maybeNotifyLowStock(
  itemId: string,
  itemName: string,
  oldQty: number,
  newQty: number,
  threshold: number
): Promise<void> {
  if (oldQty < threshold || newQty >= threshold) return;

  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, role: true, email: true },
  });

  const message = `${itemName} is low on stock — ${newQty} remaining (threshold: ${threshold})`;

  await prisma.notification.createMany({
    data: users.map((u) => ({
      message,
      type: "LOW_STOCK" as const,
      userId: u.id,
      itemId,
    })),
  });

  const admins = users.filter((u) => u.role === "ADMIN");
  await Promise.all(
    admins.map((admin) =>
      sendLowStockEmail(admin.email, itemName, newQty, threshold, itemId).catch(
        (err) => console.error("[LOW_STOCK_EMAIL]", err)
      )
    )
  );
}
