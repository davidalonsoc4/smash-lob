export type WelcomePackBagSealPlayer = {
  id: string
  displayName: string
}

export type WelcomePackPlayerNameFont =
  | "editorial-serif"
  | "clean-sans"
  | "manuscript-elegant"
  | "manuscript-casual"
  | "allura"
  | "great-vibes"
  | "petit-formal"

export type WelcomePackGeneralFont =
  | "narrow-premium"
  | "geometric"
  | "editorial"

export const WELCOME_PACK_FONT_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=Allura&family=Great+Vibes&family=Petit+Formal+Script&display=swap"

export const WELCOME_PACK_PLAYER_NAME_FONT_OPTIONS: {
  id: WelcomePackPlayerNameFont
  label: string
  description: string
}[] = [
  {
    id: "manuscript-elegant",
    label: "Manuscrita elegante",
    description: "Aspecto premium y más cercano a las demos.",
  },
  {
    id: "manuscript-casual",
    label: "Manuscrita casual",
    description: "Más fresca y cercana, con aire handwritten.",
  },
  {
    id: "editorial-serif",
    label: "Serif editorial",
    description: "Clásica y sofisticada, tipo invitación.",
  },
  {
    id: "clean-sans",
    label: "Sans premium",
    description: "Limpia, firme y muy legible.",
  },
  { id: "allura", label: "Allura", description: "Ligera y elegante." },
  { id: "great-vibes", label: "Great Vibes", description: "Caligrafía premium." },
  { id: "petit-formal", label: "Petit Formal", description: "Formal y refinada." },
]

export const WELCOME_PACK_GENERAL_FONT_OPTIONS: Array<{
  id: WelcomePackGeneralFont
  label: string
  description: string
}> = [
  { id: "narrow-premium", label: "Actual", description: "Condensada premium." },
  { id: "geometric", label: "Geométrica", description: "Moderna y limpia." },
  { id: "editorial", label: "Editorial", description: "Serifa elegante." },
]

export const WELCOME_PACK_BAG_SEAL = {
  trimWidthMm: 45,
  trimHeightMm: 120,
  faceHeightMm: 60,
  bleedMm: 2,
  printedWidthMm: 49,
  printedHeightMm: 124,
  itemsPerA4: 8,
} as const

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export function normalizeWelcomePackAccentColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value.trim()) ? value.trim().toUpperCase() : "#D7A544"
}

export function normalizeWelcomePackPlayerNameFont(value: string): WelcomePackPlayerNameFont {
  return WELCOME_PACK_PLAYER_NAME_FONT_OPTIONS.some((option) => option.id === value)
    ? (value as WelcomePackPlayerNameFont)
    : "manuscript-elegant"
}

export function getWelcomePackPlayerNameFontFamily(font: WelcomePackPlayerNameFont) {
  switch (font) {
    case "clean-sans":
      return 'Inter, "Segoe UI", Arial, sans-serif'
    case "editorial-serif":
      return 'Georgia, "Times New Roman", serif'
    case "manuscript-casual":
      return '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive'
    case "allura":
      return '"Allura", "Segoe Script", cursive'
    case "great-vibes":
      return '"Great Vibes", "Segoe Script", cursive'
    case "petit-formal":
      return '"Petit Formal Script", "Segoe Script", cursive'
    case "manuscript-elegant":
    default:
      return '"Snell Roundhand", "Brush Script MT", "Segoe Script", cursive'
  }
}

export function getWelcomePackGeneralFontFamily(font: WelcomePackGeneralFont) {
  switch (font) {
    case "geometric":
      return '"Century Gothic", Futura, Arial, sans-serif'
    case "editorial":
      return 'Georgia, "Times New Roman", serif'
    case "narrow-premium":
    default:
      return '"Arial Narrow", "Roboto Condensed", Arial, sans-serif'
  }
}

export function getWelcomePackBagSealSheetCount(playerCount: number) {
  return Math.max(0, Math.ceil(Math.max(0, playerCount) / WELCOME_PACK_BAG_SEAL.itemsPerA4))
}

