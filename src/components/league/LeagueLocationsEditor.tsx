"use client";

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  createLeagueLocation,
  getLeagueLocationMapsUrl,
  getLeagueLocationOptionLabel,
  getLeagueLocationSubtitle,
  normalizeMapsUrl,
  sortLeagueLocationsByOptionLabel,
  type LeagueLocation,
} from "@/lib/leagueLocations";

type LeagueLocationsEditorProps = {
  locations: LeagueLocation[];
  onChange: (locations: LeagueLocation[]) => void;
  disabled?: boolean;
  copy: {
    emptyLocations: string;
    addLocationTitle: string;
    locationName: string;
    locationPlaceholder: string;
    town: string;
    townPlaceholder: string;
    googleLocation: string;
    googleLocationPlaceholder: string;
    address: string;
    addressPlaceholder: string;
    duplicatedLocation: string;
    addLocation: string;
    removeLocation: string;
    openMaps: string;
    searchMaps: string;
    googleApiMissing: string;
  };
};

type SelectedGooglePlace = {
  googlePlaceId: string | null;
  googlePlaceName: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
};

type GoogleLatLngLike = {
  lat: () => number;
  lng: () => number;
};

type GooglePlaceResultLike = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  url?: string;
  geometry?: {
    location?: GoogleLatLngLike;
  };
};

type GoogleAutocompleteLike = {
  getPlace: () => GooglePlaceResultLike;
  setFields?: (fields: string[]) => void;
  addListener: (eventName: string, callback: () => void) => void;
};

type GooglePlacesLike = {
  Autocomplete: new (
    input: HTMLInputElement,
    options?: Record<string, unknown>,
  ) => GoogleAutocompleteLike;
};

type GoogleMapsLike = {
  maps?: {
    places?: GooglePlacesLike;
  };
};

declare global {
  interface Window {
    google?: GoogleMapsLike;
    __smashLobGoogleMapsPromise?: Promise<void>;
  }
}

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const googleMapsScriptId = "smash-lob-google-maps-places";

function loadGoogleMapsPlaces() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is not available"));
  }

  if (window.google?.maps?.places) {
    return Promise.resolve();
  }

  if (window.__smashLobGoogleMapsPromise) {
    return window.__smashLobGoogleMapsPromise;
  }

  if (!googleMapsApiKey) {
    return Promise.reject(new Error("Missing Google Maps API key"));
  }

  window.__smashLobGoogleMapsPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(googleMapsScriptId);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = googleMapsScriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      googleMapsApiKey,
    )}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Google Maps"));

    document.head.appendChild(script);
  });

  return window.__smashLobGoogleMapsPromise;
}

function hasSameLocation(
  locations: LeagueLocation[],
  location: LeagueLocation,
) {
  const newPlaceId = location.googlePlaceId?.toLowerCase();
  const newName = location.name.trim().toLowerCase();
  const newTown = location.town?.trim().toLowerCase() ?? "";
  const newAddress = location.address?.trim().toLowerCase() ?? "";
  const newMapsUrl = location.googleMapsUrl?.trim().toLowerCase() ?? "";

  return locations.some((item) => {
    if (newPlaceId && item.googlePlaceId?.toLowerCase() === newPlaceId) {
      return true;
    }

    if (newMapsUrl && item.googleMapsUrl?.trim().toLowerCase() === newMapsUrl) {
      return true;
    }

    return (
      item.name.trim().toLowerCase() === newName &&
      (item.town?.trim().toLowerCase() ?? "") === newTown &&
      (item.address?.trim().toLowerCase() ?? "") === newAddress
    );
  });
}

function getPlaceLocation(place: GooglePlaceResultLike): SelectedGooglePlace {
  const location = place.geometry?.location;

  return {
    googlePlaceId: place.place_id ?? null,
    googlePlaceName: place.name ?? null,
    address: place.formatted_address ?? place.name ?? null,
    googleMapsUrl: place.url ?? null,
    latitude: location ? location.lat() : null,
    longitude: location ? location.lng() : null,
  };
}

