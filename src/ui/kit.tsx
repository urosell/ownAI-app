// Piezas visuales básicas. Sin lógica de juego: solo pintan datos y lanzan callbacks.
import { useRef, useState, type ReactNode } from 'react';

export function Panel({
  title,
  aside,
  children,
  grow = 1,
  basis = 300,
  collapsible = false,
  id,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  grow?: number;
  basis?: number;
  collapsible?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section
      id={id ? `panel-${id}` : undefined}
      className="fade-in min-w-0 bg-panel border-2 border-line p-4 flex flex-col gap-2.5 scroll-mt-24"
      style={{ flex: `${grow} 1 ${basis}px` }}
    >
      <div className="flex justify-between items-baseline flex-wrap gap-2">
        <h2 className="m-0 font-pixel text-base font-normal text-amber">
          {collapsible ? (
            <button
              className="font-pixel text-amber bg-transparent border-0 p-0 cursor-pointer"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
            >
              {open ? '▾' : '▸'} {title}
            </button>
          ) : (
            title
          )}
        </h2>
        {aside && <span className="text-xs text-muted">{aside}</span>}
      </div>
      {open && children}
    </section>
  );
}

export function Row({ label, value, tone }: { label: ReactNode; value: ReactNode; tone?: Tone }) {
  return (
    <div className="flex justify-between gap-3 text-[13px]">
      <span className="text-muted">{label}</span>
      <span className={toneClass(tone)}>{value}</span>
    </div>
  );
}

export type Tone = 'good' | 'bad' | 'warn' | 'accent' | 'muted' | undefined;

export function toneClass(t: Tone): string {
  switch (t) {
    case 'good':
      return 'text-teal';
    case 'bad':
      return 'text-bad';
    case 'warn':
      return 'text-amber-hi';
    case 'accent':
      return 'text-amber';
    case 'muted':
      return 'text-muted';
    default:
      return '';
  }
}

export function Bar({ value, color = '#5fd3bc', height = 10 }: { value: number; color?: string; height?: number }) {
  const w = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="bg-void border border-line" style={{ height }}>
      <div style={{ width: `${w}%`, height: '100%', background: color, transition: 'width .2s linear' }} />
    </div>
  );
}

export function SplitBar({ parts, height = 14 }: { parts: { value: number; color: string }[]; height?: number }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  return (
    <div className="flex border border-line bg-void" style={{ height }}>
      {parts.map((p, i) => (
        <div key={i} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />
      ))}
    </div>
  );
}

export function Warn({ label, value }: { label: ReactNode; value?: ReactNode }) {
  return (
    <div className="flex justify-between gap-2 bg-warn-bg border border-warn-line px-2 py-1.5 text-[13px]">
      <span className="text-amber-hi">{label}</span>
      {value !== undefined && <span className="text-amber-hi font-medium">{value}</span>}
    </div>
  );
}

/** Botón con coste y explicación al pasar el ratón (o mantener pulsado en móvil). */
export function Btn({
  children,
  onClick,
  disabled,
  primary,
  tip,
  small,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  primary?: boolean;
  tip?: string;
  small?: boolean;
  className?: string;
}) {
  const [showTip, setShowTip] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const base = primary
    ? 'font-pixel text-sm px-4 bg-amber text-[#1a1306] border-2 border-[#1a1306] shadow-[3px_3px_0_#000] enabled:active:translate-x-[2px] enabled:active:translate-y-[2px] enabled:active:shadow-[1px_1px_0_#000]'
    : 'font-mono text-[13px] px-3.5 bg-transparent text-ink border-2 border-line-2 enabled:hover:border-amber';
  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        className={`${base} ${small ? 'min-h-9' : 'min-h-11'} w-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onFocus={() => setShowTip(true)}
        onBlur={() => setShowTip(false)}
        onTouchStart={() => {
          timer.current = window.setTimeout(() => setShowTip(true), 450);
        }}
        onTouchEnd={() => {
          window.clearTimeout(timer.current);
          window.setTimeout(() => setShowTip(false), 1800);
        }}
      >
        {children}
      </button>
      {tip && showTip && (
        <span
          role="tooltip"
          className="absolute z-30 left-0 bottom-full mb-1.5 w-64 max-w-[80vw] bg-void border border-line-2 px-2.5 py-1.5 text-xs text-ink pointer-events-none shadow-[3px_3px_0_#000]"
        >
          {tip}
        </span>
      )}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  children,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-center gap-2 min-h-11 text-[13px] ${disabled ? 'opacity-40' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="w-[18px] h-[18px] accent-amber"
      />
      {children}
    </label>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-[13px]">
      <span className="flex justify-between">
        <span className="text-muted">{label}</span>
        <span>{display}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function Big({ children }: { children: ReactNode }) {
  return <div className="font-pixel text-[44px] leading-none text-amber">{children}</div>;
}

export function Small({ children, tone }: { children: ReactNode; tone?: Tone }) {
  return <div className={`text-xs ${tone ? toneClass(tone) : 'text-muted'}`}>{children}</div>;
}
