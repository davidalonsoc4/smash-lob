import "server-only"

export type LocalDevAuthUser = {
  id: string
  email: string
  name: null
}

export function getLocalDevAuthUser(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): LocalDevAuthUser | null {
  if (
    environment.NODE_ENV !== "development" ||
    environment.NEXT_PUBLIC_LOCAL_DEV_AUTO_LOGIN !== "1"
  ) {
    return null
  }

  const email = environment.LOCAL_DEV_USER_EMAIL?.trim().toLowerCase() ?? ""

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null
  }

  return {
    id: email,
    email,
    name: null,
  }
}
