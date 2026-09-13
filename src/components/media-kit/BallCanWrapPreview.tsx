"use client"

import { useEffect, useRef, type ComponentProps, type CSSProperties } from "react"
import { BallCanWrapPremiumPreview } from "@/components/media-kit/BallCanWrapPremiumPreview"

type BallCanWrapPreviewProps = ComponentProps<typeof BallCanWrapPremiumPreview>

export function BallCanWrapPreview(props: BallCanWrapPreviewProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const design = root.querySelector('[class~="rounded-[14px]"]') as HTMLElement | null
    const contentLayer = design?.children.item(5) as HTMLElement | null
    const grid = contentLayer?.children.item(2) as HTMLElement | null
    const sections = grid ? Array.from(grid.children).filter((node): node is HTMLElement => node instanceof HTMLElement) : []
    if (sections.length < 3) return

    const [brandSection, leagueSection, playersSection] = sections

    const signature = Array.from(brandSection.children).find((node) => node instanceof HTMLParagraphElement) as HTMLParagraphElement | undefined
    if (signature) {
      signature.textContent = ""
      signature.style.display = "flex"
      signature.style.alignItems = "center"
      signature.style.justifyContent = "center"
      signature.style.gap = "4px"
      signature.style.opacity = "1"

      const icon = document.createElement("img")
      icon.src = "/icon-192.png"
      icon.alt = ""
      icon.width = 12
      icon.height = 12
      icon.style.width = "12px"
      icon.style.height = "12px"
      icon.style.borderRadius = "3px"

      const text = document.createElement("div")
      text.style.textAlign = "left"
      text.style.lineHeight = "1"
      text.style.fontFamily = '"Arial Narrow", Arial, sans-serif'

      const overline = document.createElement("div")
      overline.textContent = "CREADO CON"
      overline.style.fontSize = "4px"
      overline.style.fontWeight = "800"
      overline.style.letterSpacing = ".24em"
      overline.style.color = props.accent

      const brand = document.createElement("div")
      brand.textContent = "SMASH & LOB"
      brand.style.marginTop = "2px"
      brand.style.fontSize = "5px"
      brand.style.fontWeight = "900"
      brand.style.letterSpacing = ".1em"
      brand.style.color = "#f4f1ea"

      text.append(overline, brand)
      signature.replaceChildren(icon, text)
    }

    leagueSection.style.position = "relative"
    playersSection.style.position = "relative"

    const welcomeTitle = leagueSection.querySelector(':scope > p:first-child') as HTMLElement | null
    if (welcomeTitle) {
      welcomeTitle.style.position = "absolute"
      welcomeTitle.style.top = "16px"
      welcomeTitle.style.left = "0"
      welcomeTitle.style.right = "0"
      welcomeTitle.style.margin = "0"
    }

    const playersHeader = playersSection.querySelector(':scope > div:first-child') as HTMLElement | null
    if (playersHeader) {
      playersHeader.style.position = "absolute"
      playersHeader.style.top = "16px"
      playersHeader.style.left = "0"
      playersHeader.style.right = "0"
      playersHeader.style.justifyContent = "center"
      const countBadge = playersHeader.querySelector("span") as HTMLElement | null
      if (countBadge) countBadge.style.display = "none"
    }

    const playersList = playersSection.querySelector(':scope > div:last-child') as HTMLElement | null
    if (playersList) {
      playersList.style.marginTop = "26px"
      playersList.style.textAlign = "center"
      playersList.querySelectorAll("div").forEach((column) => {
        const element = column as HTMLElement
        element.style.alignItems = "center"
        element.style.textAlign = "center"
      })
      playersList.querySelectorAll("p").forEach((name) => {
        const element = name as HTMLElement
        element.style.width = "100%"
        element.style.textAlign = "center"
      })
    }
  }, [props.accent, props.leagueName, props.seasonName, props.players])

  return (
    <div ref={rootRef} style={{ "--ball-wrap-accent": props.accent } as CSSProperties}>
      <BallCanWrapPremiumPreview {...props} />
    </div>
  )
}
