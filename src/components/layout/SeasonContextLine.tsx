type SeasonContextLineProps = {
  seasonName: string
  statusLabel?: string
  className?: string
  button?: {
    ariaControls: string
    ariaExpanded: boolean
    dataTour?: string
    onClick: () => void
  }
}

export function SeasonContextLine({
  seasonName,
  statusLabel,
  className = "",
  button,
}: SeasonContextLineProps) {
  const content = (
    <>
      {seasonName}
      {statusLabel ? (
        <>
          <span aria-hidden="true"> · </span>
          <span>{statusLabel}</span>
        </>
      ) : null}
    </>
  )

  const visualClassName = `type-caption font-bold text-neutral-500 ${className}`.trim()

  if (button) {
    return (
      <button
        type="button"
        data-tour={button.dataTour}
        aria-haspopup="menu"
        aria-expanded={button.ariaExpanded}
        aria-controls={button.ariaControls}
        onClick={button.onClick}
        className={`m-0 block appearance-none border-0 bg-transparent p-0 text-left ${visualClassName} focus:outline-none focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500`}
      >
        {content}
      </button>
    )
  }

  return <p className={visualClassName}>{content}</p>
}
