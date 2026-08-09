import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { readAuthEnvironment } from "@/lib/authEnvironment"
import { createIncidenceCode, logServerEvent } from "@/lib/serverLog"
import { getLocalDevAuthUser } from "@/lib/serverLocalDevAuth"

const authEnvironment = readAuthEnvironment()
const localDevUser = getLocalDevAuthUser()

function getAuthErrorCode(error: unknown) {
  if (!error || typeof error !== "object") {
    return "auth_unknown_error"
  }

  const authError = error as {
    type?: unknown
    name?: unknown
    cause?: { err?: { name?: unknown } }
  }
  const type =
    typeof authError.type === "string"
      ? authError.type
      : typeof authError.name === "string"
        ? authError.name
        : "auth_error"
  const causeName =
    typeof authError.cause?.err?.name === "string"
      ? authError.cause.err.name
      : null

  return causeName ? `${type}:${causeName}` : type
}

if (authEnvironment.missing.length > 0) {
  logServerEvent("error", "auth_configuration_missing", {
    operation: "auth_initialization",
    outcome: "configuration_error",
    errorCode: `missing:${authEnvironment.missing.join(",")}`,
    incidenceCode: createIncidenceCode(),
  })
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authEnvironment.values.AUTH_SECRET,
  providers: [
    Google({
      clientId: authEnvironment.values.AUTH_GOOGLE_ID,
      clientSecret: authEnvironment.values.AUTH_GOOGLE_SECRET,
    }),
    ...(localDevUser
      ? [
          Credentials({
            id: "local-dev",
            name: "Local development",
            credentials: {
              local: { type: "hidden" },
            },
            authorize(credentials) {
              return credentials.local === "1" ? localDevUser : null
            },
          }),
        ]
      : []),
  ],
  pages: {
    error: "/auth/error",
  },
  logger: {
    error(error) {
      logServerEvent("error", "auth_error", {
        operation: "auth",
        outcome: "error",
        errorCode: getAuthErrorCode(error),
        incidenceCode: createIncidenceCode(),
      })
    },
    warn(code) {
      logServerEvent("warn", "auth_warning", {
        operation: "auth",
        outcome: "warning",
        errorCode: String(code),
      })
    },
    debug(code) {
      if (process.env.NODE_ENV !== "production") {
        logServerEvent("info", "auth_debug", {
          operation: "auth",
          outcome: "debug",
          errorCode: String(code),
        })
      }
    },
  },
})
