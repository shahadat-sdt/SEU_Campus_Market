import { notFound } from "next/navigation";
import { getCurrentUser } from "@/features/auth/server/auth";
import { marketplaceApi } from "@/features/marketplace/api/marketplace-api";
import { ProfileDetail } from "@/features/profile/components/profile-detail";

type Params = Promise<{ id: string }>;

export default async function ProfilePage({ params }: { params: Params }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const seller = await marketplaceApi.profile(id, currentUser?.id);

  if (!seller) notFound();

  return <ProfileDetail seller={seller} currentUserId={currentUser?.id} />;
}
