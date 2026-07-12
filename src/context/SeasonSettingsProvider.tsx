"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  leagues,
  playerProfiles as defaultPlayerProfiles,
  seasonPlayers as defaultSeasonPlayers,
  seasonRoundSettings,
  seasons as defaultSeasons,
  type PlayerProfile,
  type Season,
  type SeasonPlayer,
} from "@/data/fakeData";
import {
  getSeasonScheduleRoundCount,
  type SeasonScheduleMode,
} from "@/lib/calendar";
import {
  buildSeasonRegistrationFee,
  emptySeasonRegistrationFee,
  normalizeSeasonRegistrationFee,
  type SeasonRegistrationFee,
} from "@/lib/seasonRegistration";
import type { SeasonMvpMode } from "@/lib/mvp";

export type RoundWindowMode = "none" | "fixed-days";

export type SeasonRoundSettings = {
  leagueId: string;
  seasonId: string;
  roundWindowMode: RoundWindowMode;
  seasonStartsAt: string | null;
  roundWindowDays: number | null;
  requiresThreeSets: boolean;
  manualActiveRound: number | null;
  manualCompletedRounds: number[];
  registrationFee: SeasonRegistrationFee;
  mvpMode: SeasonMvpMode;
};

type SeasonSettingsContextValue = {
  seasons: Season[];
  playerProfiles: PlayerProfile[];
  seasonPlayers: SeasonPlayer[];
  seasonSettings: SeasonRoundSettings[];
  getActiveSeasonByLeagueId: (leagueId: string) => Season;
  getSeasonPlayers: (seasonId: string) => SeasonPlayer[];
  getSeasonRoundSettings: (seasonId: string) => SeasonRoundSettings;
  updateSeasonRoundSettings: (settings: SeasonRoundSettings) => void;
  updatePlayerProfile: (player: {
    playerId: string;
    displayName: string;
    avatarInitials: string;
    avatarUrl?: string | null;
    userId?: string | null;
  }) => void;
  hydrateSeasonSnapshot: (snapshot: SeasonSnapshot) => void;
  finishActiveSeason: (leagueId: string) => void;
  finishSeason: (leagueId: string, seasonId: string) => void;
  startSeason: (leagueId: string, seasonId: string) => void;
  deleteSeason: (leagueId: string, seasonId: string) => void;
  createInitialSeasonForLeague: (settings: {
    leagueId: string;
    seasonName: string;
    playerNames: string[];
    roundWindowMode: RoundWindowMode;
    seasonStartsAt: string | null;
    roundWindowDays: number | null;
    requiresThreeSets: boolean;
    registrationFeeEnabled?: boolean;
    registrationFeeAmount?: number;
    registrationFeePurpose?: string;
    mvpMode?: SeasonMvpMode;
  }) => { seasonId: string; playerIds: string[] };
  startNewSeason: (settings: {
    leagueId: string;
    name: string;
    playerIds: string[];
    newPlayerNames: string[];
    roundWindowMode: RoundWindowMode;
    seasonStartsAt: string | null;
    roundWindowDays: number | null;
    requiresThreeSets: boolean;
    scheduleMode?: SeasonScheduleMode;
    registrationFeeEnabled?: boolean;
    registrationFeeAmount?: number;
    registrationFeePurpose?: string;
    mvpMode?: SeasonMvpMode;
  }) => { season: Season; playerIds: string[]; newPlayerIds: string[] };
};

type SeasonSettingsProviderProps = {
  children: React.ReactNode;
};

const SeasonSettingsContext = createContext<SeasonSettingsContextValue | null>(
  null,
);

const storageKey = "smash-lob-season-round-settings";
const seasonDataStorageKey = "smash-lob-season-data";

type SeasonDataState = {
  seasons: Season[];
  playerProfiles: PlayerProfile[];
  seasonPlayers: SeasonPlayer[];
  activeSeasonIds: Record<string, string>;
};

export type SeasonSnapshot = {
  seasons: Season[];
  playerProfiles: PlayerProfile[];
  seasonPlayers: SeasonPlayer[];
  seasonSettings: SeasonRoundSettings[];
  activeSeasonIds: Record<string, string>;
};

