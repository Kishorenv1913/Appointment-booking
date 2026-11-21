import { useEffect, useState } from "react";
import {
  AppView,
  Booking,
  BookingStatus,
  CategorySlug,
  DateOption,
  NotificationItem,
  Provider,
  ServiceItem,
  UserAccount,
} from "./types";
import {
  INITIAL_BOOKINGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PROVIDERS,
} from "./data/providers";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { AiConciergeDrawer } from "./components/AiConciergeDrawer";
import { ExploreScreen } from "./screens/ExploreScreen";
import { ProvidersScreen } from "./screens/ProvidersScreen";
import { ProviderDetailScreen } from "./screens/ProviderDetailScreen";
import { AuthScreen } from "./screens/AuthScreen";
import { MyBookingsScreen } from "./screens/MyBookingsScreen";
import { AdminDashboardScreen } from "./screens/AdminDashboardScreen";

const STORAGE_KEYS = {
  providers: "slotwise_providers_v1",
  bookings: "slotwise_bookings_v1",
  favorites: "slotwise_favorites_v1",
  user: "slotwise_user_v1",
  notifications: "slotwise_notifications_v1",
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [providers, setProviders] = useState<Provider[]>(() =>
    readStorage(STORAGE_KEYS.providers, INITIAL_PROVIDERS)
  );
  const [bookings, setBookings] = useState<Booking[]>(() =>
    readStorage(STORAGE_KEYS.bookings, INITIAL_BOOKINGS)
  );
  const [favorites, setFavorites] = useState<string[]>(() =>
    readStorage(STORAGE_KEYS.favorites, ["glow-studio"])
  );
  const [user, setUser] = useState<UserAccount | null>(() =>
    readStorage(STORAGE_KEYS.user, null)
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    readStorage(STORAGE_KEYS.notifications, INITIAL_NOTIFICATIONS)
  );

  const [activeView, setActiveView] = useState<AppView>("explore");
  const [previousView, setPreviousView] = useState<AppView>("explore");
  const [selectedProviderId, setSelectedProviderId] = useState<string>("glow-studio");
  const [detailPrefill, setDetailPrefill] = useState<{ dateKey?: string; time?: string }>({});
  const [providersSearchQuery, setProvidersSearchQuery] = useState<string>("");
  const [providersCategory, setProvidersCategory] = useState<CategorySlug>("All");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.providers, JSON.stringify(providers));
    } catch {
      // ignore storage errors
    }
  }, [providers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
    } catch {
      // ignore storage errors
    }
  }, [bookings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
    } catch {
      // ignore storage errors
    }
  }, [favorites]);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEYS.user);
    } catch {
      // ignore storage errors
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications));
    } catch {
      // ignore storage errors
    }
  }, [notifications]);

  const navigateTo = (view: AppView) => {
    if (view !== activeView) {
      if (activeView !== "provider-detail" && activeView !== "auth") {
        setPreviousView(activeView);
      }
      setActiveView(view);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const openProviderDetail = (providerId: string, dateKey?: string, time?: string) => {
    setSelectedProviderId(providerId);
    setDetailPrefill({ dateKey, time });
    if (activeView !== "provider-detail") {
      setPreviousView(activeView);
    }
    setActiveView("provider-detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleFavorite = (providerId: string) => {
    setFavorites((prev) =>
      prev.includes(providerId) ? prev.filter((id) => id !== providerId) : [...prev, providerId]
    );
  };

  const setSlotAvailability = (
    providerId: string,
    dateKey: string,
    slotTime: string,
    available: boolean
  ) => {
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id !== providerId) return p;
        const currentSlots = p.slotsByDate[dateKey] ?? [];
        const updatedSlots = currentSlots.map((s) =>
          s.time === slotTime ? { ...s, available } : s
        );
        return {
          ...p,
          slotsByDate: {
            ...p.slotsByDate,
            [dateKey]: updatedSlots,
          },
        };
      })
    );
  };

  const handleConfirmBooking = ({
    provider,
    service,
    date,
    time,
  }: {
    provider: Provider;
    service: ServiceItem;
    date: DateOption;
    time: string;
  }) => {
    const code = `SW-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      confirmationCode: code,
      providerId: provider.id,
      providerName: provider.name,
      providerImage: provider.thumbUrl,
      providerLocation: `${provider.location} • ${provider.distance}`,
      serviceId: service.id,
      serviceName: service.name,
      price: service.price,
      priceLabel: service.priceLabel,
      duration: service.duration,
      dateKey: date.key,
      dateLabel: date.fullLabel,
      time,
      status: "confirmed",
      customerName: user?.name || "Alex Morgan",
      createdAt: new Date().toISOString(),
    };

    setBookings((prev) => [newBooking, ...prev]);
    setSlotAvailability(provider.id, date.key, time, false);
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: "Booking Confirmed",
        message: `${provider.name} — ${service.name} on ${date.fullLabel} at ${time} (${code}).`,
        timeAgo: "Just now",
        read: false,
        icon: "check_circle",
      },
      ...prev,
    ]);
  };

  const handleCancelBooking = (bookingId: string) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return;
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
    );
    setSlotAvailability(target.providerId, target.dateKey, target.time, true);
  };

  const handleRescheduleBooking = (bookingId: string, newDate: DateOption, newTime: string) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return;
    // Free old slot, claim new slot
    setSlotAvailability(target.providerId, target.dateKey, target.time, true);
    setSlotAvailability(target.providerId, newDate.key, newTime, false);
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, dateKey: newDate.key, dateLabel: newDate.fullLabel, time: newTime }
          : b
      )
    );
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: "Appointment Rescheduled",
        message: `${target.providerName} moved to ${newDate.fullLabel} at ${newTime}.`,
        timeAgo: "Just now",
        read: false,
        icon: "event_repeat",
      },
      ...prev,
    ]);
  };

  const handleAdminToggleSlot = (providerId: string, dateKey: string, slotTime: string) => {
    const provider = providers.find((p) => p.id === providerId);
    const slot = provider?.slotsByDate[dateKey]?.find((s) => s.time === slotTime);
    if (!slot) return;
    setSlotAvailability(providerId, dateKey, slotTime, !slot.available);
  };

  const handleAdminUpdateBookingStatus = (bookingId: string, status: BookingStatus) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return;
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)));
    if (status === "cancelled") {
      setSlotAvailability(target.providerId, target.dateKey, target.time, true);
    } else if (status === "confirmed") {
      setSlotAvailability(target.providerId, target.dateKey, target.time, false);
    }
  };

  const activeProvider =
    providers.find((p) => p.id === selectedProviderId) ?? providers[0];

  const showChrome = activeView !== "auth";
  const showBottomNav = activeView !== "auth" && activeView !== "provider-detail";
  const upcomingCount = bookings.filter((b) => b.status === "confirmed").length;

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      {showChrome && (
        <Header
          activeView={activeView}
          onNavigate={navigateTo}
          onBack={() => setActiveView(previousView)}
          user={user}
          notifications={notifications}
          onMarkAllRead={() =>
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
          }
        />
      )}

      <main
        className={`flex flex-col relative w-full max-w-6xl mx-auto px-margin-mobile md:px-6 flex-grow ${
          showChrome ? "pt-20 pb-28 md:pb-12" : "pt-safe pb-safe px-margin-mobile"
        }`}
      >
        {activeView === "explore" && (
          <ExploreScreen
            providers={providers}
            user={user}
            onSearchSlots={(query) => {
              setProvidersSearchQuery(query);
              setProvidersCategory("All");
              navigateTo("providers");
            }}
            onSelectCategory={(cat) => {
              setProvidersCategory(cat);
              setProvidersSearchQuery("");
            }}
            onViewAllProviders={() => {
              setProvidersCategory("All");
              setProvidersSearchQuery("");
              navigateTo("providers");
            }}
            onOpenProvider={(id) => openProviderDetail(id)}
            onOpenAuth={() => navigateTo("auth")}
          />
        )}

        {activeView === "providers" && (
          <ProvidersScreen
            key={`${providersSearchQuery}-${providersCategory}`}
            providers={providers}
            favorites={favorites}
            initialQuery={providersSearchQuery}
            initialCategory={providersCategory}
            onToggleFavorite={toggleFavorite}
            onOpenProvider={(id) => openProviderDetail(id)}
          />
        )}

        {activeView === "provider-detail" && activeProvider && (
          <ProviderDetailScreen
            provider={activeProvider}
            isFavorite={favorites.includes(activeProvider.id)}
            initialDateKey={detailPrefill.dateKey}
            initialTime={detailPrefill.time}
            onToggleFavorite={toggleFavorite}
            onConfirmBooking={handleConfirmBooking}
            onViewMyBookings={() => navigateTo("my-bookings")}
          />
        )}

        {activeView === "my-bookings" && (
          <MyBookingsScreen
            bookings={bookings}
            providers={providers}
            onRescheduleBooking={handleRescheduleBooking}
            onCancelBooking={handleCancelBooking}
            onExploreProviders={() => navigateTo("providers")}
            onOpenProvider={(id) => openProviderDetail(id)}
          />
        )}

        {activeView === "admin" && (
          <AdminDashboardScreen
            providers={providers}
            bookings={bookings}
            onToggleSlotAvailability={handleAdminToggleSlot}
            onUpdateBookingStatus={handleAdminUpdateBookingStatus}
          />
        )}

        {activeView === "auth" && (
          <AuthScreen
            user={user}
            onAuthSuccess={(newUser) => {
              setUser(newUser);
              setNotifications((prev) => [
                {
                  id: `notif-${Date.now()}`,
                  title: `Welcome, ${newUser.name.split(" ")[0]}!`,
                  message: "Your SlotWise account is active with $10 welcome booking credit.",
                  timeAgo: "Just now",
                  read: false,
                  icon: "verified_user",
                },
                ...prev,
              ]);
              setActiveView("explore");
            }}
            onSignOut={() => setUser(null)}
            onBack={() => setActiveView(previousView || "explore")}
          />
        )}
      </main>

      {showChrome && activeView !== "provider-detail" && (
        <AiConciergeDrawer
          providers={providers}
          bookings={bookings}
          onJumpToProvider={(providerId, dateKey, time) =>
            openProviderDetail(providerId, dateKey, time)
          }
          onNavigate={(view) => navigateTo(view as AppView)}
        />
      )}

      {showBottomNav && (
        <BottomNav
          activeView={activeView}
          onNavigate={navigateTo}
          bookingsCount={upcomingCount}
        />
      )}
    </div>
  );
}
