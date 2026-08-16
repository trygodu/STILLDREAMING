const FIND_PLACE_URL = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json";
const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";
const FETCH_TIMEOUT_MS = 8000;

const DETAIL_FIELDS = [
  "name",
  "formatted_address",
  "formatted_phone_number",
  "international_phone_number",
  "website",
  "rating",
  "user_ratings_total",
  "opening_hours",
  "business_status",
  "types",
  "price_level",
  "url",
  "photos",
].join(",");

export interface MapsListingData {
  found: boolean;
  demo?: boolean;
  placeId?: string;
  name?: string;
  address?: string;
  phone?: string | null;
  website?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  categories?: string[];
  businessStatus?: string;
  openNow?: boolean | null;
  hasHours?: boolean;
  priceLevel?: number | null;
  photoCount?: number;
  mapsUrl?: string;
  error?: string;
}

interface FindPlaceResponse {
  status: string;
  candidates?: { place_id: string }[];
}

interface PlaceDetailsResponse {
  status: string;
  result?: {
    name?: string;
    formatted_address?: string;
    formatted_phone_number?: string;
    international_phone_number?: string;
    website?: string;
    rating?: number;
    user_ratings_total?: number;
    opening_hours?: { open_now?: boolean; weekday_text?: string[] };
    business_status?: string;
    types?: string[];
    price_level?: number;
    url?: string;
    photos?: unknown[];
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Looks up a business on Google Maps by name/location text and returns its public
 * listing details. Requires GOOGLE_PLACES_API_KEY (legacy "Places API" — Find Place
 * + Place Details) and costs real money per call on Google's side; without a key
 * this returns a clearly-labeled demo listing instead of failing.
 */
export async function runMapsAudit(query: string): Promise<MapsListingData> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return demoListing(query);
  }

  try {
    const findUrl = `${FIND_PLACE_URL}?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${apiKey}`;
    const findRes = await fetchJson<FindPlaceResponse>(findUrl);

    if (findRes.status === "REQUEST_DENIED" || findRes.status === "INVALID_REQUEST") {
      return { found: false, error: `Google Places request denied (${findRes.status}) — check the API key and that "Places API" is enabled.` };
    }
    if (findRes.status !== "OK" || !findRes.candidates?.length) {
      return { found: false, error: `No Google Maps listing found for "${query}".` };
    }

    const placeId = findRes.candidates[0].place_id;
    const detailsUrl = `${DETAILS_URL}?place_id=${placeId}&fields=${DETAIL_FIELDS}&key=${apiKey}`;
    const detailsRes = await fetchJson<PlaceDetailsResponse>(detailsUrl);

    if (detailsRes.status !== "OK" || !detailsRes.result) {
      return { found: false, error: "Found a listing but couldn't load its details." };
    }

    const r = detailsRes.result;
    return {
      found: true,
      placeId,
      name: r.name,
      address: r.formatted_address,
      phone: r.formatted_phone_number || r.international_phone_number || null,
      website: r.website || null,
      rating: r.rating ?? null,
      reviewCount: r.user_ratings_total ?? null,
      categories: r.types || [],
      businessStatus: r.business_status,
      openNow: r.opening_hours?.open_now ?? null,
      hasHours: Boolean(r.opening_hours?.weekday_text?.length),
      priceLevel: r.price_level ?? null,
      photoCount: r.photos?.length ?? 0,
      mapsUrl: r.url,
    };
  } catch (err) {
    return { found: false, error: err instanceof Error ? err.message : "Google Places request failed." };
  }
}

function demoListing(query: string): MapsListingData {
  return {
    found: true,
    demo: true,
    name: query,
    address: "Demo mode — connect GOOGLE_PLACES_API_KEY for a real Google Maps lookup",
    phone: null,
    website: null,
    rating: 4.3,
    reviewCount: 27,
    categories: ["local_business"],
    businessStatus: "OPERATIONAL",
    openNow: null,
    hasHours: true,
    priceLevel: null,
    photoCount: 4,
  };
}

/** Deterministic 0-100 score for the portal KPI row. */
export function scoreMapsListing(data: MapsListingData): number {
  if (!data.found) return 0;

  let score = 20;
  if (data.rating != null) {
    if (data.rating >= 4.5) score += 20;
    else if (data.rating >= 4) score += 15;
    else if (data.rating >= 3) score += 8;
  }
  if (data.reviewCount != null) {
    if (data.reviewCount >= 50) score += 20;
    else if (data.reviewCount >= 10) score += 10;
    else if (data.reviewCount > 0) score += 5;
  }
  if (data.website) score += 15;
  if (data.phone) score += 10;
  if (data.hasHours) score += 10;
  if (data.photoCount && data.photoCount >= 5) score += 5;
  if (data.businessStatus === "OPERATIONAL") score += 10;

  return Math.min(100, score);
}
