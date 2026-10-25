import { describe, expect, it } from "vitest"
import type { MatchData } from "@/context/MatchDataProvider"
import { getEmptyCourtBooking } from "@/lib/courtBooking"
import { recommendPairSides, buildSideStatistics } from "@/lib/matchSideRecommendations"

describe("pair side recommendations", () => {
  it.each([
    ["drive", "reves", "drive", "reves"],
    ["reves", "drive", "reves", "drive"],
    ["drive", "versatile", "drive", "reves"],
    ["reves", "versatile", "reves", "drive"],
    ["versatile", "drive", "reves", "drive"],
    ["versatile", "reves", "drive", "reves"],
  ] as const)("respects %s + %s without needing a ranking", (a, b, expectedA, expectedB) => {
    expect(recommendPairSides([{ preferredSide: a }, { preferredSide: b }])).toEqual([expectedA, expectedB])
  })

  it.each(["drive", "reves"] as const)("lets the higher-ranked player keep %s, regardless of pair order", side => {
    const statistics = {matchesPlayed:4,wins:2,gamesFor:40,gamesAgainst:40}
    const opposite = side === "drive" ? "reves" : "drive"
    expect(recommendPairSides([{ preferredSide: side, statistics, rankingPosition: 1 }, { preferredSide: side, statistics, rankingPosition: 5 }])).toEqual([side, opposite])
    expect(recommendPairSides([{ preferredSide: side, statistics, rankingPosition: 5 }, { preferredSide: side, statistics, rankingPosition: 1 }])).toEqual([opposite, side])
  })

  it.each([null, undefined, 0, -1, 1.5, NaN, Infinity, 3])("does not invent a ranking tie-break for %s", rank => {
    expect(recommendPairSides([{ preferredSide: "reves", rankingPosition: rank }, { preferredSide: "reves", rankingPosition: 3 }])).toEqual([null, null])
  })

  it("prioritizes personal results over rank and never lets an unplayed account displace history", () => {
    const strong={preferredSide:"drive" as const,rankingPosition:10,statistics:{matchesPlayed:10,wins:8,gamesFor:80,gamesAgainst:50}}
    const weak={preferredSide:"drive" as const,rankingPosition:1,statistics:{matchesPlayed:2,wins:1,gamesFor:12,gamesAgainst:10}}
    expect(recommendPairSides([weak,strong])).toEqual(["reves","drive"])
    expect(recommendPairSides([{preferredSide:"drive",rankingPosition:1},strong])).toEqual(["reves","drive"])
    expect(recommendPairSides([{preferredSide:"drive",rankingPosition:1},{preferredSide:"drive",rankingPosition:2}])).toEqual([null,null])
    expect(recommendPairSides([weak,{...strong,statistics:{matchesPlayed:8,wins:4,gamesFor:80,gamesAgainst:50}}])).toEqual(["reves","drive"])
  })
  it("merges registered identities across seasons, excludes disputed results and never merges names",()=>{
    const profiles=["a","b","c","d","e"].map(id=>({id,leagueId:id==="c"?"l2":"l1",slug:id,displayName:"Ana",avatarInitials:"A",userId:id==="a"||id==="c"?"account-1":null}))
    const fixture=(seasonId:string,own:string,resultCounts=true):MatchData=>({id:seasonId,leagueId:"l1",seasonId,round:1,status:"finished",teamA:[own,"d"],teamB:["b","e"],sets:[{a:6,b:4}],pointsA:1,pointsB:0,scheduledAt:null,resultRecordedAt:null,resultReportedByPlayerId:null,resultLocked:false,rankingCounts:true,resultCounts,dateLabel:null,location:null,incidentType:null,incidentStatus:null,incidentReason:null,incidentNotes:null,incidentCreatedAt:null,incidentResolvedAt:null,resolutionType:null,courtBooking:getEmptyCourtBooking()})
    const matches=[fixture("s1","a"),fixture("s2","c"),fixture("s3","a",false)]
    const roster=matches.flatMap(match=>[...match.teamA,...match.teamB].map(playerId=>({seasonId:match.seasonId,playerId})))
    const stats=buildSideStatistics(matches,profiles,roster)
    expect(stats.a).toEqual({matchesPlayed:2,wins:2,gamesFor:12,gamesAgainst:8})
    expect(stats.c).toEqual(stats.a)
    expect(stats.b).toEqual({matchesPlayed:2,wins:0,gamesFor:8,gamesAgainst:12})
  })
  it("leaves two versatile players, unknown preferences and incomplete pairs to agreement", () => {
    expect(recommendPairSides([{ preferredSide: "versatile", rankingPosition: 1 }, { preferredSide: "versatile", rankingPosition: 5 }])).toEqual([null, null])
    expect(recommendPairSides([{}, { preferredSide: "drive" }])).toEqual([null, null])
    expect(recommendPairSides([{ preferredSide: "versatile" }, {}])).toEqual([null, null])
    expect(recommendPairSides([{ preferredSide: "drive" }])).toEqual([null, null])
  })
})
