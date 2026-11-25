'use client';

import { createContext, useActionState, useContext, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import type { ActionState } from '@/server/admin-action';

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;
const ErrorsContext = createContext<Record<string, string>>({});

/**
 * Dashboard form: submits to a server action, shows the result message, and passes field errors to the inputs.
 * `sticky` puts the save bar at the bottom of the card.
 */
export function ActionForm({
  action, children, submitLabel = 'Save changes', sticky = false, className = '', resetOnSuccess = false, extraButtons,
}: { action: Action; children: React.ReactNode; submitLabel?: string; sticky?: boolean; className?: string; resetOnSuccess?: boolean; extraButtons?: React.ReactNode }) {
  const [state, formAction] = useActionState(action, { ok: false, message: '' });
  const ref = useRef<HTMLFormElement>(null);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (state.ok) {
      setDirty(false);
      if (resetOnSuccess) ref.current?.reset();
    }
  }, [state, resetOnSuccess]);
  // warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);
  return (
    <ErrorsContext.Provider value={state.errors ?? {}}>
      <form ref={ref} action={formAction} className={`adm-form ${className}`} onChange={() => setDirty(true)} noValidate>
        {children}
        <div className={sticky ? 'adm-form__foot' : 'adm-actions'}>
          <SubmitButton label={submitLabel} />
          {extraButtons}
          {state.message && (
            <span className={`adm-notice adm-notice--${state.ok ? 'ok' : 'error'}`} role="status" key={state.at}>
              {state.message}
            </span>
          )}
          {dirty && !state.message && <span className="adm-muted">Unsaved changes</span>}
        </div>
      </form>
    </ErrorsContext.Provider>
  );
}

export function SubmitButton({ label, className = 'adm-btn adm-btn--primary' }: { label: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? 'Saving…' : label}
    </button>
  );
}

function useFieldError(name: string) {
  return useContext(ErrorsContext)[name];
}

type Common = { name: string; label: string; help?: string; defaultValue?: string | number | null; required?: boolean; max?: number };

export function TextField({ name, label, help, defaultValue, required, max, type = 'text', placeholder, autoComplete }: Common & { type?: string; placeholder?: string; autoComplete?: string }) {
  const error = useFieldError(name);
  const [len, setLen] = useState(String(defaultValue ?? '').length);
  return (
    <label className="adm-field">
      <span>
        {label}
        {required && ' *'}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ''}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        onChange={(e) => setLen(e.target.value.length)}
      />
      {help && <small>{help}</small>}
      {max && <small className={`adm-field__count ${len > max ? 'is-over' : ''}`}>{`${len} / ${max}`}</small>}
      {error && <span className="adm-field__error">{error}</span>}
    </label>
  );
}

export function TextArea({ name, label, help, defaultValue, required, max, rows = 4 }: Common & { rows?: number }) {
  const error = useFieldError(name);
  const [len, setLen] = useState(String(defaultValue ?? '').length);
  return (
    <label className="adm-field">
      <span>
        {label}
        {required && ' *'}
      </span>
      <textarea name={name} rows={rows} defaultValue={defaultValue ?? ''} required={required} aria-invalid={error ? true : undefined} onChange={(e) => setLen(e.target.value.length)} />
      {help && <small>{help}</small>}
      {max && <small className={`adm-field__count ${len > max ? 'is-over' : ''}`}>{`${len} / ${max}`}</small>}
      {error && <span className="adm-field__error">{error}</span>}
    </label>
  );
}

export function SelectField({ name, label, help, defaultValue, options, required }: Common & { options: { value: string; label: string }[] }) {
  const error = useFieldError(name);
  return (
    <label className="adm-field">
      <span>
        {label}
        {required && ' *'}
      </span>
      <select name={name} defaultValue={defaultValue ?? ''} aria-invalid={error ? true : undefined}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {help && <small>{help}</small>}
      {error && <span className="adm-field__error">{error}</span>}
    </label>
  );
}

export function Checkbox({ name, label, defaultChecked, value }: { name: string; label: string; defaultChecked?: boolean; value?: string }) {
  return (
    <label className="adm-check">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}

/** A small form that asks for confirmation before running a destructive action. */
export function ConfirmForm({
  action, confirm, children, hidden,
}: { action: (fd: FormData) => void | Promise<void>; confirm: string; children: React.ReactNode; hidden: Record<string, string> }) {
  return (
    <form action={action} onSubmit={(e) => !window.confirm(confirm) && e.preventDefault()}>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {children}
    </form>
  );
}

/** Like ConfirmForm, for actions that return a message (shown inline). */
export function ConfirmActionForm({ action, confirm, label, hidden, className = 'adm-btn adm-btn--danger adm-btn--sm' }: { action: Action; confirm: string; label: string; hidden: Record<string, string>; className?: string }) {
  const [state, formAction] = useActionState(action, { ok: false, message: '' });
  return (
    <form action={formAction} onSubmit={(e) => !window.confirm(confirm) && e.preventDefault()} style={{ display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <SubmitButton label={label} className={className} />
      {state.message && !state.ok && <span className="adm-field__error">{state.message}</span>}
    </form>
  );
}
