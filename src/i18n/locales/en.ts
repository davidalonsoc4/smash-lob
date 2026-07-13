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
    finishedSeasonBadge: "Finished",
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
    finishedSeasonTitle: "Finished season",
    finishedSeasonDescription:
      "The season is closed, but you can still link your account to one of its unclaimed players.",
    noActiveSeasonTitle: "No active season",
    noActiveSeasonDescription:
      "The league is waiting for the admin to create a new season.",
    claimTitle: "Claim your player",
    claimDescription:
      "Choose who you are in this league. You can only claim one player per league.",
    claimActiveDescription:
      "These are the unlinked players in the active season.",
    claimFinishedDescription:
      "These are the players from the finished season who still do not have a linked account.",
    claimableActivePlayers: "Pending players in the active season",
    claimableFinishedPlayers: "Pending players in the finished season",
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
    acceptRulesError:
      "You must confirm the rules before linking your account to the season.",
    stepsCode: "Code",
    stepsRules: "Rules",
    stepsPlayer: "Player",
    rulesEyebrow: "League rules",
    rulesTitle: "Confirm the rules before claiming a player",
    rulesDescription:
      "Your account will not be linked to any player until you accept this summary of rules and commitments.",
    acceptRulesLabel: "I have read and accept the season rules.",
    acceptRulesBeforeSelect: "Confirm the rules first to select your player.",
    rules: {
      registrationTitle: "Registration before the start",
      registrationFallbackAmount: "the fee defined by the organization",
      registrationAmountPrefix: "You must pay",
      registrationAmountSuffix:
        "before this season starts. The app lets the organization mark the payment as completed.",
      registrationNoAmount:
        "If the organization enables a registration fee, you must pay it before this season starts.",
      registrationPurposePrefix: "Purpose:",
      individualTitle: "Individual league, doubles matches",
      individualDescription:
        "You claim your player and earn your own points, even though every match is played in pairs.",
      calendarTitle: "Balanced calendar",
      calendarDescription:
        "The season aims for everyone to play with and against everyone while respecting the round order.",
      scoringTitle: "Set scoring",
      scoringThreeSets:
        "Three sets are mandatory: a 3-0 gives 3 points, and a 2-1 gives 2 points to the winning pair and 1 to the losing pair.",
      scoringOptionalSets:
        "Each set won is worth 1 point. If 3 sets are not required, only played and saved sets count.",
      commitmentTitle: "Commitment and good faith",
      commitmentDescription:
        "Matches are designed for 2-hour bookings. If there is an injury or a real scheduling issue, the match is moved without blocking the league.",
      gameRulesTitle: "Game rules",
      gameRulesDescription:
        "Matches use Star Point and a tie-break at 6-6. Games also matter because they break ranking ties.",
    },
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
    account: "Account",
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
    gamesBalance: "Games",
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
    fullDescription:
      "Quick guide to understand the league format, scoring, match statuses and MVPs.",
    quickSummaryEyebrow: "Quick summary",
    quickSummaryTitle: "The essentials at a glance",
    quickSummaryDescription:
      "Smash & Lob is designed to create individual leagues even though matches are played in pairs. The ranking rewards consistency throughout the season.",
    summaryOwnPointsTitle: "Each player earns their own points",
    summaryOwnPointsDescription:
      "The app builds an individual ranking from matches played with rotating pairs.",
    summarySetsTitle: "Sets are the basis of the ranking",
    summarySetsThree:
      "A 3-0 gives 3 points to the winning pair. A 2-1 gives 2 points to the winners and 1 to the losers.",
    summarySetsOptional:
      "Each set won gives 1 point to each player in the pair that wins it. If fewer than 3 sets are played, only saved sets count.",
    summaryGamesTitle: "Games help break ties",
    summaryGamesDescription:
      "If two players are tied on points, games won, games lost and game difference are used.",
    tipsEyebrow: "Tips",
    tipsTitle: "Tips / recommendations",
    tipsIntro:
      "Ideally, reserve 10/15 minutes before the match to warm up, find rhythm and start with real match sensations.",
    tipsParallelTitle: "Parallel rally",
    tipsParallelDescription:
      "Each player rallies with the opponent in front of them, without crossing balls with the other diagonal.",
    tipsBackCourtTitle: "Back court",
    tipsBackCourtDescription:
      "Start with a few minutes from the back court, both players looking for control, depth and rhythm.",
    tipsNetDefenseTitle: "Net and defense",
    tipsNetDefenseDescription:
      "One player moves to the net and attacks while the opponent defends from the back court. Then switch positions.",
    tipsHighBallsTitle: "High balls and smashes",
    tipsHighBallsDescription:
      "Spend a few minutes on lobs, viboras, bandejas and smashes, switching positions so everyone goes through each role.",
    tipsBeforeServeTitle: "Before the serve",
    tipsBeforeServeDescription:
      "Hydrate, decide the server by playing a point where everyone touches the ball at least once, and start the match.",
    registrationEyebrow: "Registration",
    registrationTitle: "Registration, deposit and material",
    registrationFallbackAmount: "the amount defined by the organization",
    registrationFeeTitle: "Season fee",
    registrationFeeDescriptionSuffix:
      "per person. If the season has an active fee, the app lets the organization track who has paid it.",
    registrationFundTitle: "Fund and deposit",
    registrationFundDescription:
      "The fee works as a commitment fund to cover new balls, prizes and shared costs. Any surplus can be saved for the closing event or returned at the end.",
    registrationBallsTitle: "New balls",
    registrationBallsDescription:
      "The recommended reference is to open a new ball can for every match and organize distribution at the start of the season.",
    registrationPurposePrefix: "Purpose set by the organization:",
    formatEyebrow: "Format",
    formatTitle: "How a season works",
    formatRotatingPairsTitle: "Rotating pairs",
    formatRotatingPairsDescription:
      "The season tries to make everyone play with and against everyone in a balanced way.",
    formatRoundsTitle: "Rounds",
    formatRoundsDescription:
      "Each round contains the matches scheduled by the season calendar. Ideally, the agreed order and dates set by the organization are respected.",
    formatRankingTitle: "Individual ranking",
    formatRankingDescription:
      "Even though you play in a pair, points are added to each player separately.",
    formatCourtBookingTitle: "Court booking",
    formatCourtBookingDescription:
      "The format is designed to make the most of a 2-hour booking, including warm-up, match and hydration.",
    formatGoodFaithTitle: "Good faith and postponements",
    formatGoodFaithDescription:
      "If there are holidays, an injury or a real scheduling issue, the match is moved while trying not to block the calendar.",
    injuriesEyebrow: "Injuries",
    injuriesTitle: "Wildcard players",
    injuriesRealTitle: "Only for real absences",
    injuriesRealDescription:
      "Wildcard players are reserved for injuries or long-term absences, not random last-minute substitutes.",
    injuriesAgreedTitle: "Agreed before starting",
    injuriesAgreedDescription:
      "The organization may define 1 or 2 official external wildcard players with a similar average level and accepted by the group.",
    injuriesNoInheritedTitle: "No inherited points",
    injuriesNoInheritedDescription:
      "Points earned by a wildcard player do not count for the injured player; they only help the calendar keep moving.",
    scoringEyebrow: "Scoring",
    scoringTitle: "How points are added",
    scoringThreeNilLabel: "3-0 match",
    scoringThreeNilValue: "3 points for each player in the winning pair",
    scoringTwoOneLabel: "2-1 match",
    scoringTwoOneValue:
      "2 points for the winning pair and 1 for the losing pair",
    scoringEachSetLabel: "Each set won",
    scoringEachSetValue:
      "1 point for each player in the pair that wins that set",
    scoringPlayedSetsLabel: "Played sets",
    scoringPlayedSetsValue: "Only completed and saved sets count",
    scoringTiebreakLabel: "Tiebreakers",
    scoringTiebreakValue: "First points, then games and game difference",
    scoringThreeSetsNote:
      "The ranking measures sets won by each player. That is why you can still score by fighting for a set even if you lose the match.",
    scoringOptionalSetsNote:
      "The ranking measures sets won by each player. If the match closes before three sets, the ranking is calculated with the sets actually played.",
    scoringIncompleteSetNote:
      "If court time ends with the third set unfinished, the app does not automatically split half-points. The organization must decide whether to finish the set, postpone the match closure or apply a manual adjustment outside the saved result.",
    keyRuleEyebrow: "Key rule",
    keyRuleThreeSetsTitle: "Why all 3 sets are played",
    keyRuleOptionalSetsTitle: "What happens if 3 sets are not required",
    keyRuleThreeSetsIntro:
      "Playing all 3 sets makes every match distribute the same volume of points and games. That makes the ranking fairer and easier to compare.",
    keyRuleOptionalSetsIntro:
      "In this season it is not mandatory to complete three sets. The app lets players save only the played sets and calculates the ranking with that data.",
    keyRuleFairTitle: "Fairer",
    keyRuleFairDescription: "All players compete for the same amount of sets.",
    keyRuleEmotionTitle: "More tension",
    keyRuleEmotionDescription:
      "Even if a pair loses the first two sets, the third one still counts.",
    keyRuleConsistencyTitle: "Less punishment for one bad set",
    keyRuleConsistencyDescription:
      "Consistency matters more than a bad start or a temporary dip.",
    keyRuleFlexTitle: "More flexible",
    keyRuleFlexDescription:
      "If time runs out or the match ends earlier, only completed sets can be recorded.",
    keyRuleSetPointsTitle: "Points per set",
    keyRuleSetPointsDescription:
      "Each set won gives 1 individual point to both players in the pair.",
    keyRuleGamesTiebreakTitle: "Tiebreakers with games",
    keyRuleGamesTiebreakDescription:
      "Saved games still help order the ranking when players are tied on points.",
    matchesEyebrow: "Matches",
    matchesTitle: "Match statuses",
    matchesUnscheduledLabel: "No date",
    matchesUnscheduledValue:
      "The match exists, but when it will be played is not closed yet",
    matchesScheduledLabel: "Scheduled",
    matchesScheduledValue: "It has a date, time or place assigned",
    matchesPostponedLabel: "Postponed",
    matchesPostponedValue: "It has been marked as pending reschedule",
    matchesFinishedLabel: "Finished",
    matchesFinishedValue: "It already has a recorded result",
    padelEyebrow: "Padel",
    padelTitle: "Star Point and tie-break",
    padelStarPointTitle: "Star Point",
    padelStarPointDescription:
      "It is not a direct golden point at every 40-40. The first two 40-40s use classic advantages. If the game reaches a third 40-40, one deciding point is played: whoever wins it wins the game.",
    padelTieBreakWhenTitle: "When the tie-break is played",
    padelTieBreakWhenDescription:
      "If a set reaches 6-6, a tie-break decides who wins that set. In the app it is recorded as 7-6 for the winning pair.",
    padelTieBreakServeTitle: "Where to serve from",
    padelTieBreakServeDescription:
      "The player whose turn it is in the normal serving order starts. That first point is served from the right side. Then the next player serves two points: first from the left, then from the right.",
    padelServeRotationTitle: "How serve rotates",
    padelServeRotationDescription:
      "After the first point, each player serves two consecutive points, keeping the normal serving order among the four players. Each two-point turn alternates left and right.",
    padelSideChangesTitle: "Side changes",
    padelSideChangesDescription:
      "Pairs change sides every 6 points played: for example 3-3, 6-0, 6-6, 9-3. Sides also change after the tie-break if the normal match order requires it.",
    padelHowToWinTitle: "How to win",
    padelHowToWinDescription:
      "The first pair to reach 7 points with at least 2 points of margin wins. At 6-6, play continues until someone wins by two: 8-6, 9-7, 10-8, etc.",
    mvpEyebrow: "MVP",
    mvpTitle: "How MVPs work",
    mvpDescription:
      "The round MVP is calculated automatically when all matches in that round are finished. The strongest wins are rewarded, prioritizing sets won and then game difference.",
    mvpTip:
      "A 3-0 with a large game difference is usually the strongest result. If there is a true tie, the app can show a shared MVP. The season MVP comes from accumulated round MVPs.",
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
    appearanceTitle: "Appearance",
    appearanceDescription: "Choose the app theme on this device.",
    appearanceLight: "Light",
    appearanceDark: "Dark",
    appearanceSystem: "System",
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
    qaTitle: "Testing tools",
    qaDescription:
      "Simulate players, results, confirmations and MVP voting without creating more accounts.",
    accessDeniedTitle: "No admin permissions",
    accessDeniedCardTitle: "You cannot access this panel",
    accessDeniedDescription:
      "Only league creators and admins can manage this section.",
  },

  qa: {
    title: "Testing tools",
    description:
      "Simulate player actions and test critical flows without needing several Google accounts.",
    disabledTitle: "QA mode disabled",
    disabledDescription:
      "Enable NEXT_PUBLIC_QA_MODE=true and QA_MODE=true in the test environment. Access remains restricted to admins.",
    warningTitle: "Use only in a test league",
    warningDescription:
      "These actions write real data to Supabase and may send real notifications to linked accounts.",
    loading: "Loading testing data...",
    error: "Testing tools could not be loaded.",
    actionError: "The testing action could not be completed.",
    actionCompleted: "QA action completed and data reloaded.",
    contextTitle: "Test context",
    season: "Season",
    match: "Match",
    matchStatus: "Status",
    configuration: "Configuration",
    votes: "MVP votes",
    confirmations: "Confirmations",
    disputedShort: "disputed",
    simulatedPlayerTitle: "Act as player",
    simulatedPlayerDescription:
      "Choose which participant simulates the action. A linked account is not required.",
    scheduleMatch: "Schedule tomorrow",
    recordResult: "Record 2-1",
    confirmAll: "Confirm for everyone",
    disputeResult: "Dispute result",
    autoValidate: "Simulate 24 h",
    lockResult: "Lock result",
    unlockResult: "Unlock",
    mvpTitle: "MVP scenarios",
    mvpDescription:
      "Generate valid votes, early decisions and notifications using the same application logic.",
    target: "Target",
    secondTarget: "Second target",
    castOneVote: "Cast one vote",
    awardThreeVotes: "Give 3 votes",
    tieVotes: "2-2 tie",
    completeRoundScenario: "Complete round MVP",
    resetTitle: "Reset QA data",
    resetDescription:
      "Clears the result, votes and confirmations for the selected match or round. Only MVP events created by these tools are removed.",
    resetMatch: "Reset match",
    resetRound: "Reset round",
    noDataTitle: "No matches available",
    noDataDescription:
      "Create a season with a calendar and reopen these tools.",
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
      "Each player will partner every other player once and face every opponent twice.",
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
    calendarAuditTitle: "Calendar balance",
    calendarAuditDescription:
      "Checks that everyone partners each player once and faces every opponent the same number of times.",
    calendarAuditOk: "Verified",
    calendarAuditNeedsRepair: "Review",
    calendarAuditPartners: "Partners",
    calendarAuditOpponents: "Opponents",
    calendarAuditAllCorrect: "All correct",
    calendarAuditIncorrect: "incorrect pairs",
    calendarAuditRepairHelp:
      "This calendar was created with the previous generator. You can regenerate only the pairings before the season starts. Players and settings will not change.",
    repairCalendar: "Regenerate balanced calendar",
    repairingCalendar: "Regenerating...",
    repairCalendarConfirm:
      "Regenerate this season's pairings? It will only continue if no match has been scheduled or modified.",
    repairCalendarSuccess:
      "Calendar regenerated and verified successfully.",
    repairCalendarError: "The calendar could not be regenerated.",
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

  notifications: {
    title: "Notifications",
    description:
      "Choose which alerts you want to receive. Every option is enabled by default.",
    deviceTitle: "Push on this device",
    supportUnsupported:
      "This browser does not support web push notifications. On iPhone, install the PWA on the Home Screen first.",
    supportMissingPublicKey:
      "NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured, so push permission cannot be enabled. You can still save preferences.",
    supportPermissionDenied:
      "Notifications are blocked in the browser. Allow them from the system or browser settings.",
    supportReady:
      "Enable this device to receive alerts even when the app is not open.",
    active: "Active",
    inactive: "Inactive",
    missingConfiguration:
      "Server configuration or notification SQL tables are missing. The screen is ready, but actual delivery requires completing the setup.",
    enablePush: "Enable push",
    disablePush: "Disable",
    typesTitle: "Alert types",
    enabledCount: "Enabled: {enabled}/{total}",
    mandatoryPaymentReminders:
      "Court and registration payment reminders, whether automatic or sent manually, are always received.",
    disableAll: "Disable all",
    enableAll: "Enable all",
    preferencesSaved: "Preferences saved.",
    preferencesSaveError:
      "Preferences could not be saved. Check the notification tables and SUPABASE_SERVICE_ROLE_KEY.",
    deviceEnabled: "Notifications enabled on this device.",
    deviceEnableError:
      "This device could not be saved. Check VAPID, SUPABASE_SERVICE_ROLE_KEY and the notification tables.",
    deviceDisabled: "Notifications disabled on this device.",
    deviceDisableError: "This device could not be disabled.",
    preferences: {
      next_match: {
        title: "My next match",
        description:
          "Scheduling, date, place or court changes, postponements and a reminder 2 hours before your matches.",
      },
      my_match_result: {
        title: "My match results",
        description:
          "Results entered, edited or removed, confirmations, and reminders to enter a result or vote for MVP.",
      },
      round_events: {
        title: "Rounds and MVP",
        description:
          "Alerts when a round is in play and when MVP awards are decided during the season.",
      },
      season_events: {
        title: "Seasons",
        description:
          "A new season is created, started or finished in your league.",
      },
      booking_i_owe: {
        title: "Court bookings",
        description:
          "A booking says you owe your share to another player or a booking in one of your matches is updated.",
      },
      booking_paid_to_me: {
        title: "Court payments received",
        description:
          "Someone who owed you a court transfer marks it as paid.",
      },
      player_account: {
        title: "Account and players",
        description:
          "Changes to your profile, avatar, role, league link or user details.",
      },
    },
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
    notificationSettingsTitle: "Notification management",
    notificationSettingsDescription:
      "Choose which events send a push notification, remain in personal activity, or appear only in the general history.",
    notificationFutureHint:
      "Changes apply to new league notifications. Each player also keeps their personal notification preferences.",
    notificationSettingsCollapsedHint:
      "The panel stays collapsed so the audit trail remains visible. Open it only when you want to change alerts.",
    showNotificationSettings: "Configure",
    hideNotificationSettings: "Collapse",
    modeActivityOnly: "General history only",
    modePersonal: "No push · show in personal activity",
    modeNotify: "Send push notification",
    modeActivityOnlyShort: "General",
    modePersonalShort: "Personal",
    modeNotifyShort: "Push",
    pushPreparationTitle: "All configurable notifications",
    pushPreparationDescription:
      "Every available notification type is shown here and can be configured independently.",
    pushReady: "Configurable",
    mandatoryPaymentRemindersTitle: "Payment reminders always enabled",
    mandatoryPaymentRemindersDescription:
      "Court and registration payment reminders, whether automatic or sent manually, cannot be disabled.",
    notificationEnabledCount: "Enabled",
    notificationDisabledCount: "Disabled",
    notificationEnabled: "Notification enabled",
    notificationDisabled: "Notification disabled",
    notificationToggleDescription:
      "Disabling a type stops its push, but the event remains available in the activity history.",
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
    notificationLabels: {
      match_scheduled: "Match scheduled",
      match_schedule_updated: "Match schedule changed",
      match_postponed: "Match postponed",
      match_result_saved: "Result entered",
      match_result_updated: "Result corrected",
      match_result_disputed: "Result marked as incorrect",
      match_result_cleared: "Result removed",
      match_result_missing_reminder: "Reminder to enter a result",
      match_result_confirmation_reminder: "Reminder to confirm a result",
      match_mvp_vote_reminder: "Reminder to vote for MVP",
      match_mvp_awarded: "Match MVP decided",
      match_upcoming_reminder: "Upcoming match reminder",
      round_in_play: "Round in play",
      round_mvp_awarded: "Round MVP decided",
      court_booking_updated: "Court booking created or changed",
      court_booking_cleared: "Court booking removed",
      court_booking_payment_paid: "Court payment received",
      court_booking_payment_reminder: "Court payment reminder",
      season_registration_payment_reminder: "Registration payment reminder",
      league_created: "League created",
      league_updated: "League changed",
      league_logo_updated: "League logo changed",
      league_locations_updated: "League locations changed",
      league_invite_regenerated: "Player invitation regenerated",
      season_finished: "Season finished",
      season_created: "Season created",
      season_started: "Season started",
      player_name_updated: "Player name changed",
      player_avatar_updated: "Player photo changed",
      player_role_updated: "Player role changed",
      player_unlinked: "Player unlinked",
      user_updated: "User account changed",
    },
    labels: {
      match_scheduled: "Schedule",
      match_schedule_updated: "Schedule",
      match_postponed: "Postponement",
      match_result_saved: "Result",
      match_result_updated: "Result",
      match_result_disputed: "Result",
      match_result_cleared: "Result",
      match_mvp_vote_reminder: "MVP vote",
      match_mvp_awarded: "Match MVP",
      match_result_missing_reminder: "Result",
      match_result_confirmation_reminder: "Confirmation",
      match_upcoming_reminder: "Reminder",
      round_in_play: "Round",
      round_mvp_awarded: "MVP",
      court_booking_updated: "Booking",
      court_booking_cleared: "Booking",
      court_booking_payment_paid: "Payment",
      court_booking_payment_reminder: "Reminder",
      season_registration_payment_reminder: "Registration",
      league_created: "League",
      league_updated: "League",
      league_logo_updated: "League",
      league_locations_updated: "League",
      league_invite_regenerated: "Invitation",
      season_finished: "Season",
      season_started: "Season",
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
