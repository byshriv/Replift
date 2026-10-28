import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useLocal } from '../state/local';
import { draftTarget, type Action } from '../domain/port';
export const uid = () => crypto.randomUUID();
export function playCheck(enabled: boolean) {
  if (!enabled || typeof AudioContext === 'undefined') return;
  try {
    const context = new AudioContext(),
      tone = context.createOscillator(),
      gain = context.createGain();
    tone.connect(gain);
    gain.connect(context.destination);
    tone.frequency.value = 660;
    gain.gain.setValueAtTime(0.04, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);
    tone.start();
    tone.stop(context.currentTime + 0.12);
    tone.onended = () => void context.close();
  } catch {
    /* Audio capability does not affect saving. */
  }
}
export function send(action: Action, key?: string, value?: string) {
  const state = useLocal.getState(),
    d = state.snapshot?.data;
  const targeted =
    d &&
    [
      'setField',
      'set',
      'estimate',
      'workoutExercise',
      'draftMeta',
      'finish',
      'discard',
    ].includes(action.kind)
      ? draftTarget(
          d,
          'item' in action
            ? action.item
            : action.kind === 'workoutExercise'
              ? (action.replace ?? action.remove)
              : undefined,
          'set' in action ? action.set : undefined,
        )
      : {};
  state.edit(
    { type: 'domain', action: { ...targeted, ...action } },
    key,
    value,
  );
}
export function Field({
  label,
  value,
  change,
  numeric = false,
}: {
  label: string;
  value: unknown;
  change: (v: string) => void;
  numeric?: boolean;
}) {
  return (
    <label className="field">
      {label}
      <input
        aria-label={label}
        value={String(value ?? '')}
        inputMode={numeric ? 'decimal' : 'text'}
        onFocus={(e) => e.target.select()}
        onChange={(e) => change(e.target.value)}
      />
    </label>
  );
}
export function SavedField({
  label,
  value,
  action,
  fieldKey,
  numeric = false,
}: {
  label: string;
  value: unknown;
  action: (v: string) => Action;
  fieldKey: string;
  numeric?: boolean;
}) {
  const drafts = useLocal((s) => s.drafts);
  return (
    <Field
      label={label}
      value={drafts[fieldKey] ?? value}
      numeric={numeric}
      change={(v) => send(action(v), fieldKey, v)}
    />
  );
}
export function Sheet({
  title,
  close,
  closeLabel,
  children,
}: {
  title: string;
  close: () => void;
  closeLabel?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    start = useRef<number | null>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const back = () => {
      if ([...document.querySelectorAll('dialog[open]')].at(-1) === dialog)
        close();
    };
    window.addEventListener('popstate', back);
    return () => window.removeEventListener('popstate', back);
  }, [close]);
  return (
    <dialog
      ref={ref}
      onClose={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            close();
        }
      }}
      aria-label={title}
    >
      <header
        className="sheet-handle"
        onPointerDown={(e) => {
          start.current = e.clientY;
        }}
        onPointerUp={(e) => {
          if (start.current !== null && e.clientY - start.current > 65) close();
          start.current = null;
        }}
      >
        <h2>{title}</h2>
        <button
          aria-label={closeLabel ?? `Close ${title}`}
          className="icon-button"
          onClick={close}
        >
          <X size={18} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function Confirm({
  title,
  description,
  confirm,
  close,
}: {
  title: string;
  description: string;
  confirm: () => void;
  close: () => void;
}) {
  return (
    <Sheet title={title} close={close}>
      <p>{description}</p>
      <div className="sync-actions">
        <button onClick={close}>Go back</button>
        <button
          className="danger"
          onClick={() => {
            confirm();
            close();
          }}
        >
          Continue
        </button>
      </div>
    </Sheet>
  );
}
export function PhotoInput({
  label,
  change,
}: {
  label: string;
  change: (image: string, original: string) => void;
}) {
  const [error, setError] = useState('');
  return (
    <label className="field">
      {label}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > 20 * 1024 * 1024) {
            setError(
              'Choose an image below 20 MiB. Original file is unchanged.',
            );
            return;
          }
          setError('');
          const reader = new FileReader();
          reader.onerror = () =>
            setError('Image could not be read. Try again.');
          reader.onload = () => {
            const source = String(reader.result);
            const image = new Image();
            image.onerror = () =>
              setError('This file could not be decoded as an image.');
            image.onload = () => {
              try {
                const scale = Math.min(
                  1,
                  480 / Math.max(image.width, image.height),
                );
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(image.width * scale));
                canvas.height = Math.max(1, Math.round(image.height * scale));
                const context = canvas.getContext('2d');
                if (!context) throw new Error('Compression unavailable.');
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                const compressed = canvas.toDataURL('image/jpeg', 0.78);
                if (!compressed.startsWith('data:image/jpeg'))
                  throw new Error('Compression unavailable.');
                change(compressed, source);
              } catch {
                setError(
                  'Compression failed. Original image retained for saving.',
                );
                change(source, source);
              }
            };
            image.src = source;
          };
          reader.readAsDataURL(f);
        }}
      />
      {error && <span role="alert">{error}</span>}
    </label>
  );
}
export const dateInput = (t: number) => {
  const d = new Date(t);
  return new Date(t - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: string }
> {
  state = { error: '' };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message };
  }
  render() {
    return this.state.error ? (
      <section role="alert" className="card">
        <h1>Reopen Replift</h1>
        <p>
          The screen could not be displayed. Saved data is retained. Reload to
          try again.
        </p>
        <button onClick={() => location.reload()}>Reload</button>
      </section>
    ) : (
      this.props.children
    );
  }
}
