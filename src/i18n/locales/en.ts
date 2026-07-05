export const en = {
  common: {
    appName: "Smash & Lob",
    season: "Season",
    privateLeague: "Private padel league",
    individualRanking: "Individual ranking",
    pointsShort: "pts",
    back: "Back",
    backToMatches: "← Back to matches",
    versus: "vs",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    retry: "Check again",
    active: "Selected",
  },

  auth: {
    subtitle: "Private league",
    title: "Smash & Lob",
    closedSeasonHistoricalDescription:
      "This ranking remains as the history for {seasonName}.",
    description:
      "Sign in with Google to access your leagues, matches and results.",
    signInWithGoogle: "Sign in with Google",
    signOut: "Sign out",
    loadingTitle: "Checking session",
    loadingDescription: "Preparing your access.",
    pendingTitle: "User pending invitation",
    pendingDescription:
      "Your Google account is not linked to a player in this league yet. Ask the admin to add your email.",
  },

  onboarding: {
    title: "Choose how to start",
    description:
      "Your Google account is ready. Now create a league or join an existing invitation.",
    createTitle: "Create new league",
    createDescription:
      "Create a new league with its first season and initial players.",
    createAction: "Create league",
    joinTitle: "Join existing league",
    joinDescription: "Enter the code shared by the league admin.",
    joinAction: "Validate invitation",
  },

  invites: {
    subtitle: "Private invitation",
    title: "Join a league",
    description: "Confirm the league and claim the player that belongs to you.",
    loadingDescription:
      "Checking invitation and loading the league from the database.",
    checkingCode: "Checking code",
    checkingCodeDescription:
      "Looking for the league linked to this invitation.",
    codeLabel: "Invitation code",
    codePlaceholder: "SL-8KQ4-P7M2-X9RA",
    invalidCode: "Invalid code.",
    leagueNotFound: "League not found.",
    notFoundTitle: "Invitation not found",
    notFoundDescription: "Check the link or ask the admin for a new code.",
    foundLeague: "League found",
    closedMode: "Closed mode: players are predefined by the admin.",
    openMode: "Open mode prepared for later.",
    activeSeasonTitle: "Active season",
    activeSeasonDescription:
      "Only players in the active season can be claimed.",
    noActiveSeasonTitle: "No active season",
    noActiveSeasonDescription:
      "The league is waiting for the admin to create a new season.",
    claimTitle: "Claim your player",
    claimDescription:
      "Choose who you are in this league. You can only claim one player per league.",
    claimActiveDescription:
      "These are the unlinked players in the active season.",
    claimableActivePlayers: "Pending players in the active season",
    selectedPlayer: "Selected player",
    inactivePlayersHidden:
      "Players from previous seasons are hidden here to avoid wrong claims.",
    selectPlayerError: "Select a player to continue.",
    playerAlreadyClaimed: "Player already claimed.",
    alreadyInLeague: "You already belong to this league.",
    alreadyInLeagueDescription:
      "Your account already has a linked player in this league.",
    noPlayersAvailable: "There are no unclaimed players left in this season.",
    confirmClaim: "Confirm and enter",
    claiming: "Saving...",
    enterLeague: "Enter league",
    accessDenied: "You do not have permission to view this league.",
    warningTitle: "Invitation notice",
    timeoutError:
      "Checking the code took too long. Check your connection and try again.",
    genericError:
      "The invitation could not be checked. Try again or ask the admin for a new link.",
  },

  appHeader: {
    leagueSelectorLabel: "Select league",
    settingsLabel: "Settings",
  },

  courtBooking: {
    expand: "View booking",
    collapse: "Hide booking",
    pendingPaymentSingular: "pending payment",
    pendingPaymentPlural: "pending payments",
  },

  nav: {
    home: "Home",
    ranking: "Ranking",
    matches: "Calendar",
    activity: "Activity",
    player: "Player",
    profile: "Profile",
  },

  dashboard: {
    winner: "Winner",
    seasonWinner: "Winner of {seasonName}",
    finalChampion: "Final league champion",
    leader: "Leader",
    rounds: "Rounds",
    regularLeague: "Regular season",
    rankingTitle: "Standings",
    viewAll: "View all",
    lastMatch: "Last match",
    nextMatch: "Next match",
    addSchedule: "Add date, time and place",
    playersCanSchedule:
      "The players involved in the match can complete the schedule.",
    closedSeasonTitle: "Season closed",
    closedSeasonHistoricalDescription:
      "You are viewing the history for {seasonName}. The league is pending a new active season.",
    closedSeasonDescription:
      "The league has no active season right now. You can view the history until a new one is created.",
    createSeason: "Create new season",
  },

  ranking: {
    subtitle: "Overall standings",
    description:
      "Sorted by PTS, game difference and games for as a tiebreaker.",
    gamesDiff: "Game diff.",
    gamesFor: "Games for",
    gamesAgainst: "Games against",
    diff: "Diff.",
    forShort: "GF",
    againstShort: "GA",
  },

  rounds: {
    officialWindow: "Official round window",
    from: "From",
    to: "to",
    noSpecificWindow: "No specific window for this round",
    statusNoWindow: "No window",
    statusUpcoming: "Upcoming",
    statusActive: "In progress",
    statusOverdue: "Overdue",
    statusCompleted: "Completed",
    outsideWindowTitle: "Outside the round window",
    outsideWindowDescription:
      "The selected date is outside the configured window for this round. It can be saved, but it will be marked for review.",
    postponedWindowWarning:
      "Postponed: the expected dates for this round will not be met.",
    postponedWindowTitle: "Round dates not met",
    postponedWindowDescription:
      "This match is postponed, so the round remains pending outside its expected dates until it is rescheduled.",
  },

  matches: {
    subtitle: "League calendar",
    description:
      "Fixed rounds created by the admin. Players schedule date, time and place.",
    round: "Round",
    finished: "Finished",
    scheduled: "Scheduled",
    unscheduled: "Unscheduled",
    postponed: "Postponed",
    inProgress: "In play",
    resultPending: "Result pending",
    played: "Played",
    pendingPlay: "Pending play",
    pendingDate: "Date pending",
    pendingReschedule: "New date pending",
    missingSchedule: "Missing date, time and place",
    needsReschedule: "This match needs to be rescheduled",
    closedSeasonHistoricalDescription:
      "These are the historical matches for {seasonName}.",
    scopeAll: "All",
    scopeMineShort: "Mine",
    noMatches: "There are no matches in this season.",
  },

  matchDetail: {
    title: "Match",
    notFound: "Match not found",
    teamA: "Team A",
    teamB: "Team B",
    set: "Set",
    schedule: "Schedule",
    scheduleDescription: "Agreed date, time and place for this match.",
    addScheduleTitle: "Add schedule",
    addScheduleDescription: "Select the match date, time and place.",
    postponedTitle: "Match postponed",
    postponedDescription: "This match is still pending and needs a new date.",
    noScheduleDescription: "The match is waiting for a new date and place.",
    pendingSchedule: "Date, time and place pending",
    pendingScheduleDescription:
      "The players involved in the match must complete these details once agreed.",
    addScheduleButton: "Add schedule",
    gamesA: "Games A",
    gamesB: "Games B",
    pointsA: "Points A",
    pointsB: "Points B",
    editSchedule: "Edit schedule",
    editScheduleButton: "Edit",
    postponeButton: "Postpone match",
    clearScheduleButton: "Clear schedule",
    clearScheduleConfirm:
      "Are you sure you want to clear the schedule? The match will go back to having no date, time or place.",
    clearScheduleError:
      "The schedule could not be cleared. Check Supabase or the smash-lob-last-supabase-error value.",
    clearingSchedule: "Clearing...",
    rescheduleButton: "Reschedule",
    scheduleFormDescription: "Add or edit the match date, time and place.",
    scheduleDateLabel: "Date and time",
    scheduleLocation: "Place",
    scheduleLocationPlaceholder: "Select a place",
    scheduleCourt: "Court",
    scheduleCourtPlaceholder: "Select court",
    otherLocation: "Other",
    customLocation: "Maps location",
    customLocationPlaceholder:
      "Example: Lasesarre Sports Centre, Barakaldo or Maps URL",
    directionsButton: "How to get there",
    schedulePlaceholderDate: "Example: Friday, 20:00",
    schedulePlaceholderLocation: "Example: North Padel Club",
    saveSchedule: "Save schedule",
    saveScheduleChanges: "Save changes",
    cancelScheduleEdit: "Cancel",
    calendarFutureDescription:
      "Later we will add a button to add this match to the calendar.",
  },

  matchResult: {
    title: "Record result",
    description:
      "Enter the three sets of the match. The app will calculate each team's points automatically.",
    optionalSetsDescription:
      "Enter the played sets. Empty sets will be ignored on save.",
    editTitle: "Edit result",
    editDescription:
      "Correct the match sets. The ranking will be recalculated automatically after saving.",
    registeredTitle: "Result recorded",
    registeredDescription:
      "The match is finished. You can edit the result if it was entered incorrectly.",
    editButton: "Edit result",
    set: "Set",
    teamA: "Team A",
    teamB: "Team B",
    invalidSet: "Invalid set. Use scores like 6-0, 6-4, 7-5 or 7-6.",
    save: "Save result",
    update: "Save changes",
    cancelEdit: "Cancel",
    pendingScheduleTitle: "Result pending",
    pendingScheduleDescription:
      "Schedule the match before recording the result.",
    postponedTitle: "Result blocked",
    postponedDescription:
      "Reschedule the postponed match before recording the result.",
  },

  profile: {
    title: "My profile",
    subtitle: "Current user",
    description: "Your player stats within the active season.",
    notFound: "No player linked to the current user was found.",
    points: "Points",
    seasonSummary: "Season summary",
    matchesPlayed: "Matches",
    wins: "Wins",
    losses: "Losses",
    myMatches: "My matches",
    nextMatch: "Next match",
    recentResults: "Latest results",
    noUpcomingMatches: "You have no pending matches right now.",
    noRecentResults: "You do not have recorded results yet.",
    matchHistoryTitle: "Match history",
    matchHistoryDescription:
      "Review all your season matches and filter by status.",
    matchHistoryPageDescription:
      "All your matches in the active season, with quick status filters.",
    filteredMatches: "Matches",
    noFilteredMatches: "There are no matches with this filter.",
    filterLabel: "Show",
    filterAll: "All",
    filterFinished: "Played",
    filterPending: "Pending",
    filterScheduled: "Scheduled",
    filterUnscheduled: "Unscheduled",
    filterPostponed: "Postponed",
    placeholderTitle: "Profile pending connection",
    placeholderDescription:
      "For now we will use a fake player as the current user. Later it will be connected to the real login.",
  },

  playerProfile: {
    backToRanking: "← Back to ranking",
    notFound: "Player not found",
    description: "Public stats for the player within the selected season.",
    scopeSelectorTitle: "Season",
    scopeSelectorDescription:
      "Choose one season or view the player historical total.",
    seasonStats: "Season stats",
    playerMatches: "Player matches",
    matchHistoryDescription:
      "View all their matches for the season and filter by status.",
    matchHistoryPageDescription:
      "All their matches from the selected season, with quick status filters.",
    futureTitle: "History and trends",
    futureDescription:
      "Later this will show best partners, most frequent rivals and ranking evolution.",
  },

  playerStats: {
    title: "Advanced stats",
    subtitle: "Season performance",
    winRate: "Wins",
    record: "record",
    setsBalance: "Sets balance",
    gamesBalance: "Games balance",
    mvpWon: "MVPs won",
    wonPercentage: "won",
    forPercentage: "for",
    bestPartner: "Best partner",
    toughestRival: "Toughest rival",
    bestRound: "Best round",
    roundShort: "R",
    toughestRound: "Toughest round",
    showDetails: "Show",
    hideDetails: "Hide",
  },

  help: {
    title: "Help and basics",
    description: "A quick guide for new league players.",
    starPointsTitle: "Star Points",
    starPointsDescription:
      "A Star Point is the deciding point played when a game reaches 40-40. Instead of using advantages, one single point is played: whoever wins it wins the game.",
    starPointsTip:
      "Before the serve, the receiving pair chooses the side. Then the point is played normally and the game is recorded as usual.",
    tieBreakTitle: "Tie-breaks",
    tieBreakDescription:
      "A tie-break is played when a set reaches 6-6. The first side to 7 points wins, as long as they lead by at least 2 points. At 6-6 in the tie-break, play continues until one side has a two-point lead.",
    tieBreakTip:
      "The set result is recorded as 7-6 for the pair that wins the tie-break. The app does not need the detailed tie-break points.",
    threeSetsTitle: "Why all 3 sets are mandatory",
    threeSetsDescription:
      "This league plays all 3 sets so every match gives the same amount of sets and opportunities. It makes the individual ranking fairer: a pair can lose the match but still fight for the third set, score points, improve game difference and keep the match meaningful until the end.",
    threeSetsBalance:
      "This format reduces the impact of one bad set, rewards consistency and makes every round comparable because all players compete for the same volume of sets and games.",
    futureTitle: "Later",
    futureDescription:
      "This section can be expanded with more rules, FAQs and concepts for new players.",
  },

  leagues: {
    activeLeague: "Active league",
  },

  settings: {
    title: "Settings",
    description: "Manage your app preferences.",
    helpTitle: "Help and basics",
    helpDescription: "Review Star Points, tie-breaks and the 3-set format.",
    backToProfile: "← Back to profile",
    profileShortcutDescription:
      "Change the active league, language and app preferences.",
    leagueTitle: "League",
    createNewLeague: "Create new league",
    adminPanelTitle: "Admin panel",
    adminPanelDescription:
      "Manage the active league, season, places and future admin tools.",
    adminLeagueTitle: "Manage league",
    adminLeagueDescription: "Configure the usual places for the active league.",
    adminSeasonTitle: "Manage season",
    adminSeasonDescription:
      "Configure round windows, dates and basic rules for the active season.",
    languageTitle: "Language",
    language: "Language",
    languageDescription: "Change the app language.",
    accountTitle: "Account and invitations",
    accountDescription: "Manage your session, image and access to new leagues.",
    accountSettingsTitle: "Account settings",
    accountSettingsDescription:
      "Customize the image shown in your profile for this league.",
    connectedEmail: "Connected email",
    joinNewExistingLeague: "Join another existing league",
    avatarCustomActive: "Custom image active.",
    avatarGoogleFallback: "Your Google image is used by default.",
    avatarInitialsFallback:
      "Your initials are used if you do not upload an image.",
    uploadAvatar: "Upload image",
    removeAvatar: "Remove image",
    avatarSaved: "Image saved.",
    avatarSaveError:
      "The image could not be saved. Check Supabase or smash-lob-last-supabase-error.",
    avatarProcessError: "The image could not be processed.",
    futureTitle: "Coming soon",
    futureDescription:
      "Here we will add light/dark mode, account management, seasons, leagues, invitations and sign out.",
  },

  adminPanel: {
    backToSettings: "← Back to settings",
    backToAdmin: "← Back to admin panel",
    title: "Admin panel",
    description:
      "Centralized management for the active league and its settings.",
    leagueTitle: "Manage league",
    leagueDescription: "Configure league details and usual places.",
    seasonTitle: "Manage season",
    seasonDescription:
      "Configure rounds, windows and basic rules for the active season.",
    inviteTitle: "Invite players",
    inviteDescription:
      "Share this code or link with the Google account you want to invite.",
    inviteCodeLabel: "Code",
    inviteLinkLabel: "Link",
    copyCode: "Copy code",
    copyLink: "Copy link",
    inviteCopied: "Copied",
    inviteHelper:
      "When joining {leagueName}, the invited person signs in with Google and claims one of the unlinked players.",
    regenerateInviteCode: "Regenerate code",
    regenerateInviteCodeDescription:
      "The previous code will stop working for new invitations.",
    futureTitle: "Upcoming tools",
    futureDescription:
      "Players, invitations, rules, round generation, notifications and audit will be grouped here.",
    accessDeniedTitle: "No admin permissions",
    accessDeniedCardTitle: "You cannot access this panel",
    accessDeniedDescription:
      "Only league creators and admins can manage this section.",
  },

  adminLeague: {
    backToSettings: "← Back to settings",
    title: "Manage league",
    description: "Configure the active league basic details.",
    locationsTitle: "Usual places",
    locationsDescription:
      "Configure places with town, Maps location and court count to schedule matches, open navigation and save the location in calendar.",
    emptyLocations:
      "No usual places configured. When scheduling matches, the Other option can be used.",
    addLocationTitle: "Add place",
    locationName: "Short name",
    locationPlaceholder: "Example: Lasesarre",
    town: "Town",
    townPlaceholder: "Example: Barakaldo",
    googleLocation: "Maps location",
    googleLocationPlaceholder:
      "Example: Lasesarre Sports Centre, Barakaldo or Maps URL",
    courts: "Courts",
    courtsPlaceholder: "Example: 4",
    duplicatedLocation: "That place is already in the list.",
    addLocation: "Add place",
    editLocation: "Edit",
    saveLocation: "Save place",
    cancelLocationEdit: "Cancel",
    removeLocation: "Remove",
    openMaps: "How to get there",
    searchMaps: "Test in Maps",
    googleApiMissing:
      "Type a location or paste a Maps URL. The app will open Maps with that reference.",
    save: "Save changes",
    saved: "Settings saved.",
  },

  adminSeason: {
    backToSettings: "← Back to settings",
    title: "Manage season",
    description:
      "Configure dates and windows that may change during the active season.",
    finishedDescription:
      "The current season is finished. Define what is needed to start a new one.",
    roundWindowTitle: "Round window",
    roundWindowDescription:
      "Define whether each round has an official play window.",
    newRoundWindowDescription:
      "This setting can be changed during the season if needed.",
    noWindowTitle: "No specific window",
    noWindowDescription:
      "Rounds will not have an automatically calculated deadline.",
    fixedDaysTitle: "Fixed window per round",
    fixedDaysDescription:
      "Each round will have the same number of days to be played.",
    fixedDaysSettings: "Fixed window settings",
    seasonStartDate: "Round 1 start date",
    daysPerRound: "Days per round",
    resultRulesTitle: "Result rules",
    resultRulesDescription: "Define how player-entered results are validated.",
    requireThreeSetsTitle: "Require three played sets",
    requireThreeSetsDescription:
      "When active, the form requires three valid sets. Otherwise, only played sets can be saved.",
    activePlayersTitle: "Season players",
    activePlayersDescription:
      "Read-only list to check which players have already linked their Google account.",
    playerLinked: "Linked",
    playerPending: "Pending",
    lifecycleTitle: "Season lifecycle",
    lifecycleDescription:
      "Finish the current season or open a new one with its own players.",
    currentSeason: "Current season",
    statusActive: "Active",
    statusFinished: "Finished",
    finishTitle: "Close active season",
    finishDescription:
      "When closed, the season will remain as history and you will return to the league summary. A new season will not be created automatically.",
    finishConfirmMessage:
      "Are you sure you want to close this season? A new season will not be created automatically and the league will remain pending a new season.",
    finishSeason: "Finish season",
    newSeasonTitle: "Create new season",
    newSeasonDescription:
      "Each season keeps its own players, calendar and rules inside the same league.",
    newSeasonName: "Season name",
    newSeasonNamePlaceholder: "Example: Season 3",
    newSeasonRounds: "Rounds",
    playerCount: "Number of players",
    newPlayerName: "New player",
    seasonPlayersTitle: "Players in this season",
    seasonPlayersDescription:
      "Choose league players and fill gaps with new names pending link.",
    calendarTitle: "Calendar",
    calendarDescription:
      "Choose the season length and how rounds will be generated.",
    seasonLengthTitle: "Length",
    seasonLengthDescription:
      "Choose a normal single round, an exact second round, or a remixed long season.",
    roundsShortLabel: "rounds",
    singleRoundCalendar: "Single round",
    singleRoundCalendarDescription:
      "Current format: with 8 players it generates 7 rounds.",
    doubleRoundCalendar: "Double round",
    doubleRoundCalendarDescription:
      "Repeats the calendar once: with 8 players it generates 14 rounds.",
    extendedCalendar: "Long season",
    extendedCalendarDescription:
      "Adds a remixed second round, keeping pairs but changing opponents when possible.",
    balancedCalendar: "Balanced calendar",
    balancedCalendarDescription:
      "All players will have a balanced match distribution. We will configure the details in the next step.",
    manualCalendar: "Manual calendar",
    manualCalendarDescription:
      "Configure rounds and pairings manually before creating the season.",
    calendarModeLabel: "Calendar type",
    manualCalendarSingleHelp:
      "Choose Pair A and Pair B manually for every round.",
    manualCalendarDoubleHelp:
      "Edit the first round block manually; the second block will repeat that calendar exactly.",
    manualCalendarLongHelp:
      "Configure every round of the long season manually.",
    manualCalendarBlocked:
      "Complete every manual calendar dropdown to continue.",
    startSeason: "Start season",
    seasonFinished: "Season finished.",
    seasonStarted: "New season created.",
    inviteTitle: "Invitation link",
    inviteDescription:
      "Copy this link to send it to new players or substitutes in {leagueName}.",
    copyInviteLink: "Copy invitation link",
    inviteCopied: "Link copied",
    inviteCopyError: "The link could not be copied.",
    save: "Save settings",
    saved: "Settings saved.",
  },

  newLeague: {
    title: "Create new league",
    description:
      "Define the group, its first season and initial rules. Then you can invite players to the league.",
    leagueTitle: "League details",
    leagueName: "League name",
    leagueNamePlaceholder: "Example: Thursday league",
    leagueDescription: "Description",
    leagueDescriptionPlaceholder:
      "Example: Private padel league among friends.",
    defaultDescription: "Private padel league.",
    locationsTitle: "Usual places",
    locationsDescription:
      "You can prepare the usual courts from the beginning. They will appear when scheduling matches and will be saved in the calendar.",
    seasonTitle: "First season",
    seasonDescription:
      "Rules and participants belong to this season, not the whole league.",
    seasonName: "Season name",
    playerCount: "Number of players",
    playersTitle: "Initial players",
    playersDescription:
      "The first player will be linked to your account as creator. The rest can claim their player with the league invitation.",
    playerName: "Player",
    rulesTitle: "Game rules",
    rulesDescription:
      "These settings belong to the first season and can be changed in future seasons.",
    create: "Create league",
    createError: "The league could not be created with the current user.",
  },

  activity: {
    title: "Activity",
    description: "Important changes in the league and your matches.",
    general: "General",
    personal: "Personal",
    personalTitle: "Personal activity",
    wallTitle: "Activity wall",
    refresh: "Refresh",
    loading: "Loading activity...",
    loadErrorTitle: "Could not load",
    loadErrorDescription:
      "Activity could not be loaded. Check Supabase or try again.",
    emptyGeneralTitle: "No activity yet",
    emptyGeneralDescription:
      "When someone schedules a match, records or edits a result, postpones a round or updates a booking, it will appear here.",
    emptyPersonalTitle: "You have no activity yet",
    emptyPersonalDescription:
      "Changes related to your matches, bookings and payments will appear here.",
    lastErrorTitle: "Last error while recording activity",
    actorFallback: "User",
    round: "Round",
    noGames: "no games recorded",
    sets: "Sets",
    games: "Games",
    admin: "Admin",
    adminTitle: "Full audit",
    adminDescription:
      "Complete admin view with every event and its internal data.",
    adminMetadata: "Internal data",
    adminEventType: "Event type",
    notificationSettingsTitle: "Activity alerts",
    notificationSettingsDescription:
      "Choose which events stay only in the wall, which count as personal, and which should generate an alert once notifications are enabled.",
    notificationFutureHint:
      "For now this organizes Activity, decides what enters Personal, and classifies each event for future push notifications.",
    notificationSettingsCollapsedHint:
      "The panel stays collapsed so the audit trail remains visible. Open it only when you want to change alerts.",
    showNotificationSettings: "Configure",
    hideNotificationSettings: "Collapse",
    modeActivityOnly: "General activity only",
    modePersonal: "Personal activity when it affects the player",
    modeNotify: "Notify later",
    modeActivityOnlyShort: "General",
    modePersonalShort: "Personal",
    modeNotifyShort: "Alert",
    pushPreparationTitle: "Push base ready",
    pushPreparationDescription:
      "Events marked as notifiable do not send push yet, but they are already separated so alerts can be generated when we add the notification service.",
    pushReady: "Push",
    personalScopeLabel: "Personal scope",
    categoryLabels: {
      match: "Matches",
      court: "Booking and payments",
      season: "Seasons",
      league: "League",
      player: "Players and users",
    },
    personalScopeLabels: {
      match_participants: "Match players",
      target_player: "Affected player",
      league_wide: "Whole league",
      admin_only: "Admin management only",
    },
    saveNotificationSettings: "Save alert settings",
    settingsSaved: "Alert settings saved.",
    settingsLoadError:
      "Alert settings could not be loaded. Run the activity_settings SQL or check Supabase.",
    settingsSaveError:
      "Alert settings could not be saved. Check Supabase or permissions.",
    labels: {
      match_scheduled: "Schedule",
      match_schedule_updated: "Schedule",
      match_postponed: "Postponement",
      match_result_saved: "Result",
      match_result_updated: "Result",
      match_result_cleared: "Result",
      match_result_missing_reminder: "Result",
      round_in_play: "Round",
      round_mvp_awarded: "MVP",
      court_booking_updated: "Booking",
      court_booking_cleared: "Booking",
      court_booking_payment_paid: "Payment",
      court_booking_payment_reminder: "Reminder",
      league_created: "League",
      league_updated: "League",
      league_logo_updated: "League",
      league_locations_updated: "League",
      league_invite_regenerated: "Invitation",
      season_finished: "Season",
      season_started: 'Season',
      season_created: "Season",
      player_name_updated: "Player",
      player_avatar_updated: "Player",
      player_role_updated: "User",
      player_unlinked: "User",
      user_updated: "User",
    },
  },

  language: {
    current: "English",
    switchToSpanish: "ES",
    switchToEnglish: "EN",
    switchToBasque: "EU",
  },
} as const;
