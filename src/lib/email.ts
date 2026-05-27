import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY?.startsWith("re_")
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendInvitationEmail(
  to: string,
  inviteUrl: string
): Promise<void> {
  if (!resend) {
    // Resend not configured — log the link so it can be shared manually
    console.log(`[INVITE] ${to} → ${inviteUrl}`);
    return;
  }

  const from = process.env.EMAIL_FROM ?? "Craftr <noreply@craftr.app>";

  await resend.emails.send({
    from,
    to,
    subject: "You've been invited to Craftr",
    html: `
      <p>You've been invited to join Craftr, a crafting supply inventory app.</p>
      <p>
        <a href="${inviteUrl}" style="
          display:inline-block;
          background:#18181b;
          color:#fff;
          padding:10px 20px;
          border-radius:6px;
          text-decoration:none;
          font-weight:600;
        ">
          Accept invitation
        </a>
      </p>
      <p style="color:#888;font-size:12px;">
        This link expires in 7 days. If you didn't expect this email, ignore it.
      </p>
    `,
  });
}
