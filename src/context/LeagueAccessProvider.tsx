"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { useMatchData } from "@/context/MatchDataProvider";
import { useSeasonSettings } from "@/context/SeasonSettingsProvider";
import {
  deleteSupabaseLeague,
  regenerateSupabaseLeagueInviteCode,
  updateSupabaseLeagueDetails,
  updateSupabaseLeagueLocations,
  updateSupabaseLeagueLogo,
  updateSupabaseLeagueShowRankingAvatars,
  updateSupabaseLeagueStatusColorsEnabled,
} from "@/lib/supabaseAdminLeagues";
import {
  fetchSupabaseLeagueUsers,
  unlinkSupabaseLeagueMembership,
  updateSupabaseLeagueMembershipRole,
  updateSupabasePlayerDisplayName,
  updateSupabasePlayerAvatar,
  type LeagueUserManagementPlayer,
} from "@/lib/supabaseAdminUsers";
import {
  createSupabaseLeague,
  fetchSupabaseLeagueSnapshot,
} from "@/lib/supabaseLeagues";
import {
  normalizeLeagueLocations,
  type LeagueLocation,
} from "@/lib/leagueLocations";
import {
  readCachedSpectatorLeagueIds,
  writeCachedSpectatorLeagueIds,
} from "@/lib/leagueAccessCache";
import {
  claimSupabasePlayer,
  fetchSupabaseInviteSnapshot,
} from "@/lib/supabaseInvites";
import {
  defaultUserLeagueMemberships,
  leagueMembers,
  leagues as defaultLeagues,
  type League,
  type LeagueMemberRole,
  type PlayerProfile,
  type UserLeagueMembership,
} from "@/data/fakeData";

type ClaimResult =
  | { ok: true; membership: UserLeagueMembership }
  | {
      ok: false;
      error:
        | "already-in-league"
        | "player-already-claimed"
        | "profile-incomplete"
        | "roster-full"
        | "registration-closed";
    };

type LeagueAccessContextValue = {
  userId: string | null;
  isSuperuser: boolean;
  canCreateLeagues: boolean;
  isAdminViewEnabled: boolean;
  setAdminViewEnabled: (enabled: boolean) => void;
  leagues: League[];
  userMemberships: UserLeagueMembership[];
  spectatorLeagueIds: string[];
  isAccessHydrated: boolean;
  userLeagues: League[];
  refreshLeagueAccess: () => Promise<boolean>;
  createLeague: (settings: {
    name: string;
    description: string;
    locations: LeagueLocation[];
  }) => Promise<League | null>;
  getMembershipForLeague: (leagueId: string) => UserLeagueMembership | null;
  getLeagueInviteCode: (leagueId: string) => string;
  isPlayerClaimed: (leagueId: string, playerId: string) => boolean;
  regenerateLeagueInviteCode: (leagueId: string) => Promise<string | null>;
  updateLeagueDetails: (
    leagueId: string,
    details: { name: string; description: string },
  ) => Promise<boolean>;
  updateLeagueLogo: (
    leagueId: string,
    logoUrl: string | null,
  ) => Promise<boolean>;
  updateLeagueLocations: (
    leagueId: string,
    locations: LeagueLocation[],
  ) => Promise<boolean>;
  updateLeagueStatusColorsEnabled: (
    leagueId: string,
    enabled: boolean,
  ) => Promise<boolean>;
  updateLeagueShowRankingAvatars: (
    leagueId: string,
    enabled: boolean,
  ) => Promise<boolean>;
  deleteLeague: (leagueId: string) => Promise<boolean>;
  fetchLeagueUsers: (leagueId: string) => Promise<LeagueUserManagementPlayer[]>;
  updateLeagueUserRole: (
    leagueId: string,
    playerId: string,
    role: Extract<LeagueMemberRole, "admin" | "player">,
  ) => Promise<boolean>;
  unlinkLeaguePlayerAccount: (
    leagueId: string,
    playerId: string,
  ) => Promise<boolean>;
  updateLeaguePlayerName: (
    leagueId: string,
    playerId: string,
    displayName: string,
  ) => Promise<boolean>;
  updateLeaguePlayerAvatar: (
    leagueId: string,
    playerId: string,
    avatarUrl: string | null,
  ) => Promise<boolean>;
  getLeagueByInviteCode: (code: string) => League | null;
  resolveLeagueInvite: (
    code: string,
    leagueIdHint?: string | null,
  ) => Promise<League | null>;
  getUnclaimedPlayersForLeague: (leagueId: string) => PlayerProfile[];
  claimPlayer: (
    leagueId: string,
    playerId: string,
    inviteCode?: string,
  ) => Promise<ClaimResult>;
  linkCurrentUserToLeaguePlayer: (leagueId: string, playerId: string) => void;
  canAccessLeague: (leagueId: string) => boolean;
  isLeagueSpectator: (leagueId: string) => boolean;
  canShareSpectatorInvite: (leagueId: string) => boolean;
  isLeagueAdmin: (leagueId: string) => boolean;
  hasLeagueAdminRole: (leagueId: string) => boolean;
  isLeagueCreator: (leagueId: string) => boolean;
};

type LeagueAccessProviderProps = {
  children: ReactNode;
};

const storageKey = "smash-lob-user-league-memberships";
const leaguesStorageKey = "smash-lob-leagues";
const inviteCodesStorageKey = "smash-lob-league-invite-codes";
const adminViewStorageKey = "smash-lob-admin-view-enabled";
const adminRoles: LeagueMemberRole[] = ["creator", "admin"];
const claimedMembershipUserId = "__claimed__";
const LeagueAccessContext = createContext<LeagueAccessContextValue | null>(
  null,
);
const supabaseUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isDemoDataEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === "true";
}

