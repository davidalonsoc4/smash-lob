"use client"

import { ChangeEvent, useState } from "react"
import { ImageCropDialog } from "@/components/images/ImageCropDialog"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { readFileAsDataUrl, validateImageFile } from "@/lib/clientImages"

type Props = {
  playerId: string
  playerName: string
  accountAvatarUrl: string | null
  competitiveAvatarUrl: string | null
  onSaved: (avatarUrl: string | null) => void
}

export function CompetitivePlayerAvatarEditor({
  playerId,
  playerName,
  accountAvatarUrl,
  competitiveAvatarUrl,
  onSaved,
}: Props) {
  const [cropSource, setCropSource] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const effectiveAvatarUrl = competitiveAvatarUrl ?? accountAvatarUrl

  async function saveAvatar(avatarUrl: string | null) {
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/application-admin/players/${encodeURIComponent(playerId)}/avatar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl }),
        cache: "no-store",
      })
      const payload = (await response.json().catch(() => null)) as { competitiveAvatarUrl?: string | null; error?: string } | null
      if (!response.ok) throw new Error(payload?.error ?? "player_avatar_update_failed")
      onSaved(payload?.competitiveAvatarUrl ?? null)
      setCropSource(null)
      return true
    } catch {
      setError("No se ha podido guardar la imagen competitiva.")
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      validateImageFile(file)
      setError(null)
      setCropSource(await readFileAsDataUrl(file))
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "Imagen no válida.")
    }
  }

  return (
    <div className="mt-2 rounded-xl bg-neutral-50 p-2.5">
      <div className="flex items-center gap-2.5">
        <PlayerAvatar player={{ displayName: playerName, avatarUrl: effectiveAvatarUrl }} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-neutral-900">Imagen competitiva</p>
          <p className="mt-0.5 type-caption font-semibold text-neutral-500">
            {competitiveAvatarUrl
              ? "Override gestionado por superadmin. Tiene prioridad dentro de la liga."
              : "Sin override: se usa la imagen global de la cuenta o el avatar predeterminado."}
          </p>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="cursor-pointer rounded-lg bg-white px-2.5 py-2 text-center type-caption font-black ring-1 ring-neutral-200">
          {isSaving ? "Guardando..." : "Cambiar"}
          <input type="file" accept="image/*" disabled={isSaving} onChange={handleFileChange} className="sr-only" />
        </label>
        <button
          type="button"
          disabled={isSaving || !competitiveAvatarUrl}
          onClick={() => void saveAvatar(null)}
          className="inline-flex w-full items-center justify-center rounded-lg bg-white px-2.5 py-2 text-center type-caption font-black ring-1 ring-neutral-200 disabled:text-neutral-300"
        >
          Usar global
        </button>
      </div>
      {error ? <p className="mt-2 type-caption font-bold text-red-600">{error}</p> : null}
      {cropSource ? (
        <ImageCropDialog
          src={cropSource}
          title={`Imagen competitiva · ${playerName}`}
          description="Este cambio solo afecta a la ficha competitiva del jugador; no modifica su cuenta global."
          shape="circle"
          outputSize={256}
          outputType="image/webp"
          maxOutputBytes={160 * 1024}
          onCancel={() => setCropSource(null)}
          onConfirm={saveAvatar}
        />
      ) : null}
    </div>
  )
}
