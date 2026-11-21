import {
  ACESFilmicToneMapping, CanvasTexture, CircleGeometry, CylinderGeometry, DirectionalLight, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  PMREMGenerator, PerspectiveCamera, Quaternion, RepeatWrapping, SRGBColorSpace, Scene, TextureLoader, Vector3, WebGLRenderer,
  type Texture,
} from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import type { CoinTossFace } from "@/lib/matchCoinToss"

/**
 * The 3D coin of the coin toss: real thickness, reeded edge and relief lit from the height maps of each face (public/coin).
 * It fills the whole screen of the toss, so the coin can go up to the top and fall to the bottom. It is loaded on demand
 * (this module and three.js are only fetched when the toss screen opens).
 *
 * The coin lies facing the camera. The smash is the face on the front and the lob the one on the back.
 */
export type CoinScene = {
  /** Shows the coin resting on a face, without animation. */
  setFace(face: CoinTossFace): void
  /** Where the coin waits: high on the screen (the text and the buttons are below) or in the middle. */
  setLayout(layout: "top" | "center"): void
  /**
   * What the finger does on the coin: `turn` turns it by hand (it settles on the closest face), `throw` lets it be tossed with a
   * swipe upwards (`onThrow` gets the power, from 0 to 1), `off` nothing.
   */
  setMode(mode: "turn" | "throw" | "off", onThrow?: (power: number) => void): void
  /** Tosses the coin now, without knowing the result yet (the server is asked at the same time). */
  launch(power?: number): void
  /** Gives the result: the coin finishes its toss on that face. Resolves when it has stopped and is back in its place. */
  land(face: CoinTossFace): Promise<void>
  /** The toss could not be made: the coin goes back to its place. */
  cancel(): void
  dispose(): void
}

/** How the metal looks: lights, reflections and finish. */
const LOOK = { exposure: 1.0, key: 2.8, environment: 0.3, metalness: 0.8, roughness: 0.4, bump: 3.2, tint: 0xffffff }
/** The coin is always seen with its top leaning 5 degrees toward us: the reflections then fall on the darker part of the light and the gold looks deep instead of washed out. */
const VIEW_TILT = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), (5 * Math.PI) / 180)
const RADIUS = 1
const THICKNESS = 0.15
const FACE_QUATERNION: Record<CoinTossFace, Quaternion> = {
  heads: new Quaternion(),
  tails: new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI),
}

/** How a toss tumbles: end over end like a real coin, with a light wobble to the sides (radians) that fades as it comes down. */
const VARIANTS = [
  { turns: 5, wobble: [0.32, 0.16] },
  { turns: 4, wobble: [0.4, 0.2] },
  { turns: 6, wobble: [0.26, 0.12] },
] as const
/** After landing: three bounces, each lower (height as a part of the half height of the screen, and seconds). */
/**
 * After landing the coin bounces, and not always the same way: the first bounce goes up high and keeps spinning, and the next ones
 * are smaller and die out. Each pattern is a list of bounces (height as a part of the half height of the screen), and some of
 * them add `spin` more turns end over end while the coin is in the air, like a coin that gets one more flip after hitting the
 * floor. All of them end flat on the face that came out.
 */
const BOUNCE_PATTERNS = [
  [{ height: 0.63, spin: 1 }, { height: 0.13, spin: 0 }, { height: 0.045, spin: 0 }, { height: 0.018, spin: 0 }],
  [{ height: 0.75, spin: 2 }, { height: 0.14, spin: 0 }, { height: 0.05, spin: 0 }],
  [{ height: 0.57, spin: 1 }, { height: 0.16, spin: 1 }, { height: 0.06, spin: 0 }, { height: 0.02, spin: 0 }],
  [{ height: 0.69, spin: 1 }, { height: 0.1, spin: 0 }, { height: 0.04, spin: 0 }, { height: 0.015, spin: 0 }],
  [{ height: 0.51, spin: 0 }, { height: 0.14, spin: 0 }, { height: 0.06, spin: 0 }, { height: 0.025, spin: 0 }],
  [{ height: 0.78, spin: 2 }, { height: 0.18, spin: 1 }, { height: 0.06, spin: 0 }],
  [{ height: 0.6, spin: 1 }, { height: 0.12, spin: 0 }, { height: 0.04, spin: 0 }],
] as const
/** How long a bounce of that height lasts: the same gravity as the flight, a bit faster. */
const bounceSeconds = (height: number) => 0.15 + 1.05 * Math.sqrt(height)
const REST_PAUSE = 0.3
const RETURN_TIME = 0.7

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

