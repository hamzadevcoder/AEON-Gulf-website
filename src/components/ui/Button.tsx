import { TransitionLink } from '@/components/motion/TransitionLink';

type Variant = 'ice' | 'light' | 'dark';

function Roll({ children }: { children: string }) {
  return (
    <span className="roll" aria-hidden="true">
      <span>{children}</span>
      <span>{children}</span>
    </span>
  );
}

type Props = { href?: string; variant?: Variant; children: string; className?: string; type?: 'button' | 'submit'; onClick?: () => void };

/** The reference's chip button: square bullet + label that rolls up on hover. */
export function Button({ href, variant = 'ice', children, className = '', type = 'button', onClick }: Props) {
  const cls = `btn btn--${variant} ${className}`;
  if (href) {
    return (
      <TransitionLink href={href} className={cls} aria-label={children}>
        <Roll>{children}</Roll>
      </TransitionLink>
    );
  }
  return (
    <button type={type} className={cls} aria-label={children} onClick={onClick}>
      <Roll>{children}</Roll>
    </button>
  );
}

export function ArrowLink({ href, children, className = '' }: { href: string; children: string; className?: string }) {
  return (
    <TransitionLink href={href} className={`arrow-link ${className}`} aria-label={children}>
      <ArrowIcon />
      <Roll>{children}</Roll>
    </TransitionLink>
  );
}

export function ArrowIcon({ direction = 'right' }: { direction?: 'right' | 'left' | 'up' | 'down' }) {
  const rot = { right: 0, down: 90, left: 180, up: 270 }[direction];
  return (
    <svg className={`arrow-icon${direction === 'left' || direction === 'right' ? ' arrow-icon--h' : ''}`} width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style={{ transform: `rotate(${rot}deg)` }}>
      <path d="M1 6h9.5M6.5 2 10.5 6l-4 4" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
