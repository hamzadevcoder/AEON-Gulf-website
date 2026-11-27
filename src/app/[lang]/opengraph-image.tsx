import { ImageResponse } from 'next/og';

export const alt = 'AEON Gulf: business setup and corporate services in Kuwait, Qatar and Saudi Arabia';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Default social-share image (used by every page that has no image of its own). */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 70, background: '#34353f', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 44, letterSpacing: 10 }}>
          <div style={{ width: 22, height: 22, background: '#cb333b' }} />
          AEON GULF
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 70, lineHeight: 1.1 }}>
          <span>Your company in the Gulf,</span>
          <span style={{ color: 'rgba(255,255,255,.55)' }}>set up and kept compliant.</span>
        </div>
        <div style={{ fontSize: 28, color: 'rgba(255,255,255,.7)' }}>Kuwait · Qatar · Saudi Arabia</div>
      </div>
    ),
    size,
  );
}
