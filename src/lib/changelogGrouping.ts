import type { ChangelogRelease } from "@/lib/changelog"

export type ChangelogBlock = {
  version: string
  releases: ChangelogRelease[]
  firstDate?: string
  latestDate?: string
  changeCount: number
}

export function getVersionBlock(version: string) {
  const match = version.match(/^v?(\d+)\.(\d+)/)
  return match ? `v${match[1]}.${match[2]}` : version
}

export function groupReleasesByVersionBlock(
  releases: ChangelogRelease[],
): ChangelogBlock[] {
  const grouped = new Map<string, ChangelogRelease[]>()

  releases.forEach((release) => {
    const version = getVersionBlock(release.version)
    const currentReleases = grouped.get(version) ?? []
    currentReleases.push(release)
    grouped.set(version, currentReleases)
  })

  return Array.from(grouped.entries()).map(([version, blockReleases]) => ({
    version,
    releases: blockReleases,
    firstDate: blockReleases.at(-1)?.date,
    latestDate: blockReleases[0]?.date,
    changeCount: blockReleases.reduce(
      (total, release) => total + release.changes.length,
      0,
    ),
  }))
}