function isPersistentLeagueId(leagueId: string) {
  return isDemoDataEnabled() || supabaseUuidPattern.test(leagueId);
}

function uniqueLeaguesById(items: League[]) {
  const leaguesById = new Map<string, League>();

  items.forEach((league) => {
    leaguesById.set(league.id, league);
  });

  return Array.from(leaguesById.values());
}

function normalizeUserId(email: string | null | undefined) {
  return email?.trim().toLowerCase() || null;
}

function normalizeInviteCode(code: string) {
  return code.trim().toUpperCase();
}

function readStoredAdminViewEnabled() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.localStorage.getItem(adminViewStorageKey) !== "false";
}

function readStoredInviteCodes() {
  if (typeof window === "undefined") {
    return {};
  }

  const storedValue = window.localStorage.getItem(inviteCodesStorageKey);

  if (!storedValue) {
    return {};
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    if (typeof parsedValue !== "object" || parsedValue === null) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsedValue).filter(
        ([leagueId, code]) =>
          typeof leagueId === "string" && typeof code === "string",
      ),
    ) as Record<string, string>;
  } catch {
    return {};
  }
}

function readStoredMemberships() {
  const fallbackMemberships = isDemoDataEnabled()
    ? defaultUserLeagueMemberships
    : [];

  if (typeof window === "undefined") {
    return fallbackMemberships;
  }

  const storedValue = window.localStorage.getItem(storageKey);

  if (!storedValue) {
    return fallbackMemberships;
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return fallbackMemberships;
    }

    const storedMemberships = parsedValue
      .filter(isValidStoredMembership)
      .filter((membership) => isPersistentLeagueId(membership.leagueId));

    return mergeMemberships(fallbackMemberships, storedMemberships);
  } catch {
    return fallbackMemberships;
  }
}

function normalizeStoredLeague(league: unknown): League | null {
  if (typeof league !== "object" || league === null) {
    return null;
  }

  const item = league as Record<string, unknown>;

  if (
    typeof item.id !== "string" ||
    typeof item.slug !== "string" ||
    typeof item.name !== "string" ||
    typeof item.description !== "string" ||
    typeof item.activeSeasonId !== "string" ||
    typeof item.inviteCode !== "string" ||
    (item.joinMode !== "closed" && item.joinMode !== "open") ||
    !Array.isArray(item.locations) ||
    (typeof item.logoUrl !== "undefined" &&
      item.logoUrl !== null &&
      typeof item.logoUrl !== "string") ||
    (typeof item.createdByUserId !== "undefined" &&
      item.createdByUserId !== null &&
      typeof item.createdByUserId !== "string")
  ) {
    return null;
  }

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: item.description,
    activeSeasonId: item.activeSeasonId,
    inviteCode: item.inviteCode,
    joinMode: item.joinMode,
    locations: normalizeLeagueLocations(item.locations),
    logoUrl: typeof item.logoUrl === "string" ? item.logoUrl : null,
    statusColorsEnabled: item.statusColorsEnabled !== false,
    showRankingAvatars: item.showRankingAvatars !== false,
    createdByUserId:
      typeof item.createdByUserId === "string" ? item.createdByUserId : null,
  };
}

function readStoredLeagues() {
  const fallbackLeagues = isDemoDataEnabled() ? defaultLeagues : [];

  if (typeof window === "undefined") {
    return fallbackLeagues;
  }

  const storedValue = window.localStorage.getItem(leaguesStorageKey);

  if (!storedValue) {
    return fallbackLeagues;
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return fallbackLeagues;
    }

    const storedLeagues = uniqueLeaguesById(
      parsedValue
        .map(normalizeStoredLeague)
        .filter((league): league is League => Boolean(league))
        .filter((league) => isPersistentLeagueId(league.id)),
    );
    const storedLeagueIds = new Set(storedLeagues.map((league) => league.id));

    return uniqueLeaguesById([
      ...fallbackLeagues.filter((league) => !storedLeagueIds.has(league.id)),
      ...storedLeagues,
    ]);
  } catch {
    return fallbackLeagues;
  }
}

function mergeLeagues(current: League[], incoming: League[]) {
  return uniqueLeaguesById([...current, ...incoming]);
}

function mergeMemberships(
  current: UserLeagueMembership[],
  incoming: UserLeagueMembership[],
) {
  const items = new Map(
    current.map((membership) => [
      `${membership.userId}:${membership.leagueId}:${membership.playerId}`,
      membership,
    ]),
  );

  incoming.forEach((membership) => {
    items.set(
      `${membership.userId}:${membership.leagueId}:${membership.playerId}`,
      membership,
    );
  });

  return Array.from(items.values());
}

function isValidStoredMembership(
  membership: unknown,
): membership is UserLeagueMembership {
  if (typeof membership !== "object" || membership === null) {
    return false;
  }

  const item = membership as Record<string, unknown>;

  return (
    typeof item.userId === "string" &&
    typeof item.leagueId === "string" &&
    typeof item.playerId === "string" &&
    (item.role === "creator" || item.role === "admin" || item.role === "player")
  );
}

function getBaseRole(leagueId: string, playerId: string): LeagueMemberRole {
  return (
    leagueMembers.find(
      (member) => member.leagueId === leagueId && member.playerId === playerId,
    )?.role ?? "player"
  );
}


function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "JG";
}

function slugifyLeagueName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "liga"
  );
}

function getRandomCodeSegment(length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);

  return Array.from(randomValues)
    .map((value) => alphabet[value % alphabet.length])
    .join("");
}

