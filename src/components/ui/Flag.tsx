'use client';

import { useState } from 'react';

const codes: Record<string, string> = { kuwait: 'KW', qatar: 'QA', 'saudi-arabia': 'SA' };

/** Round country flag (the flag images from the client's current site), with the country code as fallback. */
export function Flag({ country, size = 20 }: { country: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="flag flag--code" style={{ width: size, height: size }} aria-hidden="true">
        {codes[country]}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="flag"
      src={`/flags/${country}.png`}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
      ref={(el) => {
        if (el && el.complete && el.naturalWidth === 0) setFailed(true);
      }}
    />
  );
}
