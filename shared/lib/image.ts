export const listingImageFallback = "https://placehold.co/800x600?text=SEU+Market";
export const listingHeroImageFallback = "https://placehold.co/1200x900?text=SEU+Market";

export function safeImageUrl(input?: string | null, fallback = listingImageFallback) {
  if (!input) return fallback;

  try {
    const url = new URL(input);
    return url.protocol === "https:" ? input : fallback;
  } catch {
    return fallback;
  }
}
