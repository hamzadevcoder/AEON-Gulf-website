import { Fade } from '@/components/motion/Fade';
import { ArrowIcon } from '@/components/ui/Button';
import { TransitionLink } from '@/components/motion/TransitionLink';

export type ServiceListItem = { name: string; body: string; href: string };

/** Hairline-divided service rows (reference "Our solutions" list style); the whole row is a link. */
export function ServiceList({ items }: { items: ServiceListItem[] }) {
  return (
    <Fade as="ul" className="svc-list" childrenStagger y={30} stagger={0.05}>
      {items.map((s) => (
        <li key={s.href}>
          <TransitionLink href={s.href} className="svc-row">
            <span className="svc-row__name h-6">{s.name}</span>
            <span className="svc-row__body">{s.body}</span>
            <span className="svc-row__go" aria-hidden="true">
              <ArrowIcon />
            </span>
          </TransitionLink>
        </li>
      ))}
    </Fade>
  );
}
