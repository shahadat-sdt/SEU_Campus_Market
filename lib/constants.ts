export const categories = [
  "Food",
  "Clothing",
  "Makeup",
  "Electronics",
  "Used Items",
  "Notes",
  "Accessories"
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
  "COMPLETED",
  "CANCELLED"
] as const;

export const listingStatuses = [
  "ACTIVE",
  "SOLD",
  "HIDDEN"
] as const;

export function isUniversityEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return /^\d{13}@seu\.edu\.bd$/.test(normalized);
}
