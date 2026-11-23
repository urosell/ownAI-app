import { B } from './balance';
import type { GameState, LogType } from './state';

export function addLog(s: GameState, type: LogType, text: string): void {
  s.log.unshift({ id: s.nextLogId++, t: s.t, phase: s.phase, quarter: s.board.quarter, type, text });
  if (s.log.length > B.LOG_MAX) s.log.length = B.LOG_MAX;
}
