import "server-only";

type EmailPayload = {
  to: string;
  name: string;
  subject: string;
  html: string;
};

export async function sendTransactionalEmail({ to, name, subject, html }: EmailPayload) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return;

  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME || "SEU Campus Market",
          email: process.env.BREVO_SENDER_EMAIL || "no-reply@seu-campus-market.local"
        },
        to: [{ email: to, name }],
        subject,
        htmlContent: html
      })
    });
  } catch {
    return;
  }
}

export function appUrl(path = "/") {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "http://localhost:3000";
  const normalized = base.startsWith("http") ? base : `https://${base}`;
  return `${normalized}${path}`;
}