function normalizeSettings(
  settings: (typeof seasonRoundSettings)[number],
): SeasonRoundSettings {
  const storedMvpMode = (settings as Partial<SeasonRoundSettings>).mvpMode;

  return {
    leagueId: settings.leagueId,
    seasonId: settings.seasonId,
    roundWindowMode: settings.roundWindowMode as RoundWindowMode,
    seasonStartsAt: settings.seasonStartsAt,
    roundWindowDays: settings.roundWindowDays,
    requiresThreeSets: settings.requiresThreeSets ?? true,
    manualActiveRound:
      typeof (settings as Partial<SeasonRoundSettings>).manualActiveRound === "number"
        ? (settings as Partial<SeasonRoundSettings>).manualActiveRound ?? null
        : null,
    manualCompletedRounds: Array.isArray(
      (settings as Partial<SeasonRoundSettings>).manualCompletedRounds,
    )
      ? ((settings as Partial<SeasonRoundSettings>).manualCompletedRounds ?? [])
          .filter((round): round is number => typeof round === "number")
      : [],
    registrationFee: normalizeSeasonRegistrationFee(
      (settings as Partial<SeasonRoundSettings>).registrationFee,
    ),
    mvpMode:
      storedMvpMode === "none" ||
      storedMvpMode === "automatic" ||
      storedMvpMode === "voting"
        ? storedMvpMode
        : "automatic",
  };
}

function getDefaultSettings() {
  return seasonRoundSettings.map(normalizeSettings);
}

function getDefaultSeasonData(): SeasonDataState {
  return {
    seasons: defaultSeasons,
    playerProfiles: defaultPlayerProfiles,
    seasonPlayers: defaultSeasonPlayers,
    activeSeasonIds: Object.fromEntries(
      leagues.map((league) => [league.id, league.activeSeasonId]),
    ),
  };
}

function isSeasonStatus(value: unknown): value is Season["status"] {
  return value === "upcoming" || value === "active" || value === "finished";
}

function isValidSeason(value: unknown): value is Season {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    typeof item.leagueId === "string" &&
    typeof item.name === "string" &&
    isSeasonStatus(item.status) &&
    typeof item.totalRounds === "number" &&
    typeof item.completedRounds === "number"
  );
}

function isValidPlayerProfile(value: unknown): value is PlayerProfile {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    typeof item.leagueId === "string" &&
    typeof item.slug === "string" &&
    typeof item.displayName === "string" &&
    typeof item.avatarInitials === "string" &&
    (typeof item.userId === "undefined" ||
      item.userId === null ||
      typeof item.userId === "string") &&
    (typeof item.avatarUrl === "undefined" ||
      item.avatarUrl === null ||
      typeof item.avatarUrl === "string")
  );
}

function isValidSeasonPlayer(value: unknown): value is SeasonPlayer {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return typeof item.seasonId === "string" && typeof item.playerId === "string";
}

function readSeasonData(): SeasonDataState {
  if (typeof window === "undefined") {
    return getDefaultSeasonData();
  }

  const storedValue = window.localStorage.getItem(seasonDataStorageKey);

  if (!storedValue) {
    return getDefaultSeasonData();
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    if (typeof parsedValue !== "object" || parsedValue === null) {
      return getDefaultSeasonData();
    }

    const item = parsedValue as Record<string, unknown>;
    const seasons = Array.isArray(item.seasons)
      ? item.seasons.filter(isValidSeason)
      : defaultSeasons;
    const playerProfiles = Array.isArray(item.playerProfiles)
      ? item.playerProfiles.filter(isValidPlayerProfile)
      : defaultPlayerProfiles;
    const seasonPlayers = Array.isArray(item.seasonPlayers)
      ? item.seasonPlayers.filter(isValidSeasonPlayer)
      : defaultSeasonPlayers;
    const activeSeasonIds =
      typeof item.activeSeasonIds === "object" && item.activeSeasonIds !== null
        ? Object.fromEntries(
            Object.entries(item.activeSeasonIds).filter(
              ([leagueId, seasonId]) =>
                typeof leagueId === "string" && typeof seasonId === "string",
            ),
          )
        : getDefaultSeasonData().activeSeasonIds;

    return {
      seasons: seasons.length > 0 ? seasons : defaultSeasons,
      playerProfiles:
        playerProfiles.length > 0 ? playerProfiles : defaultPlayerProfiles,
      seasonPlayers,
      activeSeasonIds: activeSeasonIds as Record<string, string>,
    };
  } catch {
    return getDefaultSeasonData();
  }
}