function initials(value: string) {
  return (
    value
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "SL"
  )
}

function brandSignatureMarkup() {
  return `<div class="creator-row">
    <img class="creator-icon" src="/icon-192.png" alt="" />
    <span class="creator-copy"><span class="creator-overline">CREADO CON</span><span class="creator-name">SMASH &amp; LOB</span></span>
  </div>`
}

function logoMarkup({ leagueName, logoUrl }: { leagueName: string; logoUrl?: string | null }) {
  if (logoUrl) {
    return `<div class="league-logo-wrap"><img class="league-logo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(leagueName)}" /></div>`
  }

  return `<div class="league-logo-wrap"><span class="league-logo-fallback">${escapeHtml(initials(leagueName))}</span></div>`
}

function faceMarkup({
  playerName,
  leagueName,
  seasonName,
  logoUrl,
  playerNameFont,
  generalFont,
  showSignature,
}: {
  playerName: string
  leagueName: string
  seasonName: string
  logoUrl?: string | null
  playerNameFont: WelcomePackPlayerNameFont
  generalFont: WelcomePackGeneralFont
  showSignature: boolean
}) {
  return `<div class="face-glow face-glow-a" aria-hidden="true"></div>
    <div class="face-glow face-glow-b" aria-hidden="true"></div>
    <div class="face-ring face-ring-a" aria-hidden="true"></div>
    <div class="face-ring face-ring-b" aria-hidden="true"></div>
    <div class="face-sheen" aria-hidden="true"></div>
    <div class="face-inner general-font-${generalFont}">
      <div class="eyebrow">WELCOME PACK</div>
      ${logoMarkup({ leagueName, logoUrl })}
      <div class="league-name">${escapeHtml(leagueName)}</div>
      <div class="player-name player-font-${playerNameFont}">${escapeHtml(playerName)}</div>
      <div class="rule"><span></span><i></i><span></span></div>
      <div class="season-name">${escapeHtml(seasonName)}</div>
      ${showSignature ? brandSignatureMarkup() : ""}
    </div>`
}

function sealMarkup({
  player,
  leagueName,
  seasonName,
  logoUrl,
  playerNameFont,
  generalFont,
  showSignature,
}: {
  player: WelcomePackBagSealPlayer
  leagueName: string
  seasonName: string
  logoUrl?: string | null
  playerNameFont: WelcomePackPlayerNameFont
  generalFont: WelcomePackGeneralFont
  showSignature: boolean
}) {
  const face = faceMarkup({
    playerName: player.displayName,
    leagueName,
    seasonName,
    logoUrl,
    playerNameFont,
    generalFont,
    showSignature,
  })

  return `<div class="seal-cell" data-player-id="${escapeHtml(player.id)}">
    <div class="trim-guide" aria-hidden="true"></div>
    <span class="fold-tick fold-tick-left" aria-hidden="true"></span>
    <span class="fold-tick fold-tick-right" aria-hidden="true"></span>
    <div class="seal-trim">
      <div class="seal-face seal-face-top">${face}</div>
      <div class="seal-face seal-face-bottom">${face}</div>
    </div>
  </div>`
}

