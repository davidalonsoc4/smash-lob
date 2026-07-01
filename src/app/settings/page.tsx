"use client";

import { type ChangeEvent, type ReactNode, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { PlayerAvatar } from "@/components/player/PlayerAvatar";
import { AppCard } from "@/components/ui/AppCard";
import { BackButton } from "@/components/ui/BackButton";
import { useCurrentUser } from "@/context/CurrentUserProvider";
import { useLeagueAccess } from "@/context/LeagueAccessProvider";
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData";
import { useI18n } from "@/i18n/I18nProvider";
import { recordActivityEvent } from "@/lib/activity";
import { APP_VERSION_LABEL } from "@/lib/appVersion";
import { resizeImageFileToDataUrl } from "@/lib/clientImages";

function getActorFromSession(session: ReturnType<typeof useSession>["data"]) {
  return {
    actorEmail: session?.user?.email ?? "system@smash-lob.local",
    actorDisplayName: session?.user?.name ?? null,
  };
}

type SettingsSectionProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
};

function SettingsSection({
  eyebrow,
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <section className="space-y-2">
      <div>
        {eyebrow ? (
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-400">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-[15px] font-black tracking-tight text-stone-950">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-xs font-semibold leading-snug text-stone-500">
            {description}
          </p>
        ) : null}
      </div>

      <AppCard className="p-0">
        <div className="divide-y divide-stone-100">{children}</div>
      </AppCard>
    </section>
  );
}

type SettingsRowProps = {
  title: string;
  description?: string;
  meta?: string;
  href?: string;
  action?: ReactNode;
  children?: ReactNode;
  tone?: "default" | "primary" | "danger";
};

