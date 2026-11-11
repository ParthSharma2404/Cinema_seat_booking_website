'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  text: string;
  size?: number;
  className?: string;
}

export function QRCodeDisplay({ text, size = 180, className = '' }: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!text) return;
    QRCode.toDataURL(text, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code:', err));
  }, [text, size]);

  if (!qrDataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center bg-slate-800 text-slate-400 rounded-lg animate-pulse text-xs"
      >
        Generating QR...
      </div>
    );
  }

  return (
    <div className={`p-2 bg-white rounded-xl shadow-md inline-block ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrDataUrl}
        alt={`QR Code for ${text}`}
        width={size}
        height={size}
        className="rounded-lg block"
      />
    </div>
  );
}

