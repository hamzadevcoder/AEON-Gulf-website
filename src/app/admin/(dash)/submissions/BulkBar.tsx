'use client';

import { useRef, useState } from 'react';
import { bulkUpdateStatus } from '../../_actions/submissions';
import { statusLabels, statuses } from '@/lib/submissions';

/** Wraps the table in a form so selected rows can have their status changed together. */
export function BulkBar({ canUpdate, children }: { canUpdate: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLFormElement>(null);
  const [selected, setSelected] = useState(0);
  if (!canUpdate) return <>{children}</>;
  return (
    <form ref={ref} action={bulkUpdateStatus} onChange={() => setSelected(ref.current?.querySelectorAll('input[name=ids]:checked').length ?? 0)}>
      {children}
      {selected > 0 && (
        <div className="adm-form__foot" style={{ margin: '12px 0 0', borderRadius: 8, border: '1px solid var(--a-line)' }}>
          <strong>{`${selected} selected`}</strong>
          <select name="status" className="adm-input" style={{ width: 'auto' }} defaultValue="in_progress" aria-label="New status">
            {statuses.map((s) => (
              <option key={s} value={s}>
                {`Mark as ${statusLabels[s].toLowerCase()}`}
              </option>
            ))}
          </select>
          <button type="submit" className="adm-btn adm-btn--primary adm-btn--sm">
            Apply
          </button>
        </div>
      )}
    </form>
  );
}
