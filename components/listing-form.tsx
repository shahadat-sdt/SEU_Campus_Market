"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Tag, X } from "lucide-react";
import { listingCategories, listingConditions } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ListingFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  initial?: {
    title?: string;
    description?: string;
    category?: string;
    condition?: string;
    quantity?: number;
    price?: string;
    imageUrls?: string[];
    tags?: string[];
    negotiable?: boolean;
    campusPickup?: boolean;
    whatsappContact?: boolean;
    deliveryAvailable?: boolean;
  };
  listingId?: string;
};

export function ListingForm({ action, initial, listingId }: ListingFormProps) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [tags, setTags] = useState<string[]>(initial?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [images, setImages] = useState<string[]>(initial?.imageUrls?.length ? initial.imageUrls : []);
  const [uploadError, setUploadError] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const imageValue = useMemo(() => JSON.stringify(images), [images]);
  const tagsValue = useMemo(() => JSON.stringify(tags), [tags]);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploadError("");
    for (const file of Array.from(files).slice(0, 4 - images.length)) {
      const data = new FormData();
      data.set("file", file);
      const response = await fetch("/api/uploads/cloudinary", { method: "POST", body: data });
      const payload = await response.json();
      if (!response.ok) {
        setUploadError(payload.error || "Upload failed.");
        continue;
      }
      setImages((current) => [...current, payload.secureUrl].slice(0, 4));
    }
  }

  function addTag() {
    const next = tagInput.trim().replace(/\s+/g, " ");
    if (!next || tags.includes(next) || tags.length >= 5) return;
    setTags((current) => [...current, next]);
    setTagInput("");
  }

  function submit(intent: "draft" | "publish") {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    data.set("intent", intent);
    startTransition(() => action(data));
  }

  return (
    <div className="grid gap-5">
      <form ref={formRef} action={action} className="grid gap-5">
        {listingId && <input type="hidden" name="listingId" value={listingId} />}
        <input type="hidden" name="imageUrls" value={imageValue} />
        <input type="hidden" name="tags" value={tagsValue} />

        <section className="rounded-md border bg-card p-4">
          <h2 className="text-base font-semibold">Product Info</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 sm:col-span-2">
              <span className="flex items-center justify-between text-sm font-medium">
                Title <span className="text-xs text-muted-foreground">{title.length} / 60</span>
              </span>
              <Input name="title" maxLength={60} value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Category</span>
              <Select name="category" required defaultValue={initial?.category || ""}>
                <option value="" disabled>Choose category</option>
                {listingCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Condition</span>
              <Select name="condition" defaultValue={initial?.condition || "Good"}>
                {listingConditions.map((condition) => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </Select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Quantity</span>
              <Input name="quantity" type="number" min={1} defaultValue={initial?.quantity || 1} required />
            </label>
          </div>
        </section>

        <section className="rounded-md border bg-card p-4">
          <h2 className="text-base font-semibold">Photos</h2>
          <label
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              uploadFiles(event.dataTransfer.files);
            }}
            className="mt-4 grid min-h-36 cursor-pointer place-items-center rounded-md border border-dashed bg-muted/40 p-6 text-center"
          >
            <input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => uploadFiles(event.target.files)} />
            <span className="grid gap-2 text-sm text-muted-foreground">
              <ImagePlus className="mx-auto h-8 w-8 text-primary" />
              Upload up to 4 product photos
            </span>
          </label>
          {uploadError && <p className="mt-3 text-sm text-destructive">{uploadError}</p>}
          {!!images.length && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((image) => (
                <div key={image} className="relative overflow-hidden rounded-md border bg-muted">
                  <img src={image} alt="" className="aspect-square w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((current) => current.filter((item) => item !== image))}
                    className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-md bg-background/90 text-foreground"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-md border bg-card p-4">
          <h2 className="text-base font-semibold">Pricing</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Price</span>
              <span className="relative">
                <span className="pointer-events-none absolute left-3 top-2 text-sm font-semibold text-muted-foreground">৳</span>
                <Input name="price" type="number" min="1" step="1" className="pl-8" defaultValue={initial?.price || ""} required />
              </span>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Negotiable</span>
              <Select name="negotiable" defaultValue={initial?.negotiable ? "true" : "false"}>
                <option value="true">Yes (Negotiable)</option>
                <option value="false">Fixed Price</option>
              </Select>
            </label>
          </div>
        </section>

        <section className="rounded-md border bg-card p-4">
          <h2 className="text-base font-semibold">Pickup & Delivery</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Toggle name="campusPickup" label="Campus pickup" defaultChecked={initial?.campusPickup ?? true} />
            <Toggle name="whatsappContact" label="WhatsApp contact" defaultChecked={initial?.whatsappContact ?? true} />
            <Toggle name="deliveryAvailable" label="Delivery available" defaultChecked={initial?.deliveryAvailable ?? false} />
          </div>
        </section>

        <section className="rounded-md border bg-card p-4">
          <h2 className="text-base font-semibold">Description & Tags</h2>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2">
              <span className="flex items-center justify-between text-sm font-medium">
                Description <span className="text-xs text-muted-foreground">{description.length} / 300</span>
              </span>
              <Textarea
                name="description"
                maxLength={300}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
            </label>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="tags">Keyword tags</label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Press Enter to add"
                  disabled={tags.length >= 5}
                />
                <Button type="button" variant="outline" onClick={addTag} disabled={tags.length >= 5}>
                  <Tag className="h-4 w-4" /> Add
                </Button>
              </div>
              {!!tags.length && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-md border bg-secondary px-2.5 py-1 text-xs font-medium">
                      {tag}
                      <button type="button" onClick={() => setTags((current) => current.filter((item) => item !== tag))} aria-label={`Remove ${tag}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" disabled={isPending} onClick={() => submit("draft")}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save draft
          </Button>
          <Button type="button" disabled={isPending || !images.length} onClick={() => setPreviewing(true)}>
            Preview & Publish
          </Button>
        </div>
      </form>

      {previewing && (
        <section className="rounded-md border bg-card p-4 shadow-campus">
          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <img src={images[0]} alt="" className="aspect-square w-full rounded-md object-cover" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">{title || "Listing preview"}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {tags.map((tag) => <span key={tag}>#{tag}</span>)}
              </div>
              <Button disabled={isPending} onClick={() => submit("publish")}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />} Publish listing
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border bg-background p-3 text-sm font-medium">
      {label}
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4 accent-primary" />
    </label>
  );
}
