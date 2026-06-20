import { changePassword, updateProfile } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { meetupPoints } from "@/lib/constants";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function EditProfilePage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const password = Array.isArray(params.password) ? params.password[0] : params.password;

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="shadow-campus">
        <CardHeader>
          <CardTitle>Edit profile</CardTitle>
          <CardDescription>Keep your campus seller profile and contact details up to date.</CardDescription>
        </CardHeader>
        <CardContent>
          {error === "missing" && (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Please add your name and choose a valid preferred pickup point.
            </p>
          )}
          <form action={updateProfile} className="grid gap-4">
            <Input name="name" defaultValue={user.name} placeholder="Full name" required />
            <Input name="avatarUrl" type="url" defaultValue={user.avatarUrl || ""} placeholder="HTTPS profile photo URL" />
            <Input name="phone" defaultValue={user.phone || ""} placeholder="Phone or WhatsApp for confirmed orders" />
            <Select name="preferredPickup" defaultValue={user.preferredPickup || ""}>
              <option value="">No preferred pickup point</option>
              {meetupPoints.map((point) => (
                <option key={point} value={point}>{point}</option>
              ))}
            </Select>
            <Textarea name="bio" defaultValue={user.bio || ""} placeholder="Short seller bio, department, or buying/selling interests" />
            <AuthSubmitButton idleLabel="Save profile" pendingLabel="Saving profile" />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Use 6 or more characters.</CardDescription>
        </CardHeader>
        <CardContent>
          {error === "password" && (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Current password did not match or the new password was too short.
            </p>
          )}
          {password === "changed" && (
            <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              Password changed.
            </p>
          )}
          <form action={changePassword} className="grid gap-4">
            <Input name="currentPassword" type="password" placeholder="Current password" required />
            <Input name="newPassword" type="password" minLength={6} placeholder="New password" required />
            <PendingSubmitButton variant="outline" pendingChildren="Updating password">
              Update password
            </PendingSubmitButton>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
