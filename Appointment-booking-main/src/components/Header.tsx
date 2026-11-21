import { useState } from "react";
import { AppView, NotificationItem, UserAccount } from "../types";
import { DEFAULT_AVATAR_URL } from "../data/providers";
import { SlotWiseLogo } from "./SlotWiseLogo";

interface HeaderProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onBack: () => void;
  user: UserAccount | null;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}

const VIEW_SUBTITLES: Record<AppView, string> = {
  explore: "Explore",
  providers: "Providers",
  "my-bookings": "My Bookings",
  admin: "Admin",
  "provider-detail": "Provider Details",
  auth: "Smart Scheduling",
};

export function Header({
  activeView,
  onNavigate,
  onBack,
  user,
  notifications,
  onMarkAllRead,
}: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const isDetail = activeView === "provider-detail";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-6xl mx-auto h-16 px-margin-mobile md:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-space-sm min-w-0">
          {isDetail ? (
            <>
              <button
                aria-label="Go back"
                onClick={onBack}
                className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:text-primary hover:bg-surface-container transition-colors shrink-0"
                type="button"
              >
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("explore")}
                className="flex items-center gap-2 text-left min-w-0"
              >
                <SlotWiseLogo className="h-7 w-7" />
                <h1 className="text-headline-sm text-on-surface font-semibold truncate">
                  Provider Details
                </h1>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate("explore")}
              className="flex items-center gap-space-sm text-left shrink-0"
            >
              <SlotWiseLogo className="h-8 w-8" />
              <div className="flex flex-col">
                <span className="text-headline-sm tracking-tight text-on-surface leading-none font-semibold">
                  SlotWise
                </span>
                <span className="text-label-sm text-on-surface-variant leading-none mt-1">
                  {VIEW_SUBTITLES[activeView]}
                </span>
              </div>
            </button>
          )}
        </div>

        {/* Desktop inline navigation */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Primary">
          {(
            [
              { id: "explore", label: "Explore" },
              { id: "providers", label: "Providers" },
              { id: "my-bookings", label: "My Bookings" },
              { id: "admin", label: "Admin" },
            ] as const
          ).map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`text-label-lg whitespace-nowrap shrink-0 py-1.5 transition-colors border-b-2 ${
                  isActive
                    ? "text-primary border-primary"
                    : "text-on-surface-variant border-transparent hover:text-on-surface"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-space-xs shrink-0 relative">
          <button
            aria-label="Notifications"
            onClick={() => setNotifOpen((prev) => !prev)}
            className="relative w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-surface" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate("auth")}
            aria-label={user ? `Account: ${user.name}` : "Sign in or Sign up"}
            className="h-11 flex items-center gap-2 pl-space-xs pr-1 rounded-full hover:bg-surface-container transition-colors"
          >
            <img
              alt={user ? user.name : "Profile"}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-surface-container-high"
              src={user?.avatarUrl || DEFAULT_AVATAR_URL}
            />
            <span className="hidden lg:inline text-label-md text-on-surface font-semibold max-w-[120px] truncate">
              {user ? user.name.split(" ")[0] : "Sign In"}
            </span>
          </button>

          {/* Notifications Dropdown */}
          {notifOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotifOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-14 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-surface-container-lowest shadow-xl p-4 space-y-3 border border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <span className="text-label-lg text-on-surface font-semibold">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={onMarkAllRead}
                      className="text-label-sm text-primary font-semibold hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-body-sm text-on-surface-variant py-4 text-center">
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl transition-colors ${
                          n.read ? "bg-surface-container-low/60" : "bg-surface-container"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">{n.icon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-label-md text-on-surface font-semibold truncate">
                              {n.title}
                            </p>
                            <span className="text-label-sm text-outline shrink-0">{n.timeAgo}</span>
                          </div>
                          <p className="text-body-sm text-on-surface-variant mt-0.5 leading-snug">
                            {n.message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
