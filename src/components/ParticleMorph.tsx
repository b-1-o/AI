import { useEffect, useRef } from 'react'
import { getCrystalPoints } from './crystalGeometry'

type Point = { x: number; y: number; strength: number }

type ParticleMorphProps = {
  images: string[]
  progressRef: { current: number }
  dissolveRef?: { current: number }
  particleDensity?: number
  className?: string
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function selectEvenly(points: Point[], count: number): Point[] {
  if (points.length === 0) return []
  if (points.length === count) return points
  if (points.length > count) {
    const result: Point[] = new Array(count)
    const step = points.length / count
    for (let i = 0; i < count; i += 1) {
      result[i] = points[Math.min(points.length - 1, Math.floor(i * step))]
    }
    return result
  }
  return Array.from({ length: count }, (_, i) => {
    const source = points[i % points.length]
    const cycle = Math.floor(i / points.length)
    const angle = cycle * 2.399963
    const radius = 0.00025 * (1 + (cycle % 4))
    return {
      x: source.x + Math.cos(angle) * radius,
      y: source.y + Math.sin(angle) * radius,
      strength: source.strength * (0.72 + ((cycle + i) % 5) * 0.05),
    }
  })
}

function sampleImage(src: string, size = 720): Promise<Point[]> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'))
        return
      }
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, size, size)
      const scale = Math.min(size / image.width, size / image.height)
      const drawWidth = image.width * scale
      const drawHeight = image.height * scale
      ctx.drawImage(image, (size - drawWidth) / 2, (size - drawHeight) / 2, drawWidth, drawHeight)
      const pixels = ctx.getImageData(0, 0, size, size).data
      const candidates: Point[] = []
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const index = (y * size + x) * 4
          const brightness = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / (255 * 3)
          if (brightness < 0.27) continue
          candidates.push({
            x: x / size - 0.5,
            y: 0.5 - y / size,
            strength: clamp((brightness - 0.27) / 0.73, 0, 1),
          })
        }
      }
      resolve(candidates)
    }
    image.onerror = () => reject(new Error('Failed to load particle source: ' + src))
    image.src = src
  })
}

function shader(gl: WebGLRenderingContext, type: number, source: string) {
  const value = gl.createShader(type)
  if (!value) throw new Error('Unable to create shader')
  gl.shaderSource(value, source)
  gl.compileShader(value)
  if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(value) || 'Shader compilation failed'
    gl.deleteShader(value)
    throw new Error(log)
  }
  return value
}

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
  const vertex = shader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragment = shader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  const program = gl.createProgram()
  if (!program) throw new Error('Unable to create program')
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || 'Program link failed'
    gl.deleteProgram(program)
    gl.deleteShader(vertex)
    gl.deleteShader(fragment)
    throw new Error(log)
  }
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  return program
}