function getInvitePrefix(leagueId: string) {
  const league = defaultLeagues.find((item) => item.id === leagueId);
  const source = league?.slug ?? leagueId;
  const prefix = source
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase();

  return prefix.padEnd(2, "X");
}

function generateInviteCode(leagueId: string, existingCodes: string[]) {
  const normalizedExistingCodes = new Set(
    existingCodes.map(normalizeInviteCode),
  );

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = [
      getInvitePrefix(leagueId),
      getRandomCodeSegment(4),
      getRandomCodeSegment(4),
      getRandomCodeSegment(4),
    ].join("-");

    if (!normalizedExistingCodes.has(normalizeInviteCode(code))) {
      return code;
    }
  }

  return [
    getInvitePrefix(leagueId),
    getRandomCodeSegment(6),
    getRandomCodeSegment(6),
    getRandomCodeSegment(6),
  ].join("-");
}

function isSupabaseBackedId(id: string) {
  return supabaseUuidPattern.test(id);
}

function recordSupabaseError(action: string, error: unknown) {
  const details =
    typeof error === "object" && error !== null
      ? error
      : { message: String(error) };

  window.localStorage.setItem(
    "smash-lob-last-supabase-error",
    JSON.stringify({
      action,
      ...details,
      createdAt: new Date().toISOString(),
    }),
  );
}

