import type { Instrumentation } from "next"

export function register() {}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  const { createIncidenceCode, logServerEvent } = await import("@/lib/serverLog")
  const digest =
    typeof error === "object" && error && "digest" in error
      ? String(error.digest).slice(0, 80)
      : "uncaught_error"

  const incomingRequestId = request.headers["x-request-id"]
  const requestId =
    typeof incomingRequestId === "string" &&
    /^[a-zA-Z0-9._:-]{8,128}$/.test(incomingRequestId)
      ? incomingRequestId
      : undefined

  logServerEvent("error", "uncaught_request_error", {
    requestId,
    route: request.path,
    method: request.method,
    operation: context.routePath,
    outcome: "failed",
    errorCode: digest,
    incidenceCode: createIncidenceCode(),
  })
}