const vertexShader = [
  'precision mediump float;',
  'attribute vec4 aB1o;',
  'attribute vec4 aBall;',
  'attribute vec4 aKeyboard;',
  'attribute vec4 aCrystal;',
  'uniform float uProgress;',
  'uniform float uTime;',
  'uniform float uDissolve;',
  'uniform vec2 uScale;',
  'uniform float uPixelRatio;',
  'varying float vAlpha;',
  '',
  'float quintic(float x) {',
  '  x = clamp(x, 0.0, 1.0);',
  '  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);',
  '}',
  '',
  'void main() {',
  '  float p = clamp(uProgress, 0.0, 3.0);',
  '  vec2 from; vec2 to; float local; float fromStrength; float toStrength;',
  '  if (p < 1.0) {',
  '    local = p; from = aB1o.xy; to = aBall.xy * 0.80;',
  '    fromStrength = aB1o.z; toStrength = aBall.z;',
  '  } else if (p < 2.0) {',
  '    local = p - 1.0; from = aBall.xy * 0.80; to = aKeyboard.xy;',
  '    fromStrength = aBall.z; toStrength = aKeyboard.z;',
  '  } else {',
  '    local = p - 2.0; from = aKeyboard.xy; to = aCrystal.xy * 0.72;',
  '    fromStrength = aKeyboard.z; toStrength = aCrystal.z;',
  '  }',
  '  float t = quintic(local);',
  '  t = mix(t, smoothstep(0.0, 1.0, local), 0.35);',
  '  vec2 pos = mix(from, to, t);',
  '  float travel = sin(3.14159265 * local);',
  '  float angle = aKeyboard.w * 6.2831853 + uTime * (0.22 + aKeyboard.w * 0.55);',
  '  float burst = travel * (0.002 + aKeyboard.w * 0.006);',
  '  pos += vec2(cos(angle), sin(angle)) * burst;',
  '  pos += vec2(sin(uTime * 1.6 + aKeyboard.w * 14.0), cos(uTime * 1.3 + aKeyboard.w * 12.0)) * 0.00032;',
  '  float crystalAmt = smoothstep(2.0, 2.75, p);',
  '  float edge = aCrystal.z;',
  '  float spark = 0.0;',
  '  if (crystalAmt > 0.001) {',
  '    float spin = uTime * 0.55 + (p - 2.0) * 0.9 + uDissolve * 6.5;',
  '    float ca = cos(spin); float sa = sin(spin);',
  '    float px = pos.x; float py = pos.y; float pz = aCrystal.w * 0.72;',
  '    float rx = px * ca - pz * sa;',
  '    float rz = px * sa + pz * ca;',
  '    float tilt = 0.32; float cT = cos(tilt); float sT = sin(tilt);',
  '    float ry = py * cT - rz * sT;',
  '    float rz2 = py * sT + rz * cT;',
  '    float persp = 1.45 / (1.45 + rz2);',
  '    pos.x = mix(pos.x, rx * persp, crystalAmt);',
  '    pos.y = mix(pos.y, ry * persp, crystalAmt);',
  '    toStrength = mix(toStrength, toStrength * (0.7 + persp * 0.55), crystalAmt);',
  '    spark = edge * edge * (0.55 + 0.45 * sin(uTime * 3.2 + edge * 20.0 + rz2 * 8.0));',
  '    spark *= crystalAmt * (1.0 - uDissolve * 0.7);',
  '    if (uDissolve > 0.001) {',
  '      float d = uDissolve;',
  '      float rnd = aKeyboard.w;',
  '      vec2 dir = normalize(pos + vec2(0.0001));',
  '      float outward = d * (0.12 + rnd * 0.28);',
  '      pos += dir * outward;',
  '      pos += vec2(cos(rnd * 40.0 + uTime * 4.0), sin(rnd * 35.0 + uTime * 3.5)) * d * 0.08;',
  '    }',
  '  }',
  '  gl_Position = vec4(pos * uScale, 0.0, 1.0);',
  '  float strength = mix(fromStrength, toStrength, t);',
  '  float alpha = 0.62 + min(0.38, strength * 0.45);',
  '  alpha *= (1.0 - uDissolve * 0.55);',
  '  alpha = min(1.0, alpha + spark * 0.5);',
  '  vAlpha = alpha;',
  '  float sizeBoost = 1.0 + spark * 0.9;',
  '  gl_PointSize = uPixelRatio * (1.45 + strength * 0.5) * sizeBoost;',
  '}',
].join('\n')

const fragmentShader = [
  'precision mediump float;',
  'varying float vAlpha;',
  'void main() {',
  '  vec2 p = gl_PointCoord - 0.5;',
  '  float distanceFromCenter = length(p) * 2.0;',
  '  float alpha = smoothstep(1.0, 0.22, distanceFromCenter) * vAlpha;',
  '  if (alpha < 0.01) discard;',
  '  gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);',
  '}',
].join('\n')

