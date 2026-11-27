import Link from 'next/link';

/** English / Arabic switch at the top of an editor. */
export function LangTabs({ href, lang, arStatus }: { href: string; lang: 'en' | 'ar'; arStatus?: string }) {
  const join = href.includes('?') ? '&' : '?';
  return (
    <nav className="adm-tabs adm-langtabs" aria-label="Language">
      <Link href={href} aria-current={lang === 'en' ? 'true' : undefined}>
        English
      </Link>
      <Link href={`${href}${join}lang=ar`} aria-current={lang === 'ar' ? 'true' : undefined}>
        العربية{arStatus ? ` · ${arStatus}` : ''}
      </Link>
    </nav>
  );
}

/** Wraps Arabic form fields so they are typed and shown right-to-left. */
export function ArabicArea({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" lang="ar" className="adm-ar">
      {children}
    </div>
  );
}
