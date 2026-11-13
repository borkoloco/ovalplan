import type { Diagram, DiagramItem, DiagramMove, ItemKind, Vec } from './diagram'

/**
 * Diagramas de los ejercicios de ejemplo, en metros. Son orientativos:
 * se ajustan cuando Juan revise cada ejercicio.
 */

// Ayudas para escribirlos de forma compacta.
let seq = 0
const it = (kind: ItemKind, id: string, x: number, y: number, holder?: string): DiagramItem => ({
  id,
  kind,
  x,
  y,
  ...(holder ? { holder } : {}),
})
const att = (id: string, x: number, y: number) => it('att', id, x, y)
const def = (id: string, x: number, y: number) => it('def', id, x, y)
const coach = (id: string, x: number, y: number) => it('coach', id, x, y)
const cone = (id: string, x: number, y: number) => it('cone', id, x, y)
const shield = (id: string, x: number, y: number) => it('shield', id, x, y)
const ball = (id: string, holder: string, x = 0, y = 0) => it('ball', id, x, y, holder)
const looseBall = (id: string, x: number, y: number) => it('ball', id, x, y)
const run = (step: number, item: string, to: Vec): DiagramMove => ({ id: `m${++seq}`, step, kind: 'run', item, to })
const pass = (step: number, from: string, to: string | Vec): DiagramMove => ({ id: `m${++seq}`, step, kind: 'pass', from, to })
const kick = (step: number, from: string, to: string | Vec): DiagramMove => ({ id: `m${++seq}`, step, kind: 'kick', from, to })
const corners = (x1: number, y1: number, x2: number, y2: number) => [
  cone('c1', x1, y1),
  cone('c2', x2, y1),
  cone('c3', x2, y2),
  cone('c4', x1, y2),
]

