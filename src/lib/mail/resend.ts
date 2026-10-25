// Sends mail through Resend. The key is read from the environment only.
export const FROM = "OpenMedina <hello@mail.telep.io>";
export const POSTAL = "Telep IO, PO Box 187, Valley City, OH 44280";

export async function sendMail(msg: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Mail is not configured");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [msg.to],
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
      reply_to: msg.replyTo,
      headers: msg.headers,
    }),
  });
  if (!res.ok) throw new Error(`Resend error ${res.status}`);
  return (await res.json()) as { id: string };
}
