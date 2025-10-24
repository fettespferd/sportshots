"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

interface EventQRCodeProps {
  eventUrl: string;
  eventTitle: string;
}

export function EventQRCode({ eventUrl, eventTitle }: EventQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        eventUrl,
        {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        },
        (error) => {
          if (error) {
            console.error("QR Code generation error:", error);
          } else {
            setQrGenerated(true);
          }
        }
      );
    }
  }, [eventUrl]);

  const downloadQRCode = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${eventTitle.toLowerCase().replace(/\s+/g, "-")}-qr-code.png`;
      link.href = url;
      link.click();
    }
  };

  const downloadPoster = () => {
    if (!canvasRef.current) return;

    // Create a larger canvas for the poster
    const posterCanvas = document.createElement("canvas");
    const ctx = posterCanvas.getContext("2d");
    if (!ctx) return;

    // A4 size at 300 DPI: 2480 x 3508 pixels
    posterCanvas.width = 2480;
    posterCanvas.height = 3508;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, posterCanvas.width, posterCanvas.height);

    // Title
    ctx.fillStyle = "#000000";
    ctx.font = "bold 120px Arial";
    ctx.textAlign = "center";
    ctx.fillText(eventTitle, posterCanvas.width / 2, 300);

    // Subtitle
    ctx.font = "60px Arial";
    ctx.fillStyle = "#666666";
    ctx.fillText("Scanne den QR-Code für deine Fotos!", posterCanvas.width / 2, 450);

    // Draw QR Code (centered and larger)
    const qrSize = 1200;
    const qrX = (posterCanvas.width - qrSize) / 2;
    const qrY = 700;
    ctx.drawImage(canvasRef.current, qrX, qrY, qrSize, qrSize);

    // URL text below QR code
    ctx.font = "50px Arial";
    ctx.fillStyle = "#333333";
    ctx.fillText(eventUrl, posterCanvas.width / 2, qrY + qrSize + 150);

    // Instructions
    ctx.font = "70px Arial";
    ctx.fillStyle = "#000000";
    ctx.fillText("📸 Finde deine Sportfotos", posterCanvas.width / 2, qrY + qrSize + 300);
    
    ctx.font = "50px Arial";
    ctx.fillStyle = "#666666";
    ctx.fillText("• Startnummer eingeben", posterCanvas.width / 2, qrY + qrSize + 400);
    ctx.fillText("• Selfie hochladen", posterCanvas.width / 2, qrY + qrSize + 480);
    ctx.fillText("• Gesichtserkennung nutzen", posterCanvas.width / 2, qrY + qrSize + 560);

    // Footer
    ctx.font = "40px Arial";
    ctx.fillStyle = "#999999";
    ctx.fillText("SportShots.app", posterCanvas.width / 2, posterCanvas.height - 100);

    // Download
    const url = posterCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${eventTitle.toLowerCase().replace(/\s+/g, "-")}-poster.png`;
    link.href = url;
    link.click();
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
      <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        QR-Code & Marketing
      </h3>
      
      <div className="mb-4 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
        <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
          Event-Link:
        </p>
        <code className="block rounded bg-zinc-100 p-2 text-xs text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
          {eventUrl}
        </code>
      </div>

      <div className="mb-4 flex justify-center">
        <div className="rounded-lg border-4 border-zinc-200 bg-white p-4 dark:border-zinc-700">
          <canvas ref={canvasRef} />
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={downloadQRCode}
          disabled={!qrGenerated}
          className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          📥 QR-Code herunterladen (PNG)
        </button>
        
        <button
          onClick={downloadPoster}
          disabled={!qrGenerated}
          className="w-full rounded-md border border-blue-600 px-4 py-3 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
        >
          🖼️ Marketing-Poster herunterladen (A4)
        </button>
      </div>

      <div className="mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <h4 className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-400">
          💡 Verwendungstipps:
        </h4>
        <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-300">
          <li>• Poster am Veranstaltungsort aufhängen</li>
          <li>• QR-Code auf Startnummern drucken</li>
          <li>• In Social Media Posts einbinden</li>
          <li>• Per E-Mail an Teilnehmer senden</li>
        </ul>
      </div>
    </div>
  );
}

