// Downloads the brand fonts (Avenir LT Std, as used on the current AEON Gulf site) into public/fonts,
// the country flags into public/flags, and every photo in src/content/images.ts into public/images.
// Runs automatically before `npm run dev` and `npm run build`; files already present are skipped.
// If the network is unavailable it warns and the site falls back to Geist / remote images.
import { readFile, mkdir, writeFile, access } from 'node:fs/promises';

const OLD = 'https://aeon.qrq8.com';
const root = new URL('../', import.meta.url);
const exists = (p) => access(new URL(p, root)).then(() => true, () => false);

const fonts = ['Light', 'Roman', 'Medium', 'Heavy'].map((w) => ({
  file: `public/fonts/AvenirLTStd-${w}.otf`,
  url: `${OLD}/wp-content/uploads/2024/12/AvenirLTStd-${w}.otf`,
}));
const flags = [
  { file: 'public/flags/kuwait.png', url: `${OLD}/kuwait/wp-content/uploads/sites/2/2024/12/kw_thumb.png` },
  { file: 'public/flags/saudi-arabia.png', url: `${OLD}/kuwait/wp-content/uploads/sites/2/2024/12/ksa_thumb.png` },
  { file: 'public/flags/qatar.png', url: `${OLD}/kuwait/wp-content/uploads/sites/2/2025/03/qatar_flag.png` },
];
const src = await readFile(new URL('src/content/images.ts', root), 'utf8');
const unsplash = (id) => `https://images.unsplash.com/${id}?w=2000&q=75&auto=format&fit=crop`;
const images = [...src.matchAll(/key: '([^']+)', remote: (`[^`]+`|unsplash\('([^']+)'\))/g)].map((m) => ({
  file: `public/images/${m[1]}`,
  url: m[3] ? unsplash(m[3]) : m[2].slice(1, -1).replace('${OLD_SITE}', OLD),
}));

let ok = 0, skipped = 0, failed = 0;
for (const { file, url } of [...fonts, ...flags, ...images]) {
  if (await exists(file)) { skipped++; continue; }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(String(res.status));
    await mkdir(new URL(file.slice(0, file.lastIndexOf('/') + 1), root), { recursive: true });
    await writeFile(new URL(file, root), Buffer.from(await res.arrayBuffer()));
    ok++;
  } catch (e) {
    failed++;
    if (failed === 1) console.warn('[assets] Could not download some brand assets (offline?). The site will use fallbacks.');
    console.warn(`[assets] ✗ ${file} (${e.message})`);
  }
}
console.log(`[assets] downloaded ${ok}, already present ${skipped}, failed ${failed}`);
