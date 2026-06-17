import { markNotificationsRead, openNotification } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { shortDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Notifications</h1>
          <p className="mt-2 text-muted-foreground">Category alerts and order status changes appear here.</p>
        </div>
        {!!unreadCount && (
          <form action={markNotificationsRead}>
            <Button variant="outline" size="sm">Mark all read</Button>
          </form>
        )}
      </div>
      <div className="mt-6 space-y-3">
        {notifications.map((notification) => (
          <Card key={notification.id} className={notification.read ? "" : "border-primary/40 shadow-campus"}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{notification.title}</p>
                    {!notification.read && <Badge variant="mint">New</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
                  {notification.productTitle && (
                    <p className="mt-1 text-xs text-muted-foreground">Product: {notification.productTitle}</p>
                  )}
                </div>
                <div className="grid shrink-0 justify-items-end gap-2">
                  <span className="text-xs text-muted-foreground">{shortDate(notification.createdAt)}</span>
                  {notification.url && (
                    <form action={openNotification}>
                      <input type="hidden" name="notificationId" value={notification.id} />
                      <input type="hidden" name="url" value={notification.url} />
                      <Button size="sm" variant="outline">Open</Button>
                    </form>
                  )}
                </div>
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
