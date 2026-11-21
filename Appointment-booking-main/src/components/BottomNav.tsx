import { AppView } from "../types";

interface BottomNavProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  bookingsCount: number;
}

export function BottomNav({ activeView, onNavigate, bookingsCount }: BottomNavProps) {
  const navItems: Array<{ id: AppView; label: string; icon: string }> = [
    { id: "explore", label: "Explore", icon: "explore" },
    { id: "providers", label: "Providers", icon: "group" },
    { id: "my-bookings", label: "My Bookings", icon: "calendar_month" },
    { id: "admin", label: "Admin", icon: "dashboard" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.04)] md:hidden"
      aria-label="Bottom Navigation"
    >
      <div className="flex justify-around items-center h-16 px-space-xs">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center justify-center min-w-[44px] min-h-[44px] flex-1 transition-colors ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[24px] ${
                  isActive ? "material-symbols-filled" : ""
                }`}
              >
                {item.icon}
              </span>
              {item.id === "my-bookings" && bookingsCount > 0 && (
                <span className="absolute top-1.5 right-[26%] min-w-[16px] h-4 px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">
                  {bookingsCount}
                </span>
              )}
              <span className="text-label-sm mt-0.5 whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
