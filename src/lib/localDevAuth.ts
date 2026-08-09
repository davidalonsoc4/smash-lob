const LOCAL_DEV_LAN_HOSTS = new Set(["192.168.3.2"])

export function isLoopbackHostname(hostname: string) {
  const normalized = hostname.trim().toLowerCase()

  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "[::1]" ||
    LOCAL_DEV_LAN_HOSTS.has(normalized)
  )
}

export function isLocalDevAutoLoginEnabled() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_LOCAL_DEV_AUTO_LOGIN === "1"
  )
}
