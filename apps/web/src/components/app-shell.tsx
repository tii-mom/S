"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { HomeIcon, ScrollIcon, UserIcon, VaultIcon } from "@/components/icons";
import { useShoreState } from "@/components/shore-state-provider";

const navItems = [
  { href: "/", label: "首页", icon: HomeIcon },
  { href: "/tasks", label: "任务", icon: ScrollIcon },
  { href: "/vault", label: "金库", icon: VaultIcon },
  { href: "/profile", label: "我的", icon: UserIcon },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
}

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const { state } = useShoreState();

  return (
    <div className="shore-world">
      <div className="sky-glow sky-glow--one" />
      <div className="sky-glow sky-glow--two" />
      <div className="cloud cloud--one" />
      <div className="cloud cloud--two" />
      <div className="cloud cloud--three" />
      <div className="distant-mountain distant-mountain--left" />
      <div className="distant-mountain distant-mountain--right" />
      <div className="petal petal--one" />
      <div className="petal petal--two" />
      <div className="petal petal--three" />

      <div className="shore-app-shell">
        <header className="shore-topbar">
          <Link href="/" className="shore-brand" aria-label="返回上岸首页">
            <span className="shore-brand__seal">岸</span>
            <span>
              <strong>上岸仙岛</strong>
              <small>SHORE</small>
            </span>
          </Link>

          <div className="shore-points" aria-label={`当前积分 ${state.points}`}>
            <span className="shore-points__coin">✦</span>
            <span>
              <small>今日积分</small>
              <strong>{state.points.toLocaleString("zh-CN")}</strong>
            </span>
          </div>
        </header>

        <main className="shore-main">{children}</main>

        <nav className="shore-bottom-nav" aria-label="主要导航">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "shore-nav-item shore-nav-item--active" : "shore-nav-item"}
                aria-current={active ? "page" : undefined}
              >
                <span className="shore-nav-item__icon">
                  <Icon />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
