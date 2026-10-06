import { beforeEach, describe, expect, it } from 'vitest'
import { clamp, selectEvenly } from '../src/components/ParticleMorph'

type Point = {
  x: number
  y: number
  strength: number
}

const points: Point[] = [
  { x: 0, y: 0, strength: 0.1 },
  { x: 1, y: 1, strength: 0.2 },
  { x: 2, y: 2, strength: 0.3 },
  { x: 3, y: 3, strength: 0.4 },
]

describe('ParticleMorph utilities', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  describe('clamp', () => {
    it('returns the value when it is inside the range', () => {
      expect(clamp(5, 0, 10)).toBe(5)
    })

    it('clamps values below the minimum', () => {
      expect(clamp(-5, 0, 10)).toBe(0)
    })

    it('clamps values above the maximum', () => {
      expect(clamp(15, 0, 10)).toBe(10)
    })

    it('keeps an exact minimum unchanged', () => {
      expect(clamp(0, 0, 10)).toBe(0)
    })

    it('keeps an exact maximum unchanged', () => {
      expect(clamp(10, 0, 10)).toBe(10)
    })
  })

  describe('selectEvenly', () => {
    it('generates fallback points for an empty source', () => {
      const result = selectEvenly([], 5)
      expect(result).toHaveLength(5)
      for (const point of result) {
        expect(point.strength).toBe(0.4)
        expect(point.x).toEqual(expect.any(Number))
        expect(point.y).toEqual(expect.any(Number))
      }
    })

    it('returns an empty array when count is zero', () => {
      expect(selectEvenly(points, 0)).toEqual([])
    })

    it('returns the original array when count equals length', () => {
      const result = selectEvenly(points, points.length)
      expect(result).toBe(points)
    })

    it('selects evenly spaced points when source is larger', () => {
      const result = selectEvenly(points, 2)
      expect(result).toHaveLength(2)
      expect(result[0]).toBe(points[0])
      expect(result[1]).toBe(points[2])
    })

    it('does not exceed the requested count', () => {
      const result = selectEvenly(points, 1)
      expect(result).toHaveLength(1)
    })

    it('expands a smaller source by cycling through source points', () => {
      const result = selectEvenly(points.slice(0, 2), 5)
      expect(result).toHaveLength(5)
      // selectEvenly adds a small jitter when expanding,
      // so assert within 2 decimal places (tolerance 0.005).
      expect(result[0].x).toBeCloseTo(0, 2)
      expect(result[0].y).toBeCloseTo(0, 2)
      expect(result[1].x).toBeCloseTo(1, 2)
      expect(result[1].y).toBeCloseTo(1, 2)
      expect(result[2].x).not.toBeUndefined()
      expect(result[3].x).not.toBeUndefined()
      expect(result[4].x).not.toBeUndefined()
    })

    it('preserves point identity approximately while expanding with small perturbations', () => {
      const source = [{ x: 0.25, y: -0.5, strength: 0.8 }]
      const result = selectEvenly(source, 4)
      expect(result).toHaveLength(4)
      // Expansion jitter can reach ~0.001, so tolerance 2 digits (0.005).
      expect(result[0].x).toBeCloseTo(0.25, 2)
      expect(result[0].y).toBeCloseTo(-0.5, 2)
      for (const point of result) {
        expect(point.x).toBeCloseTo(0.25, 2)
        expect(point.y).toBeCloseTo(-0.5, 2)
        expect(point.strength).toBeGreaterThan(0)
      }
    })
  })
})