type Throw = {
  start: number
  /** Where and how the coin was when it was tossed (it may have been lifted by the finger or turned by hand). */
  from: { y: number; orientation: Quaternion }
  power: number
  variant: number
  /** One of the bounce patterns. */
  pattern: number
  /** Unknown until the server answers. Meanwhile the coin tumbles as if it were heads. */
  face: CoinTossFace | null
  /** Seconds into the toss when the face became known (to blend into it without a jump). */
  faceKnownAt: number
  resolve: (() => void) | null
  landed: boolean
}

/** The coin goes back to its place (after a toss that could not be made). */
type Glide = { start: number; duration: number; from: { y: number; z: number; floor: number; orientation: Quaternion }; face: CoinTossFace; resolve: (() => void) | null }

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

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3))
  renderer.toneMapping = ACESFilmicToneMapping
  const look = LOOK
  renderer.toneMappingExposure = look.exposure
  renderer.outputColorSpace = SRGBColorSpace

  const scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04)
  scene.environment = environment.texture
  // How much the room is reflected in the metal (the material setting does not count for the scene environment).
  scene.environmentIntensity = look.environment
  const key = new DirectionalLight(0xfff1d0, look.key)
  key.position.set(-3, 4, 5)
  scene.add(key)

  const VERTICAL_FOV = 32
  const camera = new PerspectiveCamera(VERTICAL_FOV, 1, 0.1, 80)

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
  const faceMaterial = (map: Texture, height: Texture) => new MeshStandardMaterial({ map, color: look.tint, bumpMap: height, bumpScale: look.bump, metalness: look.metalness, roughness: look.roughness, envMapIntensity: look.environment })
  const frontMaterial = faceMaterial(smash, smashHeight)
  const backMaterial = faceMaterial(lob, lobHeight)
  const coin = new Group()
  coin.add(new Mesh(edge, edgeMaterial), new Mesh(front, frontMaterial), new Mesh(back, backMaterial))
  scene.add(coin)

  const shadowMap = shadowTexture()
  const shadow = new Mesh(new CircleGeometry(1, 48), new MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false }))
  scene.add(shadow)

  // ---- the screen: the coin is measured against half the height that the camera sees (`half`) ----
  let half = 4
  let distance = 14
  let worldPerPixel = 0.01
  const resize = () => {
    const { clientWidth: width, clientHeight: height } = canvas
    if (!width || !height) return
    renderer.setSize(width, height, false)
    const aspect = width / height
    camera.aspect = aspect
    // The coin takes about half the width on a phone, and never more than a third of the height on a wide screen.
    half = Math.max(1.9 / aspect, 3.4)
    distance = half / Math.tan((VERTICAL_FOV * Math.PI) / 360)
    camera.position.set(0, 0, distance)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    worldPerPixel = (2 * half) / height
  }
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  resize()

  // ---- state ----
  const orientation = FACE_QUATERNION.heads.clone()
  let layout: "top" | "center" = "top"
  let restY = 0.3 * half
  let mode: "turn" | "throw" | "off" = "off"
  let onThrow: ((power: number) => void) | null = null
  let touched = false
  let disposed = false
  let dragging = false
  let released = false
  let lastPointer = { x: 0, y: 0 }
  let pointerTrail: Array<{ y: number; t: number }> = []
  let fingerLift = 0
  const spin = { x: 0, y: 0 }
  let tossing: Throw | null = null
  let glide: Glide | null = null
  let frame = 0
  /** The time of the last animation frame: everything is measured on the clock of the frames, which is also the one of the pointer events. */
  let lastFrame = 0

  const floorY = () => -0.7 * half
  const targetRestY = () => (layout === "top" ? 0.3 : 0.02) * half

  /** Coin and shadow at a height. `y` is the height of the center of the coin, `z` how much it comes toward the camera. */
  const place = (y: number, z: number, floor: number) => {
    coin.position.set(0, y, z)
    const above = Math.max(0, y - floor) / (1.4 * half)
    const clamped = Math.min(1, above)
    shadow.position.set(0, floor - 1.1, -0.4)
    shadow.scale.set(1.3 * (1 - 0.5 * clamped), 0.28 * (1 - 0.5 * clamped), 1)
    ;(shadow.material as MeshBasicMaterial).opacity = Math.max(0.1, 0.9 - 0.8 * clamped)
  }

  /** One toss, as a function of the seconds since it started: where the coin is, how it is turned, and when everything ends. */
  const tossPose = (seconds: number, current: Throw) => {
    const variant = VARIANTS[(current.variant - 1) % VARIANTS.length]
    const floor = floorY()
    const y0 = current.from.y
    const peak = Math.min(0.7 * half, y0 + (0.5 + 0.3 * current.power) * half)
    // Up and down under the same gravity: the way down is longer because it falls from higher than it started.
    const up = 0.45 + 0.17 * current.power
    const down = up * Math.sqrt(Math.max(0.1, (peak - floor) / Math.max(0.1, peak - y0)))
    const landing = up + down
    const bounces = BOUNCE_PATTERNS[current.pattern % BOUNCE_PATTERNS.length]
    let y = floor
    let z = 0
    let extraSpin = 0
    if (seconds < up) {
      const u = seconds / up
      y = y0 + (peak - y0) * (2 * u - u * u)
    } else if (seconds < landing) {
      const v = (seconds - up) / down
      y = peak - (peak - floor) * v * v
    } else {
      let start = landing
      for (const bounce of bounces) {
        const time = bounceSeconds(bounce.height)
        if (seconds < start + time) {
          const u = (seconds - start) / time
          y = floor + bounce.height * half * 4 * u * (1 - u)
          // A bounce can carry one more flip or two: whole turns, so it ends exactly as it began.
          extraSpin = bounce.spin * Math.PI * 2 * smoothstep(0, 1, u)
          break
        }
        start += time
      }
    }
    // It comes toward the camera as it goes up: it looks bigger.
    z = 0.1 * distance * Math.min(1, Math.max(0, (y - floor) / (peak - floor)))
    const after = Math.max(0, seconds - landing)
    const wobble = 0.3 * (seconds < landing ? smoothstep(landing - 0.25, landing, seconds) : Math.exp(-3.6 * after) * Math.cos(15 * after))
    const decay = Math.pow(Math.max(0, 1 - seconds / landing), 1.4)
    const turns = variant.turns + 2 * current.power
    const x = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), turns * Math.PI * 2 * decay + wobble + extraSpin)
    const yaw = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.sin(seconds * 9 + current.variant) * variant.wobble[0] * decay + wobble * 0.6)
    const roll = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.sin(seconds * 6.5 + 1.3) * variant.wobble[1] * decay + wobble * 0.35)
    // Until the result is known the coin tumbles as heads; then it blends into the real face while it is spinning fast.
    const face = current.face ?? "heads"
    const target = current.face
      ? FACE_QUATERNION.heads.clone().slerp(FACE_QUATERNION[face], smoothstep(current.faceKnownAt, current.faceKnownAt + 0.7, seconds))
      : FACE_QUATERNION.heads
    const rotation = x.multiply(yaw).multiply(roll).multiply(target)
    const resting = landing + bounces.reduce((sum, bounce) => sum + bounceSeconds(bounce.height), 0)
    return { rotation, y, z, landing, resting, floor, peak }
  }

  const render = (now: number) => {
    if (disposed) return
    frame = requestAnimationFrame(render)
    const dt = Math.min(0.05, (now - lastFrame) / 1000)
    lastFrame = now
    restY += (targetRestY() - restY) * (1 - Math.exp(-dt * 7))

    if (tossing) {
      let seconds = (now - tossing.start) / 1000
      const pose = tossPose(seconds, tossing)
      // If the server has not answered yet when the coin would land, it waits up in the air.
      if (!tossing.face && seconds > pose.landing * 0.45) {
        tossing.start = now - pose.landing * 0.45 * 1000
        seconds = pose.landing * 0.45
      }
      const live = tossPose(seconds, tossing)
      // The first moments blend from wherever the coin was (it may have been turned by hand) into the tumble.
      orientation.copy(tossing.from.orientation).slerp(live.rotation, smoothstep(0, 0.22, seconds))
      place(live.y, live.z, live.floor)
      if (!tossing.landed && tossing.face && seconds >= live.landing) { tossing.landed = true; navigator.vibrate?.(40) }
      if (tossing.face && seconds >= live.resting + REST_PAUSE) {
        // Stopped: it glides back to its place.
        const finished = tossing
        tossing = null
        orientation.copy(FACE_QUATERNION[finished.face!])
        glide = { start: now, duration: RETURN_TIME * 1000, from: { y: live.floor, z: 0, floor: live.floor, orientation: orientation.clone() }, face: finished.face!, resolve: finished.resolve }
      }
    } else if (glide) {
      const progress = Math.min(1, (now - glide.start) / glide.duration)
      const eased = smoothstep(0, 1, progress)
      orientation.copy(glide.from.orientation).slerp(FACE_QUATERNION[glide.face], eased)
      const y = glide.from.y + (restY - glide.from.y) * eased
      // The shadow goes from the floor to under the coin.
      place(y, glide.from.z * (1 - eased), glide.from.floor + (restY - glide.from.floor) * eased)
      if (progress >= 1) {
        const done = glide
        glide = null
        done.resolve?.()
      }
    } else {
      if (!dragging && (Math.abs(spin.x) > 0.0004 || Math.abs(spin.y) > 0.0004)) {
        orientation.premultiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), spin.x)).premultiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), spin.y))
        spin.x *= 0.94
        spin.y *= 0.94
      }
      // After turning it by hand the coin settles on the closest face, with the picture upright, whichever way it was turned.
      if (released && !dragging) {
        // The face looking at the camera decides which one it settles on.
        const target = new Vector3(0, 0, 1).applyQuaternion(orientation).z >= 0 ? FACE_QUATERNION.heads : FACE_QUATERNION.tails
        orientation.slerp(target, 0.07)
      }
      // Lifted by the finger while it is being tossed, and back down if it is let go without a toss.
      if (!dragging) fingerLift *= 0.8
      place(restY + fingerLift, 0.03 * distance * (fingerLift / (0.35 * half)), restY)
    }
    // A slow sway while nobody has touched it, so the relief catches the light and it shows that the coin can be turned.
    const sway = !touched && !tossing && !glide && mode === "turn"
      ? new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.sin(now / 900) * 0.28).multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.sin(now / 1300) * 0.12))
      : null
    coin.quaternion.copy(VIEW_TILT).multiply(sway ? sway.multiply(orientation) : orientation)
    renderer.render(scene, camera)
  }
  frame = requestAnimationFrame(render)

  // ---- the finger ----
  const beginToss = (power: number) => {
    const y = restY + fingerLift
    fingerLift = 0
    released = false
    touched = true
    tossing = {
      start: lastFrame, from: { y, orientation: orientation.clone() }, power, face: null, faceKnownAt: 0,
      variant: 1 + (crypto.getRandomValues(new Uint32Array(1))[0] % VARIANTS.length),
      pattern: crypto.getRandomValues(new Uint32Array(1))[0] % BOUNCE_PATTERNS.length, resolve: null, landed: false,
    }
  }
  const onDown = (event: PointerEvent) => {
    if (mode === "off" || tossing || glide) return
    dragging = true
    released = false
    touched = true
    lastPointer = { x: event.clientX, y: event.clientY }
    pointerTrail = [{ y: event.clientY, t: event.timeStamp }]
    spin.x = spin.y = 0
    try { canvas.setPointerCapture(event.pointerId) } catch { /* the swipe still works without it */ }
  }
  const onMove = (event: PointerEvent) => {
    if (!dragging) return
    const dx = event.clientX - lastPointer.x
    const dy = event.clientY - lastPointer.y
    const now = event.timeStamp
    // The last moments of the swipe: the speed is measured over them, not against the moment the finger lifts.
    pointerTrail.push({ y: event.clientY, t: now })
    pointerTrail = pointerTrail.filter((point) => now - point.t <= 700)
    if (mode === "throw") {
      // The coin follows the finger upwards.
      fingerLift = Math.min(0.35 * half, Math.max(0, fingerLift - dy * worldPerPixel))
      lastPointer = { x: event.clientX, y: event.clientY }
      return
    }
    lastPointer = { x: event.clientX, y: event.clientY }
    spin.x = dx * 0.011
    spin.y = dy * 0.011
    orientation.premultiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), spin.x)).premultiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), spin.y))
  }
  const onUp = (event: PointerEvent) => {
    const wasDragging = dragging
    dragging = false
    try { if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId) } catch { /* nothing to release */ }
    if (!wasDragging) return
    if (mode === "throw") {
      // A quick swipe upwards (pixels per millisecond, negative is up) is a toss; its speed is the power.
      const first = pointerTrail[0]
      const last = pointerTrail[pointerTrail.length - 1]
      // A finger that stopped before lifting is not a toss.
      const paused = !last || event.timeStamp - last.t > 400
      const speed = !paused && last.t - first.t > 8 ? (first.y - last.y) / (last.t - first.t) : 0
      const traveled = !paused ? first.y - last.y : 0
      if (speed >= 0.25 || (traveled > 140 && speed > 0.1)) {
        const power = Math.min(1, Math.max(0, (speed - 0.25) / 1.4))
        beginToss(power)
        onThrow?.(power)
      }
      return
    }
    released = true
  }
  canvas.addEventListener("pointerdown", onDown)
  canvas.addEventListener("pointermove", onMove)
  canvas.addEventListener("pointerup", onUp)
  canvas.addEventListener("pointercancel", onUp)

  return {
    setFace(face) { orientation.copy(FACE_QUATERNION[face]); touched = true; released = false },
    setLayout(next) { layout = next },
    setMode(next, handler) {
      mode = next
      onThrow = handler ?? null
      canvas.style.touchAction = next === "off" ? "" : "none"
    },
    launch(power = 0.6) {
      if (tossing || glide) return
      beginToss(power)
    },
    land(face) {
      return new Promise<void>((resolve) => {
        layout = "top"
        const current = tossing
        if (!current) {
          // Nothing was in the air (for example a toss with reduced motion): it just shows the face.
          orientation.copy(FACE_QUATERNION[face])
          resolve()
          return
        }
        current.face = face
        current.faceKnownAt = (lastFrame - current.start) / 1000
        current.resolve = resolve
      })
    },
    cancel() {
      const current = tossing
      if (!current) return
      tossing = null
      glide = { start: lastFrame, duration: 600, from: { y: coin.position.y, z: coin.position.z, floor: floorY(), orientation: orientation.clone() }, face: "heads", resolve: null }
    },
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
