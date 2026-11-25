'use client';

import Link from 'next/link';
import type { AnchorHTMLAttributes } from 'react';
import { usePageTransition } from './TransitionProvider';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string };

/** A next/link that plays the column transition instead of switching pages instantly. */
export function TransitionLink({ href, onClick, children, ...rest }: Props) {
  const { navigate } = usePageTransition();
  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (rest.target && rest.target !== '_self') return;
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </Link>
  );
}
