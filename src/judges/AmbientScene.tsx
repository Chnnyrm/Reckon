// Ambient layer for the film. Deliberately small: one Points cloud, one
// shader pair, no addons. It is imported lazily so the product routes and the
// first paint of /judges never pay for three.js.
//
// Lifecycle:
// - IntersectionObserver starts and stops the render loop as the stage enters
//   and leaves the viewport.
// - The `paused` prop comes from the player, so pausing the film stops the scene.
// - document visibility pauses it as well.
// - prefers-reduced-motion renders exactly one frame and never starts a loop.

import { useEffect, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three'

const COUNT = 1400
const FIELD_X = 14
const FIELD_Y = 10
const FIELD_Z = 8

// Vertex shader with realistic photographic optical depth-of-field simulation:
// points expand into optical circle-of-confusion bokeh discs based on distance
// from the camera focal plane.
const vertexShader = `
  uniform float uTime;
  uniform float uScroll;
  uniform float uPixelRatio;
  attribute float aSize;
  attribute float aSpeed;
  attribute float aPhase;
  attribute float aShape;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vShape;
  varying float vBokeh;

  void main() {
    vec3 p = position;
    p.y = mod(p.y + uTime * aSpeed + 5.0, 10.0) - 5.0;
    p.x += sin(uTime * 0.12 + aPhase) * 0.18;
    p.z += cos(uTime * 0.1 + aPhase) * 0.1;
    p.y += uScroll * 0.6;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    // Optical focal plane at z = -6.5 (macro camera lens simulation)
    float focalPlane = -6.5;
    float distToFocus = abs(mv.z - focalPlane);
    float coc = smoothstep(0.2, 3.8, distToFocus);
    vBokeh = coc;

    // Realistic optical expansion: out of focus points form larger bokeh discs
    float opticalSize = aSize * (1.0 + coc * 2.6);
    gl_PointSize = opticalSize * uPixelRatio * (13.5 / max(2.0, -mv.z));

    float depthFade = smoothstep(18.0, 2.8, -mv.z);
    float intensity = 1.0 / (1.0 + coc * 1.4);
    vAlpha = (0.24 + 0.76 * depthFade) * intensity * 0.52;
    vColor = aColor;
    vShape = aShape;
  }
`

// Fragment shader modeling physical camera aperture optics:
// circular bokeh discs with bright perimeter rims and subtle chromatic fringing.
const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vShape;
  varying float vBokeh;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;

    float alpha = 0.0;
    vec3 col = vColor;

    if (vShape > 0.82) {
      float bar = step(abs(c.x), 0.08) * step(abs(c.y), 0.48);
      alpha = bar * vAlpha;
    } else {
      // 1-to-1 realistic photographic lens bokeh aperture:
      // sharp outer perimeter ring characteristic of real fast lenses,
      // with a smooth translucent core.
      float rim = smoothstep(0.35, 0.48, r) * (0.8 + 0.45 * vBokeh);
      float core = (1.0 - smoothstep(0.0, 0.46, r) * 0.4);
      float edge = smoothstep(0.5, 0.42, r);
      float disc = (core + rim) * edge;

      if (r > 0.4 && vBokeh > 0.3) {
        col.r *= 1.06;
        col.b *= 0.95;
      }

      alpha = disc * vAlpha;
    }

    if (alpha < 0.005) discard;
    gl_FragColor = vec4(col, alpha);
  }
