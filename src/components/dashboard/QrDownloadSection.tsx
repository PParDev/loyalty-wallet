"use client";

import { useState, useEffect } from "react";

interface QrDownloadSectionProps {
  slug: string;
}

export default function QrDownloadSection({ slug }: QrDownloadSectionProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const registrationUrl = `${appUrl}/r/${slug}`;

  useEffect(() => {
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(registrationUrl, { width: 200, margin: 2 }).then(setQrDataUrl);
    });
  }, [registrationUrl]);

  const handleDownloadPng = () => {
    window.open("/api/businesses/me/qr?format=png", "_blank");
  };

  const handleDownloadSvg = () => {
    window.open("/api/businesses/me/qr?format=svg", "_blank");
  };

  const handlePrintFlyer = () => {
    const win = window.open("/api/businesses/me/flyer", "_blank");
    if (win) {
      win.addEventListener("load", () => {
        setTimeout(() => win.print(), 500);
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [copied, setCopied] = useState(false);

  return (
    <section className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 md:p-6 text-white shadow-lg">
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        {/* QR Preview */}
        <div className="bg-white rounded-xl p-3 shrink-0 self-center sm:self-start">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR de registro" className="w-32 h-32" />
          ) : (
            <div className="w-32 h-32 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Info + Actions */}
        <div className="flex-1 min-w-0 w-full">
          <h3 className="text-lg font-bold mb-1">QR de registro de clientes</h3>
          <p className="text-indigo-200 text-sm mb-3">
            Imprime este QR y colócalo en tu mostrador. Tus clientes lo escanean para unirse a tu programa de lealtad.
          </p>

          {/* URL copiable */}
          <div className="flex items-center gap-2 mb-4">
            <code className="text-xs bg-indigo-800/50 border border-indigo-500/30 rounded-lg px-3 py-2 flex-1 truncate text-indigo-100">
              {registrationUrl}
            </code>
            <button
              onClick={handleCopy}
              className="text-xs font-medium bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 shrink-0 transition-colors"
            >
              {copied ? "✓ Copiado" : "Copiar"}
            </button>
          </div>

          {/* Botones de descarga */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownloadPng}
              className="flex items-center gap-1.5 bg-white text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              QR (PNG)
            </button>
            <button
              onClick={handleDownloadSvg}
              className="flex items-center gap-1.5 bg-white/10 border border-white/20 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
            >
              QR (SVG)
            </button>
            <button
              onClick={handlePrintFlyer}
              className="flex items-center gap-1.5 bg-white/10 border border-white/20 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir flyer
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
