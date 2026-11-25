/** Thin line icons drawn for this site (stroke inherits currentColor). */
const common = { width: 46, height: 46, viewBox: '0 0 46 46', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, 'aria-hidden': true } as const;

export function ServiceIcon({ name }: { name: string }) {
  switch (name) {
    case 'formation':
      return (
        <svg {...common}>
          <rect x="9" y="15" width="28" height="22" />
          <path d="M17 15V9h12v6M9 24h28" />
        </svg>
      );
    case 'visa':
      return (
        <svg {...common}>
          <rect x="11" y="7" width="24" height="32" rx="2" />
          <circle cx="23" cy="20" r="6" />
          <path d="M16 32h14" />
        </svg>
      );
    case 'renewal':
      return (
        <svg {...common}>
          <path d="M35 23a12 12 0 1 1-3.5-8.5" />
          <path d="M33 8v7h-7" />
        </svg>
      );
    case 'closure':
      return (
        <svg {...common}>
          <circle cx="23" cy="23" r="14" />
          <path d="M16 23h14" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="23" cy="23" r="12" />
        </svg>
      );
  }
}

export function StageIcon({ index }: { index: number }) {
  const paths = [
    <path key="a" d="M8 34h30M14 34V18l9-7 9 7v16" />,
    <path key="b" d="M8 23h6l4-10 6 20 4-10h10" />,
    <path key="c" d="M9 35 21 23l6 6 11-14M31 15h7v7" />,
  ];
  return <svg {...common}>{paths[index % paths.length]}</svg>;
}