`

export default function AmbientScene({ paused = false }: { paused?: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(paused)
  const controlsRef = useRef<{ start: () => void; stop: () => void } | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let renderer: WebGLRenderer
    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
      })
    } catch {
      return
    }

    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    host.appendChild(renderer.domElement)

    const scene = new Scene()
    const camera = new PerspectiveCamera(48, 1, 0.1, 40)
    camera.position.set(0, 0, 7)

    const positions = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)
    const sizes = new Float32Array(COUNT)
    const speeds = new Float32Array(COUNT)
    const phases = new Float32Array(COUNT)
    const shapes = new Float32Array(COUNT)

    const orange = [1.0, 0.478, 0.102]
    const warmAmber = [1.0, 0.64, 0.32]
    const white = [0.92, 0.93, 0.96]
    const gray = [0.52, 0.54, 0.58]

    for (let i = 0; i < COUNT; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * FIELD_X
      positions[i * 3 + 1] = Math.random() * FIELD_Y - FIELD_Y / 2
      positions[i * 3 + 2] = (Math.random() - 0.5) * FIELD_Z - 1.5

      const roll = Math.random()
      const tint = roll < 0.1 ? orange : roll < 0.18 ? warmAmber : roll < 0.32 ? gray : white
      colors[i * 3] = tint[0]
      colors[i * 3 + 1] = tint[1]
      colors[i * 3 + 2] = tint[2]

      sizes[i] = roll < 0.1 ? 2.2 + Math.random() * 1.5 : 0.8 + Math.random() * 1.2
      speeds[i] = 0.05 + Math.random() * 0.16
      phases[i] = Math.random() * Math.PI * 2
      shapes[i] = Math.random() < 0.15 ? 1 : 0
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('aColor', new BufferAttribute(colors, 3))
    geometry.setAttribute('aSize', new BufferAttribute(sizes, 1))
    geometry.setAttribute('aSpeed', new BufferAttribute(speeds, 1))
    geometry.setAttribute('aPhase', new BufferAttribute(phases, 1))
    geometry.setAttribute('aShape', new BufferAttribute(shapes, 1))

    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.75) },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
    })

    const points = new Points(geometry, material)
    points.frustumCulled = false
    scene.add(points)

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const resize = () => {
      const width = Math.max(1, host.clientWidth)
      const height = Math.max(1, host.clientHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 1.75)
      if (reduced) renderer.render(scene, camera)
    }

    material.uniforms.uScroll.value = Math.min(1, window.scrollY / Math.max(1, window.innerHeight))

    resize()
    renderer.render(scene, camera)

    if (reduced) {
      const resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(host)
      return () => {
        resizeObserver.disconnect()
        geometry.dispose()
        material.dispose()
        renderer.dispose()
        renderer.domElement.remove()
      }
    }

    let frame = 0
    let active = false
    let onScreen = false
    let last = performance.now()
    let time = 0

    const renderFrame = (now: number) => {
      const delta = Math.min(0.05, (now - last) / 1000)
      last = now
      time += delta
      material.uniforms.uTime.value = time
      const scroll = window.scrollY / Math.max(1, window.innerHeight)
      material.uniforms.uScroll.value += (Math.min(1.2, scroll) - material.uniforms.uScroll.value) * 0.04
      renderer.render(scene, camera)
    }

    const tick = (now: number) => {
      if (!active || !onScreen || pausedRef.current) {
        frame = 0
        return
      }
      renderFrame(now)
      frame = window.requestAnimationFrame(tick)
    }

    const start = () => {
      if (frame || pausedRef.current) return
      last = performance.now()
      frame = window.requestAnimationFrame(tick)
    }

    const stop = () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
        frame = 0
      }
    }

    controlsRef.current = { start, stop }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        onScreen = Boolean(entry && entry.isIntersecting)
        if (onScreen && active) start()
        else stop()
      },
      { rootMargin: '120px 0px', threshold: 0 }
    )
    observer.observe(host)

    const onVisibility = () => {
      active = document.visibilityState === 'visible'
      if (active && onScreen) start()
      else stop()
    }
    active = document.visibilityState === 'visible'
    document.addEventListener('visibilitychange', onVisibility)

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)

    if (active && onScreen) start()

    return () => {
      stop()
      controlsRef.current = null
      observer.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  useEffect(() => {
    pausedRef.current = paused
    const controls = controlsRef.current
    if (!controls) return
    if (paused) controls.stop()
    else controls.start()
  }, [paused])

  return <div ref={hostRef} className="h-full w-full" />
}
