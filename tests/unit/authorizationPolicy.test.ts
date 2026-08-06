import { describe, expect, it } from "vitest"
import {
  evaluateAuthorization,
  type AuthorizationContext,
  type AuthorizationRequirement,
} from "@/lib/authorizationPolicy"

type ActorName =
  | "anonymous"
  | "suspended"
  | "authenticated"
  | "other-league"
  | "spectator"
  | "player"
  | "participant"
  | "admin"
  | "creator"
  | "superuser"

const actors: Record<ActorName, AuthorizationContext> = {
  anonymous: { authenticated: false },
  suspended: { authenticated: true, suspended: true },
  authenticated: { authenticated: true },
  "other-league": { authenticated: true },
  spectator: { authenticated: true, isSpectator: true },
  player: { authenticated: true, membershipRole: "player" },
  participant: {
    authenticated: true,
    membershipRole: "player",
    isParticipant: true,
  },
  admin: { authenticated: true, membershipRole: "admin" },
  creator: { authenticated: true, membershipRole: "creator" },
  superuser: { authenticated: true, isSuperuser: true },
}

const expected: Record<AuthorizationRequirement, ActorName[]> = {
  authenticated: [
    "authenticated",
    "other-league",
    "spectator",
    "player",
    "participant",
    "admin",
    "creator",
    "superuser",
  ],
  "league:access": [
    "spectator",
    "player",
    "participant",
    "admin",
    "creator",
    "superuser",
  ],
  "league:member": ["player", "participant", "admin", "creator", "superuser"],
  "league:admin": ["admin", "creator", "superuser"],
  "league:creator": ["creator", "superuser"],
  "match:participant": ["participant"],
}

describe("central authorization matrix", () => {
  for (const [requirement, allowedActors] of Object.entries(expected) as [
    AuthorizationRequirement,
    ActorName[],
  ][]) {
    it(`enforces ${requirement}`, () => {
      for (const [actorName, context] of Object.entries(actors) as [
        ActorName,
        AuthorizationContext,
      ][]) {
        expect(
          evaluateAuthorization(context, requirement).allowed,
          `${actorName} / ${requirement}`,
        ).toBe(allowedActors.includes(actorName))
      }
    })
  }

  it("returns actionable denial reasons", () => {
    expect(evaluateAuthorization(actors.anonymous, "authenticated").reason).toBe(
      "unauthenticated",
    )
    expect(evaluateAuthorization(actors.suspended, "league:access").reason).toBe(
      "account_suspended",
    )
    expect(evaluateAuthorization(actors.spectator, "league:member").reason).toBe(
      "league_membership_required",
    )
    expect(evaluateAuthorization(actors.player, "league:admin").reason).toBe(
      "league_admin_required",
    )
  })
})
