import { beforeEach, describe, expect, it } from 'vitest'
import {
  add,
  buildCrystalVertices,
  cross,
  getCrystalPoints,
  len,
  lerp,
  sampleEdge,
  sampleFace,
  scale,
  sub,
  type CrystalPt,
  type Vec3,
} from '../src/components/crystalGeometry'

describe('crystalGeometry', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  describe('vector utilities', () => {
    it('adds two vectors', () => {
      expect(add([1, 2, 3], [4, 5, 6])).toEqual([5, 7, 9])
    })

    it('subtracts two vectors', () => {
      expect(sub([5, 7, 9], [1, 2, 3])).toEqual([4, 5, 6])
    })

    it('scales a vector', () => {
      expect(scale([1, -2, 3], 2)).toEqual([2, -4, 6])
    })

    it('linearly interpolates vectors', () => {
      expect(lerp([0, 0, 0], [10, 20, 30], 0.5)).toEqual([5, 10, 15])
    })

    it('returns the vector length', () => {
      expect(len([3, 4, 0])).toBe(5)
    })

    it('uses 1 for the zero vector length', () => {
      expect(len([0, 0, 0])).toBe(1)
    })

    it('calculates the cross product', () => {
      expect(cross([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1])
    })
  })

  describe('buildCrystalVertices', () => {
    it('builds the expected crystal vertex count', () => {
      const result = buildCrystalVertices()
      expect(result.verts).toHaveLength(26)
    })

    it('builds the expected face count', () => {
      const result = buildCrystalVertices()
      expect(result.faces).toHaveLength(48)
    })

    it('builds a unique edge list', () => {
      const result = buildCrystalVertices()
      expect(result.edgeList).toHaveLength(54)
      const keys = result.edgeList.map(([a, b]) => a + '-' + b)
      expect(new Set(keys).size).toBe(result.edgeList.length)
    })

    it('keeps every face index inside the vertex array', () => {
      const { verts, faces } = buildCrystalVertices()
      for (const face of faces) {
        expect(face).toHaveLength(3)
        for (const index of face) {
          expect(index).toBeGreaterThanOrEqual(0)
          expect(index).toBeLessThan(verts.length)
        }
      }
    })

    it('keeps every edge endpoint inside the vertex array', () => {
      const { verts, edgeList } = buildCrystalVertices()
      for (const [a, b] of edgeList) {
        expect(a).toBeGreaterThanOrEqual(0)
        expect(b).toBeGreaterThanOrEqual(0)
        expect(a).toBeLessThan(verts.length)
        expect(b).toBeLessThan(verts.length)
        expect(a).toBeLessThan(b)
      }
    })
  })

  describe('sampleFace', () => {
    it('produces the minimum number of samples for zero density', () => {
      const output: CrystalPt[] = []
      sampleFace([0, 0, 0], [1, 0, 0], [0, 1, 0], 0, output)
      expect(output).toHaveLength(2)
    })

    it('keeps sampled points inside a simple triangle', () => {
      const output: CrystalPt[] = []
      sampleFace([0, 0, 0], [1, 0, 0], [0, 1, 0], 0, output)
      for (const point of output) {
        expect(point.x).toBeGreaterThanOrEqual(0)
        expect(point.y).toBeGreaterThanOrEqual(0)
        expect(point.x + point.y).toBeLessThanOrEqual(1)
        expect(point.z).toBe(0)
        expect(point.s).toBeGreaterThanOrEqual(0.28)
        expect(point.s).toBeLessThanOrEqual(0.6)
      }
    })
  })

  describe('sampleEdge', () => {
    it('produces the minimum edge samples for zero density', () => {
      const output: CrystalPt[] = []
      sampleEdge([0, 0, 0], [1, 0, 0], 0, output)
      expect(output).toHaveLength(7)
    })

    it('samples both endpoints of an edge', () => {
      const output: CrystalPt[] = []
      sampleEdge([0, 0, 0], [1, 0, 0], 0, output)
      const first = output[0]
      const last = output[output.length - 1]
      // sampleEdge adds random jitter of ±0.001, so tolerance 2 digits (0.005).
      expect(first.x).toBeCloseTo(0, 2)
      expect(first.y).toBeCloseTo(0, 2)
      expect(first.z).toBeCloseTo(0, 2)
      expect(last.x).toBeCloseTo(1, 2)
      expect(last.y).toBeCloseTo(0, 2)
      expect(last.z).toBeCloseTo(0, 2)
    })
  })

  describe('getCrystalPoints', () => {
    it('returns an empty array for count zero', () => {
      expect(getCrystalPoints(0)).toEqual([])
    })

    it('returns the requested number for a normal count', () => {
      const points = getCrystalPoints(100)
      expect(points).toHaveLength(100)
    })

    it('returns the default number of points', () => {
      const points = getCrystalPoints()
      expect(points).toHaveLength(5200)
    })

    it('returns no more than requested count when count exceeds available samples', () => {
      const requested = 9000
      const points = getCrystalPoints(requested)
      expect(points.length).toBeLessThanOrEqual(requested)
      expect(points.length).toBeGreaterThan(0)
    })

    it('returns points with the expected CrystalPt shape', () => {
      const points = getCrystalPoints(32)
      expect(points).toHaveLength(32)
      for (const point of points) {
        expect(point).toEqual(
          expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number),
            z: expect.any(Number),
            s: expect.any(Number),
          }),
        )
      }
    })

    it('returns the same content for repeated calls with the same count', () => {
      const first = getCrystalPoints(64)
      const second = getCrystalPoints(64)
      // Cache may return the same reference, but the downsample path
      // builds a new array. Compare by content.
      expect(second).toStrictEqual(first)
    })

    it('can downsample an existing larger cached set', () => {
      const large = getCrystalPoints(256)
      const small = getCrystalPoints(32)
      expect(large).toHaveLength(256)
      expect(small).toHaveLength(32)
    })
  })

  describe('type-level vector usage', () => {
    it('accepts Vec3 tuples as the geometry API type', () => {
      const a: Vec3 = [1, 2, 3]
      const b: Vec3 = [4, 5, 6]
      expect(add(a, b)).toEqual([5, 7, 9])
    })
  })
})
