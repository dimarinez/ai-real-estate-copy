// components/LinkedInInsightTag.tsx
"use client";

import Script from "next/script";

// Define TypeScript types directly in the file
declare global {
  interface Lintrk {
    (action: string, data: unknown): void;
    q: [string, unknown][];
  }

  interface Window {
    lintrk: Lintrk;
    _linkedin_data_partner_ids: string[];
    _linkedin_partner_id?: string;
  }
}

export default function LinkedInInsightTag() {
  return (
    <>
      <Script id="linkedin-insight-init" strategy="afterInteractive">
        {`
          _linkedin_partner_id = "7095684";
          window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
          window._linkedin_data_partner_ids.push(_linkedin_partner_id);
        `}
      </Script>
      <Script
        id="linkedin-insight"
        strategy="afterInteractive"
        src="https://snap.licdn.com/li.lms-analytics/insight.min.js"
        onLoad={() => {
          (function(l: ((action: string, data: unknown) => void) | undefined) {
            if (!l) {
              window.lintrk = Object.assign(
                function(a: string, b: unknown) {
                  window.lintrk.q.push([a, b]);
                },
                { q: [] }
              );
            }
          })(window.lintrk);
        }}
      />
      <noscript>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img
          height={1}
          width={1}
          style={{ display: "none" }}
          alt=""
          src="https://px.ads.linkedin.com/collect/?pid=7095684&fmt=gif"
        />
      </noscript>
    </>
  );
}