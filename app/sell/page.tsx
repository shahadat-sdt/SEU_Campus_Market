import { requireUser } from "@/features/auth/server/auth";
import { marketplaceApi } from "@/features/marketplace/api/marketplace-api";
import { SellerDashboard } from "@/features/sell/components/seller-dashboard";

export default async function SellPage() {
  const user = await requireUser();
  const data = await marketplaceApi.sellerDashboard(user.id);

  return <SellerDashboard data={data} />;
}
