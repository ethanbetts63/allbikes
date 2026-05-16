"use client";

import { useEffect, useState } from 'react';

const DeferredMap = () => {
  const [shouldRenderMap, setShouldRenderMap] = useState(false);

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(() => setShouldRenderMap(true), { timeout: 2500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = setTimeout(() => setShouldRenderMap(true), 1200);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="mt-6 rounded-lg overflow-hidden border border-border-light shadow-sm">
      {shouldRenderMap ? (
        <iframe
          src="https://maps.google.com/maps?q=Unit+5%2F6+Cleveland+Street+Dianella+WA+6059&output=embed&z=16"
          width="100%"
          height="360"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="ScooterShop location map"
        />
      ) : (
        <div className="flex h-[360px] items-center justify-center bg-[var(--bg-light-secondary)] px-4 text-center">
          <a
            href="https://maps.google.com/?q=Unit+5%2F6+Cleveland+Street+Dianella+WA+6059"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold uppercase tracking-widest text-[var(--text-dark-primary)] underline underline-offset-4"
          >
            Open ScooterShop in Google Maps
          </a>
        </div>
      )}
    </div>
  );
};

export default DeferredMap;