function SettingsRow({
  title,
  description,
  meta,
  href,
  action,
  children,
  tone = "default",
}: SettingsRowProps) {
  const content = (
    <div className="flex items-center justify-between gap-3 p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`text-sm font-black ${
              tone === "danger" ? "text-red-700" : "text-stone-950"
            }`}
          >
            {title}
          </p>
          {meta ? (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-stone-500">
              {meta}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="mt-0.5 text-xs font-semibold leading-snug text-stone-500">
            {description}
          </p>
        ) : null}
        {children}
      </div>

      {action ?? (
        <span
          aria-hidden="true"
          className={`text-lg font-black ${
            tone === "primary" ? "text-stone-950" : "text-stone-300"
          }`}
        >
          &gt;
        </span>
      )}
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block transition active:scale-[0.99]">
      {content}
    </Link>
  );
}

function AccountAvatarSettings() {
  const { t } = useI18n();
  const { currentUser } = useCurrentUser();
  const { data: session } = useSession();
  const { updateLeaguePlayerAvatar } = useLeagueAccess();
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveAvatar(nextAvatarUrl: string | null) {
    setIsSaving(true);
    setSaved(false);
    setError(null);

    const updated = await updateLeaguePlayerAvatar(
      currentUser.leagueId,
      currentUser.id,
      nextAvatarUrl,
    );

    setIsSaving(false);

    if (!updated) {
      setError(t.settings.avatarSaveError);
      return;
    }

    setAvatarUrl(nextAvatarUrl);

    try {
      await recordActivityEvent({
        leagueId: currentUser.leagueId,
        ...getActorFromSession(session),
        type: "player_avatar_updated",
        title: nextAvatarUrl
          ? "Imagen de perfil actualizada"
          : "Imagen de perfil eliminada",
        description: nextAvatarUrl
          ? `${currentUser.displayName} ha actualizado su imagen de perfil.`
          : `${currentUser.displayName} ha eliminado su imagen de perfil.`,
        metadata: {
          targetPlayerId: currentUser.id,
          targetPlayerName: currentUser.displayName,
          hasAvatar: Boolean(nextAvatarUrl),
        },
      });
    } catch {
      // La imagen ya está guardada; la actividad es auxiliar.
    }

    setSaved(true);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const dataUrl = await resizeImageFileToDataUrl({
        file,
        maxSize: 512,
      });

      await saveAvatar(dataUrl);
    } catch (imageError) {
      setError(
        imageError instanceof Error
          ? imageError.message
          : t.settings.avatarProcessError,
      );
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
      <div className="flex items-center gap-3">
        <PlayerAvatar
          player={{
            ...currentUser,
            avatarUrl,
          }}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-stone-950">
            {currentUser.displayName}
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold text-stone-500">
            {session?.user?.email ?? t.settings.accountDescription}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-stone-400">
            {avatarUrl
              ? t.settings.avatarCustomActive
              : "Se mostrará el icono genérico si no subes imagen."}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block rounded-xl bg-white px-3 py-2 text-center text-xs font-black text-stone-800 ">
          {isSaving ? t.common.saving : t.settings.uploadAvatar}
          <input
            type="file"
            accept="image/*"
            disabled={isSaving}
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>

        <button
          type="button"
          onClick={() => saveAvatar(null)}
          disabled={isSaving || !avatarUrl}
          className="rounded-xl bg-white px-3 py-2 text-xs font-black text-stone-800  disabled:text-stone-300"
        >
          {t.settings.removeAvatar}
        </button>
      </div>

      {error ? (
        <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>
      ) : null}

      {saved ? (
        <p className="mt-2 text-xs font-semibold text-neutral-600">
          {t.settings.avatarSaved}
        </p>
      ) : null}
    </div>
  );
}

function AdminViewSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition ${
        checked ? "bg-neutral-950" : "bg-neutral-300"
      }`}
    >
      <span
        className={`absolute top-1 h-6 w-6 rounded-full bg-white  transition ${
          checked ? "left-7" : "left-1"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { t } = useI18n();
  const { activeLeague, activeSeason } = useCurrentLeagueData();
  const {
    canCreateLeagues,
    hasLeagueAdminRole,
    isAdminViewEnabled,
    setAdminViewEnabled,
    userLeagues,
  } = useLeagueAccess();
  const canAccessAdmin = hasLeagueAdminRole(activeLeague.id);
  const hasLeagues = userLeagues.length > 0;

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <BackButton fallbackHref="/profile" label={t.common.back} />

        <div className="mt-4 rounded-3xl border border-stone-200 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-400">
            Ajustes
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-stone-950">
            Organiza tu cuenta
          </h1>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-stone-500">
            Gestiona cuenta, ligas, preferencias y herramientas de administración
            desde una pantalla más compacta.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-neutral-700">
              {activeLeague.name}
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-neutral-700">
              {activeSeason.name}
            </span>
          </div>
        </div>
      </header>

      <SettingsSection
        eyebrow="Cuenta"
        title="Perfil y sesión"
        description="Tu imagen es de cuenta y se reutiliza en las ligas donde tengas un jugador vinculado."
      >
        <SettingsRow
          title="Imagen y cuenta conectada"
          description="Sube o elimina tu imagen de perfil. El email conectado aparece debajo del nombre."
          action={null}
        >
          <AccountAvatarSettings />
        </SettingsRow>

        <SettingsRow
          title={t.auth.signOut}
          description="Cierra la sesión de Google en este dispositivo."
          tone="danger"
          action={
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-xl bg-red-50 px-4 py-2 text-xs font-black text-red-700"
            >
              Salir
            </button>
          }
        />
      </SettingsSection>

      <SettingsSection
        eyebrow="Ligas"
        title="Acceso y cambio de liga"
        description="Todo lo relacionado con entrar, cambiar o crear ligas queda agrupado aquí."
      >
        {hasLeagues ? (
          <SettingsRow
            href="/leagues"
            title="Mis ligas"
            description="Selecciona la liga activa desde una pantalla con resumen de cada competición."
            meta={activeLeague.name}
          />
        ) : null}

        <SettingsRow
          href="/invite"
          title={t.settings.joinNewExistingLeague}
          description="Usa un código o enlace de invitación para entrar en una liga existente."
        />

        {canCreateLeagues ? (
          <SettingsRow
            href="/league/new"
            title={t.settings.createNewLeague}
            description="Crea una liga nueva y después configura su primera temporada."
            tone="primary"
          />
        ) : (
          <SettingsRow
            title="Crear nuevas ligas"
            description="Esta cuenta puede participar en ligas, pero no tiene permiso para crear ligas nuevas."
            action={
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-stone-500">
                No disponible
              </span>
            }
          />
        )}
      </SettingsSection>

      <SettingsSection
        eyebrow="Preferencias"
        title="Idioma y ayuda"
        description="Ajustes generales de uso y acceso rápido a las normas básicas."
      >
        <SettingsRow
          title={t.settings.language}
          description={t.settings.languageDescription}
          action={<LanguageSwitcher />}
        />

        <SettingsRow
          href="/help"
          title={t.settings.helpTitle}
          description={t.settings.helpDescription}
        />
      </SettingsSection>

      {canAccessAdmin ? (
        <SettingsSection
          eyebrow="Administración"
          title="Herramientas de admin"
          description="Opciones visibles solo para creadores, admins de liga o superadmin."
        >
          <SettingsRow
            title="Vista admin"
            description="Desactívala para revisar Inicio, Ranking, Partidos y Actividad como un jugador normal. Ajustes y admin siguen disponibles."
            meta={isAdminViewEnabled ? "Activa" : "Oculta"}
            action={
              <AdminViewSwitch
                checked={isAdminViewEnabled}
                onChange={setAdminViewEnabled}
              />
            }
          />

          <SettingsRow
            href="/admin"
            title={t.settings.adminPanelTitle}
            description={t.settings.adminPanelDescription}
          />
        </SettingsSection>
      ) : null}

      <p className="pb-4 text-center text-xs font-semibold text-neutral-600">
        {APP_VERSION_LABEL}
      </p>
    </div>
  );
}
