import {
  ACESFilmicToneMapping, CanvasTexture, CircleGeometry, CylinderGeometry, DirectionalLight, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  PMREMGenerator, PerspectiveCamera, Quaternion, RepeatWrapping, SRGBColorSpace, Scene, TextureLoader, Vector3, WebGLRenderer,
  type Texture,
} from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import type { CoinTossFace } from "@/lib/matchCoinToss"
import { playCoinHit, playCoinWhoosh } from "@/lib/coinSound"

/**
 * The 3D coin of the coin toss: real thickness, reeded edge and relief lit from the height maps of each face (public/coin).
 * It fills the whole screen of the toss, so the coin can go up to the top and fall to the bottom. It is loaded on demand
 * (this module and three.js are only fetched when the toss screen opens).
 *
 * The coin lies facing the camera. The smash is the face on the front and the lob the one on the back.
 */
/** A circle on the screen, in pixels: where the small coin of the panel is (center and diameter). */
export type ScreenCircle = { x: number; y: number; size: number }

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
  /** EXPERIMENT: changes the look of the metal on the fly (before / after). */
  setLook(name: CoinLookName): void
  /** The coin starts on that circle (the small coin of the panel) and moves to its place, growing. */
  appear(from: ScreenCircle): void
  /** The coin moves onto that circle and shrinks to its size. Resolves when it has arrived. */
  dismiss(to: ScreenCircle): Promise<void>
  dispose(): void
}

/** How the metal looks: lights, reflections and finish. */
const LOOK = { exposure: 1.0, key: 2.8, environment: 0.3, metalness: 0.8, roughness: 0.4, bump: 3.2, lobBump: 3.2, tint: 0xffffff }
/**
 * EXPERIMENT (branch exp/coin-design): the look that is in production ("before") and a candidate ("after") with less yellow glare
 * and more contrast in the relief (stronger bump, a bit more roughness so the highlights do not flatten the picture, less reflection of
 * the room, a deeper tint), and a stronger relief on the lob. A switch on the screen goes from one to the other to compare them.
 */
export type CoinLookName = "before" | "after"
export const COIN_LOOKS: Record<CoinLookName, typeof LOOK> = {
  before: LOOK,
  after: { exposure: 0.92, key: 2.5, environment: 0.22, metalness: 0.85, roughness: 0.5, bump: 5.2, lobBump: 7, tint: 0xf2dfb4 },
}
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
type Bounce = { height: number; spin: number }
const pick = <T,>(list: readonly T[]) => list[crypto.getRandomValues(new Uint32Array(1))[0] % list.length]

/**
 * After landing the coin bounces, and each toss does it a bit differently. Heights are a part of the half height of the screen
 * (2 is the whole screen): the first bounce goes up 50% to 60% of the screen, always keeping on spinning; the second one 30% to 35%
 * and may give the coin one more flip, or two, or none; then two smaller ones (13% to 19%, and 4% to 6%) that die out. The `spin` of a bounce is whole turns end over end while it is in the air, so it ends flat on the face that came out.
 */
const bouncePattern = (): Bounce[] => [
  { height: pick([1.0, 1.05, 1.1, 1.15, 1.2]), spin: pick([1, 1, 2]) },
  { height: pick([0.6, 0.64, 0.68, 0.7]), spin: pick([0, 0, 1, 1, 2]) },
  { height: pick([0.26, 0.3, 0.34, 0.38]), spin: 0 },
  { height: pick([0.08, 0.1, 0.12]), spin: 0 },
]
/**
 * How long a bounce of that height lasts. A ball under gravity stays in the air for a time that goes with the square root of its
 * height, so every bounce is shorter than the one before but not by much: 1.3 s, 1.0 s, 0.8 s and 0.45 s for the four of them.
 */
const bounceSeconds = (height: number) => 0.12 + 1.15 * Math.sqrt(height)
/** The coin lands on a floor this far above the bottom edge of the screen (about the height of the navigation bar), shadow included. */
const FLOOR_MARGIN_PX = 64
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

/** The coin moving between the screen of the toss and the small coin of the panel. */
type View = { kind: "appear" | "dismiss"; start: number | null; duration: number; circle: ScreenCircle; resolve: (() => void) | null }
const VIEW_TIME = 620

