type ActivityAvatarProps = {
  name?: string | null
  email?: string | null
  initials?: string | null
  imageUrl?: string | null
  imageFit?: "cover" | "contain"
}

function getInitials(value: string) {
  const cleanValue = value.trim()

  if (!cleanValue) {
    return "SL"
  }

  const namePart = cleanValue.includes("@")
    ? cleanValue.split("@")[0].replace(/[._-]+/g, " ")
    : cleanValue

  const initials = namePart
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return initials || "SL"
}

export function ActivityAvatar({
  name,
  email,
  initials,
  imageUrl,
  imageFit = "cover",
}: ActivityAvatarProps) {
  const label = name || email || "Smash & Lob"

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-950 text-xs font-black text-white shadow-sm">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className={`h-full w-full ${
            imageFit === "contain" ? "object-contain" : "object-cover"
          }`}
        />
      ) : (
        <span>{initials || getInitials(label)}</span>
      )}
    </div>
  )
}
