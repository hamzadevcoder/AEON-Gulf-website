'use client';

import { useState } from 'react';

type SubField = { name: string; label: string; type: 'text' | 'textarea' };
type Item = Record<string, string>;

/**
 * Repeating group editor (benefits, steps, FAQs, testimonials…). Keeps the items in state and writes them
 * as JSON into a hidden input, which the server action validates.
 */
export function ListEditor({
  name, label, itemLabel, fields, initial, min = 0, max = 50, help,
}: { name: string; label: string; itemLabel: string; fields: SubField[]; initial: Item[]; min?: number; max?: number; help?: string }) {
  const blank = () => Object.fromEntries(fields.map((f) => [f.name, '']));
  const [items, setItems] = useState<(Item & { _k: string })[]>(() => (initial ?? []).map((it, i) => ({ ...blank(), ...it, _k: `i${i}` })));
  const [seq, setSeq] = useState(items.length);
  const update = (i: number, key: string, value: string) => setItems((list) => list.map((it, n) => (n === i ? { ...it, [key]: value } : it)));
  const move = (i: number, dir: -1 | 1) =>
    setItems((list) => {
      const next = [...list];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });
  const clean = items.map(({ _k, ...rest }) => rest);
  return (
    <fieldset className="adm-field">
      <legend>{label}</legend>
      {help && <small>{help}</small>}
      <input type="hidden" name={name} value={JSON.stringify(clean)} />
      <div className="adm-list">
        {items.map((it, i) => (
          <div className="adm-list__item" key={it._k}>
            <div className="adm-list__bar">
              <strong>{`${itemLabel} ${i + 1}${it[fields[0].name] ? `: ${it[fields[0].name]}` : ''}`}</strong>
              <div className="adm-list__tools">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${itemLabel} ${i + 1} up`}>
                  ↑
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Move ${itemLabel} ${i + 1} down`}>
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => setItems((list) => list.filter((_, n) => n !== i))}
                  disabled={items.length <= min}
                  aria-label={`Remove ${itemLabel} ${i + 1}`}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="adm-list__body">
              {fields.map((f) => (
                <label className="adm-field" key={f.name}>
                  <span>{f.label}</span>
                  {f.type === 'textarea' ? (
                    <textarea rows={3} value={it[f.name] ?? ''} onChange={(e) => update(i, f.name, e.target.value)} />
                  ) : (
                    <input type="text" value={it[f.name] ?? ''} onChange={(e) => update(i, f.name, e.target.value)} />
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      {items.length < max && (
        <div>
          <button
            type="button"
            className="adm-btn adm-btn--ghost adm-btn--sm"
            onClick={() => {
              setItems((list) => [...list, { ...blank(), _k: `n${seq}` }]);
              setSeq((s) => s + 1);
            }}
          >
            {`+ Add ${itemLabel.toLowerCase()}`}
          </button>
        </div>
      )}
    </fieldset>
  );
}