function persistSeasonData(seasonData: SeasonDataState) {
  window.localStorage.setItem(seasonDataStorageKey, JSON.stringify(seasonData));
}

function parseStoredSettings(
  value: string | null,
): SeasonRoundSettings[] | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return null;
    }

    const defaultSettings = getDefaultSettings();

    const mergedSettings = defaultSettings.map((defaultSetting) => {
      const storedSetting = parsed.find(
        (item: Partial<SeasonRoundSettings>) =>
          item.seasonId === defaultSetting.seasonId,
      ) as Partial<SeasonRoundSettings> | undefined;

      if (!storedSetting) {
        return defaultSetting;
      }

      return {
        ...defaultSetting,
        ...storedSetting,
        requiresThreeSets:
          storedSetting.requiresThreeSets ?? defaultSetting.requiresThreeSets,
        mvpMode:
          storedSetting.mvpMode === "none" ||
          storedSetting.mvpMode === "automatic" ||
          storedSetting.mvpMode === "voting"
            ? storedSetting.mvpMode
            : defaultSetting.mvpMode,
      };
    });

    const extraSettings = parsed
      .filter((storedSetting) => {
        return !mergedSettings.some(
          (setting) => setting.seasonId === storedSetting.seasonId,
        );
      })
      .map((storedSetting: Partial<SeasonRoundSettings>) => ({
        leagueId: storedSetting.leagueId ?? "",
        seasonId: storedSetting.seasonId ?? "",
        roundWindowMode: storedSetting.roundWindowMode ?? "none",
        seasonStartsAt: storedSetting.seasonStartsAt ?? null,
        roundWindowDays: storedSetting.roundWindowDays ?? null,
        requiresThreeSets: storedSetting.requiresThreeSets ?? true,
        manualActiveRound:
          typeof storedSetting.manualActiveRound === "number"
            ? storedSetting.manualActiveRound
            : null,
        manualCompletedRounds: Array.isArray(storedSetting.manualCompletedRounds)
          ? storedSetting.manualCompletedRounds.filter(
              (round): round is number => typeof round === "number",
            )
          : [],
        registrationFee: normalizeSeasonRegistrationFee(
          storedSetting.registrationFee,
        ),
        mvpMode:
          storedSetting.mvpMode === "none" ||
          storedSetting.mvpMode === "automatic" ||
          storedSetting.mvpMode === "voting"
            ? storedSetting.mvpMode
            : "automatic",
      }));

    return [...mergedSettings, ...extraSettings];
  } catch {
    return null;
  }
}

function createFallbackSettings(seasonId: string): SeasonRoundSettings {
  return {
    leagueId: "",
    seasonId,
    roundWindowMode: "none",
    seasonStartsAt: null,
    roundWindowDays: null,
    requiresThreeSets: true,
    manualActiveRound: null,
    manualCompletedRounds: [],
    registrationFee: emptySeasonRegistrationFee,
    mvpMode: "automatic",
  };
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]) {
  const items = new Map(current.map((item) => [item.id, item]));

  incoming.forEach((item) => {
    items.set(item.id, item);
  });

  return Array.from(items.values());
}

function mergeSeasonPlayers(current: SeasonPlayer[], incoming: SeasonPlayer[]) {
  const items = new Map(
    current.map((item) => [`${item.seasonId}:${item.playerId}`, item]),
  );

  incoming.forEach((item) => {
    items.set(`${item.seasonId}:${item.playerId}`, item);
  });

  return Array.from(items.values());
}

function mergeSettings(
  current: SeasonRoundSettings[],
  incoming: SeasonRoundSettings[],
) {
  const items = new Map(current.map((item) => [item.seasonId, item]));

  incoming.forEach((item) => {
    items.set(item.seasonId, item);
  });

  return Array.from(items.values());
}