export function LeagueLocationsEditor({
  locations,
  onChange,
  disabled = false,
  copy,
}: LeagueLocationsEditorProps) {
  const googleInputRef = useRef<HTMLInputElement | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [townInput, setTownInput] = useState("");
  const [googleInput, setGoogleInput] = useState("");
  const [detailInput, setDetailInput] = useState("");
  const [selectedGooglePlace, setSelectedGooglePlace] =
    useState<SelectedGooglePlace | null>(null);
  const [autocompleteReady, setAutocompleteReady] = useState(false);
  const [hasTriedLoadingAutocomplete, setHasTriedLoadingAutocomplete] =
    useState(false);
  const [duplicated, setDuplicated] = useState(false);

  useEffect(() => {
    if (!googleMapsApiKey || !googleInputRef.current || !isAdding) {
      return;
    }

    let isMounted = true;

    loadGoogleMapsPlaces()
      .then(() => {
        if (
          !isMounted ||
          !googleInputRef.current ||
          !window.google?.maps?.places
        ) {
          return;
        }

        const autocomplete = new window.google.maps.places.Autocomplete(
          googleInputRef.current,
          {
            fields: [
              "place_id",
              "name",
              "formatted_address",
              "geometry",
              "url",
            ],
          },
        );

        autocomplete.setFields?.([
          "place_id",
          "name",
          "formatted_address",
          "geometry",
          "url",
        ]);

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const nextGooglePlace = getPlaceLocation(place);

          setSelectedGooglePlace(nextGooglePlace);
          setGoogleInput(
            nextGooglePlace.googlePlaceName ?? nextGooglePlace.address ?? "",
          );
          setName((currentName) =>
            currentName.trim() || nextGooglePlace.googlePlaceName
              ? currentName.trim() || nextGooglePlace.googlePlaceName || ""
              : currentName,
          );
          setDuplicated(false);
        });

        setAutocompleteReady(true);
      })
      .catch(() => {
        setAutocompleteReady(false);
      })
      .finally(() => {
        if (isMounted) {
          setHasTriedLoadingAutocomplete(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAdding]);

  const sortedLocations = useMemo(
    () => sortLeagueLocationsByOptionLabel(locations),
    [locations],
  );
  const cleanName = name.trim();
  const cleanTown = townInput.trim();
  const cleanDetail = detailInput.trim();
  const cleanSearchText = googleInput.trim();
  const typedMapsUrl = normalizeMapsUrl(cleanSearchText);
  const isTypedMapsUrl = Boolean(typedMapsUrl);
  const resolvedName =
    cleanName ||
    selectedGooglePlace?.googlePlaceName ||
    (!isTypedMapsUrl ? cleanSearchText : "");
  const resolvedAddress =
    selectedGooglePlace?.address ?? (!isTypedMapsUrl ? cleanSearchText : null);
  const resolvedMapsUrl = selectedGooglePlace?.googleMapsUrl ?? typedMapsUrl;

  const draftLocation = useMemo(
    () =>
      createLeagueLocation({
        name: resolvedName,
        town: cleanTown,
        address: resolvedAddress,
        detail: cleanDetail,
        googlePlaceId: selectedGooglePlace?.googlePlaceId ?? null,
        googlePlaceName: selectedGooglePlace?.googlePlaceName ?? null,
        googleMapsUrl: resolvedMapsUrl,
        latitude: selectedGooglePlace?.latitude ?? null,
        longitude: selectedGooglePlace?.longitude ?? null,
      }),
    [
      cleanDetail,
      cleanTown,
      resolvedAddress,
      resolvedMapsUrl,
      resolvedName,
      selectedGooglePlace,
    ],
  );

  const canAdd = Boolean(draftLocation) && !disabled;

  function resetForm() {
    setName("");
    setTownInput("");
    setGoogleInput("");
    setDetailInput("");
    setSelectedGooglePlace(null);
    setDuplicated(false);
  }

  function handleGoogleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;

    setGoogleInput(nextValue);
    setSelectedGooglePlace(null);
    setDuplicated(false);

    if (!name.trim() && !normalizeMapsUrl(nextValue)) {
      setName(nextValue);
    }
  }

  function handleAddLocation() {
    if (!draftLocation) {
      return;
    }

    if (hasSameLocation(locations, draftLocation)) {
      setDuplicated(true);
      return;
    }

    onChange([...locations, draftLocation]);
    resetForm();
    setIsAdding(false);
  }

  function handleRemoveLocation(locationId: string) {
    onChange(locations.filter((location) => location.id !== locationId));
    setDuplicated(false);
  }

  return (
    <div className="space-y-3">
      {sortedLocations.length > 0 ? (
        <div className="space-y-2">
          {sortedLocations.map((location) => (
            <div
              key={location.id}
              className="rounded-xl border border-neutral-200 bg-white p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-neutral-950">
                    {getLeagueLocationOptionLabel(location)}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-5 text-neutral-500">
                    {getLeagueLocationSubtitle(location)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveLocation(location.id)}
                  disabled={disabled}
                  className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1.5 text-[11px] font-black text-neutral-800 disabled:text-neutral-400"
                >
                  {copy.removeLocation}
                </button>
              </div>

              <a
                href={getLeagueLocationMapsUrl(location)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-center text-[11px] font-black text-neutral-800"
              >
                {copy.openMaps}
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-300 p-3">
          <p className="text-sm font-semibold text-neutral-500">
            {copy.emptyLocations}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setIsAdding((current) => !current);
          setDuplicated(false);
        }}
        disabled={disabled}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-3 py-2 text-sm font-black text-white shadow-sm transition active:scale-[0.99] disabled:bg-neutral-200 disabled:text-neutral-400"
      >
        <span>{isAdding ? "−" : "+"}</span>
        <span>{copy.addLocationTitle}</span>
      </button>

      {isAdding ? (
        <div className="rounded-xl bg-neutral-100 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-neutral-600">
                {copy.locationName}
              </span>
              <input
                value={name}
                disabled={disabled}
                onChange={(event) => {
                  setName(event.target.value);
                  setDuplicated(false);
                }}
                placeholder={copy.locationPlaceholder}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
              />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-neutral-600">
                {copy.town}
              </span>
              <input
                value={townInput}
                disabled={disabled}
                onChange={(event) => {
                  setTownInput(event.target.value);
                  setDuplicated(false);
                }}
                placeholder={copy.townPlaceholder}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
              />
            </label>
          </div>

          <label className="mt-3 block">
            <span className="text-xs font-black uppercase tracking-wide text-neutral-600">
              {copy.googleLocation}
            </span>
            <input
              ref={googleInputRef}
              value={googleInput}
              disabled={disabled}
              onChange={handleGoogleInputChange}
              placeholder={copy.googleLocationPlaceholder}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
            />
          </label>

          <label className="mt-3 block">
            <span className="text-xs font-black uppercase tracking-wide text-neutral-600">
              {copy.address}
            </span>
            <input
              value={detailInput}
              disabled={disabled}
              onChange={(event) => {
                setDetailInput(event.target.value);
                setDuplicated(false);
              }}
              placeholder={copy.addressPlaceholder}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
            />
          </label>

          {!googleMapsApiKey && !autocompleteReady ? (
            <p className="mt-2 text-[11px] font-semibold leading-4 text-neutral-500">
              {copy.googleApiMissing}
            </p>
          ) : hasTriedLoadingAutocomplete && !autocompleteReady ? (
            <p className="mt-2 text-[11px] font-semibold leading-4 text-neutral-500">
              {copy.googleApiMissing}
            </p>
          ) : null}

          {duplicated ? (
            <p className="mt-2 text-xs font-semibold text-red-600">
              {copy.duplicatedLocation}
            </p>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href={
                draftLocation
                  ? getLeagueLocationMapsUrl(draftLocation)
                  : undefined
              }
              target="_blank"
              rel="noreferrer"
              aria-disabled={!draftLocation}
              className={`rounded-xl border px-3 py-2 text-center text-sm font-black shadow-sm ${
                draftLocation
                  ? "border-neutral-200 bg-white text-neutral-800"
                  : "pointer-events-none border-neutral-200 bg-neutral-200 text-neutral-400"
              }`}
            >
              {copy.searchMaps}
            </a>

            <button
              type="button"
              onClick={handleAddLocation}
              disabled={!canAdd}
              className="rounded-xl bg-neutral-950 px-3 py-2 text-sm font-black text-white shadow-sm disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              {copy.addLocation}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
