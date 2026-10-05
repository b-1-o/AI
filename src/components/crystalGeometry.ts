/** Shared faceted crystal mesh → surface points (dot-art). Edge-heavy for facet lines. */

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

function buildCrystalVertices(): { verts: Vec3[]; faces: number[][] } {
  const sides = 6
  const verts: Vec3[] = []
  verts.push([0, 0.48, 0])
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2
    verts.push([Math.cos(a) * 0.11, 0.30, Math.sin(a) * 0.11])
  }
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2
    verts.push([Math.cos(a) * 0.20, 0.08, Math.sin(a) * 0.20])
  }
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2
    verts.push([Math.cos(a) * 0.27, -0.18, Math.sin(a) * 0.27])
  }
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2
    verts.push([Math.cos(a) * 0.16, -0.34, Math.sin(a) * 0.16])
  }
  verts.push([0, -0.44, 0])

  const faces: number[][] = []
  const ring = (start: number) => Array.from({ length: sides }, (_, i) => start + i)
  const crown = ring(1)
  for (let i = 0; i < sides; i++) faces.push([0, crown[i], crown[(i + 1) % sides]])
  const mid = ring(7)
  for (let i = 0; i < sides; i++) {
    faces.push([crown[i], crown[(i + 1) % sides], mid[(i + 1) % sides]])
    faces.push([crown[i], mid[(i + 1) % sides], mid[i]])
  }
  const girdle = ring(13)
  for (let i = 0; i < sides; i++) {
    faces.push([mid[i], mid[(i + 1) % sides], girdle[(i + 1) % sides]])
    faces.push([mid[i], girdle[(i + 1) % sides], girdle[i]])
  }
  const lower = ring(19)
  for (let i = 0; i < sides; i++) {
    faces.push([girdle[i], girdle[(i + 1) % sides], lower[(i + 1) % sides]])
    faces.push([girdle[i], lower[(i + 1) % sides], lower[i]])
  }
  for (let i = 0; i < sides; i++) faces.push([lower[i], lower[(i + 1) % sides], 25])
  return { verts, faces }
}

function sampleTriangle(
  a: Vec3,
  b: Vec3,
  c: Vec3,
  faceDensity: number,
  edgeDensity: number,
  out: CrystalPt[],
) {
  const ab = sub(b, a)
  const ac = sub(c, a)
  const area = 0.5 * len(cross(ab, ac))
  const nFace = Math.max(0, Math.floor(area * faceDensity * 280))
  const nEdge = Math.max(3, Math.floor(len(ab) * edgeDensity * 48))

  for (let i = 0; i < nFace; i++) {
    let u = Math.random()
    let v = Math.random()
    if (u + v > 1) {
      u = 1 - u
      v = 1 - v
    }
    const p = add(a, add(scale(ab, u), scale(ac, v)))
    out.push({ x: p[0], y: p[1], z: p[2], s: 0.22 + Math.random() * 0.25 })
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
      const j = (Math.random() - 0.5) * 0.0025
      out.push({
        x: p[0] + side[0] * j,
        y: p[1] + side[1] * j,
        z: p[2] + side[2] * j,
        s: 0.85 + Math.random() * 0.15,
      })
    }
  }
}

let cached: CrystalPt[] | null = null

export function getCrystalPoints(count = 4200): CrystalPt[] {
  if (cached && cached.length === count) return cached
  if (cached && cached.length > count) {
    const step = cached.length / count
    return Array.from({ length: count }, (_, i) => cached![Math.min(cached!.length - 1, Math.floor(i * step))])
  }

  const { verts, faces } = buildCrystalVertices()
  const raw: CrystalPt[] = []
  for (const f of faces) {
    sampleTriangle(verts[f[0]], verts[f[1]], verts[f[2]], 4.5, 1.8, raw)
  }

  for (let i = raw.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = raw[i]
    raw[i] = raw[j]
    raw[j] = tmp
  }

  let final = raw
  if (raw.length > count) {
    raw.sort((a, b) => b.s - a.s)
    const edges = raw.filter((p) => p.s > 0.7)
    const facesPts = raw.filter((p) => p.s <= 0.7)
    const edgeN = Math.min(edges.length, Math.floor(count * 0.62))
    const faceN = count - edgeN
    final = [...edges.slice(0, edgeN), ...facesPts.slice(0, faceN)]
  } else if (raw.length < count) {
    final = Array.from({ length: count }, (_, i) => raw[i % raw.length])
  }

  cached = final
  return final
}
