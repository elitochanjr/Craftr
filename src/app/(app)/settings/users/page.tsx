import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { UsersView } from "@/components/settings/users/users-view";

export default async function UsersPage() {
  const session = await requireAdmin();

  const [users, pendingInvitations] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.invitation.findMany({
      where: { accepted: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <>
      <Header title="User Management" />
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h2 className="text-xl font-semibold tracking-tight mb-1">
              Users
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage who has access to Craftr and their roles.
            </p>
          </div>
          <UsersView
            users={users}
            pendingInvitations={pendingInvitations}
            currentUserId={session.user.id}
          />
        </div>
      </div>
    </>
  );
}
