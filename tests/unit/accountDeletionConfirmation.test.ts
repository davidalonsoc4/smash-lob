import { expect, it } from "vitest"
import { accountDeletionApiConfirmation, accountDeletionPhrases, isAccountDeletionConfirmation } from "@/lib/accountDeletionConfirmation"
import { translateLeagueText } from "@/i18n/leagueText"
import type { Locale } from "@/i18n/translations"

it.each<Locale>(["es", "en", "eu"])("accepts the confirmation actually displayed in %s", (locale) => {
  const phrase = accountDeletionPhrases[locale]
  expect(translateLeagueText(locale, "Para confirmar, escribe ELIMINAR MI CUENTA.")).toContain(phrase)
  expect(isAccountDeletionConfirmation(` ${phrase.toLowerCase()} `, locale)).toBe(true)
  expect(isAccountDeletionConfirmation("", locale)).toBe(false)
  expect(isAccountDeletionConfirmation("wrong", locale)).toBe(false)
  expect(accountDeletionApiConfirmation).toBe("ELIMINAR MI CUENTA")
})
