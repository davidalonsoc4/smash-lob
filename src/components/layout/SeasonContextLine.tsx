type SeasonContextLineProps = {
  seasonName: string
  statusLabel?: string
  className?: string
}

export function SeasonContextLine({
  seasonName,
  statusLabel,
  className = "",
}: SeasonContextLineProps) {
  return (
    <p className={`type-caption font-bold text-neutral-500 ${className}`.trim()}>
      {seasonName}
      {statusLabel ? (
        <>
          <span aria-hidden="true"> · </span>
          <span>{statusLabel}</span>
        </>
      ) : null}
    </p>
  )
}
