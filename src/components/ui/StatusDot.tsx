"use client"

import { StatusHelp } from "@/components/ui/StatusHelp"
import { useLayoutEffect, useRef, useState } from "react"

const colors: Record<string, string> = {
  finished: "bg-neutral-400",
  readonly: "bg-neutral-400",
  scheduled: "bg-sky-500",
  scheduling: "bg-neutral-400",
  postponed: "bg-orange-500",
  in_progress: "bg-emerald-500",
  result_pending: "bg-amber-500",
  coordinating: "bg-violet-500",
  awaiting_booking: "bg-indigo-500",
}

export function StatusDot({ status, kind = "match", label, helpStatus = status }: {
  status: string; kind?: string; label: string; helpStatus?: string
}) {
  const dot = useRef<HTMLSpanElement>(null)
  const [outlined, setOutlined] = useState(false)
  useLayoutEffect(() => {
    const element = dot.current
    const card = element?.closest("[data-activity-accent] .app-card")
    if (!element || !card) return
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 1
    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!context) return
    const luminance = (color: string) => {
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = color
      context.fillRect(0, 0, 1, 1)
      const channels = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map(value => {
        const channel = value / 255
        return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4
      })
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
    }
    const update = () => {
      const a = luminance(getComputedStyle(element).backgroundColor)
      const b = luminance(getComputedStyle(card).backgroundColor)
      setOutlined((Math.max(a, b) + .05) / (Math.min(a, b) + .05) < 3)
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme", "data-visual-style", "data-palette"] })
    return () => observer.disconnect()
  }, [status])
  return <StatusHelp kind={kind} status={helpStatus} label={label} className="relative z-10 ml-auto flex h-5 w-5 shrink-0 self-start items-start justify-end rounded-full">
    <span ref={dot} data-status-dot data-status-dot-outlined={outlined} aria-hidden="true" style={outlined ? { boxShadow: "inset 0 0 0 1px var(--hub-surface)" } : undefined} className={`h-1.5 w-1.5 rounded-full ${colors[status] ?? colors.scheduling}`} />
  </StatusHelp>
}
