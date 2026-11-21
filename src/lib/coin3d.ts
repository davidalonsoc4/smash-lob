import {
  ACESFilmicToneMapping, CanvasTexture, CircleGeometry, CylinderGeometry, DirectionalLight, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  PMREMGenerator, PerspectiveCamera, Quaternion, RepeatWrapping, SRGBColorSpace, Scene, TextureLoader, Vector3, WebGLRenderer,
  type Texture,
} from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import type { CoinTossFace } from "@/lib/matchCoinToss"

/**
 * The 3D coin of the coin toss: real thickness, reeded edge and relief lit from the height maps of each face (public/coin).
 * It is loaded on demand (this module and three.js are only fetched when the toss screen opens).
 *
 * The coin lies facing the camera. The smash is the face on the front and the lob the one on the back: resting on the lob
 * means the coin has turned half a turn around the horizontal axis.
 */
export type CoinScene = {
  /** Shows the coin resting on a face, without animation. */
  setFace(face: CoinTossFace): void
  /** Spins the coin on the spot while the result is not known yet. */
  setWaiting(waiting: boolean): void
  /** Tosses the coin: it tumbles on every axis, falls and bounces until it rests on `face`. Resolves when it has stopped. */
  toss(face: CoinTossFace, variant: number): Promise<void>
  /** Lets the person turn the coin with the finger (or the mouse). */
  setInteractive(interactive: boolean): void
  dispose(): void
}

const RADIUS = 1
const THICKNESS = 0.15
const REST = new Vector3(0, -0.7, 0)
const FLOOR_Y = REST.y - 1.15
const FACE_QUATERNION: Record<CoinTossFace, Quaternion> = {
  heads: new Quaternion(),
  tails: new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI),
}

/** One toss: how high the coin goes, how it tumbles (turns on each axis) and how long each bounce lasts. */
const VARIANTS = [
  { turns: [5, 2, 1], flight: 1.5, rise: 1.5 },
  { turns: [3, 4, 0.5], flight: 1.65, rise: 1.7 },
  { turns: [6, 1, 2], flight: 1.4, rise: 1.4 },
] as const
const BOUNCES = [{ height: 0.42, time: 0.36 }, { height: 0.15, time: 0.22 }, { height: 0.05, time: 0.14 }] as const

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const x = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)))
  return x * x * (3 - 2 * x)
}

function reedingTexture() {
  const canvas = document.createElement("canvas")
  canvas.width = 1024
  canvas.height = 16
  const context = canvas.getContext("2d")!
  context.fillStyle = "#6a6a6a"
  context.fillRect(0, 0, 1024, 16)
  context.fillStyle = "#ffffff"
  for (let index = 0; index < 128; index++) context.fillRect(index * 8, 0, 4, 16)
  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  return texture
}

function shadowTexture() {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 128
  const context = canvas.getContext("2d")!
  const gradient = context.createRadialGradient(64, 64, 4, 64, 64, 64)
  gradient.addColorStop(0, "rgba(0,0,0,0.75)")
  gradient.addColorStop(1, "rgba(0,0,0,0)")
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  return new CanvasTexture(canvas)
}

