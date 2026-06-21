import { requireAdmin } from "@/features/auth/server/auth";
import { marketplaceApi } from "@/features/marketplace/api/marketplace-api";
import { AdminDashboard } from "@/features/admin/components/admin-dashboard";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const roleError = Array.isArray(params.role) ? params.role[0] : params.role;
  const listingError = Array.isArray(params.error) ? params.error[0] : params.error;
  const data = await marketplaceApi.adminDashboard();

  return <AdminDashboard admin={admin} roleError={roleError} listingError={listingError} data={data} />;
}
