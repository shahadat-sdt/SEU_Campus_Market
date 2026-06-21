import { listingHeroImageFallback, safeImageUrl } from "@/shared/lib/image";

export function ListingGallery({ title, imageUrl, imageUrls }: { title: string; imageUrl: string; imageUrls: string[] }) {
  const images = (imageUrls.length ? imageUrls : [imageUrl])
    .map((image) => safeImageUrl(image, listingHeroImageFallback));

  return (
    <>
      <div className="relative overflow-hidden rounded-md border bg-muted shadow-campus">
        <img
          src={images[0]}
          alt={title}
          decoding="async"
          fetchPriority="high"
          className="aspect-[4/3] w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.slice(0, 4).map((image, index) => (
            <div key={image} className="relative overflow-hidden rounded-md border bg-muted">
              <img
                src={image}
                alt={`${title} photo ${index + 1}`}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
