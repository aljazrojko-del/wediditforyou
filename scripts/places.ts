// Google Places API (New) — Text Search wrapper.
// Docs: https://developers.google.com/maps/documentation/places/web-service/text-search

import { checkBeforeCall, recordCall } from "./usage";

const ENDPOINT = "https://places.googleapis.com/v1/places:searchText";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.rating",
  "places.userRatingCount",
  "places.types",
  "nextPageToken",
].join(",");

export type PlaceResult = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
};

export type SearchResponse = {
  places?: PlaceResult[];
  nextPageToken?: string;
};

export async function searchText(
  apiKey: string,
  query: string,
  opts: { pageToken?: string; pageSize?: number } = {},
): Promise<SearchResponse> {
  // Hard-stops here if local spend tracker is at the cap.
  checkBeforeCall();

  const body: Record<string, unknown> = {
    textQuery: query,
    pageSize: opts.pageSize ?? 20,
  };
  if (opts.pageToken) body.pageToken = opts.pageToken;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places API ${res.status}: ${text}`);
  }

  // Only count successful calls — Google bills only successful responses.
  recordCall();

  return (await res.json()) as SearchResponse;
}

export async function* searchAllPages(
  apiKey: string,
  query: string,
  maxPages = 3,
): AsyncGenerator<PlaceResult, void, void> {
  let pageToken: string | undefined;
  for (let i = 0; i < maxPages; i++) {
    const resp = await searchText(apiKey, query, { pageToken });
    for (const p of resp.places ?? []) yield p;
    if (!resp.nextPageToken) return;
    pageToken = resp.nextPageToken;
    // Google requires a brief pause before the next page token activates.
    await new Promise((r) => setTimeout(r, 2000));
  }
}
