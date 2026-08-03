import { describe, expect, it } from "vitest"
import {
  getMissingAuthEnvironment,
  readAuthEnvironment,
} from "@/lib/authEnvironment"

describe("Auth environment", () => {
  it("detects every missing Auth.js variable without returning values", () => {
    expect(getMissingAuthEnvironment({})).toEqual([
      "AUTH_SECRET",
      "AUTH_GOOGLE_ID",
      "AUTH_GOOGLE_SECRET",
    ])
  })

  it("normalizes present values and reports only missing names", () => {
    const result = readAuthEnvironment({
      AUTH_SECRET: " secret ",
      AUTH_GOOGLE_ID: " client ",
      AUTH_GOOGLE_SECRET: " ",
    })

    expect(result).toEqual({
      values: {
        AUTH_SECRET: "secret",
        AUTH_GOOGLE_ID: "client",
      },
      missing: ["AUTH_GOOGLE_SECRET"],
    })
  })
})