type Throw = {
  start: number
  /** Where and how the coin was when it was tossed (it may have been lifted by the finger or turned by hand). */
  from: { y: number; orientation: Quaternion }
  power: number
  variant: number
  /** The bounces of this toss. */
  bounces: Bounce[]
  /** Unknown until the server answers. Meanwhile the coin tumbles as if it were heads. */
  face: CoinTossFace | null
  /** Seconds into the toss when the face became known (to blend into it without a jump). */
  faceKnownAt: number
  resolve: (() => void) | null
  landed: boolean
  /** How many hits on the floor have already made their sound (the landing, then the end of each bounce). */
  hits: number
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
  /** Pixels at the bottom of the screen that the coin does not use: the floor margin plus the safe area of the phone (the gesture bar). */
  let bottomMargin = FLOOR_MARGIN_PX
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
    const probe = document.createElement("div")
    probe.style.cssText = "position:fixed;bottom:0;left:0;width:0;height:env(safe-area-inset-bottom, 0px);visibility:hidden;pointer-events:none"
    document.body.appendChild(probe)
    const safeArea = probe.offsetHeight
    probe.remove()
    // On a very low screen (landscape) the margin is a part of it, so the coin still has room.
    bottomMargin = Math.min(FLOOR_MARGIN_PX + safeArea, 0.14 * height)
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
  let view: View | null = null
  let frame = 0
  /** The time of the last animation frame: everything is measured on the clock of the frames, which is also the one of the pointer events. */
  let lastFrame = 0

  /** Where the center of the coin is when it lies on the floor: the bottom of the coin stays `bottomMargin` pixels above the edge. */
  const floorY = () => -half + bottomMargin * worldPerPixel + RADIUS
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
    const bounces = current.bounces
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
      // The sound of each hit on the floor: the landing and the end of every bounce, softer each time.
      if (tossing.face) {
        let at = live.landing
        for (let hit = 0; hit <= tossing.bounces.length; hit += 1) {
          if (hit > 0) at += bounceSeconds(tossing.bounces[hit - 1].height)
          if (hit >= tossing.hits && seconds >= at) {
            tossing.hits = hit + 1
            playCoinHit(hit === 0 ? 1 : Math.min(0.8, tossing.bounces[hit - 1].height / 1.2))
          }
        }
      }
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
    if (view) {
      view.start ??= now
      const progress = Math.min(1, (now - view.start) / view.duration)
      const eased = smoothstep(0, 1, progress)
      // The circle on the screen, in the units of the scene.
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const target = { x: (view.circle.x - width / 2) * worldPerPixel, y: (height / 2 - view.circle.y) * worldPerPixel, scale: (view.circle.size / 2) * worldPerPixel / RADIUS }
      const current = { x: coin.position.x, y: coin.position.y, scale: 1 }
      const from = view.kind === "appear" ? target : current
      const to = view.kind === "appear" ? current : target
      coin.position.x = from.x + (to.x - from.x) * eased
      coin.position.y = from.y + (to.y - from.y) * eased
      coin.scale.setScalar(from.scale + (to.scale - from.scale) * eased)
      // The shadow is only there while the coin is on the screen of the toss.
      ;(shadow.material as MeshBasicMaterial).opacity *= view.kind === "appear" ? eased : 1 - eased
      if (progress >= 1 && view.kind === "appear") view = null
      else if (progress >= 1) { const done = view.resolve; view.resolve = null; done?.() }
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
      bounces: bouncePattern(), resolve: null, landed: false, hits: 0,
    }
    playCoinWhoosh(power)
  }
  const onDown = (event: PointerEvent) => {
    if (mode === "off" || tossing || glide || view) return
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
    setLook(name) {
      const next = COIN_LOOKS[name]
      renderer.toneMappingExposure = next.exposure
      scene.environmentIntensity = next.environment
      key.intensity = next.key
      for (const [material, bump] of [[frontMaterial, next.bump], [backMaterial, next.lobBump]] as const) {
        material.metalness = next.metalness
        material.roughness = next.roughness
        material.bumpScale = bump
        material.color.setHex(next.tint)
        material.envMapIntensity = next.environment
      }
    },
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
    appear(from) {
      view = { kind: "appear", start: null, duration: VIEW_TIME, circle: from, resolve: null }
    },
    dismiss(to) {
      return new Promise<void>((resolve) => {
        view = { kind: "dismiss", start: null, duration: VIEW_TIME, circle: to, resolve }
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
