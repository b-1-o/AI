/** Faceted crystal: dense face fill + dedicated edge outline points. */

export type CrystalPt = { x: number; y: number; z: number; s: number }

export type Vec3 = [number, number, number]

export function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}
export function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}
export function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s]
}
export function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}
export function len(a: Vec3): number {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]) || 1
}
export function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

export function buildCrystalVertices(): { verts: Vec3[]; faces: number[][]; edgeList: [number, number][] } {
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

  const edgeSet = new Set<string>()
  const edgeList: [number, number][] = []
  const addEdge = (i: number, j: number) => {
    const a = Math.min(i, j)
    const b = Math.max(i, j)
    const key = a + '-' + b
    if (edgeSet.has(key)) return
    edgeSet.add(key)
    edgeList.push([a, b])
  }
  for (let i = 0; i < sides; i++) {
    addEdge(0, crown[i])
    addEdge(crown[i], crown[(i + 1) % sides])
    addEdge(crown[i], mid[i])
    addEdge(mid[i], mid[(i + 1) % sides])
    addEdge(mid[i], girdle[i])
    addEdge(girdle[i], girdle[(i + 1) % sides])
    addEdge(girdle[i], lower[i])
    addEdge(lower[i], lower[(i + 1) % sides])
    addEdge(lower[i], 25)
  }
  return { verts, faces, edgeList }
}

export function sampleFace(a: Vec3, b: Vec3, c: Vec3, density: number, out: CrystalPt[]) {
  const ab = sub(b, a)
  const ac = sub(c, a)
  const area = 0.5 * len(cross(ab, ac))
  const n = Math.max(2, Math.floor(area * density * 680))
  for (let i = 0; i < n; i++) {
    let u = Math.random()
    let v = Math.random()
    if (u + v > 1) {
      u = 1 - u
      v = 1 - v
    }
    const p = add(a, add(scale(ab, u), scale(ac, v)))
    out.push({ x: p[0], y: p[1], z: p[2], s: 0.28 + Math.random() * 0.32 })
  }
}

export function sampleEdge(a: Vec3, b: Vec3, density: number, out: CrystalPt[]) {
  const L = len(sub(b, a))
  const n = Math.max(6, Math.floor(L * density * 90))
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const p = lerp(a, b, t)
    const j = (Math.random() - 0.5) * 0.004
    out.push({
      x: p[0] + j * 0.3,
      y: p[1] + j * 0.2,
      z: p[2] + j * 0.3,
      s: 0.84 + Math.random() * 0.04,
    })
  }
}

let cached: CrystalPt[] | null = null

export function getCrystalPoints(count = 5200): CrystalPt[] {
  if (cached && cached.length === count) return cached
  if (cached && cached.length > count) {
    const step = cached.length / count
    return Array.from({ length: count }, (_, i) => cached![Math.min(cached!.length - 1, Math.floor(i * step))])
  }

  const { verts, faces, edgeList } = buildCrystalVertices()
  const facesPts: CrystalPt[] = []
  const edgePts: CrystalPt[] = []

  for (const f of faces) {
    sampleFace(verts[f[0]], verts[f[1]], verts[f[2]], 10, facesPts)
  }
  for (const [i, j] of edgeList) {
    sampleEdge(verts[i], verts[j], 1.35, edgePts)
  }

  const edgeBudget = Math.min(edgePts.length, Math.floor(count * 0.255))
  const faceBudget = count - edgeBudget

  const pick = (src: CrystalPt[], n: number) => {
    if (src.length <= n) return src.slice()
    const step = src.length / n
    return Array.from({ length: n }, (_, i) => src[Math.min(src.length - 1, Math.floor(i * step))])
  }

  const final = [...pick(edgePts, edgeBudget), ...pick(facesPts, faceBudget)]
  for (let i = final.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = final[i]
    final[i] = final[j]
    final[j] = tmp
  }

  cached = final
  return final
}
