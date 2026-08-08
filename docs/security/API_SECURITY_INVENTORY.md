# Inventario de seguridad de API

Generado por `npm run api-security:check`. Cualquier ruta o método nuevo debe quedar inventariado como público o protegido por uno de los guardas compartidos.

| Ruta | Método | Exposición | Guarda detectada |
| --- | --- | --- | --- |
| `/api/access` | GET | Protegido | requireAuthenticatedAppUser |
| `/api/account/profile` | GET | Protegido | requireAuthenticatedAppUser |
| `/api/account/profile` | PUT | Protegido | requireAuthenticatedAppUser |
| `/api/account/profile` | PATCH | Protegido | requireAuthenticatedAppUser |
| `/api/app-user` | GET | Protegido | requireAuthenticatedAppUser |
| `/api/application-admin/leagues/[leagueId]/transfer` | POST | Protegido | requireAuthenticatedAppUser + isSuperuser |
| `/api/application-admin/suggestions` | GET | Protegido | requireAuthenticatedAppUser + isSuperuser |
| `/api/application-admin/suggestions` | PATCH | Protegido | requireAuthenticatedAppUser + isSuperuser |
| `/api/application-admin/users` | GET | Protegido | requireAuthenticatedAppUser + isSuperuser |
| `/api/application-admin/users/[userId]` | PATCH | Protegido | requireAuthenticatedAppUser + isSuperuser |
| `/api/application-admin/users/[userId]` | DELETE | Protegido | requireAuthenticatedAppUser + isSuperuser |
| `/api/application-admin/users/[userId]/actions` | POST | Protegido | requireAuthenticatedAppUser + isSuperuser |
| `/api/auth/[...nextauth]` | GET | Público explícito | Allowlist revisada |
| `/api/auth/[...nextauth]` | POST | Público explícito | Allowlist revisada |
| `/api/experimental/avatar-lab/dicebear-big-smile` | GET | Protegido | requireAuthenticatedAppUser |
| `/api/experimental/avatar-lab/notion-avatar` | GET | Protegido | requireAuthenticatedAppUser |
| `/api/health` | GET | Público explícito | Allowlist revisada |
| `/api/invites/[code]` | GET | Público explícito | Allowlist revisada |
| `/api/invites/[code]/claim` | POST | Protegido | requireAuthenticatedAppUser |
| `/api/leagues` | POST | Protegido | requireAuthenticatedAppUser |
| `/api/leagues/[id]` | PATCH | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]` | DELETE | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]/activity` | GET | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]/activity-settings` | GET | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]/activity-settings` | PUT | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]/announcements` | GET | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]/announcements` | POST | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]/announcements/[announcementId]` | DELETE | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]/invite` | POST | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]/matches/[matchId]/availability` | GET | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]/members/[playerId]` | PATCH | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]/members/[playerId]` | DELETE | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]/players/[playerId]` | PATCH | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]/players/[playerId]/availability` | GET | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]/players/[playerId]/availability` | PUT | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]/seasons` | POST | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]/seasons/[seasonId]` | DELETE | Protegido | getServerSeasonAdmin / requireSeasonAdmin |
| `/api/leagues/[id]/seasons/[seasonId]/duplicate` | POST | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]/seasons/[seasonId]/finish` | POST | Protegido | getServerSeasonAdmin / requireSeasonAdmin |
| `/api/leagues/[id]/seasons/[seasonId]/mvp-selection` | PUT | Protegido | getServerSeasonAdmin / requireSeasonAdmin |
| `/api/leagues/[id]/seasons/[seasonId]/registration` | POST | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]/seasons/[seasonId]/registration` | DELETE | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]/seasons/[seasonId]/registration-reminder` | POST | Protegido | getServerSeasonAdmin / requireSeasonAdmin |
| `/api/leagues/[id]/seasons/[seasonId]/repair-calendar` | POST | Protegido | getServerSeasonAdmin / requireSeasonAdmin |
| `/api/leagues/[id]/seasons/[seasonId]/round-order` | PUT | Protegido | getServerSeasonAdmin / requireSeasonAdmin |
| `/api/leagues/[id]/seasons/[seasonId]/rounds/[round]/matches` | DELETE | Protegido | getServerSeasonAdmin / requireSeasonAdmin |
| `/api/leagues/[id]/seasons/[seasonId]/settings` | PUT | Protegido | getServerSeasonAdmin / requireSeasonAdmin |
| `/api/leagues/[id]/seasons/[seasonId]/start` | POST | Protegido | getServerSeasonAdmin / requireSeasonAdmin |
| `/api/leagues/[id]/spectator-invite` | POST | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]/spectator-self` | DELETE | Protegido | requireAuthenticatedAppUser |
| `/api/leagues/[id]/spectators` | GET | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]/spectators` | DELETE | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/leagues/[id]/users` | GET | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/matches/[matchId]/court-booking` | PUT | Protegido | getServerMatchActor |
| `/api/matches/[matchId]/court-booking` | DELETE | Protegido | getServerMatchActor |
| `/api/matches/[matchId]/court-booking/payment-reminder` | POST | Protegido | getServerMatchActor |
| `/api/matches/[matchId]/court-booking/transfers/[transferId]` | PUT | Protegido | getServerMatchActor |
| `/api/matches/[matchId]/incident` | POST | Protegido | getServerMatchActor |
| `/api/matches/[matchId]/incident` | PUT | Protegido | getServerMatchActor |
| `/api/matches/[matchId]/incident` | DELETE | Protegido | getServerMatchActor |
| `/api/matches/[matchId]/mvp-vote` | PUT | Protegido | getServerMatchActor |
| `/api/matches/[matchId]/mvp-votes` | DELETE | Protegido | getServerMatchActor |
| `/api/matches/[matchId]/postpone` | POST | Protegido | getServerMatchActor |
| `/api/matches/[matchId]/result` | PUT | Protegido | getServerMatchActor |
| `/api/matches/[matchId]/result` | DELETE | Protegido | getServerMatchActor |
| `/api/matches/[matchId]/result-lock` | PUT | Protegido | getServerMatchActor |
| `/api/matches/[matchId]/schedule` | PUT | Protegido | getServerMatchActor |
| `/api/matches/[matchId]/schedule` | DELETE | Protegido | getServerMatchActor |
| `/api/matches/[matchId]/substitution` | GET | Protegido | getServerMatchActor |
| `/api/matches/[matchId]/substitution` | PUT | Protegido | getServerMatchActor |
| `/api/matches/[matchId]/substitution` | DELETE | Protegido | getServerMatchActor |
| `/api/mvp` | POST | Protegido | requireAuthenticatedAppUser |
| `/api/notifications/dispatch` | POST | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/notifications/preferences` | GET | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/notifications/preferences` | POST | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/notifications/scheduled-check` | GET | Protegido | CRON_SECRET |
| `/api/notifications/subscribe` | POST | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/notifications/unsubscribe` | POST | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/observability/client-error` | POST | Público explícito | Allowlist revisada |
| `/api/onboarding/progress` | GET | Protegido | requireAuthenticatedAppUser |
| `/api/onboarding/progress` | PATCH | Protegido | requireAuthenticatedAppUser |
| `/api/onboarding/progress` | DELETE | Protegido | requireAuthenticatedAppUser |
| `/api/personal-matches` | GET | Protegido | requireAuthenticatedAppUser |
| `/api/personal-matches` | POST | Protegido | requireAuthenticatedAppUser |
| `/api/personal-matches/[id]` | GET | Protegido | requireAuthenticatedAppUser |
| `/api/personal-matches/[id]` | PATCH | Protegido | requireAuthenticatedAppUser |
| `/api/personal-matches/[id]` | DELETE | Protegido | requireAuthenticatedAppUser |
| `/api/personal-matches/people` | GET | Protegido | requireAuthenticatedAppUser |
| `/api/qa` | GET | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/qa` | POST | Protegido | getServerLeagueActor / getServerLeagueViewer |
| `/api/result-confirmations` | POST | Protegido | requireAuthenticatedAppUser |
| `/api/result-confirmations/[matchId]` | PUT | Protegido | getServerMatchActor |
| `/api/result-confirmations/[matchId]` | DELETE | Protegido | getServerMatchActor |
| `/api/seasons/[seasonId]/replacements` | POST | Protegido | getServerSeasonAdmin / requireSeasonAdmin |
| `/api/seasons/[seasonId]/substitutes` | GET | Protegido | getServerSeasonAdmin / requireSeasonAdmin |
| `/api/seasons/[seasonId]/substitutes` | POST | Protegido | getServerSeasonAdmin / requireSeasonAdmin |
| `/api/seasons/[seasonId]/substitutes/[substituteId]` | DELETE | Protegido | getServerSeasonAdmin / requireSeasonAdmin |
| `/api/spectator-access` | GET | Protegido | requireAuthenticatedAppUser |
| `/api/spectator-invites/[code]` | GET | Público explícito | Allowlist revisada |
| `/api/spectator-invites/[code]` | POST | Protegido | requireAuthenticatedAppUser |
| `/api/suggestions` | GET | Protegido | requireAuthenticatedAppUser |
| `/api/suggestions` | POST | Protegido | requireAuthenticatedAppUser |

## Reglas

- Solo las combinaciones ruta/método de la allowlist pueden ser públicas.
- Las demás deben utilizar autenticación, política de liga/partido/temporada, superusuario o secreto de cron.
- La validación es deliberadamente conservadora: además de esta comprobación estática, la matriz de autorización y las pruebas E2E validan comportamiento.

