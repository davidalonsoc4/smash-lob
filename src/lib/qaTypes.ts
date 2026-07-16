export type QaAction =
  | "schedule_match"
  | "record_result"
  | "cast_vote"
  | "award_three_votes"
  | "tie_votes"
  | "confirm_all"
  | "dispute_result"
  | "auto_validate_24h"
  | "lock_result"
  | "unlock_result"
  | "complete_round_scenario"
  | "reset_match"
  | "reset_round";

export type QaActionInput = {
  action: QaAction;
  leagueId: string;
  seasonId?: string;
  matchId?: string;
  actorPlayerId?: string;
  selectedPlayerId?: string;
  secondaryPlayerId?: string;
};
