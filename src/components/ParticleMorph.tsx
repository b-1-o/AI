import { useEffect, useRef } from 'react'

type Point = { x: number; y: number; strength: number }

type ParticleMorphProps = {
  images: string[]
  progressRef: { current: number }
  particleDensity?: number
  className?: string
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function smoothstep(x: number) {
  const t = clamp(x, 0, 1)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

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

      ctx.drawImage(
        image,
        (size - drawWidth) / 2,
        (size - drawHeight) / 2,
        drawWidth,
        drawHeight,
      )

      const pixels = ctx.getImageData(0, 0, size, size).data
      const candidates: Point[] = []

      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const index = (y * size + x) * 4
          const brightness =
            (pixels[index] + pixels[index + 1] + pixels[index + 2]) / (255 * 3)

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
    const log = gl.getProgramInfoLog(program) || 'Program linking failed'
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
  'uniform float uProgress;',
  'uniform float uTime;',
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
  '  float p = clamp(uProgress, 0.0, 2.0);',
  '  vec2 from;',
  '  vec2 to;',
  '  float local;',
  '  float fromStrength;',
  '  float toStrength;',
  '',
  '  if (p < 1.0) {',
  '    local = p;',
  '    from = aB1o.xy;',
  '    to = aBall.xy * 0.80;',
  '    fromStrength = aB1o.z;',
  '    toStrength = aBall.z;',
  '  } else {',
  '    local = p - 1.0;',
  '    from = aBall.xy * 0.80;',
  '    to = aKeyboard.xy;',
  '    fromStrength = aBall.z;',
  '    toStrength = aKeyboard.z;',
  '  }',
  '',
  '  float t = quintic(local);',
  '  vec2 pos = mix(from, to, t);',
  '  float travel = sin(3.14159265 * local);',
  '  float angle = aKeyboard.w * 6.2831853 + uTime * (0.30 + aKeyboard.w * 0.70);',
  '  float burst = travel * (0.003 + aKeyboard.w * 0.009);',
  '',
  '  pos += vec2(cos(angle), sin(angle)) * burst;',
  '  pos += vec2(',
  '    sin(uTime * 2.0 + aKeyboard.w * 18.0),',
  '    cos(uTime * 1.7 + aKeyboard.w * 15.0)',
  '  ) * 0.00045;',
  '',
  '  gl_Position = vec4(pos * uScale, 0.0, 1.0);',
  '  float strength = mix(fromStrength, toStrength, t);',
  '  vAlpha = 0.62 + min(0.38, strength * 0.45);',
  '  gl_PointSize = uPixelRatio * (1.55 + strength * 0.55);',
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
  particleDensity = 1,
  className = '',
}: ParticleMorphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

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
    let width = 1
    let height = 1
    let pixelRatio = 1
    let stopRenderer = () => {}

    const particleCount = Math.round(
      (window.innerWidth < 760 ? 5000 : 8500) * particleDensity,
    )

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
      const loaded = await Promise.all(images.map((src) => sampleImage(src)))
      if (disposed) return () => {}

      const prepared = loaded.map((points) => selectEvenly(points, particleCount))
      const b1o = new Float32Array(particleCount * 4)
      const ball = new Float32Array(particleCount * 4)
      const keyboard = new Float32Array(particleCount * 4)

      for (let i = 0; i < particleCount; i += 1) {
        const offset = i * 4
        const b1 = prepared[0][i]
        const ba = prepared[1][i]
        const kb = prepared[2][i]

        b1o[offset] = b1.x
        b1o[offset + 1] = b1.y
        b1o[offset + 2] = b1.strength

        ball[offset] = ba.x
        ball[offset + 1] = ba.y
        ball[offset + 2] = ba.strength

        keyboard[offset] = kb.x
        keyboard[offset + 1] = kb.y
        keyboard[offset + 2] = kb.strength

        const value = Math.sin((i + 1) * 12.9898) * 43758.5453
        keyboard[offset + 3] = value - Math.floor(value)
      }

      const program = createProgram(gl, vertexShader, fragmentShader)
      gl.useProgram(program)

      const uniformProgress = gl.getUniformLocation(program, 'uProgress')
      const uniformTime = gl.getUniformLocation(program, 'uTime')
      const uniformScale = gl.getUniformLocation(program, 'uScale')
      const uniformPixelRatio = gl.getUniformLocation(program, 'uPixelRatio')

      const buffers = [
        setAttribute(program, 'aB1o', b1o, 4),
        setAttribute(program, 'aBall', ball, 4),
        setAttribute(program, 'aKeyboard', keyboard, 4),
      ]

      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.clearColor(0, 0, 0, 0)

      const resize = () => {
        width = window.innerWidth
        height = window.innerHeight
        pixelRatio = Math.min(
          window.devicePixelRatio || 1,
          window.innerWidth < 760 ? 1.0 : 1.0,
        )

        canvas.width = Math.floor(width * pixelRatio)
        canvas.height = Math.floor(height * pixelRatio)
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        gl.viewport(0, 0, canvas.width, canvas.height)

        const aspect = width / Math.max(1, height)
        const fit = 1.18
        const scaleX = 2.0 * fit / Math.max(1, aspect)
        const scaleY = 2.0 * fit

        gl.uniform2f(uniformScale, scaleX, scaleY)
        gl.uniform1f(uniformPixelRatio, pixelRatio)
      }

      let running = false

      const requestRender = () => {
        if (!disposed && running && !document.hidden && frame === 0) {
          frame = requestAnimationFrame(render)
        }
      }

      const render = (time: number) => {
        frame = 0
        if (disposed || !running || document.hidden) return

        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.uniform1f(uniformProgress, progressRef.current)
        gl.uniform1f(uniformTime, time * 0.001)
        gl.drawArrays(gl.POINTS, 0, particleCount)

        requestRender()
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          running = Boolean(entry?.isIntersecting)
          if (running) requestRender()
          else if (frame !== 0) {
            cancelAnimationFrame(frame)
            frame = 0
          }
        },
        { rootMargin: '64px 0px' },
      )

      const onVisibilityChange = () => {
        if (document.hidden) {
          if (frame !== 0) {
            cancelAnimationFrame(frame)
            frame = 0
          }
          return
        }

        requestRender()
      }

      resize()
      observer.observe(canvas)
      document.addEventListener('visibilitychange', onVisibilityChange)
      window.addEventListener('resize', resize)
      running = true
      requestRender()

      return () => {
        cancelAnimationFrame(frame)
        observer.disconnect()
        document.removeEventListener('visibilitychange', onVisibilityChange)
        window.removeEventListener('resize', resize)
        for (const buffer of buffers) gl.deleteBuffer(buffer)
        gl.deleteProgram(program)
      }
    }

    void start()
      .then((cleanup) => {
        if (disposed) cleanup()
        else stopRenderer = cleanup
      })
      .catch((error) => console.error(error))

    return () => {
      disposed = true
      stopRenderer()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [images, particleDensity, progressRef])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
