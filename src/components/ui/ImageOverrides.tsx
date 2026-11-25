'use client';

import { setImageOverrides } from '@/content/images';

/** Makes the admin's image replacements available to client components (set before children render). */
export function ImageOverrides({ overrides, children }: { overrides: Record<string, { src: string; alt?: string }>; children: React.ReactNode }) {
  setImageOverrides(overrides);
  return <>{children}</>;
}