export const DIAGRAMS: Record<string, Diagram> = {
  'ball-tag': {
    w: 24,
    h: 24,
    items: [
      ...corners(2, 2, 22, 22),
      att('a1', 6, 6), att('a2', 16, 8), att('a3', 8, 16), att('a4', 17, 17), att('a5', 12, 13),
      def('d1', 12, 4), def('d2', 4, 12),
      ball('b', 'a1'),
    ],
    moves: [
      run(0, 'd1', [14.5, 7]), pass(0, 'a1', 'a2'),
      run(1, 'd2', [14.5, 16]), pass(1, 'a2', 'a4'),
    ],
  },
  'dynamic-mobility': {
    w: 20,
    h: 12,
    items: [
      cone('c1', 2, 1), cone('c2', 2, 11), cone('c3', 18, 1), cone('c4', 18, 11),
      att('a1', 2, 3), att('a2', 2, 5), att('a3', 2, 7.5), att('a4', 2, 9.5),
      ball('b1', 'a1'), ball('b2', 'a3'),
    ],
    moves: [
      run(0, 'a1', [10, 3]), run(0, 'a2', [10, 5]), run(0, 'a3', [10, 7.5]), run(0, 'a4', [10, 9.5]),
      pass(1, 'a1', 'a2'), pass(1, 'a3', 'a4'),
      run(1, 'a1', [18, 3]), run(1, 'a2', [18, 5]), run(1, 'a3', [18, 7.5]), run(1, 'a4', [18, 9.5]),
    ],
  },
  'square-passing': {
    w: 16,
    h: 16,
    items: [
      ...corners(3, 3, 13, 13),
      att('a1', 3, 3), att('a5', 1.5, 1.5), att('a2', 13, 3), att('a6', 14.5, 1.5),
      att('a3', 13, 13), att('a7', 14.5, 14.5), att('a4', 3, 13), att('a8', 1.5, 14.5),
      ball('b', 'a1'),
    ],
    moves: [
      run(0, 'a1', [9, 3.5]), run(0, 'a2', [12.5, 7]),
      pass(1, 'a1', 'a2'), run(1, 'a1', [13, 2]), run(1, 'a2', [12.5, 9.5]),
      run(2, 'a3', [9, 12.5]), pass(2, 'a2', 'a3'), run(2, 'a2', [14, 14]),
    ],
  },
  'four-corners-game': {
    w: 18,
    h: 18,
    items: [
      ...corners(2, 2, 16, 16),
      att('a1', 8, 8), att('a2', 10.5, 9), att('a3', 8.5, 11), att('a4', 11, 11.5),
      coach('co', 9, 17),
      ball('b1', 'a1'), ball('b2', 'a2'), ball('b3', 'a3'), ball('b4', 'a4'),
    ],
    moves: [
      run(0, 'a1', [15, 3]), run(0, 'a2', [16, 4]), run(0, 'a3', [14.5, 4]), run(0, 'a4', [15.5, 5]),
    ],
  },
  'running-lines-passing': {
    w: 34,
    h: 14,
    items: [
      cone('c1', 1, 1), cone('c2', 1, 13), cone('c3', 32, 1), cone('c4', 32, 13),
      att('a1', 4, 2.5), att('a2', 3, 5.5), att('a3', 2, 8.5), att('a4', 1, 11.5),
      ball('b', 'a1'),
    ],
    moves: [
      run(0, 'a1', [12, 2.5]), run(0, 'a2', [11, 5.5]), run(0, 'a3', [10, 8.5]), run(0, 'a4', [9, 11.5]),
      pass(1, 'a1', 'a2'), run(1, 'a1', [19, 2.5]), run(1, 'a2', [18, 5.5]), run(1, 'a3', [17, 8.5]), run(1, 'a4', [16, 11.5]),
      pass(2, 'a2', 'a3'), run(2, 'a1', [25, 2.5]), run(2, 'a2', [24, 5.5]), run(2, 'a3', [23, 8.5]), run(2, 'a4', [22, 11.5]),
      pass(3, 'a3', 'a4'), run(3, 'a4', [31, 11.5]),
    ],
  },
  'two-vs-one': {
    w: 17,
    h: 12,
    items: [
      ...corners(1, 1, 16, 11),
      att('a1', 2, 4), att('a2', 2, 8.5), def('d1', 12, 6),
      ball('b', 'a1'),
    ],
    moves: [
      run(0, 'a1', [8, 4.5]), run(0, 'a2', [7.5, 9]), run(0, 'd1', [9.5, 5]),
      pass(1, 'a1', 'a2'), run(1, 'a2', [15.5, 9]),
    ],
  },
  'kneeling-tackle': {
    w: 10,
    h: 8,
    items: [att('a1', 3, 2.5), def('d1', 5.5, 2.5), att('a2', 3, 5.5), def('d2', 5.5, 5.5)],
    moves: [run(0, 'd1', [3.9, 2.5]), run(0, 'd2', [3.9, 5.5])],
  },
  'shield-tackle': {
    w: 14,
    h: 9,
    items: [
      att('a1', 11, 2.5), shield('s1', 10.2, 2.5), def('d1', 2, 2.5),
      att('a2', 11, 6.5), shield('s2', 10.2, 6.5), def('d2', 2, 6.5),
    ],
    moves: [
      run(0, 'd1', [6, 2.5]), run(0, 'd2', [6, 6.5]),
      run(1, 'd1', [9.4, 2.5]), run(1, 'd2', [9.4, 6.5]),
    ],
  },
  'go-to-ground': {
    w: 16,
    h: 8,
    items: [att('a1', 2, 3.5), att('a2', 1, 6), ball('b', 'a1')],
    moves: [
      run(0, 'a1', [8, 3.5]), run(0, 'a2', [4.5, 5.5]),
      pass(1, 'a1', [6.8, 3.6]),
      run(2, 'a2', [6.5, 4.2]),
    ],
  },
  'ruck-clearout-shields': {
    w: 14,
    h: 10,
    items: [
      looseBall('b', 7, 5),
      def('d1', 8.4, 5), shield('s1', 7.8, 5),
      att('a1', 2, 3.5), att('a2', 2, 6.5), att('a3', 4.5, 8), att('a4', 1.5, 9),
    ],
    moves: [
      run(0, 'a1', [7.7, 3.8]), run(0, 'a2', [7.7, 6.2]), run(0, 'd1', [11, 5]), run(0, 's1', [10.4, 5]),
      run(1, 'a3', [6.3, 5.3]),
      pass(2, 'a3', 'a4'),
    ],
  },
  'lineout-throw': {
    w: 14,
    h: 8,
    items: [
      cone('c1', 6, 5.5), cone('c2', 9, 5.5), cone('c3', 12, 5.5),
      att('a1', 1, 4), att('a2', 9, 4), ball('b', 'a1'),
    ],
    moves: [pass(0, 'a1', 'a2')],
  },
  'lineout-lift': {
    w: 10,
    h: 8,
    items: [att('a2', 4, 3.5), att('a1', 5, 3.5), att('a3', 6, 3.5), att('a4', 5, 7.5), ball('b', 'a4')],
    moves: [run(0, 'a2', [4.4, 3.5]), run(0, 'a3', [5.6, 3.5]), pass(1, 'a4', 'a1')],
  },
  'defensive-line': {
    w: 20,
    h: 16,
    items: [
      att('a1', 3, 2), att('a2', 3, 5), att('a3', 3, 8), att('a4', 3, 11), att('a5', 3, 14),
      def('d1', 13, 3.5), def('d2', 13, 6.5), def('d3', 13, 9.5), def('d4', 13, 12.5),
      ball('b', 'a3'),
    ],
    moves: [
      run(0, 'd1', [8.5, 3.5]), run(0, 'd2', [8.5, 6.5]), run(0, 'd3', [8.5, 9.5]), run(0, 'd4', [8.5, 12.5]),
      run(0, 'a3', [5, 8]), run(0, 'a4', [5, 11]),
      pass(1, 'a3', 'a4'), run(1, 'd4', [6.3, 11.4]), run(1, 'd3', [7, 9.6]),
    ],
  },
  'kicking-basics': {
    w: 20,
    h: 8,
    items: [att('a1', 2, 4), att('a2', 17, 4), cone('c1', 17, 6.5), ball('b', 'a1')],
    moves: [kick(0, 'a1', 'a2'), kick(1, 'a2', 'a1')],
  },
  'scrum-body-position': {
    w: 8,
    h: 6,
    items: [att('a1', 2.5, 3), def('d1', 5.5, 3), coach('co', 4, 5.3)],
    moves: [run(0, 'a1', [3.5, 3]), run(0, 'd1', [4.5, 3])],
  },
  'tag-rugby': {
    w: 32,
    h: 22,
    lines: [3, 29],
    items: [
      ...corners(1, 1, 31, 21),
      att('a1', 8, 5), att('a2', 6, 9), att('a3', 7, 13), att('a4', 5, 17),
      def('d1', 17, 5), def('d2', 16, 9), def('d3', 17, 13), def('d4', 16, 17),
      ball('b', 'a2'),
    ],
    moves: [
      run(0, 'a2', [12, 9.5]), run(0, 'd2', [13.5, 9.5]), run(0, 'a3', [11, 13]), run(0, 'a4', [9, 17]),
      pass(1, 'a2', 'a3'), run(1, 'a3', [15, 13.5]), run(1, 'd3', [15.5, 12.5]), run(1, 'a4', [13, 17.5]),
      pass(2, 'a3', 'a4'), run(2, 'a4', [29.5, 18]),
    ],
  },
  'end-ball': {
    w: 30,
    h: 20,
    lines: [4, 26],
    items: [
      att('a1', 10, 10), att('a2', 15, 5), att('a3', 19, 14), att('a4', 27.5, 8),
      def('d1', 13, 8), def('d2', 18, 10.5), def('d3', 24, 7),
      ball('b', 'a1'),
    ],
    moves: [pass(0, 'a1', 'a2'), run(0, 'd1', [14, 6]), pass(1, 'a2', 'a3'), run(1, 'a4', [28, 11]), pass(2, 'a3', 'a4')],
  },
  'overload-channel': {
    w: 25,
    h: 20,
    items: [
      ...corners(1, 1, 24, 19),
      att('a1', 3, 4), att('a2', 3, 8), att('a3', 3, 12), att('a4', 3, 16),
      def('d1', 13, 5), def('d2', 13, 10), def('d3', 13, 15),
      ball('b', 'a1'),
    ],
    moves: [
      run(0, 'a1', [8, 4]), run(0, 'a2', [7.5, 8]), run(0, 'a3', [7, 12]), run(0, 'a4', [6.5, 16]),
      run(0, 'd1', [10, 5]), run(0, 'd2', [10, 10]), run(0, 'd3', [10, 14]),
      pass(1, 'a1', 'a2'), run(1, 'd1', [9, 7]),
      pass(2, 'a2', 'a3'), run(2, 'd2', [9, 11.5]),
      pass(3, 'a3', 'a4'), run(3, 'a4', [23, 17]), run(3, 'd3', [11, 13.5]),
    ],
  },
  'ruck-game': {
    w: 30,
    h: 25,
    items: [
      att('a1', 10, 12), att('a2', 7, 9), att('a3', 6, 14), att('a4', 4, 18),
      def('d1', 17, 12), def('d2', 18, 7), def('d3', 18, 17),
      ball('b', 'a1'),
    ],
    moves: [
      run(0, 'a1', [14, 12]), run(0, 'd1', [15.4, 12.3]), run(0, 'a2', [10, 10]), run(0, 'a3', [9, 14]),
      pass(1, 'a1', [13, 12]), run(1, 'a2', [12.6, 10.6]),
      run(2, 'a3', [12.2, 12.5]),
      pass(3, 'a3', 'a4'),
    ],
  },
  'conditioned-match': {
    w: 40,
    h: 30,
    lines: [2, 38],
    items: [
      att('a1', 10, 5), att('a2', 9, 10), att('a3', 8, 15), att('a4', 9, 20), att('a5', 10, 25),
      def('d1', 22, 5), def('d2', 22, 10), def('d3', 22, 15), def('d4', 22, 20), def('d5', 22, 25),
      ball('b', 'a3'),
    ],
    moves: [
      pass(0, 'a3', 'a4'), run(0, 'd4', [19, 20]), run(0, 'a4', [12, 20]),
      pass(1, 'a4', 'a5'), run(1, 'a5', [16, 26]), run(1, 'd5', [19, 25]),
      run(2, 'a5', [37, 27]),
    ],
  },
  'stretch-talk': {
    w: 12,
    h: 12,
    items: [
      coach('co', 6, 6),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
        att(`a${i}`, 6 + 4 * Math.cos((i * Math.PI) / 4), 6 + 4 * Math.sin((i * Math.PI) / 4)),
      ),
    ],
    moves: [],
  },
  'accuracy-challenge': {
    w: 12,
    h: 10,
    items: [
      cone('c1', 9, 5),
      att('a1', 3, 3), att('a2', 1.5, 3), att('a3', 3, 7), att('a4', 1.5, 7),
      ball('b1', 'a1'), ball('b2', 'a3'),
    ],
    moves: [pass(0, 'a1', [8.7, 4.7]), pass(0, 'a3', [8.7, 5.3])],
  },
}