export function LeagueAccessProvider({ children }: LeagueAccessProviderProps) {
  const { data: session, status: sessionStatus } = useSession();
  const { hydrateMatches } = useMatchData();
  const {
    hydrateSeasonSnapshot,
    playerProfiles,
    seasonPlayers,
    seasons,
    updatePlayerProfile,
  } = useSeasonSettings();
  const userId = normalizeUserId(session?.user?.email);
  const userDisplayName = session?.user?.name;
  const [isSuperuserFromDb, setIsSuperuserFromDb] = useState(false);
  const [canCreateLeaguesFromDb, setCanCreateLeaguesFromDb] = useState(false);
  const isSuperuser = Boolean(userId) && isSuperuserFromDb;
  const canCreateLeagues = Boolean(userId) && canCreateLeaguesFromDb;
  const [isAdminViewEnabled, setIsAdminViewEnabledState] = useState(
    readStoredAdminViewEnabled,
  );
  const setAdminViewEnabled = useCallback((enabled: boolean) => {
    setIsAdminViewEnabledState(enabled);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(adminViewStorageKey, String(enabled));
    }
  }, []);
  const [leagues, setLeagues] = useState<League[]>(readStoredLeagues);
  const [memberships, setMemberships] = useState<UserLeagueMembership[]>(
    readStoredMemberships,
  );
  const [inviteClaimablePlayerIds, setInviteClaimablePlayerIds] = useState<
    Record<string, string[]>
  >({});
  const [spectatorLeagueIds, setSpectatorLeagueIds] = useState<string[]>([]);
  const [hydratedAccessUserId, setHydratedAccessUserId] = useState<string | null>(
    null,
  );
  const isAccessHydrated =
    sessionStatus === "unauthenticated" ||
    (Boolean(userId) && hydratedAccessUserId === userId);

  function persistLeagues(nextLeaguesInput: League[]) {
    const nextLeagues = uniqueLeaguesById(nextLeaguesInput);

    setLeagues(nextLeagues);
    const customLeagues = nextLeagues.filter(
      (league) =>
        !defaultLeagues.some((defaultLeague) => defaultLeague.id === league.id),
    );
    window.localStorage.setItem(
      leaguesStorageKey,
      JSON.stringify(customLeagues),
    );

    return nextLeagues;
  }
  const [inviteCodeOverrides, setInviteCodeOverrides] = useState<
    Record<string, string>
  >(readStoredInviteCodes);

  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }

    if (!userId) {
      return;
    }

    let isCancelled = false;
    const cachedSpectatorLeagueIds = readCachedSpectatorLeagueIds(userId);
    const cachedAccessTimer = window.setTimeout(() => {
      if (!isCancelled) {
        setSpectatorLeagueIds(cachedSpectatorLeagueIds);
      }
    }, 0);

    async function hydrateSupabaseAccess() {
      try {
        const snapshot = await fetchSupabaseLeagueSnapshot();

        if (isCancelled) {
          return;
        }

        setIsSuperuserFromDb(snapshot.isSuperuser);
        setCanCreateLeaguesFromDb(snapshot.canCreateLeagues);
        setSpectatorLeagueIds(snapshot.spectatorLeagueIds);
        writeCachedSpectatorLeagueIds(
          userId as string,
          snapshot.spectatorLeagueIds,
        );

        const fallbackLeagues = isDemoDataEnabled() ? defaultLeagues : [];
        const nextLeagues = mergeLeagues(fallbackLeagues, snapshot.leagues);

        persistLeagues(nextLeagues);
        setMemberships(() => {
          const fallbackMemberships = isDemoDataEnabled()
            ? defaultUserLeagueMemberships
            : [];
          const nextMemberships = mergeMemberships(
            fallbackMemberships,
            snapshot.memberships,
          );

          window.localStorage.setItem(
            storageKey,
            JSON.stringify(nextMemberships),
          );

          return nextMemberships;
        });
        hydrateMatches(snapshot.matches);
        hydrateSeasonSnapshot(snapshot.seasonSnapshot);
      } catch (error) {
        const details =
          typeof error === "object" && error !== null
            ? error
            : { message: String(error) };
        window.localStorage.setItem(
          "smash-lob-last-supabase-error",
          JSON.stringify({
            ...details,
            createdAt: new Date().toISOString(),
          }),
        );
      } finally {
        if (!isCancelled) {
          setHydratedAccessUserId(userId);
        }
      }
    }

    hydrateSupabaseAccess();

    return () => {
      isCancelled = true;
      window.clearTimeout(cachedAccessTimer);
    };
  }, [
    hydrateMatches,
    hydrateSeasonSnapshot,
    sessionStatus,
    userId,
  ]);

  const refreshLeagueAccess = useCallback(async () => {
    if (!userId) {
      return false;
    }

    try {
      const snapshot = await fetchSupabaseLeagueSnapshot();
      const fallbackLeagues = isDemoDataEnabled() ? defaultLeagues : [];
      const fallbackMemberships = isDemoDataEnabled()
        ? defaultUserLeagueMemberships
        : [];

      setIsSuperuserFromDb(snapshot.isSuperuser);
      setCanCreateLeaguesFromDb(snapshot.canCreateLeagues);
      setSpectatorLeagueIds(snapshot.spectatorLeagueIds);
      writeCachedSpectatorLeagueIds(userId, snapshot.spectatorLeagueIds);

      setLeagues((currentLeagues) => {
        const nextLeagues = mergeLeagues(
          mergeLeagues(fallbackLeagues, currentLeagues),
          snapshot.leagues,
        );
        const customLeagues = nextLeagues.filter(
          (league) =>
            !defaultLeagues.some(
              (defaultLeague) => defaultLeague.id === league.id,
            ),
        );

        window.localStorage.setItem(
          leaguesStorageKey,
          JSON.stringify(customLeagues),
        );

        return nextLeagues;
      });
      setMemberships((currentMemberships) => {
        const nextMemberships = mergeMemberships(
          mergeMemberships(fallbackMemberships, currentMemberships),
          snapshot.memberships,
        );

        window.localStorage.setItem(
          storageKey,
          JSON.stringify(nextMemberships),
        );

        return nextMemberships;
      });
      hydrateMatches(snapshot.matches);
      hydrateSeasonSnapshot(snapshot.seasonSnapshot);
      setHydratedAccessUserId(userId);

      return true;
    } catch (error) {
      recordSupabaseError("refresh-league-access", error);
      return false;
    }
  }, [hydrateMatches, hydrateSeasonSnapshot, userId]);

  const persistMemberships = useCallback(
    (nextMemberships: UserLeagueMembership[]) => {
      setMemberships(nextMemberships);
      window.localStorage.setItem(storageKey, JSON.stringify(nextMemberships));
    },
    [],
  );

  const userMemberships = useMemo(() => {
    if (!userId) {
      return [];
    }

    return memberships.filter((membership) => membership.userId === userId);
  }, [memberships, userId]);

  const getLeagueInviteCode = useCallback(
    (leagueId: string) => {
      const league = leagues.find((item) => item.id === leagueId);

      return inviteCodeOverrides[leagueId] ?? league?.inviteCode ?? "";
    },
    [inviteCodeOverrides, leagues],
  );

  const createLeague = useCallback(
    async ({
      name,
      description,
      locations,
    }: {
      name: string;
      description: string;
      locations: LeagueLocation[];
    }) => {
      if (!userId || !canCreateLeagues) {
        return null;
      }

      const baseSlug = slugifyLeagueName(name);
      const existingSlugs = new Set(leagues.map((league) => league.slug));
      let slug = baseSlug;
      let suffix = 2;

      while (existingSlugs.has(slug)) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
      }

      const inviteCode = generateInviteCode(
        slug,
        leagues.map((league) => getLeagueInviteCode(league.id)),
      );

      try {
        const result = await createSupabaseLeague({
          leagueName: name,
          leagueDescription: description,
          leagueSlug: slug,
          inviteCode,
          locations,
        });

        setLeagues((currentLeagues) => {
          const nextLeagues = mergeLeagues(currentLeagues, [result.league]);

          persistLeagues(nextLeagues);

          return nextLeagues;
        });
        const createdMembership = result.membership;

        if (createdMembership) {
          setMemberships((currentMemberships) => {
            const nextMemberships = mergeMemberships(currentMemberships, [
              createdMembership,
            ]);

            window.localStorage.setItem(
              storageKey,
              JSON.stringify(nextMemberships),
            );

            return nextMemberships;
          });
        }
        hydrateSeasonSnapshot(result.seasonSnapshot);

        return result.league;
      } catch (error) {
        const details =
          typeof error === "object" && error !== null
            ? error
            : { message: String(error) };
        window.localStorage.setItem(
          "smash-lob-last-supabase-error",
          JSON.stringify({
            ...details,
            createdAt: new Date().toISOString(),
          }),
        );

        return null;
      }
    },
    [
      canCreateLeagues,
      getLeagueInviteCode,
      hydrateSeasonSnapshot,
      leagues,
      userId,
    ],
  );

  const isPlayerClaimed = useCallback(
    (leagueId: string, playerId: string) =>
      memberships.some(
        (membership) =>
          membership.leagueId === leagueId && membership.playerId === playerId,
      ),
    [memberships],
  );

  const getLeagueWithInviteCode = useCallback(
    (league: League): League => ({
      ...league,
      inviteCode: getLeagueInviteCode(league.id),
    }),
    [getLeagueInviteCode],
  );

  const userLeagues = useMemo(() => {
    if (isSuperuser) {
      return uniqueLeaguesById(leagues).map(getLeagueWithInviteCode);
    }

    const accessibleLeagueIds = new Set([
      ...userMemberships.map((membership) => membership.leagueId),
      ...spectatorLeagueIds,
    ]);
    const accessibleLeagues = leagues.filter((league) =>
      accessibleLeagueIds.has(league.id),
    );

    return uniqueLeaguesById(accessibleLeagues).map(getLeagueWithInviteCode);
  }, [
    getLeagueWithInviteCode,
    isSuperuser,
    leagues,
    spectatorLeagueIds,
    userMemberships,
  ]);

  const getMembershipForLeague = useCallback(
    (leagueId: string) =>
      userMemberships.find((membership) => membership.leagueId === leagueId) ??
      null,
    [userMemberships],
  );

  const regenerateLeagueInviteCode = useCallback(
    async (leagueId: string) => {
      if (!userId) {
        return null;
      }

      const existingCodes = leagues.map((league) =>
        league.id === leagueId
          ? ""
          : (inviteCodeOverrides[league.id] ?? league.inviteCode),
      );
      const code = generateInviteCode(leagueId, existingCodes);

      if (isSupabaseBackedId(leagueId)) {
        try {
          const result = await regenerateSupabaseLeagueInviteCode({
            leagueId,
            code,
            email: userId,
            displayName: userDisplayName,
          });

          setLeagues((currentLeagues) => {
            const nextLeagues = currentLeagues.map((league) =>
              league.id === result.leagueId
                ? {
                    ...league,
                    inviteCode: result.inviteCode,
                  }
                : league,
            );

            persistLeagues(nextLeagues);

            return nextLeagues;
          });

          const nextInviteCodeOverrides = { ...inviteCodeOverrides };
          delete nextInviteCodeOverrides[leagueId];

          setInviteCodeOverrides(nextInviteCodeOverrides);
          window.localStorage.setItem(
            inviteCodesStorageKey,
            JSON.stringify(nextInviteCodeOverrides),
          );

          return result.inviteCode;
        } catch (error) {
          recordSupabaseError("regenerate-invite-code", error);
          return null;
        }
      }

      const nextInviteCodeOverrides = {
        ...inviteCodeOverrides,
        [leagueId]: code,
      };

      setInviteCodeOverrides(nextInviteCodeOverrides);
      window.localStorage.setItem(
        inviteCodesStorageKey,
        JSON.stringify(nextInviteCodeOverrides),
      );

      return code;
    },
    [inviteCodeOverrides, leagues, userDisplayName, userId],
  );

  const updateLeagueDetails = useCallback(
    async (
      leagueId: string,
      details: { name: string; description: string },
    ) => {
      const name = details.name.trim();
      const description = details.description.trim();

      if (!name) {
        return false;
      }

      if (isSupabaseBackedId(leagueId)) {
        try {
          const result = await updateSupabaseLeagueDetails({
            leagueId,
            name,
            description,
          });

          setLeagues((currentLeagues) => {
            const nextLeagues = currentLeagues.map((league) =>
              league.id === result.leagueId
                ? {
                    ...league,
                    name: result.name,
                    description: result.description,
                  }
                : league,
            );

            persistLeagues(nextLeagues);

            return nextLeagues;
          });

          return true;
        } catch (error) {
          recordSupabaseError("update-league-details", error);
          return false;
        }
      }

      setLeagues((currentLeagues) => {
        const nextLeagues = currentLeagues.map((league) =>
          league.id === leagueId
            ? {
                ...league,
                name,
                description,
              }
            : league,
        );

        persistLeagues(nextLeagues);

        return nextLeagues;
      });

      return true;
    },
    [],
  );

  const updateLeagueLogo = useCallback(
    async (leagueId: string, logoUrl: string | null) => {
      if (isSupabaseBackedId(leagueId)) {
        try {
          const result = await updateSupabaseLeagueLogo({
            leagueId,
            logoUrl,
          });

          setLeagues((currentLeagues) => {
            const nextLeagues = currentLeagues.map((league) =>
              league.id === result.leagueId
                ? {
                    ...league,
                    logoUrl: result.logoUrl,
                  }
                : league,
            );

            persistLeagues(nextLeagues);

            return nextLeagues;
          });

          return true;
        } catch (error) {
          recordSupabaseError("update-league-logo", error);
          return false;
        }
      }

      setLeagues((currentLeagues) => {
        const nextLeagues = currentLeagues.map((league) =>
          league.id === leagueId
            ? {
                ...league,
                logoUrl,
              }
            : league,
        );

        persistLeagues(nextLeagues);

        return nextLeagues;
      });

      return true;
    },
    [],
  );

  const updateLeagueLocations = useCallback(
    async (leagueId: string, locations: LeagueLocation[]) => {
      const normalizedLocations = normalizeLeagueLocations(locations);

      if (isSupabaseBackedId(leagueId)) {
        try {
          const result = await updateSupabaseLeagueLocations({
            leagueId,
            locations: normalizedLocations,
          });

          setLeagues((currentLeagues) => {
            const nextLeagues = currentLeagues.map((league) =>
              league.id === result.leagueId
                ? {
                    ...league,
                    locations: result.locations,
                  }
                : league,
            );

            persistLeagues(nextLeagues);

            return nextLeagues;
          });

          return true;
        } catch (error) {
          recordSupabaseError("update-league-locations", error);
          return false;
        }
      }

      setLeagues((currentLeagues) => {
        const nextLeagues = currentLeagues.map((league) =>
          league.id === leagueId
            ? {
                ...league,
                locations: normalizedLocations,
              }
            : league,
        );

        persistLeagues(nextLeagues);

        return nextLeagues;
      });

      return true;
    },
    [],
  );

  const updateLeagueStatusColorsEnabled = useCallback(
    async (leagueId: string, enabled: boolean) => {
      if (isSupabaseBackedId(leagueId)) {
        try {
          const result = await updateSupabaseLeagueStatusColorsEnabled({
            leagueId,
            enabled,
          });

          setLeagues((currentLeagues) => {
            const nextLeagues = currentLeagues.map((league) =>
              league.id === result.leagueId
                ? {
                    ...league,
                    statusColorsEnabled: result.statusColorsEnabled,
                  }
                : league,
            );

            persistLeagues(nextLeagues);

            return nextLeagues;
          });

          return true;
        } catch (error) {
          recordSupabaseError("update-league-status-colors", error);
          return false;
        }
      }

      setLeagues((currentLeagues) => {
        const nextLeagues = currentLeagues.map((league) =>
          league.id === leagueId
            ? {
                ...league,
                statusColorsEnabled: enabled,
              }
            : league,
        );

        persistLeagues(nextLeagues);

        return nextLeagues;
      });

      return true;
    },
    [],
  );


  const updateLeagueShowRankingAvatars = useCallback(
    async (leagueId: string, enabled: boolean) => {
      if (isSupabaseBackedId(leagueId)) {
        try {
          const result = await updateSupabaseLeagueShowRankingAvatars({
            leagueId,
            enabled,
          });

          setLeagues((currentLeagues) => {
            const nextLeagues = currentLeagues.map((league) =>
              league.id === result.leagueId
                ? {
                    ...league,
                    showRankingAvatars: result.showRankingAvatars,
                  }
                : league,
            );

            persistLeagues(nextLeagues);

            return nextLeagues;
          });

          return true;
        } catch (error) {
          recordSupabaseError("update-league-ranking-avatars", error);
          return false;
        }
      }

      setLeagues((currentLeagues) => {
        const nextLeagues = currentLeagues.map((league) =>
          league.id === leagueId
            ? {
                ...league,
                showRankingAvatars: enabled,
              }
            : league,
        );

        persistLeagues(nextLeagues);

        return nextLeagues;
      });

      return true;
    },
    [],
  );

  const deleteLeague = useCallback(
    async (leagueId: string) => {
      if (!userId) {
        return false;
      }

      const membership = memberships.find(
        (item) => item.userId === userId && item.leagueId === leagueId,
      );

      if (membership?.role !== "creator") {
        return false;
      }

      if (isSupabaseBackedId(leagueId)) {
        try {
          await deleteSupabaseLeague({
            leagueId,
            email: userId,
            displayName: userDisplayName,
          });
        } catch (error) {
          recordSupabaseError("delete-league", error);
          return false;
        }
      }

      setLeagues((currentLeagues) => {
        const nextLeagues = currentLeagues.filter(
          (league) => league.id !== leagueId,
        );

        persistLeagues(nextLeagues);

        return nextLeagues;
      });
      persistMemberships(
        memberships.filter((membership) => membership.leagueId !== leagueId),
      );
      setInviteCodeOverrides((currentInviteCodeOverrides) => {
        const nextInviteCodeOverrides = { ...currentInviteCodeOverrides };
        delete nextInviteCodeOverrides[leagueId];

        window.localStorage.setItem(
          inviteCodesStorageKey,
          JSON.stringify(nextInviteCodeOverrides),
        );

        return nextInviteCodeOverrides;
      });
      window.localStorage.removeItem("smash-lob-active-league");

      return true;
    },
    [memberships, persistMemberships, userDisplayName, userId],
  );

  const fetchLeagueUsers = useCallback(async (leagueId: string) => {
    try {
      return await fetchSupabaseLeagueUsers(leagueId);
    } catch (error) {
      recordSupabaseError("fetch-league-users", error);
      return [];
    }
  }, []);

  const updateLeagueUserRole = useCallback(
    async (
      leagueId: string,
      playerId: string,
      role: Extract<LeagueMemberRole, "admin" | "player">,
    ) => {
      try {
        const result = await updateSupabaseLeagueMembershipRole({
          leagueId,
          playerId,
          role,
        });

        setMemberships((currentMemberships) => {
          const nextMemberships = mergeMemberships(
            currentMemberships.filter(
              (membership) =>
                !(
                  membership.leagueId === leagueId &&
                  membership.playerId === playerId &&
                  membership.userId === claimedMembershipUserId
                ),
            ),
            [result],
          );

          window.localStorage.setItem(
            storageKey,
            JSON.stringify(nextMemberships),
          );

          return nextMemberships;
        });

        return true;
      } catch (error) {
        recordSupabaseError("update-league-user-role", error);
        return false;
      }
    },
    [],
  );

  const unlinkLeaguePlayerAccount = useCallback(
    async (leagueId: string, playerId: string) => {
      try {
        if (
          isSupabaseBackedId(leagueId) &&
          isSupabaseBackedId(playerId)
        ) {
          await unlinkSupabaseLeagueMembership({ leagueId, playerId });
        }

        setMemberships((currentMemberships) => {
          const nextMemberships = currentMemberships.filter(
            (membership) =>
              !(
                membership.leagueId === leagueId &&
                membership.playerId === playerId
              ),
          );

          window.localStorage.setItem(
            storageKey,
            JSON.stringify(nextMemberships),
          );

          return nextMemberships;
        });

        return true;
      } catch (error) {
        recordSupabaseError("unlink-league-player-account", error);
        return false;
      }
    },
    [],
  );

  const updateLeaguePlayerName = useCallback(
    async (leagueId: string, playerId: string, displayName: string) => {
      const cleanName = displayName.trim();

      if (!cleanName) {
        return false;
      }

      if (!isSupabaseBackedId(leagueId) || !isSupabaseBackedId(playerId)) {
        updatePlayerProfile({
          playerId,
          displayName: cleanName,
          avatarInitials: getInitials(cleanName),
        });

        return true;
      }

      try {
        const result = await updateSupabasePlayerDisplayName({
          leagueId,
          playerId,
          displayName: cleanName,
        });

        updatePlayerProfile(result);

        return true;
      } catch (error) {
        recordSupabaseError("update-league-player-name", error);
        return false;
      }
    },
    [updatePlayerProfile],
  );

  const updateLeaguePlayerAvatar = useCallback(
    async (leagueId: string, playerId: string, avatarUrl: string | null) => {
      try {
        const result = await updateSupabasePlayerAvatar({
          leagueId,
          playerId,
          avatarUrl,
        });

        updatePlayerProfile(result);

        return true;
      } catch (error) {
        recordSupabaseError("update-league-player-avatar", error);
        return false;
      }
    },
    [updatePlayerProfile],
  );

  const getLeagueByInviteCode = useCallback(
    (code: string) => {
      const normalizedCode = normalizeInviteCode(code);

      const league = leagues.find(
        (item) =>
          normalizeInviteCode(getLeagueInviteCode(item.id)) === normalizedCode,
      );

      return league ? getLeagueWithInviteCode(league) : null;
    },
    [getLeagueInviteCode, getLeagueWithInviteCode, leagues],
  );

  const resolveLeagueInvite = useCallback(
    async (code: string, leagueIdHint?: string | null) => {
      const localLeague = getLeagueByInviteCode(code);

      try {
        const snapshot = await fetchSupabaseInviteSnapshot(code, leagueIdHint);

        if (!snapshot) {
          return localLeague;
        }

        setLeagues((currentLeagues) => {
          const nextLeagues = mergeLeagues(currentLeagues, [snapshot.league]);

          persistLeagues(nextLeagues);

          return nextLeagues;
        });
        setMemberships((currentMemberships) =>
          mergeMemberships(currentMemberships, snapshot.claimedMemberships),
        );
        setInviteClaimablePlayerIds((current) => ({
          ...current,
          [snapshot.league.id]: snapshot.claimablePlayerIds,
        }));
        hydrateMatches(snapshot.matches);
        hydrateSeasonSnapshot(snapshot.seasonSnapshot);

        return snapshot.league;
      } catch (error) {
        recordSupabaseError("resolve-league-invite", error);
        return localLeague;
      }
    },
    [getLeagueByInviteCode, hydrateMatches, hydrateSeasonSnapshot],
  );

  const getUnclaimedPlayersForLeague = useCallback(
    (leagueId: string) => {
      const claimedPlayerIds = new Set(
        memberships
          .filter((membership) => membership.leagueId === leagueId)
          .map((membership) => membership.playerId),
      );
      const league = leagues.find((item) => item.id === leagueId);
      const latestLeagueSeason = [...seasons]
        .filter((season) => season.leagueId === leagueId)
        .at(-1);
      const joinableSeasonId =
        league?.activeSeasonId || latestLeagueSeason?.id || "";
      const joinableSeasonPlayerIds = new Set([
        ...(joinableSeasonId
          ? seasonPlayers
              .filter(
                (seasonPlayer) =>
                  seasonPlayer.seasonId === joinableSeasonId &&
                  seasonPlayer.status !== "withdrawn",
              )
              .map((seasonPlayer) => seasonPlayer.playerId)
          : []),
        ...(inviteClaimablePlayerIds[leagueId] ?? []),
      ]);

      return playerProfiles.filter((player) => {
        if (player.leagueId !== leagueId || claimedPlayerIds.has(player.id)) {
          return false;
        }

        if (joinableSeasonPlayerIds.size > 0) {
          return joinableSeasonPlayerIds.has(player.id);
        }

        return true;
      });
    },
    [
      inviteClaimablePlayerIds,
      leagues,
      memberships,
      playerProfiles,
      seasonPlayers,
      seasons,
    ],
  );

  const claimPlayer = useCallback(
    async (
      leagueId: string,
      playerId: string,
      inviteCode?: string,
    ): Promise<ClaimResult> => {
      if (!userId) {
        return { ok: false, error: "already-in-league" };
      }

      const alreadyInLeague = memberships.some(
        (membership) =>
          membership.userId === userId && membership.leagueId === leagueId,
      );

      if (alreadyInLeague) {
        return { ok: false, error: "already-in-league" };
      }

      const isSelfRegistrationClaim = playerId === "__self_registration__";
      const playerAlreadyClaimed =
        !isSelfRegistrationClaim &&
        memberships.some(
          (membership) =>
            membership.leagueId === leagueId && membership.playerId === playerId,
        );

      if (playerAlreadyClaimed) {
        return { ok: false, error: "player-already-claimed" };
      }

      if (
        isSupabaseBackedId(leagueId) &&
        (isSupabaseBackedId(playerId) || isSelfRegistrationClaim)
      ) {
        try {
          const result = await claimSupabasePlayer({
            code: inviteCode ?? getLeagueInviteCode(leagueId),
            leagueId,
            playerId: isSelfRegistrationClaim ? undefined : playerId,
          });

          if (result.ok) {
            const normalizedMembership = {
              ...result.membership,
              userId,
            };

            persistMemberships(
              mergeMemberships(memberships, [normalizedMembership]),
            );
            void refreshLeagueAccess();

            return { ok: true, membership: normalizedMembership };
          }

          return result;
        } catch (error) {
          recordSupabaseError("claim-player", error);
          return { ok: false, error: "player-already-claimed" };
        }
      }

      const membership = {
        userId,
        leagueId,
        playerId,
        role: getBaseRole(leagueId, playerId),
      };

      persistMemberships([...memberships, membership]);

      return { ok: true, membership };
    },
    [
      getLeagueInviteCode,
      memberships,
      persistMemberships,
      refreshLeagueAccess,
      userId,
    ],
  );

  const linkCurrentUserToLeaguePlayer = useCallback(
    (leagueId: string, playerId: string) => {
      if (!userId || !playerId) {
        return;
      }

      setMemberships((currentMemberships) => {
        const currentMembership = currentMemberships.find(
          (membership) =>
            membership.userId === userId && membership.leagueId === leagueId,
        );
        const linkedMembership: UserLeagueMembership = {
          userId,
          leagueId,
          playerId,
          role: currentMembership?.role ?? getBaseRole(leagueId, playerId),
        };
        const nextMemberships = mergeMemberships(
          currentMemberships.filter(
            (membership) =>
              !(
                membership.userId === userId && membership.leagueId === leagueId
              ),
          ),
          [linkedMembership],
        );

        window.localStorage.setItem(
          storageKey,
          JSON.stringify(nextMemberships),
        );

        return nextMemberships;
      });
    },
    [userId],
  );

  const isLeagueSpectator = useCallback(
    (leagueId: string) =>
      !getMembershipForLeague(leagueId) && spectatorLeagueIds.includes(leagueId),
    [getMembershipForLeague, spectatorLeagueIds],
  );

  const canShareSpectatorInvite = useCallback(
    (leagueId: string) =>
      isSuperuser || Boolean(getMembershipForLeague(leagueId)),
    [getMembershipForLeague, isSuperuser],
  );

  const canAccessLeague = useCallback(
    (leagueId: string) =>
      isSuperuser ||
      Boolean(getMembershipForLeague(leagueId)) ||
      spectatorLeagueIds.includes(leagueId),
    [getMembershipForLeague, isSuperuser, spectatorLeagueIds],
  );

  const hasLeagueAdminRole = useCallback(
    (leagueId: string) => {
      if (isSuperuser) {
        return true;
      }

      const membership = getMembershipForLeague(leagueId);

      return Boolean(membership && adminRoles.includes(membership.role));
    },
    [getMembershipForLeague, isSuperuser],
  );

  const isLeagueAdmin = useCallback(
    (leagueId: string) =>
      isAdminViewEnabled && hasLeagueAdminRole(leagueId),
    [hasLeagueAdminRole, isAdminViewEnabled],
  );

  const isLeagueCreator = useCallback(
    (leagueId: string) => {
      if (!isAdminViewEnabled) {
        return false;
      }

      if (isSuperuser) {
        return true;
      }

      const membership = getMembershipForLeague(leagueId);

      return membership?.role === "creator";
    },
    [getMembershipForLeague, isAdminViewEnabled, isSuperuser],
  );

  const value = useMemo(
    () => ({
      userId,
      isSuperuser,
      canCreateLeagues,
      isAdminViewEnabled,
      setAdminViewEnabled,
      leagues,
      userMemberships,
      spectatorLeagueIds,
      isAccessHydrated,
      userLeagues,
      refreshLeagueAccess,
      createLeague,
      getMembershipForLeague,
      getLeagueInviteCode,
      isPlayerClaimed,
      regenerateLeagueInviteCode,
      updateLeagueDetails,
      updateLeagueLogo,
      updateLeagueLocations,
      updateLeagueStatusColorsEnabled,
      updateLeagueShowRankingAvatars,
      deleteLeague,
      fetchLeagueUsers,
      updateLeagueUserRole,
      unlinkLeaguePlayerAccount,
      updateLeaguePlayerName,
      updateLeaguePlayerAvatar,
      getLeagueByInviteCode,
      resolveLeagueInvite,
      getUnclaimedPlayersForLeague,
      claimPlayer,
      linkCurrentUserToLeaguePlayer,
      canAccessLeague,
      isLeagueSpectator,
      canShareSpectatorInvite,
      isLeagueAdmin,
      hasLeagueAdminRole,
      isLeagueCreator,
    }),
    [
      canAccessLeague,
      canShareSpectatorInvite,
      createLeague,
      claimPlayer,
      deleteLeague,
      fetchLeagueUsers,
      updateLeagueUserRole,
      unlinkLeaguePlayerAccount,
      updateLeaguePlayerName,
      updateLeaguePlayerAvatar,
      getLeagueByInviteCode,
      getLeagueInviteCode,
      getMembershipForLeague,
      getUnclaimedPlayersForLeague,
      isPlayerClaimed,
      linkCurrentUserToLeaguePlayer,
      regenerateLeagueInviteCode,
      updateLeagueDetails,
      updateLeagueLogo,
      updateLeagueLocations,
      updateLeagueStatusColorsEnabled,
      updateLeagueShowRankingAvatars,
      resolveLeagueInvite,
      refreshLeagueAccess,
      isLeagueAdmin,
      isLeagueSpectator,
      hasLeagueAdminRole,
      isLeagueCreator,
      isSuperuser,
      canCreateLeagues,
      isAdminViewEnabled,
      setAdminViewEnabled,
      leagues,
      spectatorLeagueIds,
      isAccessHydrated,
      userId,
      userLeagues,
      userMemberships,
    ],
  );

  return (
    <LeagueAccessContext.Provider value={value}>
      {children}
    </LeagueAccessContext.Provider>
  );
}

export function useLeagueAccess() {
  const context = useContext(LeagueAccessContext);

  if (!context) {
    throw new Error("useLeagueAccess must be used inside LeagueAccessProvider");
  }

  return context;
}
