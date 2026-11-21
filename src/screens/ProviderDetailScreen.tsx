import { useEffect, useMemo, useState } from "react";
import { DateOption, Provider, ServiceItem, SlotPeriod, TimeSlot } from "../types";
import { DATE_OPTIONS, FULL_OCTOBER_DATES } from "../data/providers";

interface ProviderDetailScreenProps {
  provider: Provider;
  isFavorite: boolean;
  initialDateKey?: string;
  initialTime?: string;
  onToggleFavorite: (providerId: string) => void;
  onConfirmBooking: (params: {
    provider: Provider;
    service: ServiceItem;
    date: DateOption;
    time: string;
  }) => void;
  onViewMyBookings: () => void;
}

export function ProviderDetailScreen({
  provider,
  isFavorite,
  initialDateKey,
  initialTime,
  onToggleFavorite,
  onConfirmBooking,
  onViewMyBookings,
}: ProviderDetailScreenProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    provider.services[0]?.id ?? ""
  );
  const [selectedDateKey, setSelectedDateKey] = useState<string>(
    initialDateKey || "2024-10-18"
  );
  const [fullCalendarOpen, setFullCalendarOpen] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [bookingState, setBookingState] = useState<"idle" | "securing" | "confirmed">("idle");

  const selectedService = useMemo(
    () => provider.services.find((s) => s.id === selectedServiceId) ?? provider.services[0],
    [provider.services, selectedServiceId]
  );

  const visibleDates = fullCalendarOpen ? FULL_OCTOBER_DATES : DATE_OPTIONS;
  const selectedDate =
    FULL_OCTOBER_DATES.find((d) => d.key === selectedDateKey) ?? DATE_OPTIONS[2];

  const slotsForDate: TimeSlot[] = useMemo(
    () => provider.slotsByDate[selectedDateKey] ?? [],
    [provider.slotsByDate, selectedDateKey]
  );

  const defaultAvailableSlot = useMemo(() => {
    if (initialTime) {
      const exact = slotsForDate.find((s) => s.time === initialTime && s.available);
      if (exact) return exact.time;
    }
    const preferred = slotsForDate.find((s) => s.time === "03:30 PM" && s.available);
    if (preferred) return preferred.time;
    return slotsForDate.find((s) => s.available)?.time ?? "";
  }, [slotsForDate, initialTime]);

  const [selectedTime, setSelectedTime] = useState<string>(defaultAvailableSlot);

  useEffect(() => {
    setSelectedServiceId(provider.services[0]?.id ?? "");
    setBookingState("idle");
  }, [provider.id, provider.services]);

  useEffect(() => {
    const stillAvailable = slotsForDate.some((s) => s.time === selectedTime && s.available);
    if (!stillAvailable) {
      setSelectedTime(defaultAvailableSlot);
    }
  }, [selectedDateKey, slotsForDate, selectedTime, defaultAvailableSlot]);

  const periods: Array<{ period: SlotPeriod; title: string; icon: string; badgeBg: string; iconColor: string }> = [
    {
      period: "Morning",
      title: "Morning Slots",
      icon: "wb_twilight",
      badgeBg: "bg-secondary-fixed/50",
      iconColor: "text-on-secondary-fixed-variant",
    },
    {
      period: "Afternoon",
      title: "Afternoon Slots",
      icon: "light_mode",
      badgeBg: "bg-tertiary-fixed",
      iconColor: "text-on-tertiary-fixed",
    },
    {
      period: "Evening",
      title: "Evening Slots",
      icon: "dark_mode",
      badgeBg: "bg-surface-container-highest",
      iconColor: "text-primary",
    },
  ];

  const handleBook = () => {
    if (!selectedService || !selectedTime || bookingState !== "idle") return;
    setBookingState("securing");
    setTimeout(() => {
      onConfirmBooking({
        provider,
        service: selectedService,
        date: selectedDate,
        time: selectedTime,
      });
      setBookingState("confirmed");
    }, 550);
  };

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      // Ignore clipboard permission errors in sandboxed iframes
    }
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2400);
  };

  const shortServiceTitle = selectedService
    ? selectedService.name.split(" ").slice(0, 2).join(" ")
    : "";

  return (
    <div className="flex flex-col w-full pb-28">
      {/* Visual Hero Banner with Studio Atmosphere */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-md bg-surface-container-low mb-space-md">
        <div
          className="bg-cover bg-center w-full h-44 md:h-64 relative"
          style={{ backgroundImage: `url('${provider.heroUrl}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 via-on-surface/30 to-transparent" />

          {/* Quick Favorite & Share Overlay */}
          <div className="absolute top-space-sm right-space-sm flex items-center gap-space-xs">
            <button
              aria-label="Save to favorites"
              onClick={() => onToggleFavorite(provider.id)}
              className={`w-10 h-10 rounded-full bg-surface-container-lowest/85 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform shadow-sm ${
                isFavorite ? "text-error" : "text-primary"
              }`}
              type="button"
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  isFavorite ? "material-symbols-filled" : ""
                }`}
              >
                {isFavorite ? "favorite" : "favorite_border"}
              </span>
            </button>
            <button
              aria-label="Share provider"
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-surface-container-lowest/85 backdrop-blur-md flex items-center justify-center text-on-surface active:scale-95 transition-transform shadow-sm"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
          </div>

          {shareToast && (
            <div className="absolute top-space-sm left-space-sm px-3 py-1.5 rounded-full bg-on-surface text-surface text-label-sm font-medium shadow-md">
              Provider link copied
            </div>
          )}

          {/* Studio Badges Over Glass */}
          <div className="absolute bottom-space-sm left-space-sm right-space-sm flex items-end justify-between gap-2">
            <div className="flex items-center gap-1.5 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span className="text-label-sm text-secondary font-semibold">
                {provider.openNowLabel}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm text-on-surface">
              <span className="material-symbols-outlined material-symbols-filled text-[15px] text-tertiary-container">
                star
              </span>
              <span className="text-label-md font-bold tabular-nums">
                {provider.rating.toFixed(1)}
              </span>
              <span className="text-body-sm text-on-surface-variant">
                ({provider.reviewsCount})
              </span>
            </div>
          </div>
        </div>

        {/* Provider Header Info */}
        <div className="p-space-md bg-surface-container-lowest flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-headline-lg-mobile text-on-surface font-bold tracking-tight">
                {provider.name}
              </h2>
              {provider.verified && (
                <span
                  className="material-symbols-outlined material-symbols-filled text-secondary text-[20px]"
                  title="Verified Business"
                >
                  verified
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-on-surface-variant pt-0.5">
            <span className="flex items-center gap-1 text-label-md">
              <span className="material-symbols-outlined text-[16px] text-primary">near_me</span>
              {provider.distanceMiles} miles away
            </span>
            <span className="text-outline-variant text-label-sm">•</span>
            {provider.topRated && (
              <>
                <span className="text-label-md bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-semibold">
                  Top Rated
                </span>
                <span className="text-outline-variant text-label-sm">•</span>
              </>
            )}
            <span className="text-label-md text-on-surface-variant">Instant Confirmation</span>
          </div>

          <p className="text-body-md text-on-surface-variant pt-1 leading-relaxed">
            {provider.description}
          </p>
        </div>
      </div>

      {/* Confirmation Banner after booking */}
      {bookingState === "confirmed" && (
        <div className="mb-space-lg rounded-2xl bg-secondary-container text-on-secondary-container p-space-md shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined material-symbols-filled text-[22px] text-secondary mt-0.5">
              check_circle
            </span>
            <div>
              <p className="text-label-lg font-bold">Appointment Confirmed!</p>
              <p className="text-body-sm">
                {selectedService?.name} on {selectedDate.fullLabel} at {selectedTime}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onViewMyBookings}
            className="px-4 py-2 rounded-xl bg-secondary text-on-secondary text-label-md font-semibold shadow-sm hover:opacity-95 transition-opacity whitespace-nowrap"
          >
            View My Bookings
          </button>
        </div>
      )}

      {/* Service Selector Tabs / Carousel */}
      <section className="mb-space-lg">
        <div className="flex items-center justify-between mb-space-sm">
          <h3 className="text-headline-sm text-on-surface font-semibold">Select Service</h3>
          <span className="text-label-sm text-primary font-semibold">
            {provider.services.length} Services Available
          </span>
        </div>

        <div className="flex gap-space-sm overflow-x-auto pb-2 -mx-margin-mobile md:mx-0 px-margin-mobile md:px-0 no-scrollbar">
          {provider.services.map((service) => {
            const isSelected = service.id === selectedService?.id;
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => {
                  setSelectedServiceId(service.id);
                  setBookingState("idle");
                }}
                className={`shrink-0 w-64 p-space-md rounded-xl text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? "bg-primary-container text-on-primary shadow-md"
                    : "bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container-low"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? "bg-surface-container-lowest/20 text-white"
                        : "bg-surface-container text-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{service.icon}</span>
                  </div>
                  <span
                    className={`text-headline-sm font-bold tabular-nums ${
                      isSelected ? "text-white" : "text-on-surface"
                    }`}
                  >
                    {service.priceLabel}
                  </span>
                </div>

                <p
                  className={`text-label-lg font-bold line-clamp-1 ${
                    isSelected ? "text-white" : "text-on-surface"
                  }`}
                >
                  {service.name}
                </p>

                <div
                  className={`flex items-center gap-1.5 mt-1 ${
                    isSelected ? "text-on-primary-container" : "text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  <span className="text-label-sm">{service.duration} session</span>
                </div>

                {isSelected && (
                  <div className="absolute -right-2 -bottom-2 text-white/10 pointer-events-none">
                    <span className="material-symbols-outlined text-[64px]">spa</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Calendar Date Strip */}
      <section className="mb-space-lg">
        <div className="flex items-center justify-between mb-space-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">
              calendar_month
            </span>
            <h3 className="text-headline-sm text-on-surface font-semibold">October 2024</h3>
          </div>
          <button
            type="button"
            onClick={() => setFullCalendarOpen((v) => !v)}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-high text-primary text-label-md font-semibold hover:bg-surface-variant active:scale-95 transition-all"
          >
            <span>{fullCalendarOpen ? "6-Day View" : "Full Calendar"}</span>
            <span className="material-symbols-outlined text-[16px]">
              {fullCalendarOpen ? "expand_less" : "expand_more"}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {visibleDates.map((d) => {
            const isSelected = d.key === selectedDateKey;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => {
                  setSelectedDateKey(d.key);
                  setBookingState("idle");
                }}
                className={`flex flex-col items-center py-2.5 px-1 rounded-xl transition-all active:scale-95 relative ${
                  isSelected
                    ? "bg-primary text-on-primary shadow-md"
                    : "bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container-low"
                }`}
              >
                <span
                  className={`text-label-sm ${
                    isSelected ? "text-on-primary-container font-semibold" : "text-on-surface-variant"
                  }`}
                >
                  {d.dayShort}
                </span>
                <span className="text-label-lg font-bold mt-0.5 tabular-nums">{d.dayNum}</span>
                {d.isToday && (
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1 rounded mt-1 ${
                      isSelected
                        ? "bg-secondary-fixed text-on-secondary-fixed-variant"
                        : "bg-secondary-container text-on-secondary-container"
                    }`}
                  >
                    Today
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Legend Row */}
      <div className="flex items-center justify-between px-space-md py-2.5 bg-surface-container-low rounded-xl mb-space-md">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[10px] text-white">check</span>
          </span>
          <span className="text-label-sm text-on-surface font-medium">Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-surface-container-highest shadow-sm" />
          <span className="text-label-sm text-on-surface font-medium">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-surface-container-high relative overflow-hidden">
            <span className="absolute inset-0 bg-outline-variant/40" />
          </span>
          <span className="text-label-sm text-on-surface-variant font-medium">Booked</span>
        </div>
      </div>

      {/* Time Slot Picker Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-space-md mb-space-lg">
        {periods.map((group) => {
          const periodSlots = slotsForDate.filter((s) => s.period === group.period);
          const availableCount = periodSlots.filter((s) => s.available).length;

          return (
            <div key={group.period} className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-space-sm">
                <div className={`w-6 h-6 rounded-md ${group.badgeBg} flex items-center justify-center ${group.iconColor}`}>
                  <span className="material-symbols-outlined text-[16px]">{group.icon}</span>
                </div>
                <h4 className="text-label-lg font-semibold text-on-surface">{group.title}</h4>
                <span className="text-label-sm text-on-surface-variant ml-auto tabular-nums">
                  {availableCount} available
                </span>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-2 gap-space-sm">
                {periodSlots.map((slot) => {
                  const isSelected = slot.available && selectedTime === slot.time;
                  if (!slot.available) {
                    return (
                      <button
                        key={slot.id}
                        disabled
                        type="button"
                        className="py-3 px-2 rounded-xl bg-surface-container-high/60 text-outline-variant text-label-md font-medium cursor-not-allowed flex items-center justify-center line-through opacity-70 tabular-nums"
                      >
                        {slot.time}
                      </button>
                    );
                  }

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                        setSelectedTime(slot.time);
                        setBookingState("idle");
                      }}
                      className={`py-3 px-2 rounded-xl text-label-md font-bold active:scale-95 transition-all flex items-center justify-center gap-1 tabular-nums ${
                        isSelected
                          ? "bg-primary text-on-primary shadow-md ring-2 ring-primary ring-offset-1"
                          : "bg-surface-container text-primary shadow-sm hover:bg-surface-container-highest"
                      }`}
                    >
                      <span>{slot.time}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-secondary-fixed text-[16px]">
                          check_circle
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* Sticky Bottom Booking Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-xl px-margin-mobile py-space-sm pb-safe shadow-[0_-8px_20px_rgba(19,27,46,0.08)]">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-space-sm">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 text-on-surface truncate">
              <span className="material-symbols-outlined text-primary text-[18px]">event</span>
              <span className="text-label-lg font-bold truncate tabular-nums">
                {selectedDate.fullLabel} • {selectedTime || "No open slot"}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5 truncate">
              <span className="text-headline-sm font-bold text-primary tabular-nums">
                {selectedService?.priceLabel}
              </span>
              <span className="text-body-sm text-on-surface-variant truncate">
                • {shortServiceTitle}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={!selectedTime || bookingState === "securing"}
            onClick={
              bookingState === "confirmed" ? onViewMyBookings : handleBook
            }
            className={`shrink-0 flex items-center gap-2 px-space-md py-3 rounded-xl text-label-lg font-semibold shadow-md active:scale-95 transition-all whitespace-nowrap disabled:opacity-50 ${
              bookingState === "confirmed"
                ? "bg-secondary text-on-secondary"
                : "bg-primary text-on-primary hover:bg-surface-tint"
            }`}
          >
            {bookingState === "securing" ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                <span>Securing...</span>
              </>
            ) : bookingState === "confirmed" ? (
              <>
                <span className="material-symbols-outlined text-[18px]">done</span>
                <span>Confirmed!</span>
              </>
            ) : (
              <>
                <span>Book Appointment</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