/** Null when the device cannot do WebGL: the screen then keeps the flat coin. */
export async function createCoinScene(canvas: HTMLCanvasElement): Promise<CoinScene | null> {
  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" })
  } catch {
    return null
  }
  if (!renderer.getContext()) return null

  const loader = new TextureLoader()
  let textures: Texture[]
  try {
    textures = await Promise.all(["smash", "lob", "smash-height", "lob-height"].map((name) => loader.loadAsync(`/coin/${name}.webp`)))
  } catch {
    renderer.dispose()
    return null
  }
  const [smash, lob, smashHeight, lobHeight] = textures
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()
  for (const texture of [smash, lob]) { texture.colorSpace = SRGBColorSpace; texture.anisotropy = maxAnisotropy }
  for (const texture of [smashHeight, lobHeight]) texture.anisotropy = maxAnisotropy

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.outputColorSpace = SRGBColorSpace

  const scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04)
  scene.environment = environment.texture
  const key = new DirectionalLight(0xfff1d0, 2.2)
  key.position.set(-3, 4, 5)
  scene.add(key)

  const camera = new PerspectiveCamera(32, 1, 0.1, 50)
  camera.position.set(0, 0, 7.5)
  camera.lookAt(0, 0, 0)

  // The coin: two circles for the faces and a band for the edge.
  const edge = new CylinderGeometry(RADIUS, RADIUS, THICKNESS, 160, 1, true)
  edge.rotateX(Math.PI / 2)
  const front = new CircleGeometry(RADIUS, 160)
  front.translate(0, 0, THICKNESS / 2)
  // The back is turned over around the horizontal axis, so after the coin turns to show it, the picture stands upright.
  const back = new CircleGeometry(RADIUS, 160)
  back.rotateX(Math.PI)
  back.translate(0, 0, -THICKNESS / 2)
  const reeding = reedingTexture()
  const edgeMaterial = new MeshStandardMaterial({ color: 0xd9ac47, metalness: 1, roughness: 0.36, bumpMap: reeding, bumpScale: 1.6 })
  const faceMaterial = (map: Texture, height: Texture) => new MeshStandardMaterial({ map, bumpMap: height, bumpScale: 3.2, metalness: 0.8, roughness: 0.4, envMapIntensity: 1.15 })
  const frontMaterial = faceMaterial(smash, smashHeight)
  const backMaterial = faceMaterial(lob, lobHeight)
  const coin = new Group()
  coin.add(new Mesh(edge, edgeMaterial), new Mesh(front, frontMaterial), new Mesh(back, backMaterial))
  scene.add(coin)

  const shadowMap = shadowTexture()
  const shadow = new Mesh(new CircleGeometry(1, 48), new MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false }))
  shadow.scale.set(1.3, 0.28, 1)
  shadow.position.set(0, FLOOR_Y, -0.4)
  scene.add(shadow)

  // ---- state ----
  const orientation = FACE_QUATERNION.heads.clone()
  let interactive = false
  let touched = false
  let waiting = false
  let disposed = false
  let dragging = false
  let lastPointer = { x: 0, y: 0 }
  const spin = { x: 0, y: 0 }
  let tossing: { start: number; from: Quaternion; face: CoinTossFace; variant: number; resolve: () => void; landed: boolean } | null = null
  let frame = 0

  const resize = () => {
    const { clientWidth: width, clientHeight: height } = canvas
    if (!width || !height) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  resize()

  const place = (position: Vector3, lift: number, towardCamera: number) => {
    coin.position.set(position.x, position.y + lift, position.z + towardCamera)
    const height = Math.max(0, lift) / 1.8
    shadow.scale.set(1.3 * (1 - 0.5 * height), 0.28 * (1 - 0.5 * height), 1)
    ;(shadow.material as MeshBasicMaterial).opacity = Math.max(0.12, 0.9 - 0.75 * height)
  }

  /** The tumble: on every axis, slowing down until the coin lands, then a small wobble that dies out with each bounce. */
  const tossPose = (seconds: number, current: NonNullable<typeof tossing>) => {
    const variant = VARIANTS[(current.variant - 1) % VARIANTS.length]
    const { flight, rise, turns } = variant
    const landing = flight
    let lift = 0
    let towardCamera = 0
    if (seconds < landing) {
      const u = seconds / landing
      lift = rise * 4 * u * (1 - u)
      towardCamera = 1.1 * 4 * u * (1 - u)
    } else {
      let start = landing
      for (const bounce of BOUNCES) {
        if (seconds < start + bounce.time) {
          const u = (seconds - start) / bounce.time
          lift = bounce.height * 4 * u * (1 - u)
          break
        }
        start += bounce.time
      }
    }
    const after = Math.max(0, seconds - landing)
    const wobble = 0.3 * (seconds < landing ? smoothstep(landing - 0.25, landing, seconds) : Math.exp(-3.6 * after) * Math.cos(15 * after))
    const decay = Math.pow(Math.max(0, 1 - seconds / landing), 1.45)
    const angle = (turn: number, residual: number) => turn * Math.PI * 2 * decay + residual
    const x = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), angle(turns[0], wobble))
    const y = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), angle(turns[1], wobble * 0.6))
    const z = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), angle(turns[2], wobble * 0.35))
    const rotation = x.multiply(y).multiply(z).multiply(FACE_QUATERNION[current.face])
    const total = landing + BOUNCES.reduce((sum, bounce) => sum + bounce.time, 0) + 0.25
    return { rotation, lift, towardCamera, total, landing }
  }

  const render = (now: number) => {
    if (disposed) return
    frame = requestAnimationFrame(render)
    if (tossing) {
      const seconds = (now - tossing.start) / 1000
      const pose = tossPose(seconds, tossing)
      // The first moments blend from wherever the coin was (it may have been turned by hand) into the tumble.
      const blend = smoothstep(0, 0.22, seconds)
      orientation.copy(tossing.from).slerp(pose.rotation, blend)
      place(REST, pose.lift, pose.towardCamera)
      if (!tossing.landed && seconds >= pose.landing) { tossing.landed = true; navigator.vibrate?.(40) }
      if (seconds >= pose.total) {
        orientation.copy(FACE_QUATERNION[tossing.face])
        place(REST, 0, 0)
        const finished = tossing
        tossing = null
        finished.resolve()
      }
    } else {
      if (waiting) {
        orientation.premultiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 0.22))
      } else if (!dragging && (Math.abs(spin.x) > 0.0004 || Math.abs(spin.y) > 0.0004)) {
        orientation.premultiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), spin.x)).premultiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), spin.y))
        spin.x *= 0.94
        spin.y *= 0.94
      }
      place(REST, 0, 0)
    }
    // A slow sway while nobody has touched it, so the relief catches the light and it shows that the coin can be turned.
    const sway = !touched && !tossing && !waiting && interactive
      ? new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.sin(now / 900) * 0.28).multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.sin(now / 1300) * 0.12))
      : null
    coin.quaternion.copy(sway ? sway.multiply(orientation) : orientation)
    renderer.render(scene, camera)
  }
  frame = requestAnimationFrame(render)

  const onDown = (event: PointerEvent) => {
    if (!interactive || tossing) return
    dragging = true
    touched = true
    lastPointer = { x: event.clientX, y: event.clientY }
    spin.x = spin.y = 0
    canvas.setPointerCapture(event.pointerId)
  }
  const onMove = (event: PointerEvent) => {
    if (!dragging) return
    const dx = event.clientX - lastPointer.x
    const dy = event.clientY - lastPointer.y
    lastPointer = { x: event.clientX, y: event.clientY }
    spin.x = dx * 0.011
    spin.y = dy * 0.011
    orientation.premultiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), spin.x)).premultiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), spin.y))
  }
  const onUp = (event: PointerEvent) => {
    dragging = false
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
  }
  canvas.addEventListener("pointerdown", onDown)
  canvas.addEventListener("pointermove", onMove)
  canvas.addEventListener("pointerup", onUp)
  canvas.addEventListener("pointercancel", onUp)

  return {
    setFace(face) { orientation.copy(FACE_QUATERNION[face]); touched = true },
    setWaiting(value) { waiting = value; if (value) { touched = true; spin.x = spin.y = 0 } },
    toss(face, variant) {
      return new Promise<void>((resolve) => {
        waiting = false
        touched = true
        tossing = { start: performance.now(), from: orientation.clone(), face, variant, resolve, landed: false }
      })
    },
    setInteractive(value) { interactive = value; canvas.style.touchAction = value ? "none" : "" },
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      canvas.removeEventListener("pointerdown", onDown)
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerup", onUp)
      canvas.removeEventListener("pointercancel", onUp)
      for (const geometry of [edge, front, back, shadow.geometry]) geometry.dispose()
      for (const material of [edgeMaterial, frontMaterial, backMaterial, shadow.material as MeshBasicMaterial]) material.dispose()
      for (const texture of [...textures, reeding, shadowMap, environment.texture]) texture.dispose()
      pmrem.dispose()
      renderer.dispose()
    },
  }
}
