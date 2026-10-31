// Ambient layer for the walkthrough. Deliberately small: one Points cloud, one
// shader pair, no addons. It is imported lazily so the product routes and the
// first paint of /judges never pay for three.js.
//
// Lifecycle:
// - IntersectionObserver starts and stops the render loop as the stage enters
//   and leaves the viewport.
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

const COUNT = 1300
const FIELD_X = 14
const FIELD_Y = 10
const FIELD_Z = 8

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

  void main() {
    vec3 p = position;
    p.y = mod(p.y + uTime * aSpeed + 5.0, 10.0) - 5.0;
    p.x += sin(uTime * 0.12 + aPhase) * 0.18;
    p.z += cos(uTime * 0.1 + aPhase) * 0.1;
    p.y += uScroll * 0.6;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (12.0 / max(2.0, -mv.z));

    float depthFade = smoothstep(20.0, 3.0, -mv.z);
    vAlpha = (0.2 + 0.8 * depthFade) * 0.45;
    vColor = aColor;
    vShape = aShape;
  }
`

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vShape;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float alpha = 0.0;

    if (vShape > 0.82) {
      float bar = step(abs(c.x), 0.09) * step(abs(c.y), 0.5);
      alpha = bar * vAlpha;
    } else {
      float d = length(c);
      if (d > 0.5) discard;
      alpha = smoothstep(0.5, 0.08, d) * vAlpha;
    }

    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`

export default function AmbientScene() {
  const hostRef = useRef<HTMLDivElement>(null)

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
    const white = [0.86, 0.87, 0.9]
    const gray = [0.48, 0.49, 0.52]

    for (let i = 0; i < COUNT; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * FIELD_X
      positions[i * 3 + 1] = Math.random() * FIELD_Y - FIELD_Y / 2
      positions[i * 3 + 2] = (Math.random() - 0.5) * FIELD_Z - 1.5

      const roll = Math.random()
      const tint = roll < 0.1 ? orange : roll < 0.26 ? gray : white
      colors[i * 3] = tint[0]
      colors[i * 3 + 1] = tint[1]
      colors[i * 3 + 2] = tint[2]

      sizes[i] = roll < 0.1 ? 2.0 + Math.random() * 1.4 : 0.75 + Math.random() * 1.15
      speeds[i] = 0.05 + Math.random() * 0.16
      phases[i] = Math.random() * Math.PI * 2
      shapes[i] = Math.random() < 0.16 ? 1 : 0
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
      if (!active || !onScreen) {
        frame = 0
        return
      }
      renderFrame(now)
      frame = window.requestAnimationFrame(tick)
    }

    const start = () => {
      if (frame) return
      last = performance.now()
      frame = window.requestAnimationFrame(tick)
    }

    const stop = () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
        frame = 0
      }
    }

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
      observer.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div ref={hostRef} className="h-full w-full" />
}
