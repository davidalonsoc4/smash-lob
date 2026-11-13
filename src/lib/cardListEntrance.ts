import type { AnimationEvent } from "react"

export const cardListEntrance = {
  "data-card-list-enter": "",
  onAnimationEnd({ animationName, currentTarget, target }: AnimationEvent<HTMLElement>) {
    if (animationName === "card-list-enter" && target === currentTarget.children[Math.min(3, currentTarget.childElementCount - 1)]) currentTarget.removeAttribute("data-card-list-enter")
  },
}
