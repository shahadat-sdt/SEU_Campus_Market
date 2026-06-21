import { requireUser } from "@/features/auth/server/auth";
import { marketplaceApi } from "@/features/marketplace/api/marketplace-api";
import { OrdersDashboard } from "@/features/orders/components/orders-dashboard";

export default async function OrdersPage() {
  const user = await requireUser();
  const data = await marketplaceApi.ordersForUser(user.id);

  return <OrdersDashboard data={data} />;
}