export default function ParticleMorph({
  images,
  progressRef,
  dissolveRef,
  particleDensity = 1,
  className = '',
}: ParticleMorphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const dissolveInternal = useRef(0)
  const dissolve = dissolveRef ?? dissolveInternal

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
      desynchronized: true,
      preserveDrawingBuffer: false,
    })

    if (!gl) {
      console.warn('WebGL unavailable for particle morph')
      return
    }

    let disposed = false
    let frame = 0
    let stopRenderer = () => {}

    const particleCount = Math.floor((window.innerWidth < 720 ? 5000 : 8500) * particleDensity)

    const setAttribute = (program: WebGLProgram, name: string, values: Float32Array, size: number) => {
      const location = gl.getAttribLocation(program, name)
      const buffer = gl.createBuffer()
      if (location < 0 || !buffer) throw new Error('Failed to create attribute: ' + name)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, values, gl.STATIC_DRAW)
      gl.enableVertexAttribArray(location)
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0)
      return buffer
    }

    const start = async () => {
      const loaded = await Promise.all(images.slice(0, 3).map((src) => sampleImage(src)))
      if (disposed) return () => {}

      const prepared = loaded.map((points) => selectEvenly(points, particleCount))
      const b1o = new Float32Array(particleCount * 4)
      const ball = new Float32Array(particleCount * 4)
      const keyboard = new Float32Array(particleCount * 4)
      const crystal = new Float32Array(particleCount * 4)
      const mesh = getCrystalPoints(particleCount)

      for (let i = 0; i < particleCount; i += 1) {
        const offset = i * 4
        const b1 = prepared[0][i]
        const ba = prepared[1][i]
        const kb = prepared[2][i]
        const cr = mesh[i]

        b1o[offset] = b1.x
        b1o[offset + 1] = b1.y
        b1o[offset + 2] = b1.strength
        ball[offset] = ba.x
        ball[offset + 1] = ba.y
        ball[offset + 2] = ba.strength
        keyboard[offset] = kb.x
        keyboard[offset + 1] = kb.y
        keyboard[offset + 2] = kb.strength

        crystal[offset] = cr.x
        crystal[offset + 1] = cr.y
        crystal[offset + 2] = cr.s
        crystal[offset + 3] = cr.z

        const value = Math.sin((i + 1) * 12.9898) * 43758.5453
        keyboard[offset + 3] = value - Math.floor(value)
      }

      const program = createProgram(gl, vertexShader, fragmentShader)
      gl.useProgram(program)

      const uniformProgress = gl.getUniformLocation(program, 'uProgress')
      const uniformTime = gl.getUniformLocation(program, 'uTime')
      const uniformDissolve = gl.getUniformLocation(program, 'uDissolve')
      const uniformScale = gl.getUniformLocation(program, 'uScale')
      const uniformPixelRatio = gl.getUniformLocation(program, 'uPixelRatio')

      const buffers = [
        setAttribute(program, 'aB1o', b1o, 4),
        setAttribute(program, 'aBall', ball, 4),
        setAttribute(program, 'aKeyboard', keyboard, 4),
        setAttribute(program, 'aCrystal', crystal, 4),
      ]

      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.clearColor(0, 0, 0, 0)
      gl.disable(gl.DEPTH_TEST)
      gl.disable(gl.CULL_FACE)

      const resize = () => {
        const width = window.innerWidth
        const height = window.innerHeight
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 1)
        canvas.width = Math.floor(width * pixelRatio)
        canvas.height = Math.floor(height * pixelRatio)
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        gl.viewport(0, 0, canvas.width, canvas.height)
        const aspect = width / Math.max(1, height)
        const fit = 1.18
        gl.uniform2f(uniformScale, (2.0 * fit) / Math.max(1, aspect), 2.0 * fit)
        gl.uniform1f(uniformPixelRatio, pixelRatio)
      }

      let running = false
      let lastProgress = -1
      let lastDissolve = -1
      let idleFrames = 0
      const IDLE_THRESHOLD = 45

      const requestRender = (force = false) => {
        if (!disposed && running && !document.hidden && frame === 0) {
          if (force || idleFrames < IDLE_THRESHOLD) {
            frame = requestAnimationFrame(render)
          } else {
            frame = window.setTimeout(() => {
              frame = 0
              requestAnimationFrame(render)
            }, 100) as unknown as number
          }
        }
      }

      const render = (time: number) => {
        frame = 0
        if (disposed || !running || document.hidden) return
        const progress = progressRef.current
        const d = dissolve.current
        const progressDelta = Math.abs(progress - lastProgress)
        const dissolveDelta = Math.abs(d - lastDissolve)
        if (progress >= 2.0 || d > 0.001) {
          idleFrames = 0
          lastProgress = progress
          lastDissolve = d
        } else if (progressDelta < 0.00005 && dissolveDelta < 0.00005) {
          idleFrames += 1
        } else {
          idleFrames = 0
          lastProgress = progress
          lastDissolve = d
        }
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.uniform1f(uniformProgress, progress)
        gl.uniform1f(uniformTime, time * 0.001)
        gl.uniform1f(uniformDissolve, d)
        gl.drawArrays(gl.POINTS, 0, particleCount)
        requestRender()
      }

      const onVisibility = () => {
        if (!document.hidden) {
          idleFrames = 0
          requestRender(true)
        }
      }

      resize()
      window.addEventListener('resize', resize)
      document.addEventListener('visibilitychange', onVisibility)
      running = true
      requestRender(true)

      return () => {
        running = false
        window.removeEventListener('resize', resize)
        document.removeEventListener('visibilitychange', onVisibility)
        if (frame) {
          cancelAnimationFrame(frame)
          clearTimeout(frame)
        }
        buffers.forEach((b) => gl.deleteBuffer(b))
        gl.deleteProgram(program)
      }
    }

    start().then((cleanup) => {
      if (disposed && cleanup) cleanup()
      else if (cleanup) stopRenderer = cleanup
    })

    return () => {
      disposed = true
      stopRenderer()
    }
  }, [images, particleDensity, progressRef, dissolve])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
