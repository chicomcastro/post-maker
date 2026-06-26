// Biblioteca de arranjos reutilizáveis (ver docs/TEMPLATES.md).
// Cada slot define posição (centro), tamanho (fração da página) e rotação das
// fotos de colagem. Coordenadas normalizadas 0–1.

export interface ArrangementSlot {
  /** Centro X (0–1). */
  x: number
  /** Centro Y (0–1). */
  y: number
  /** Largura do frame (fração da página). */
  w: number
  /** Altura do frame (fração da página). */
  h: number
  /** Rotação em graus. */
  rotation: number
}

export interface Arrangement {
  id: string
  /** Número de fotos de colagem. */
  count: number
  slots: ArrangementSlot[]
}

export const ARRANGEMENTS: Record<string, Arrangement> = {
  A1: {
    id: 'A1',
    count: 1,
    slots: [{ x: 0.5, y: 0.58, w: 0.56, h: 0.5, rotation: 4 }],
  },
  A2: {
    id: 'A2',
    count: 2,
    slots: [
      { x: 0.42, y: 0.44, w: 0.5, h: 0.52, rotation: -7 },
      { x: 0.6, y: 0.6, w: 0.5, h: 0.52, rotation: 8 },
    ],
  },
  A3: {
    id: 'A3',
    count: 2,
    slots: [
      { x: 0.34, y: 0.3, w: 0.46, h: 0.48, rotation: -6 },
      { x: 0.66, y: 0.72, w: 0.46, h: 0.48, rotation: 6 },
    ],
  },
  A4: {
    id: 'A4',
    count: 2,
    slots: [
      { x: 0.48, y: 0.5, w: 0.52, h: 0.54, rotation: -4 },
      { x: 0.54, y: 0.54, w: 0.48, h: 0.5, rotation: 5 },
    ],
  },
  A5: {
    id: 'A5',
    count: 3,
    slots: [
      { x: 0.3, y: 0.32, w: 0.42, h: 0.42, rotation: -8 },
      { x: 0.66, y: 0.4, w: 0.4, h: 0.42, rotation: 7 },
      { x: 0.48, y: 0.7, w: 0.44, h: 0.44, rotation: -3 },
    ],
  },
  A6: {
    id: 'A6',
    count: 3,
    slots: [
      { x: 0.46, y: 0.26, w: 0.5, h: 0.3, rotation: -4 },
      { x: 0.54, y: 0.5, w: 0.5, h: 0.3, rotation: 4 },
      { x: 0.46, y: 0.74, w: 0.5, h: 0.3, rotation: -4 },
    ],
  },
  A7: {
    id: 'A7',
    count: 3,
    slots: [
      { x: 0.34, y: 0.66, w: 0.4, h: 0.4, rotation: -10 },
      { x: 0.56, y: 0.7, w: 0.4, h: 0.4, rotation: 6 },
      { x: 0.48, y: 0.84, w: 0.38, h: 0.36, rotation: -2 },
    ],
  },
  A8: {
    id: 'A8',
    count: 2,
    slots: [
      { x: 0.7, y: 0.34, w: 0.46, h: 0.4, rotation: 5 },
      { x: 0.7, y: 0.66, w: 0.46, h: 0.4, rotation: -5 },
    ],
  },
  A9: {
    id: 'A9',
    count: 3,
    slots: [
      { x: 0.4, y: 0.58, w: 0.4, h: 0.46, rotation: -14 },
      { x: 0.5, y: 0.54, w: 0.4, h: 0.46, rotation: 0 },
      { x: 0.6, y: 0.58, w: 0.4, h: 0.46, rotation: 14 },
    ],
  },
}

export function getArrangement(id: string): Arrangement {
  const a = ARRANGEMENTS[id]
  if (!a) throw new Error(`Arranjo desconhecido: ${id}`)
  return a
}