export function buildWelcomePackBagSealPrintHtml({
  players,
  leagueName,
  seasonName,
  logoUrl,
  accentColor,
  playerNameFont = "manuscript-elegant",
  generalFont = "narrow-premium",
  showSignature = true,
}: {
  players: WelcomePackBagSealPlayer[]
  leagueName: string
  seasonName: string
  logoUrl?: string | null
  accentColor: string
  playerNameFont?: WelcomePackPlayerNameFont
  generalFont?: WelcomePackGeneralFont
  showSignature?: boolean
}) {
  const accent = normalizeWelcomePackAccentColor(accentColor)
  const font = normalizeWelcomePackPlayerNameFont(playerNameFont)

  const sheets = Array.from(
    { length: getWelcomePackBagSealSheetCount(players.length) },
    (_, index) => players.slice(index * WELCOME_PACK_BAG_SEAL.itemsPerA4, (index + 1) * WELCOME_PACK_BAG_SEAL.itemsPerA4),
  )

  const sheetMarkup = sheets
    .map(
      (sheetPlayers) => `<section class="sheet">${sheetPlayers
        .map((player) => sealMarkup({ player, leagueName, seasonName, logoUrl, playerNameFont: font, generalFont, showSignature }))
        .join("")}</section>`,
    )
    .join("")

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="stylesheet" href="${WELCOME_PACK_FONT_STYLESHEET}" />
  <title>Welcome Pack · Precintos de bolsa · ${escapeHtml(leagueName)}</title>
  <style>
    @page { size: A4 portrait; margin: 4mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .sheet { width: 202mm; min-height: 289mm; display: grid; grid-template-columns: repeat(4, 49mm); grid-template-rows: repeat(2, 124mm); gap: 2mm; align-content: start; break-after: page; page-break-after: always; }
    .sheet:last-child { break-after: auto; page-break-after: auto; }
    .seal-cell { --accent: ${accent}; position: relative; width: 49mm; height: 124mm; overflow: hidden; background: #050505; }
    .seal-trim { position: absolute; inset: 2mm; display: grid; grid-template-rows: 60mm 60mm; overflow: hidden; background: #050505; }
    .trim-guide { position: absolute; inset: 2mm; z-index: 20; border: .16mm solid rgba(0,0,0,.72); pointer-events: none; }
    .fold-tick { position: absolute; top: 61.85mm; z-index: 30; width: 2mm; height: .3mm; background: #111; }
    .fold-tick-left { left: 0; }
    .fold-tick-right { right: 0; }
    .seal-face {
      position: relative;
      min-height: 60mm;
      overflow: hidden;
      background:
        radial-gradient(circle at 18% 12%, color-mix(in srgb, var(--accent) 34%, transparent), transparent 28%),
        radial-gradient(circle at 82% 18%, rgba(255,255,255,.18) 0%, transparent 18%),
        radial-gradient(circle at 50% 76%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 34%),
        linear-gradient(145deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,0) 26%),
        linear-gradient(160deg, #191919 0%, #0A0A0A 48%, #020202 100%);
    }
    .seal-face::before { content: ""; position: absolute; inset: 1.55mm; border: .16mm solid rgba(255,255,255,.14); border-radius: 2.2mm; pointer-events: none; }
    .seal-face-top { transform: rotate(180deg); }
    .seal-face-bottom { transform: none; }
    .face-glow { position: absolute; border-radius: 999px; filter: blur(4mm); opacity: .5; }
    .face-glow-a { top: 2mm; left: -3mm; width: 16mm; height: 16mm; background: color-mix(in srgb, var(--accent) 38%, transparent); }
    .face-glow-b { bottom: 3mm; right: -2mm; width: 18mm; height: 18mm; background: color-mix(in srgb, var(--accent) 20%, transparent); }
    .face-ring { position: absolute; border-radius: 999px; border: .18mm solid rgba(255,255,255,.07); }
    .face-ring-a { top: 8mm; right: -6mm; width: 20mm; height: 20mm; }
    .face-ring-b { left: -5mm; top: 18mm; width: 14mm; height: 14mm; }
    .face-sheen { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,.08) 0%, rgba(255,255,255,0) 26%, rgba(255,255,255,.04) 60%, rgba(255,255,255,0) 100%); mix-blend-mode: screen; }
    .face-inner { position: absolute; inset: 0; z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5.4mm 4.2mm 4.5mm; text-align: center; }
    .general-font-narrow-premium { font-family: "Arial Narrow", "Roboto Condensed", Arial, sans-serif; }
    .general-font-geometric { font-family: "Century Gothic", Futura, Arial, sans-serif; }
    .general-font-editorial { font-family: Georgia, "Times New Roman", serif; }
    .eyebrow { margin-bottom: 2.1mm; color: var(--accent); font-size: 2.1mm; font-weight: 900; letter-spacing: .62mm; line-height: 1; }
    .league-logo-wrap { position: relative; display: flex; align-items: center; justify-content: center; min-height: 13mm; width: 100%; margin-top: .8mm; }
    .league-logo-wrap::before { content: ""; position: absolute; left: 7mm; right: 7mm; top: 50%; height: 4.2mm; transform: translateY(-50%); background: rgba(255,255,255,.10); filter: blur(3.8mm); }
    .league-logo { position: relative; z-index: 1; max-width: 30mm; max-height: 12.2mm; object-fit: contain; filter: drop-shadow(0 2mm 4mm rgba(0,0,0,.38)); }
    .league-logo-fallback { position: relative; z-index: 1; color: #fff; font-size: 4.2mm; font-weight: 900; letter-spacing: .5mm; text-transform: uppercase; }
    .league-name { max-width: 34mm; margin-top: 1.8mm; overflow: hidden; color: rgba(255,255,255,.57); font-size: 2.05mm; font-weight: 800; line-height: 1.05; text-transform: uppercase; letter-spacing: .16mm; white-space: nowrap; text-overflow: ellipsis; }
    .player-name { max-width: 36.5mm; margin-top: 2.7mm; color: #fff; font-size: 4.8mm; line-height: .98; text-wrap: balance; text-shadow: 0 1.1mm 2.4mm rgba(0,0,0,.42); }
    .player-font-editorial-serif { font-family: Georgia, "Times New Roman", serif; }
    .player-font-clean-sans { font-family: Inter, "Segoe UI", Arial, sans-serif; font-weight: 800; }
    .player-font-manuscript-elegant { font-family: "Snell Roundhand", "Brush Script MT", "Segoe Script", cursive; font-weight: 700; }
    .player-font-manuscript-casual { font-family: "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive; font-weight: 700; }
    .player-font-allura { font-family: "Allura", "Segoe Script", cursive; font-size: 5.7mm; font-weight: 400; }
    .player-font-great-vibes { font-family: "Great Vibes", "Segoe Script", cursive; font-size: 5.5mm; font-weight: 400; }
    .player-font-petit-formal { font-family: "Petit Formal Script", "Segoe Script", cursive; font-size: 4.15mm; font-weight: 400; }
    .rule { display: grid; grid-template-columns: 8mm 1.5mm 8mm; align-items: center; gap: 1.15mm; margin-top: 2.5mm; }
    .rule span { height: .18mm; background: rgba(255,255,255,.24); }
    .rule i { width: 1.45mm; height: 1.45mm; transform: rotate(45deg); background: var(--accent); box-shadow: 0 0 1.8mm rgba(255,255,255,.22); }
    .season-name { margin-top: 2mm; color: rgba(255,255,255,.76); font-size: 2.15mm; font-weight: 850; text-transform: uppercase; letter-spacing: .2mm; }
    .creator-row { margin-top: 1.15mm; display: flex; align-items: center; justify-content: center; gap: .85mm; }
    .creator-icon { width: 2.6mm; height: 2.6mm; border-radius: .65mm; object-fit: cover; }
    .creator-copy { display: flex; flex-direction: column; align-items: flex-start; line-height: 1; font-family: "Arial Narrow", Arial, sans-serif; }
    .creator-overline { color: color-mix(in srgb, var(--accent) 82%, white 18%); font-size: .78mm; font-weight: 800; letter-spacing: .22mm; }
    .creator-name { margin-top: .3mm; color: #f4f1ea; font-size: 1.05mm; font-weight: 900; letter-spacing: .09mm; }
    @media screen {
      body { padding: 12px; background: #e5e7eb; }
      .sheet { margin: 0 auto 16px; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,.14); }
    }
  </style>
</head>
<body>
  ${sheetMarkup || '<p style="color:#111">No hay jugadores para imprimir.</p>'}
  <script>
    window.addEventListener("load", function () {
      var images = Array.from(document.images || []);
      Promise.all(images.map(function (image) {
        if (image.complete) return Promise.resolve();
        return new Promise(function (resolve) {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });
      })).then(function () {
        var fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
        Promise.resolve(fontsReady).then(function () { window.setTimeout(function () { window.print(); }, 250); });
      });
    });
  </script>
</body>
</html>`
}
