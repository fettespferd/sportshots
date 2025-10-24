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
}

async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!resend) {
    console.warn("Resend API key not configured - skipping email send");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("Email send error:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email send failed:", error);
    return { success: false, error };
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
  photoCount: number
) {
  const html = await render(
    NewPhotosEmail({
      userName,
      eventName,
      eventSlug,
      photoCount,
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
  totalAmount: number,
  downloadLinks: string[]
) {
  const html = await render(
    PurchaseConfirmationEmail({
      customerName,
      eventName,
      photoCount,
      totalAmount,
      downloadLinks,
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

