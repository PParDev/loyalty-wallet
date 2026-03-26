"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onScan: (result: string) => void;
}

export default function QrScanner({ onScan }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!containerRef.current || started) return;

    const id = "qr-reader-" + Math.random().toString(36).slice(2);
    containerRef.current.id = id;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      const scanner = new Html5Qrcode(id);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            onScan(decodedText);
          },
          undefined
        )
        .catch((err: unknown) => {
          setError("No se pudo acceder a la cámara. Verifica los permisos.");
          console.error(err);
        });
    });

    setStarted(true);

    return () => {
      if (scannerRef.current) {
        const s = scannerRef.current as { stop: () => Promise<void>; clear: () => void };
        s.stop().then(() => s.clear()).catch(console.error);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      {error ? (
        <div className="p-6 text-center text-red-500 text-sm">{error}</div>
      ) : (
        <div ref={containerRef} className="w-full" />
      )}
    </div>
  );
}
