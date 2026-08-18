export async function clearPendingAccessIntent() {
  try {
    await fetch("/api/access-intent", {
      method: "DELETE",
      credentials: "same-origin",
      cache: "no-store",
    })
  } catch {
    // Joining the league must still complete if clearing the recovery hint fails.
  }
}
