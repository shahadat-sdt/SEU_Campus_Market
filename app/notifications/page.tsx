import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { shortDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-semibold">Notifications</h1>
      <p className="mt-2 text-muted-foreground">Category alerts and order status changes appear here.</p>
      <div className="mt-6 space-y-3">
        {notifications.map((notification) => (
          <Card key={notification.id}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{notification.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{shortDate(notification.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {!notifications.length && (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            Nothing yet. Follow a category or place an order to see updates.
          </div>
        )}
      </div>
    </main>
  );
}
