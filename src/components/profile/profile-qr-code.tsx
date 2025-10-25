"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export function ProfileQRCode({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);
  const profileUrl = `https://sportshots.brainmotion.ai/${username}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQRCode = () => {
    const svg = document.getElementById("profile-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `${username}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Teile deine Event-Seite
      </h3>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Scanne den QR-Code oder teile den Link mit deinen Kunden
      </p>

      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
        {/* QR Code */}
        <div className="flex-shrink-0 rounded-lg bg-white p-4 shadow-sm">
          <QRCodeSVG
            id="profile-qr-code"
            value={profileUrl}
            size={160}
            level="H"
            includeMargin
          />
        </div>

        {/* Link and Actions */}
        <div className="flex-1 space-y-4">
          {/* Link Display */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Öffentliche URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={profileUrl}
                readOnly
                className="block w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
              <button
                onClick={handleCopy}
                className="flex-shrink-0 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {copied ? "✓ Kopiert!" : "Kopieren"}
              </button>
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={downloadQRCode}
            className="w-full rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            📥 QR-Code als PNG herunterladen
          </button>
        </div>
      </div>
    </div>
  );
}

