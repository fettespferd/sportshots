import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Heading,
  Hr,
  Link,
} from "@react-email/components";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Template 1: Photographer Approval
export function PhotographerApprovedEmail({
  photographerName,
}: {
  photographerName: string;
}) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎉 Willkommen bei SportShots!</Heading>
          <Text style={text}>
            Hallo {photographerName},
          </Text>
          <Text style={text}>
            Deine Fotografen-Registrierung wurde erfolgreich genehmigt! Du
            kannst jetzt Events anlegen und Fotos verkaufen.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={`${baseUrl}/photographer/events`}>
              Erstes Event erstellen
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Nächste Schritte:
            <br />
            1. Verbinde dein Stripe-Konto für Auszahlungen
            <br />
            2. Lege dein erstes Event an
            <br />
            3. Lade Fotos hoch und starte den Verkauf
          </Text>
          <Text style={footer}>
            Bei Fragen stehen wir dir gerne zur Verfügung.
            <br />
            Dein SportShots Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Template 2: New Photos Available
export function NewPhotosEmail({
  userName,
  eventName,
  eventSlug,
  photoCount,
}: {
  userName: string;
  eventName: string;
  eventSlug: string;
  photoCount: number;
}) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>📸 Neue Fotos verfügbar!</Heading>
          <Text style={text}>
            Hallo {userName},
          </Text>
          <Text style={text}>
            Es wurden {photoCount} neue Fotos von <strong>{eventName}</strong>{" "}
            hochgeladen!
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={`${baseUrl}/event/${eventSlug}`}>
              Fotos ansehen
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Du erhältst diese E-Mail, weil du diesem Event folgst.
            <br />
            <Link href={`${baseUrl}/settings`} style={link}>
              Benachrichtigungseinstellungen ändern
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Template 3: Purchase Confirmation
export function PurchaseConfirmationEmail({
  customerName,
  eventName,
  photoCount,
  downloadUrl,
}: {
  customerName: string;
  eventName: string;
  photoCount: number;
  downloadUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎉 Herzlichen Glückwunsch!</Heading>
          <Text style={text}>
            Hallo {customerName},
          </Text>
          <Text style={text}>
            Vielen Dank für deinen Kauf! 🎊 Deine Bestellung für <strong>{eventName}</strong> wurde erfolgreich
            abgeschlossen und deine unvergesslichen Momente stehen jetzt zum Download bereit!
          </Text>
          <Hr style={hr} />
          <Section style={celebrationBox}>
            <Text style={celebrationEmoji}>📸</Text>
            <Text style={celebrationText}>
              {photoCount} {photoCount === 1 ? "Foto" : "Fotos"} in hoher Qualität
            </Text>
          </Section>
          <Hr style={hr} />
          <Section style={buttonContainer}>
            <Button style={button} href={downloadUrl}>
              🚀 Jetzt herunterladen
            </Button>
          </Section>
          <Text style={text}>
            <strong>💡 Gut zu wissen:</strong>
            <br />
            • Deine Fotos sind in voller Auflösung verfügbar
            <br />
            • Der Download-Link bleibt dauerhaft gültig
            <br />
            • Du kannst die Fotos jederzeit erneut herunterladen
            <br />
            • Teile deine besten Momente mit Freunden und Familie!
          </Text>
          <Hr style={hr} />
          <Text style={text}>
            <strong>🔗 Dein persönlicher Download-Link:</strong>
          </Text>
          <Text style={downloadLink}>
            <Link href={downloadUrl} style={link}>
              {downloadUrl}
            </Link>
          </Text>
          <Text style={downloadLinkNote}>
            Speichere diesen Link für späteren Zugriff!
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Wir hoffen, du hattest großartige Momente bei {eventName}! 🌟
            <br />
            <br />
            Viel Spaß mit deinen Fotos!
            <br />
            Dein SportShots Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Template 4: Payout Notification
export function PayoutNotificationEmail({
  photographerName,
  amount,
  eventTitle,
  photosSold,
}: {
  photographerName: string;
  amount: number;
  eventTitle: string;
  photosSold: number;
}) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>💰 Du hast Geld verdient!</Heading>
          <Text style={text}>
            Hallo {photographerName},
          </Text>
          <Text style={text}>
            Großartige Neuigkeiten! Du hast {photosSold}{" "}
            {photosSold === 1 ? "Foto" : "Fotos"} von{" "}
            <strong>{eventTitle}</strong> verkauft.
          </Text>
          <Section style={amountBox}>
            <Text style={amountText}>
              {amount.toFixed(2)} €
            </Text>
            <Text style={amountLabel}>wird an dich ausgezahlt</Text>
          </Section>
          <Text style={text}>
            Die Auszahlung erfolgt automatisch über Stripe Connect auf dein
            verknüpftes Bankkonto.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={`${baseUrl}/photographer/sales`}>
              Verkäufe ansehen
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Dein SportShots Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const h1 = {
  color: "#18181b",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 40px",
  textAlign: "center" as const,
};

const text = {
  color: "#404040",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
  padding: "0 40px",
};

const buttonContainer = {
  padding: "27px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#18181b",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "16px 0",
  padding: "0 40px",
};

const link = {
  color: "#556cd6",
  textDecoration: "underline",
};

const downloadLink = {
  margin: "8px 0",
  padding: "0 40px",
};

const downloadLinkNote = {
  color: "#8898aa",
  fontSize: "13px",
  fontStyle: "italic" as const,
  margin: "4px 0 0",
  padding: "0 40px",
};

const celebrationBox = {
  backgroundColor: "#fef3c7",
  border: "2px solid #fbbf24",
  borderRadius: "12px",
  padding: "32px",
  margin: "24px 40px",
  textAlign: "center" as const,
};

const celebrationEmoji = {
  fontSize: "64px",
  margin: "0 0 16px",
};

const celebrationText = {
  color: "#92400e",
  fontSize: "24px",
  fontWeight: "600",
  margin: "0",
};

const amountBox = {
  backgroundColor: "#f0fdf4",
  border: "2px solid #86efac",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 40px",
  textAlign: "center" as const,
};

const amountText = {
  color: "#15803d",
  fontSize: "48px",
  fontWeight: "bold",
  margin: "0",
};

const amountLabel = {
  color: "#166534",
  fontSize: "14px",
  margin: "8px 0 0",
};


