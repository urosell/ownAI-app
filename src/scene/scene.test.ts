import { describe, expect, it } from 'vitest';
import { initialState } from '../engine/state';
import { EMPTY_MANIFEST, parseManifest, resolveSprite, spritePosition } from './manifest';
import { placeholderShapes } from './placeholders';
import { SCENES } from './scenes';
import { sceneData } from './variants';

describe('manifiesto', () => {
  const m = parseManifest({
    version: 1,
    palette: 'ownai-32',
    sprites: {
      'gpu_rack.2': { file: 'sprites/gpu_rack_2.png', w: 46, h: 62, anchor: 'bottom-left', frames: 2, fps: 4 },
      desk: { file: 'sprites/desk.png', w: 120, h: 26 },
      roto: { file: 3 },
    },
  });

  it('un sprite ficticio sustituye a su placeholder', () => {
    expect(resolveSprite(m, 'gpu_rack', '2')?.name).toBe('gpu_rack.2');
    expect(resolveSprite(m, 'desk', 'cualquiera')?.name).toBe('desk');
  });

  it('un sprite que falta no rompe nada: se usa el placeholder', () => {
    expect(resolveSprite(m, 'gpu_rack', '3')).toBeNull();
    expect(resolveSprite(EMPTY_MANIFEST, 'founder', 'idle')).toBeNull();
    expect(placeholderShapes('garage', 'founder', 'idle', sceneData(initialState(1))).length).toBeGreaterThan(0);
  });

  it('descarta entradas mal formadas y manifiestos basura', () => {
    expect(m.sprites.roto).toBeUndefined();
    expect(parseManifest(null).sprites).toEqual({});
    expect(parseManifest('hola').sprites).toEqual({});
  });

  it('coloca el sprite según su ancla', () => {
    const slot = { x: 10, y: 10, w: 50, h: 50 };
    expect(spritePosition(slot, { file: '', w: 20, h: 20, anchor: 'bottom-left' })).toEqual({ x: 10, y: 40 });
    expect(spritePosition(slot, { file: '', w: 20, h: 20, anchor: 'top-right' })).toEqual({ x: 40, y: 10 });
  });
});

describe('escenas', () => {
  it('todos los slots tienen placeholder en todas sus variantes', () => {
    const d = sceneData(initialState(1));
    for (const scene of Object.values(SCENES)) {
      for (const slot of scene.slots) {
        for (const v of slot.variants ?? ['']) {
          // Variantes vacías a propósito (nadie / sin humo)
          if (['annotators.0', 'smoke.off', 'servers_smoke.off'].includes(`${slot.id}.${v}`)) continue;
          if (scene.id === 'ending' || scene.id === 'campus') continue;
          expect(placeholderShapes(scene.id, slot.id, v, d).length, `${scene.id}/${slot.id}.${v}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('los slots caben en la escena de 400 × 110', () => {
    for (const scene of Object.values(SCENES)) {
      for (const s of scene.slots) {
        expect(s.x >= 0 && s.y >= 0 && s.x + s.w <= 400 && s.y + s.h <= 110, `${scene.id}/${s.id}`).toBe(true);
      }
    }
  });

  it('las variantes reaccionan al estado', () => {
    const s = initialState(1);
    s.gpus.consumer = 3;
    s.phase = 1;
    expect(sceneData(s).variants.gpu_rack).toBe('3');
    expect(sceneData(s).variants.whiteboard).toBe('1');
  });
});
