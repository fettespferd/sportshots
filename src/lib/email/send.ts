import { Resend } from "resend";
import { render } from "@react-email/components";
import {
  PhotographerApprovedEmail,
  NewPhotosEmail,
  PurchaseConfirmationEmail,
  PayoutNotificationEmail,
} from "./templates";

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const fromName = "SportShots";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams) {
  if (!resend) {
    console.error("[EMAIL] Resend API key not configured - skipping email send");
    return { success: false, error: "Email service not configured" };
  }

  try {
    console.log(`[EMAIL] Sending email to ${to} with subject: ${subject}`);
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html,
      replyTo: replyTo || "julius.faubel@brainmotion.ai",
    });

    if (error) {
      console.error(`[EMAIL] Email send error for ${to}:`, error);
      throw error;
    }

    console.log(`[EMAIL] ✅ Email sent successfully to ${to}`, data);
    return { success: true, data };
  } catch (error: any) {
    console.error(`[EMAIL] ❌ Email send failed for ${to}:`, error);
    return { success: false, error: error?.message || String(error) };
  }
}

// Send photographer approval email
export async function sendPhotographerApprovedEmail(
  to: string,
  photographerName: string
) {
  const html = await render(PhotographerApprovedEmail({ photographerName }));

  return sendEmail({
    to,
    subject: "🎉 Deine Fotografen-Registrierung wurde genehmigt!",
    html,
  });
}

// Send new photos notification
export async function sendNewPhotosEmail(
  to: string,
  userName: string,
  eventName: string,
  eventSlug: string,
  photoCount: number,
  unsubscribeToken?: string,
  eventId?: string,
  followerEmail?: string
) {
  const html = await render(
    NewPhotosEmail({
      userName,
      eventName,
      eventSlug,
      photoCount,
      unsubscribeToken,
      eventId,
      followerEmail,
    })
  );

  return sendEmail({
    to,
    subject: `📸 ${photoCount} neue Fotos von ${eventName}!`,
    html,
  });
}

// Send purchase confirmation
export async function sendPurchaseConfirmationEmail(
  to: string,
  customerName: string,
  eventName: string,
  photoCount: number,
  downloadUrl: string
) {
  const html = await render(
    PurchaseConfirmationEmail({
      customerName,
      eventName,
      photoCount,
      downloadUrl,
    })
  );

  return sendEmail({
    to,
    subject: `✅ Deine Bestellung für ${eventName}`,
    html,
  });
}

// Send payout notification
export async function sendPayoutNotificationEmail(
  to: string,
  photographerName: string,
  amount: number,
  eventTitle: string,
  photosSold: number
) {
  const html = await render(
    PayoutNotificationEmail({
      photographerName,
      amount,
      eventTitle,
      photosSold,
    })
  );

  return sendEmail({
    to,
    subject: `💰 Du hast ${amount.toFixed(2)} € verdient!`,
    html,
  });
}

