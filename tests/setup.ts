import "@testing-library/jest-dom/vitest"

// jsdom lacks native dialog methods; browser tests cover top-layer focus/inertness.
if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal ??= function () { this.setAttribute("open", "") }
  HTMLDialogElement.prototype.close ??= function () { this.removeAttribute("open") }
}
