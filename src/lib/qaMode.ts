export function isQaModeEnabled() {
  return process.env.QA_MODE === "true";
}
