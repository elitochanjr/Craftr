import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NotificationBell } from "@/components/layout/notification-bell";

interface HeaderProps {
  title: string;
}

export async function Header({ title }: HeaderProps) {
  const session = await auth();
  const notifications = session?.user?.id
    ? await prisma.notification.findMany({
        where: { userId: session.user.id, read: false },
        select: {
          id: true,
          message: true,
          createdAt: true,
          item: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      })
    : [];

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-background sticky top-0 z-40">
      <h1 className="font-semibold text-base">{title}</h1>
      <div className="flex items-center gap-2">
        <NotificationBell initialNotifications={notifications} />
      </div>
    </header>
  );
}
