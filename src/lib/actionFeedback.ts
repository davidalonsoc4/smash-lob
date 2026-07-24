export type ActionFeedbackTone = "success" | "error" | "info"

export type ActionFeedbackDetail = {
  id: string
  message: string
  tone: ActionFeedbackTone
  actionLabel?: string
  onAction?: () => void
  durationMs?: number
}

export const ACTION_FEEDBACK_EVENT = "smash-lob:action-feedback"

function createFeedbackId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function showActionFeedback({
  message,
  tone,
  actionLabel,
  onAction,
  durationMs,
}: Omit<ActionFeedbackDetail, "id">) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(
    new CustomEvent<ActionFeedbackDetail>(ACTION_FEEDBACK_EVENT, {
      detail: {
        id: createFeedbackId(),
        message,
        tone,
        actionLabel,
        onAction,
        durationMs,
      },
    }),
  )
}
