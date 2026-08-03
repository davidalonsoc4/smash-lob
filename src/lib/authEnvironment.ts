export const REQUIRED_AUTH_ENV_NAMES = [
  "AUTH_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
] as const

type AuthEnvironment = Record<(typeof REQUIRED_AUTH_ENV_NAMES)[number], string>

export function getMissingAuthEnvironment(
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  return REQUIRED_AUTH_ENV_NAMES.filter((name) => !environment[name]?.trim())
}

export function readAuthEnvironment(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): {
  values: Partial<AuthEnvironment>
  missing: (typeof REQUIRED_AUTH_ENV_NAMES)[number][]
} {
  const values: Partial<AuthEnvironment> = {}

  for (const name of REQUIRED_AUTH_ENV_NAMES) {
    const value = environment[name]?.trim()
    if (value) {
      values[name] = value
    }
  }

  return {
    values,
    missing: getMissingAuthEnvironment(environment),
  }
}
