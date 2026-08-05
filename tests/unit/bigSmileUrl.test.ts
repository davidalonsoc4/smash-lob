import { describe, expect, it } from "vitest"
import { buildDiceBearBigSmileUrl } from "@/features/avatar-lab/bigSmileUrl"

describe("DiceBear Big Smile URL", () => {
  it("maps the complete local recipe to the upstream renderer", () => {
    const url = buildDiceBearBigSmileUrl(new URLSearchParams({
      seed: "Davo",
      hair: "mohawk",
      eyes: "starstruck",
      mouth: "gapSmile",
      accessories: "sunglasses",
      backgroundFill: "linear",
      backgroundColor: "dbeafe",
      backgroundColor2: "ede9fe",
      flip: "horizontal",
      rotate: "18",
      scale: "1.2",
      translateX: "4",
      translateY: "-3",
      borderRadius: "24",
    }))

    expect(url.origin).toBe("https://api.dicebear.com")
    expect(url.pathname).toBe("/10.x/big-smile/svg")
    expect(url.searchParams.get("hairVariant")).toBe("mohawk")
    expect(url.searchParams.get("eyesVariant")).toBe("starstruck")
    expect(url.searchParams.get("mouthVariant")).toBe("gapSmile")
    expect(url.searchParams.get("accessoriesVariant")).toBe("sunglasses")
    expect(url.searchParams.get("backgroundColorFill")).toBe("linear")
    expect(url.searchParams.get("flip")).toBe("horizontal")
    expect(url.searchParams.get("rotate")).toBe("18")
    expect(url.searchParams.get("scale")).toBe("1.2")
  })

  it("clamps unsafe numeric input and rejects unknown options", () => {
    const url = buildDiceBearBigSmileUrl(new URLSearchParams({
      hair: "not-real",
      rotate: "9999",
      scale: "-4",
      borderRadius: "999",
      backgroundColor: "javascript:alert(1)",
    }))

    expect(url.searchParams.get("hairVariant")).toBe("shortHair")
    expect(url.searchParams.get("rotate")).toBe("360")
    expect(url.searchParams.get("scale")).toBe("0")
    expect(url.searchParams.get("borderRadius")).toBe("50")
    expect(url.searchParams.get("backgroundColor")).toBe("dbeafe")
  })
})
