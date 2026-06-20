"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const START_EVENT = "market-progress:start";
const DONE_EVENT = "market-progress:done";

export function startGlobalProgress() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(START_EVENT));
  }
}

export function stopGlobalProgress() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DONE_EVENT));
  }
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [value, setValue] = useState(0);
  const activeRef = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const clearTimers = () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
    };

    const start = () => {
      clearTimers();
      activeRef.current = true;
      setActive(true);
      setValue((current) => (current > 0 && current < 96 ? current : 16));
      safetyTimer.current = setTimeout(() => finish(), 15000);
    };

    const finish = () => {
      if (!activeRef.current) return;
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setValue(100);
      hideTimer.current = setTimeout(() => {
        activeRef.current = false;
        setActive(false);
        setValue(0);
      }, 260);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target || link.download || link.origin !== window.location.origin) return;
      const next = new URL(link.href);
      const current = new URL(window.location.href);
      if (next.pathname === current.pathname && next.search === current.search && next.hash) return;
      start();
    };

    const onSubmit = (event: SubmitEvent) => {
      if (!event.defaultPrevented) start();
    };

    window.addEventListener(START_EVENT, start);
    window.addEventListener(DONE_EVENT, finish);
    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);

    return () => {
      clearTimers();
      window.removeEventListener(START_EVENT, start);
      window.removeEventListener(DONE_EVENT, finish);
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSubmit);
    };
  }, []);

  useEffect(() => {
    stopGlobalProgress();
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setValue((current) => {
        if (current >= 92) return current;
        return current + Math.max(1, Math.round((92 - current) * 0.18));
      });
    }, 420);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-transparent" aria-hidden={!active}>
      <div
        className="h-full bg-primary shadow-[0_0_18px_hsl(var(--primary)/0.45)] transition-all duration-300 ease-out"
        style={{
          opacity: active ? 1 : 0,
          transform: `translateX(${active ? value - 100 : -100}%)`
        }}
      />
    </div>
  );
}
