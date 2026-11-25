/** A collapsible card for one section of a page. Click the header to open its fields. */
export function SectionCard({
  id, icon, title, summary, badge, open = false, tools, children,
}: { id?: string; icon?: string; title: string; summary?: string; badge?: React.ReactNode; open?: boolean; tools?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="adm-sec" id={id}>
      {tools && <div className="adm-sec__tools">{tools}</div>}
      <details className="adm-sec__details" open={open}>
        <summary>
          <span className="adm-sec__icon" aria-hidden="true">
            {icon ?? '▭'}
          </span>
          <span className="adm-sec__text">
            <strong>{title}</strong>
            {summary && <small>{summary}</small>}
          </span>
          {badge}
          <span className="adm-sec__chev" aria-hidden="true" />
        </summary>
        <div className="adm-sec__body">{children}</div>
      </details>
    </div>
  );
}