function getLatestLeagueSeason(seasons: Season[], leagueId: string) {
  const leagueSeasons = seasons.filter(
    (season) => season.leagueId === leagueId,
  );

  return leagueSeasons[leagueSeasons.length - 1] ?? null;
}

function slugifyName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "jugador"
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

export function SeasonSettingsProvider({
  children,
}: SeasonSettingsProviderProps) {
  const [seasonSettings, setSeasonSettings] =
    useState<SeasonRoundSettings[]>(getDefaultSettings);
  const [seasonData, setSeasonData] = useState<SeasonDataState>(readSeasonData);

  useEffect(() => {
    const storedSettings = parseStoredSettings(
      window.localStorage.getItem(storageKey),
    );

    if (storedSettings) {
      window.setTimeout(() => {
        setSeasonSettings(storedSettings);
      }, 0);
    }
  }, []);

  function getSeasonRoundSettings(seasonId: string) {
    return (
      seasonSettings.find((settings) => settings.seasonId === seasonId) ??
      createFallbackSettings(seasonId)
    );
  }

  function getActiveSeasonByLeagueId(leagueId: string) {
    const activeSeasonId = seasonData.activeSeasonIds[leagueId];
    const pointedSeason = activeSeasonId
      ? seasonData.seasons.find(
          (season) =>
            season.id === activeSeasonId && season.leagueId === leagueId,
        )
      : null;

    if (pointedSeason) {
      return pointedSeason;
    }

    const activeFallbackSeason = seasonData.seasons.find(
      (season) => season.leagueId === leagueId && season.status === "active",
    );

    if (activeFallbackSeason) {
      return activeFallbackSeason;
    }

    const upcomingFallbackSeason = seasonData.seasons.find(
      (season) => season.leagueId === leagueId && season.status === "upcoming",
    );

    if (upcomingFallbackSeason) {
      return upcomingFallbackSeason;
    }

    const latestSeason = getLatestLeagueSeason(seasonData.seasons, leagueId);

    if (!latestSeason) {
      return {
        id: `${leagueId}-season-draft`,
        leagueId,
        name: "Sin temporada",
        status: "finished" as const,
        totalRounds: 0,
        completedRounds: 0,
      };
    }

    return latestSeason;
  }

  function getSeasonPlayers(seasonId: string) {
    return seasonData.seasonPlayers.filter(
      (seasonPlayer) => seasonPlayer.seasonId === seasonId,
    );
  }

  function finishSeason(leagueId: string, seasonId: string) {
    setSeasonData((currentSeasonData) => {
      const nextActiveSeasonIds = { ...currentSeasonData.activeSeasonIds };

      if (nextActiveSeasonIds[leagueId] === seasonId) {
        delete nextActiveSeasonIds[leagueId];
      }

      const nextSeasonData = {
        ...currentSeasonData,
        seasons: currentSeasonData.seasons.map((season) =>
          season.id === seasonId
            ? {
                ...season,
                status: "finished" as const,
                completedRounds: season.totalRounds,
              }
            : season,
        ),
        activeSeasonIds: nextActiveSeasonIds,
      };

      persistSeasonData(nextSeasonData);

      return nextSeasonData;
    });
  }

  function finishActiveSeason(leagueId: string) {
    setSeasonData((currentSeasonData) => {
      const activeSeasonId = currentSeasonData.activeSeasonIds[leagueId];

      if (!activeSeasonId) {
        return currentSeasonData;
      }

      const nextActiveSeasonIds = { ...currentSeasonData.activeSeasonIds };
      delete nextActiveSeasonIds[leagueId];

      const nextSeasonData = {
        ...currentSeasonData,
        seasons: currentSeasonData.seasons.map((season) =>
          season.id === activeSeasonId
            ? {
                ...season,
                status: "finished" as const,
                completedRounds: season.totalRounds,
              }
            : season,
        ),
        activeSeasonIds: nextActiveSeasonIds,
      };

      persistSeasonData(nextSeasonData);

      return nextSeasonData;
    });
  }

  function startSeason(leagueId: string, seasonId: string) {
    setSeasonData((currentSeasonData) => {
      const nextSeasonData = {
        ...currentSeasonData,
        seasons: currentSeasonData.seasons.map((season) =>
          season.id === seasonId
            ? {
                ...season,
                status: "active" as const,
              }
            : season.leagueId === leagueId && season.status === "active"
              ? {
                  ...season,
                  status: "finished" as const,
                }
              : season,
        ),
        activeSeasonIds: {
          ...currentSeasonData.activeSeasonIds,
          [leagueId]: seasonId,
        },
      };

      persistSeasonData(nextSeasonData);

      return nextSeasonData;
    });
  }

  function deleteSeason(leagueId: string, seasonId: string) {
    setSeasonData((currentSeasonData) => {
      const remainingSeasons = currentSeasonData.seasons.filter(
        (season) => season.id !== seasonId,
      );
      const fallbackSeason = getLatestLeagueSeason(remainingSeasons, leagueId);
      const nextActiveSeasonIds = { ...currentSeasonData.activeSeasonIds };

      if (nextActiveSeasonIds[leagueId] === seasonId) {
        if (fallbackSeason) {
          nextActiveSeasonIds[leagueId] = fallbackSeason.id;
        } else {
          delete nextActiveSeasonIds[leagueId];
        }
      }

      const nextSeasonData = {
        seasons: remainingSeasons,
        playerProfiles: currentSeasonData.playerProfiles,
        seasonPlayers: currentSeasonData.seasonPlayers.filter(
          (seasonPlayer) => seasonPlayer.seasonId !== seasonId,
        ),
        activeSeasonIds: nextActiveSeasonIds,
      };

      persistSeasonData(nextSeasonData);

      return nextSeasonData;
    });

    setSeasonSettings((currentSettings) => {
      const nextSettings = currentSettings.filter(
        (settings) => settings.seasonId !== seasonId,
      );

      window.localStorage.setItem(storageKey, JSON.stringify(nextSettings));

      return nextSettings;
    });
  }

  function createInitialSeasonForLeague({
    leagueId,
    seasonName,
    playerNames,
    roundWindowMode,
    seasonStartsAt,
    roundWindowDays,
    requiresThreeSets,
    registrationFeeEnabled = false,
    registrationFeeAmount = 0,
    registrationFeePurpose = "",
    mvpMode = "automatic",
  }: {
    leagueId: string;
    seasonName: string;
    playerNames: string[];
    roundWindowMode: RoundWindowMode;
    seasonStartsAt: string | null;
    roundWindowDays: number | null;
    requiresThreeSets: boolean;
    registrationFeeEnabled?: boolean;
    registrationFeeAmount?: number;
    registrationFeePurpose?: string;
    mvpMode?: SeasonMvpMode;
  }) {
    const seasonId = `${leagueId}-season-${Date.now()}`;
    const cleanPlayerNames = playerNames
      .map((playerName) => playerName.trim())
      .filter(Boolean);
    const newSeason: Season = {
      id: seasonId,
      leagueId,
      name: seasonName,
      status: "upcoming",
      totalRounds: Math.max(cleanPlayerNames.length - 1, 1),
      completedRounds: 0,
    };
    const existingPlayerIds = new Set(
      seasonData.playerProfiles.map((player) => player.id),
    );
    const existingSlugs = new Set(
      seasonData.playerProfiles.map((player) => player.slug),
    );
    const newPlayers = cleanPlayerNames.map((playerName, index) => {
      const baseId = `${leagueId}-player-${index + 1}`;
      const baseSlug = slugifyName(playerName);
      let id = baseId;
      let slug = baseSlug;
      let suffix = 2;

      while (existingPlayerIds.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }

      suffix = 2;
      while (existingSlugs.has(slug)) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
      }

      existingPlayerIds.add(id);
      existingSlugs.add(slug);

      return {
        id,
        leagueId,
        slug,
        displayName: playerName,
        avatarInitials: getInitials(playerName),
      };
    });
    const playerIds = newPlayers.map((player) => player.id);

    setSeasonData((currentSeasonData) => {
      const nextSeasonData = {
        seasons: [...currentSeasonData.seasons, newSeason],
        playerProfiles: [...currentSeasonData.playerProfiles, ...newPlayers],
        seasonPlayers: [
          ...currentSeasonData.seasonPlayers,
          ...newPlayers.map((player) => ({
            seasonId,
            playerId: player.id,
          })),
        ],
        activeSeasonIds: {
          ...currentSeasonData.activeSeasonIds,
          [leagueId]: seasonId,
        },
      };

      persistSeasonData(nextSeasonData);

      return nextSeasonData;
    });

    updateSeasonRoundSettings({
      leagueId,
      seasonId,
      roundWindowMode,
      seasonStartsAt,
      roundWindowDays,
      requiresThreeSets,
      manualActiveRound: null,
      manualCompletedRounds: [],
      registrationFee: buildSeasonRegistrationFee({
        enabled: registrationFeeEnabled,
        amount: registrationFeeAmount,
        purpose: registrationFeePurpose,
        playerIds,
      }),
      mvpMode,
    });

    return { seasonId, playerIds };
  }

  function startNewSeason({
    leagueId,
    name,
    playerIds,
    newPlayerNames,
    roundWindowMode,
    seasonStartsAt,
    roundWindowDays,
    requiresThreeSets,
    scheduleMode = "single",
    registrationFeeEnabled = false,
    registrationFeeAmount = 0,
    registrationFeePurpose = "",
    mvpMode = "automatic",
  }: {
    leagueId: string;
    name: string;
    playerIds: string[];
    newPlayerNames: string[];
    roundWindowMode: RoundWindowMode;
    seasonStartsAt: string | null;
    roundWindowDays: number | null;
    requiresThreeSets: boolean;
    scheduleMode?: SeasonScheduleMode;
    registrationFeeEnabled?: boolean;
    registrationFeeAmount?: number;
    registrationFeePurpose?: string;
    mvpMode?: SeasonMvpMode;
  }) {
    const seasonId = `${leagueId}-season-${Date.now()}`;
    const uniquePlayerIds = Array.from(new Set(playerIds));
    const cleanNewPlayerNames = newPlayerNames
      .map((playerName) => playerName.trim())
      .filter(Boolean);
    const totalPlayers = uniquePlayerIds.length + cleanNewPlayerNames.length;
    const newSeason: Season = {
      id: seasonId,
      leagueId,
      name,
      status: "upcoming",
      totalRounds: getSeasonScheduleRoundCount({
        playerCount: totalPlayers,
        mode: scheduleMode,
      }),
      completedRounds: 0,
    };
    const existingPlayerIds = new Set(
      seasonData.playerProfiles.map((player) => player.id),
    );
    const existingSlugs = new Set(
      seasonData.playerProfiles.map((player) => player.slug),
    );
    const newPlayers = cleanNewPlayerNames.map((playerName, index) => {
      const baseId = `${seasonId}-player-${index + 1}`;
      const baseSlug = slugifyName(playerName);
      let id = baseId;
      let slug = baseSlug;
      let suffix = 2;

      while (existingPlayerIds.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }

      suffix = 2;
      while (existingSlugs.has(slug)) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
      }

      existingPlayerIds.add(id);
      existingSlugs.add(slug);

      return {
        id,
        leagueId,
        slug,
        displayName: playerName,
        avatarInitials: getInitials(playerName),
      };
    });
    const newPlayerIds = newPlayers.map((player) => player.id);
    const finalPlayerIds = [...uniquePlayerIds, ...newPlayerIds];

    setSeasonData((currentSeasonData) => {
      const nextSeasonData = {
        seasons: [...currentSeasonData.seasons, newSeason],
        playerProfiles: [...currentSeasonData.playerProfiles, ...newPlayers],
        seasonPlayers: [
          ...currentSeasonData.seasonPlayers,
          ...finalPlayerIds.map((playerId) => ({
            seasonId,
            playerId,
          })),
        ],
        activeSeasonIds: {
          ...currentSeasonData.activeSeasonIds,
          [leagueId]: seasonId,
        },
      };

      persistSeasonData(nextSeasonData);

      return nextSeasonData;
    });

    updateSeasonRoundSettings({
      leagueId,
      seasonId,
      roundWindowMode,
      seasonStartsAt,
      roundWindowDays,
      requiresThreeSets,
      manualActiveRound: null,
      manualCompletedRounds: [],
      registrationFee: buildSeasonRegistrationFee({
        enabled: registrationFeeEnabled,
        amount: registrationFeeAmount,
        purpose: registrationFeePurpose,
        playerIds: finalPlayerIds,
      }),
      mvpMode,
    });

    return { season: newSeason, playerIds: finalPlayerIds, newPlayerIds };
  }

  function updateSeasonRoundSettings(settings: SeasonRoundSettings) {
    setSeasonSettings((currentSettings) => {
      const exists = currentSettings.some(
        (item) => item.seasonId === settings.seasonId,
      );

      const nextSettings = exists
        ? currentSettings.map((item) =>
            item.seasonId === settings.seasonId ? settings : item,
          )
        : [...currentSettings, settings];

      window.localStorage.setItem(storageKey, JSON.stringify(nextSettings));

      return nextSettings;
    });
  }

  const updatePlayerProfile = useCallback(
    ({
      playerId,
      displayName,
      avatarInitials,
      avatarUrl,
      userId,
    }: {
      playerId: string;
      displayName: string;
      avatarInitials: string;
      avatarUrl?: string | null;
      userId?: string | null;
    }) => {
      setSeasonData((currentSeasonData) => {
        const targetPlayer = currentSeasonData.playerProfiles.find(
          (player) => player.id === playerId,
        );
        const linkedUserId = userId ?? targetPlayer?.userId ?? null;
        const nextSeasonData = {
          ...currentSeasonData,
          playerProfiles: currentSeasonData.playerProfiles.map((player) => {
            const isDirectTarget = player.id === playerId;
            const isSameLinkedUser = Boolean(
              linkedUserId && player.userId === linkedUserId,
            );

            if (!isDirectTarget && !isSameLinkedUser) {
              return player;
            }

            return {
              ...player,
              displayName: isDirectTarget ? displayName : player.displayName,
              avatarInitials: isDirectTarget ? avatarInitials : player.avatarInitials,
              avatarUrl:
                typeof avatarUrl === "undefined"
                  ? (player.avatarUrl ?? null)
                  : avatarUrl,
              userId: linkedUserId ?? player.userId,
            };
          }),
        };

        persistSeasonData(nextSeasonData);

        return nextSeasonData;
      });
    },
    [],
  );

  const hydrateSeasonSnapshot = useCallback((snapshot: SeasonSnapshot) => {
    setSeasonData((currentSeasonData) => {
      const nextSeasonData = {
        seasons: mergeById(currentSeasonData.seasons, snapshot.seasons),
        playerProfiles: mergeById(
          currentSeasonData.playerProfiles,
          snapshot.playerProfiles,
        ),
        seasonPlayers: mergeSeasonPlayers(
          currentSeasonData.seasonPlayers,
          snapshot.seasonPlayers,
        ),
        activeSeasonIds: Object.fromEntries(
          Object.entries({
            ...currentSeasonData.activeSeasonIds,
            ...snapshot.activeSeasonIds,
          }).filter(([, seasonId]) => Boolean(seasonId)),
        ),
      };

      persistSeasonData(nextSeasonData);

      return nextSeasonData;
    });

    setSeasonSettings((currentSettings) => {
      const nextSettings = mergeSettings(
        currentSettings,
        snapshot.seasonSettings,
      );

      window.localStorage.setItem(storageKey, JSON.stringify(nextSettings));

      return nextSettings;
    });
  }, []);

  const value = {
    seasons: seasonData.seasons,
    playerProfiles: seasonData.playerProfiles,
    seasonPlayers: seasonData.seasonPlayers,
    seasonSettings,
    getActiveSeasonByLeagueId,
    getSeasonPlayers,
    getSeasonRoundSettings,
    updateSeasonRoundSettings,
    updatePlayerProfile,
    hydrateSeasonSnapshot,
    finishActiveSeason,
    finishSeason,
    startSeason,
    deleteSeason,
    createInitialSeasonForLeague,
    startNewSeason,
  };

  return (
    <SeasonSettingsContext.Provider value={value}>
      {children}
    </SeasonSettingsContext.Provider>
  );
}

export function useSeasonSettings() {
  const context = useContext(SeasonSettingsContext);

  if (!context) {
    throw new Error(
      "useSeasonSettings must be used inside SeasonSettingsProvider",
    );
  }

  return context;
}
