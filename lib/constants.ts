export const categories = [
  "All",
  "Food",
  "Clothing",
  "Makeup",
  "Electronics",
  "Used Items",
  "Notes",
  "Accessories"
] as const;

export const listingCategories = categories.filter((category) => category !== "All");

export const listingConditions = [
  "New",
  "Like New",
  "Good",
  "Fair"
] as const;

export const meetupPoints = [
  "Main gate",
  "Library lobby",
  "Cafeteria",
  "CSE department floor",
  "Auditorium entrance",
  "Central courtyard"
] as const;

export const orderStatuses = [
  "PENDING",
  "CONFIRMED",
  "READY",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED"
] as const;

export const listingStatuses = [
  "ACTIVE",
  "SOLD",
  "HIDDEN",
  "DRAFT"
] as const;

export function isUniversityEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return /^\d{13}@seu\.edu\.bd$/.test(normalized);
}
