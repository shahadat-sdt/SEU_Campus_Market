import Link from "next/link";
import { Bell, LogOut, PackagePlus, Search, ShieldCheck, ShoppingBag, UserRound } from "lucide-react";
import { logout } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { Button, buttonVariants } from "@/components/ui/button";

export async function Nav() {
  const user = await getCurrentUser();
  const unreadCount = user
    ? await db.notification.count({ where: { userId: user.id, read: false } })
    : 0;

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-sm text-primary-foreground shadow-sm">
            SE
          </span>
          <span className="hidden truncate sm:inline">SEU Campus Market</span>
        </Link>
        <nav className="flex min-w-0 items-center gap-1 overflow-x-auto">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/buy"><Search className="h-4 w-4" /> <span className="hidden md:inline">Buy</span></Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/sell"><PackagePlus className="h-4 w-4" /> <span className="hidden md:inline">Sell</span></Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/orders"><ShoppingBag className="h-4 w-4" /> <span className="hidden md:inline">Orders</span></Link>
              </Button>
              {user.role === "ADMIN" && (
                <Button asChild variant="default" size="sm" className="shrink-0">
                  <Link href="/admin"><ShieldCheck className="h-4 w-4" /> <span>Admin</span></Link>
                </Button>
              )}
              <Link
                href="/notifications"
                aria-label="Notifications"
                title="Notifications"
                className={buttonVariants({ variant: "ghost", size: "icon", className: "relative" })}
              >
                <Bell className="h-4 w-4" />
                {!!unreadCount && (
                  <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-none text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href={`/profile/${user.id}`}
                aria-label="Profile"
                title="Profile"
                className={buttonVariants({ variant: "ghost", size: "icon" })}
              >
                <UserRound className="h-4 w-4" />
              </Link>
              <form action={logout}>
                <PendingSubmitButton variant="ghost" size="icon" aria-label="Logout" pendingChildren={<span className="sr-only">Logging out</span>}>
                  <LogOut className="h-4 w-4" />
                </PendingSubmitButton>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link href="/buy">Buy</Link></Button>
              <Button asChild variant="ghost" size="sm"><Link href="/login">Login</Link></Button>
              <Button asChild size="sm"><Link href="/register">Join</Link></Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
