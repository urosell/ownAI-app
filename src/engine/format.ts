// Formato de números en español: 1,5 k · 2,3 M · 4,1 mil M · 1,2 B (billones)

const nf = (digits: number) =>
  new Intl.NumberFormat('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: digits, useGrouping: true });
const nf0 = nf(0);
const nf1 = nf(1);
const nf2 = nf(2);

function grouped(n: number): string {
  // Intl en es-ES no agrupa números de 4 cifras; lo forzamos para que "1.240" se lea como en la maqueta.
  const s = nf0.format(Math.round(n));
  if (Math.abs(n) >= 1000 && Math.abs(n) < 10000 && !s.includes('.')) {
    const sign = n < 0 ? '−' : '';
    const a = Math.round(Math.abs(n)).toString();
    return sign + a.slice(0, a.length - 3) + '.' + a.slice(a.length - 3);
  }
  return s.replace('-', '−');
}

const UNITS: [number, string][] = [
  [1e15, ' mil B'],
  [1e12, ' B'],
  [1e9, ' mil M'],
  [1e6, ' M'],
  [1e4, ' k'],
];

export function fmt(n: number, opts: { decimals?: number } = {}): string {
  if (!Number.isFinite(n)) return '∞';
  const a = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  for (const [v, u] of UNITS) {
    if (a >= v) {
      const div = v === 1e4 ? 1e3 : v;
      return sign + nf1.format(a / div) + u;
    }
  }
  if (a >= 100) return grouped(n);
  if (opts.decimals !== undefined) return sign + nf(opts.decimals).format(a);
  if (a >= 10) return sign + nf1.format(a);
  return sign + nf2.format(a);
}

export function money(n: number): string {
  const f = fmt(n);
  return /[kMB]$/.test(f) ? f + '€' : f + ' €';
}

export function perSecond(n: number): string {
  return (n >= 0 ? '+' : '') + fmt(n) + ' €/s';
}

export function pct(p: number, signed = false): string {
  const v = Math.round(p * 100);
  return (signed && v > 0 ? '+' : '') + (v < 0 ? '−' + Math.abs(v) : v) + ' %';
}

export function sci(n: number): string {
  if (n === 0) return '0';
  const e = Math.floor(Math.log10(n));
  const m = n / 10 ** e;
  return `${m.toFixed(1).replace('.', ',')}e${e}`;
}

export function clock(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function tokens(n: number): string {
  return fmt(n);
}
