/** Shared faceted crystal mesh → surface points (dot-art). All crystals use this. */

export type CrystalPt = { x: number; y: number; z: number; s: number }

type Vec3 = [number, number, number]

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}
function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}
function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s]
}
function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}
function len(a: Vec3): number {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]) || 1
}
function normalize(a: Vec3): Vec3 {
  const L = len(a)
  return [a[0] / L, a[1] / L, a[2] / L]
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

/** Build vertices matching the reference faceted crystal (6-sided). */
function buildCrystalVertices(): { verts: Vec3[]; faces: number[][] } {
  const sides = 6
  const verts: Vec3[] = []

  // 0: top apex
  verts.push([0, 0.48, 0])

  // 1..6: upper crown ring (under tip)
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2
    verts.push([Math.cos(a) * 0.11, 0.30, Math.sin(a) * 0.11])
  }

  // 7..12: mid upper body
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2
    verts.push([Math.cos(a) * 0.20, 0.08, Math.sin(a) * 0.20])
  }

  // 13..18: widest girdle
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2
    verts.push([Math.cos(a) * 0.27, -0.18, Math.sin(a) * 0.27])
  }

  // 19..24: lower taper
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2
    verts.push([Math.cos(a) * 0.16, -0.34, Math.sin(a) * 0.16])
  }

  // 25: bottom apex
  verts.push([0, -0.44, 0])

  const faces: number[][] = []
  const ring = (start: number) => Array.from({ length: sides }, (_, i) => start + i)

  const crown = ring(1)
  for (let i = 0; i < sides; i++) {
    faces.push([0, crown[i], crown[(i + 1) % sides]])
  }

  const mid = ring(7)
  for (let i = 0; i < sides; i++) {
    const a = crown[i]
    const b = crown[(i + 1) % sides]
    const c = mid[(i + 1) % sides]
    const d = mid[i]
    faces.push([a, b, c])
    faces.push([a, c, d])
  }

  const girdle = ring(13)
  for (let i = 0; i < sides; i++) {
    const a = mid[i]
    const b = mid[(i + 1) % sides]
    const c = girdle[(i + 1) % sides]
    const d = girdle[i]
    faces.push([a, b, c])
    faces.push([a, c, d])
  }

  const lower = ring(19)
  for (let i = 0; i < sides; i++) {
    const a = girdle[i]
    const b = girdle[(i + 1) % sides]
    const c = lower[(i + 1) % sides]
    const d = lower[i]
    faces.push([a, b, c])
    faces.push([a, c, d])
  }

  for (let i = 0; i < sides; i++) {
    faces.push([lower[i], lower[(i + 1) % sides], 25])
  }

  return { verts, faces }
}

function sampleTriangle(a: Vec3, b: Vec3, c: Vec3, density: number, edgeBoost: number, out: CrystalPt[]) {
  const ab = sub(b, a)
  const ac = sub(c, a)
  const area = 0.5 * len(cross(ab, ac))
  const nFace = Math.max(1, Math.floor(area * density * 900))
  const nEdge = Math.max(2, Math.floor(len(ab) * edgeBoost * 28))

  for (let i = 0; i < nFace; i++) {
    let u = Math.random()
    let v = Math.random()
    if (u + v > 1) {
      u = 1 - u
      v = 1 - v
    }
    const p = add(a, add(scale(ab, u), scale(ac, v)))
    out.push({ x: p[0], y: p[1], z: p[2], s: 0.35 + Math.random() * 0.35 })
  }

  const edges: [Vec3, Vec3][] = [
    [a, b],
    [b, c],
    [c, a],
  ]
  for (const [p0, p1] of edges) {
    for (let i = 0; i < nEdge; i++) {
      const t = i / (nEdge - 1 || 1)
      const p = lerp(p0, p1, t)
      const dir = normalize(sub(p1, p0))
      const up: Vec3 = Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
      const side = normalize(cross(dir, up))
      const j = (Math.random() - 0.5) * 0.004
      out.push({
        x: p[0] + side[0] * j,
        y: p[1] + side[1] * j,
        z: p[2] + side[2] * j,
        s: 0.75 + Math.random() * 0.25,
      })
    }
  }
}

let cached: CrystalPt[] | null = null

/**
 * Surface point cloud for the crystal. Same points for every crystal instance.
 */
export function getCrystalPoints(count = 5200): CrystalPt[] {
  if (cached && cached.length >= count * 0.9) {
    if (cached.length === count) return cached
    if (cached.length > count) {
      const step = cached.length / count
      return Array.from({ length: count }, (_, i) => cached![Math.min(cached!.length - 1, Math.floor(i * step))])
    }
  }

  const { verts, faces } = buildCrystalVertices()
  const raw: CrystalPt[] = []

  for (const f of faces) {
    sampleTriangle(verts[f[0]], verts[f[1]], verts[f[2]], 14, 1.35, raw)
  }

  for (let i = 0; i < 40; i++) {
    const t = Math.random()
    raw.push({ x: (Math.random() - 0.5) * 0.02, y: 0.48 - t * 0.06, z: (Math.random() - 0.5) * 0.02, s: 1 })
    raw.push({ x: (Math.random() - 0.5) * 0.02, y: -0.44 + t * 0.05, z: (Math.random() - 0.5) * 0.02, s: 0.9 })
  }

  for (let i = raw.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = raw[i]
    raw[i] = raw[j]
    raw[j] = tmp
  }

  let final = raw
  if (raw.length > count) {
    const step = raw.length / count
    final = Array.from({ length: count }, (_, i) => raw[Math.min(raw.length - 1, Math.floor(i * step))])
  } else if (raw.length < count) {
    final = Array.from({ length: count }, (_, i) => raw[i % raw.length])
  }

  cached = final
  return final
}
