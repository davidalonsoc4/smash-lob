import type { HTMLAttributes } from "react"

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  rounded?: "full" | "xl" | "2xl" | "3xl"
}

const roundedClassName = {
  full: "rounded-full",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
}

export function Skeleton({
  className = "",
  rounded = "xl",
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`app-skeleton ${roundedClassName[rounded]} ${className}`}
      {...props}
    />
  )
}
