function isPrivateLanIpv4(hostname: string) {
  const octets = hostname.split(".")
  if (octets.length !== 4) return false

  const parts = octets.map((octet) => Number(octet))
  if (
    parts.some(
      (part, index) =>
        !Number.isInteger(part) ||
        part < 0 ||
        part > 255 ||
        String(part) !== octets[index],
    )
  ) {
    return false
  }

  const [first, second] = parts

  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  )
}

export function isLoopbackHostname(hostname: string) {
  const normalized = hostname.trim().toLowerCase()

  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "[::1]" ||
    isPrivateLanIpv4(normalized)
  )
}

export function isLocalDevAutoLoginEnabled() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_LOCAL_DEV_AUTO_LOGIN === "1"
  )
}
