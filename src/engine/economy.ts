import { B } from './balance';
import { addLog } from './log';
import type { GameState } from './state';

/** Ingreso: suma al dinero, al total ganado y a la contabilidad del trimestre. */
export function earn(s: GameState, amount: number): void {
  if (amount <= 0) return;
  s.money += amount;
  s.totalEarned += amount;
  s.board.revenueThisQuarter += amount;
  s.incomeBuffer += amount;
}

/** Gasto puntual (compras). Devuelve false si no hay dinero. */
export function spend(s: GameState, amount: number): boolean {
  if (amount > s.money + 1e-9) return false;
  s.money -= amount;
  s.board.costsThisQuarter += amount;
  return true;
}

/** Gasto continuo (sueldos, energía…). En Fases 0–1 el dinero no baja de 0: se va gente. */
export function payRunning(s: GameState, amount: number, dt: number): void {
  s.money -= amount;
  s.board.costsThisQuarter += amount;
  if (s.phase <= 1 && s.money < 0) {
    s.money = 0;
    s.unpaidTimer += dt;
    if (s.unpaidTimer >= B.UNPAID_LEAVE_SECONDS) {
      s.unpaidTimer = 0;
      layoffOne(s);
    }
  } else {
    s.unpaidTimer = Math.max(0, s.unpaidTimer - dt);
  }
}

function layoffOne(s: GameState): void {
  if (s.gpus.rented > 0) {
    s.gpus.rented -= 1;
    addLog(s, 'fail', 'No puedes pagar la nube. Te cortan una GPU alquilada.');
  } else if (s.researchers > 0) {
    s.researchers -= 1;
    addLog(s, 'fail', 'Una investigadora se va: "la equity no paga el alquiler".');
  } else if (s.annotators > 0) {
    s.annotators -= 1;
    addLog(s, 'fail', 'Un anotador se va sin cobrar. Te deja una reseña en Glassdoor.');
  }
}
