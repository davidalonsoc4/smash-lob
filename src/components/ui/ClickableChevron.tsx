type ClickableChevronProps = {
  className?: string
}

export function ClickableChevron({ className = "" }: ClickableChevronProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-neutral-500 ${className}`}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="h-3.5 w-3.5"
        focusable="false"
      >
        <path
          d="M8 5L13 10L8 15"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
