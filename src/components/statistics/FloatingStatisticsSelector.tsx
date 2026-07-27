"use client"

import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react"
import { AppCard } from "@/components/ui/AppCard"

const FLOATING_THRESHOLD_PX = 54

type FloatingStatisticsSelectorProps = {
  children: ReactNode
  className?: string
}

export function FloatingStatisticsSelector({
  children,
  className = "",
}: FloatingStatisticsSelectorProps) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const selectorRef = useRef<HTMLDivElement>(null)
  const [isFloating, setIsFloating] = useState(false)
  const [selectorHeight, setSelectorHeight] = useState<number | null>(null)

  useEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFloating(
          !entry.isIntersecting &&
            entry.boundingClientRect.top < FLOATING_THRESHOLD_PX,
        )
      },
      {
        rootMargin: `-${FLOATING_THRESHOLD_PX}px 0px 0px 0px`,
        threshold: 0,
      },
    )

    observer.observe(anchor)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const selector = selectorRef.current
    if (!selector) return

    const updateHeight = () => {
      setSelectorHeight(selector.getBoundingClientRect().height)
    }
    const resizeObserver = new ResizeObserver(updateHeight)
    const frame = window.requestAnimationFrame(updateHeight)

    resizeObserver.observe(selector)
    return () => {
      window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <>
      <div
        ref={anchorRef}
        aria-hidden="true"
        className="statistics-floating-selector-anchor"
      />
      <div
        className="statistics-floating-selector-slot"
        style={
          isFloating && selectorHeight
            ? { height: `${selectorHeight}px` }
            : undefined
        }
      >
        <div
          ref={selectorRef}
          className={
            isFloating
              ? "statistics-floating-selector statistics-floating-selector-active"
              : "statistics-floating-selector"
          }
        >
          <AppCard className={`p-2.5 ${className}`}>{children}</AppCard>
        </div>
      </div>
    </>
  )
}
