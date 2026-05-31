// Email notification using fetch to a simple email API.
// We use Resend for this.

export async function sendOverdueNotification(
  adminEmail: string,
  adminName: string,
  overdueCount: number,
  dueSoonCount: number,
  campusName: string,
) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not set, skipping email");
    return;
  }

  const subject =
    overdueCount > 0
      ? `⚠️ ${overdueCount} Overdue Payment${overdueCount > 1 ? "s" : ""} — ${campusName}`
      : `📅 ${dueSoonCount} Payment${dueSoonCount > 1 ? "s" : ""} Due This Week — ${campusName}`;

  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Exceed Training Center — Payment Alert</h2>
      <p>Hello ${adminName},</p>

      ${
        overdueCount > 0
          ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #dc2626; margin: 0 0 8px 0;">🔴 ${overdueCount} Overdue Payment${overdueCount > 1 ? "s" : ""}</h3>
          <p style="color: #7f1d1d; margin: 0;">
            ${overdueCount} student${overdueCount > 1 ? "s have" : " has"} overdue remaining payments at ${campusName}.
          </p>
        </div>
      `
          : ""
      }

      ${
        dueSoonCount > 0
          ? `
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #d97706; margin: 0 0 8px 0;">🟡 ${dueSoonCount} Payment${dueSoonCount > 1 ? "s" : ""} Due This Week</h3>
          <p style="color: #78350f; margin: 0;">
            ${dueSoonCount} student${dueSoonCount > 1 ? "s have" : " has"} remaining payments due within 7 days at ${campusName}.
          </p>
        </div>
      `
          : ""
      }

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/remaining"
         style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
        View Remaining Payments
      </a>

      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
        This is an automated notification from Exceed Training Center Management System.
      </p>
    </div>
  `;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Exceed Training Center <notifications@exceeddev.vercel.app>",
        to: adminEmail,
        subject,
        html: body,
      }),
    });
  } catch (error) {
    console.error("Failed to send email notification:", error);
  }
}
