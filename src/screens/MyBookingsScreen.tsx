import { useState } from "react";
import { Booking, BookingStatus, DateOption, Provider } from "../types";
import { DATE_OPTIONS } from "../data/providers";

interface MyBookingsScreenProps {
  bookings: Booking[];
  providers: Provider[];
  onRescheduleBooking: (bookingId: string, newDate: DateOption, newTime: string) => void;
  onCancelBooking: (bookingId: string) => void;
  onExploreProviders: () => void;
  onOpenProvider: (providerId: string) => void;
}

export function MyBookingsScreen({
  bookings,
  providers,
  onRescheduleBooking,
  onCancelBooking,
  onExploreProviders,
  onOpenProvider,
}: MyBookingsScreenProps) {
  const [statusFilter, setStatusFilter] = useState<BookingStatus>("confirmed");
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const [selectedNewDateKey, setSelectedNewDateKey] = useState<string>("2024-10-18");
  const [selectedNewTime, setSelectedNewTime] = useState<string>("");

  const filtered = bookings.filter((b) => b.status === statusFilter);

  const counts = {
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  const openReschedule = (booking: Booking) => {
    setRescheduleTarget(booking);
    setSelectedNewDateKey(booking.dateKey);
    const provider = providers.find((p) => p.id === booking.providerId);
    const open = (provider?.slotsByDate[booking.dateKey] ?? []).find((s) => s.available);
    setSelectedNewTime(open?.time ?? "");
  };

  const rescheduleProvider = rescheduleTarget
    ? providers.find((p) => p.id === rescheduleTarget.providerId)
    : undefined;
  const rescheduleSlots = rescheduleProvider?.slotsByDate[selectedNewDateKey] ?? [];

  return (
    <div className="flex flex-col w-full pb-8 space-y-space-md">
      <div className="flex items-center justify-between pt-space-xs">
        <div>
          <h1 className="text-headline-lg-mobile text-on-surface font-bold">My Bookings</h1>
          <p className="text-body-md text-on-surface-variant">
            Manage upcoming slots, 1-click rescheduling, and receipts.
          </p>
        </div>
        <button
          type="button"
          onClick={onExploreProviders}
          className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-semibold shadow-sm hover:bg-primary-container transition-colors whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Booking</span>
        </button>
      </div>

      {/* Segmented Status Filter */}
      <div className="grid grid-cols-3 p-1 bg-surface-container rounded-xl gap-1 max-w-md">
        {(
          [
            { id: "confirmed", label: `Upcoming (${counts.confirmed})` },
            { id: "completed", label: `Past (${counts.completed})` },
            { id: "cancelled", label: `Cancelled (${counts.cancelled})` },
          ] as const
        ).map((tab) => {
          const active = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`py-2.5 px-2 rounded-lg text-label-md transition-all whitespace-nowrap ${
                active
                  ? "bg-surface-container-lowest text-primary font-semibold shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-lowest p-8 text-center shadow-sm space-y-3">
          <span className="material-symbols-outlined text-[42px] text-outline">event_busy</span>
          <h2 className="text-headline-sm text-on-surface font-semibold">
            No {statusFilter === "confirmed" ? "upcoming" : statusFilter} appointments
          </h2>
          <p className="text-body-md text-on-surface-variant max-w-sm mx-auto">
            Browse verified local specialists and reserve an open slot in seconds.
          </p>
          <button
            type="button"
            onClick={onExploreProviders}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-label-lg font-semibold shadow-sm hover:bg-primary-container transition-colors"
          >
            <span>Find Providers</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((booking) => (
            <article
              key={booking.id}
              className="rounded-2xl bg-surface-container-lowest p-space-md shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src={booking.providerImage}
                    alt={booking.providerName}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover shrink-0 bg-surface-container"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenProvider(booking.providerId)}
                        className="text-label-lg text-on-surface font-bold truncate hover:text-primary text-left"
                      >
                        {booking.providerName}
                      </button>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-label-sm font-semibold whitespace-nowrap ${
                          booking.status === "confirmed"
                            ? "bg-secondary-container text-on-secondary-container"
                            : booking.status === "completed"
                              ? "bg-surface-container-high text-primary"
                              : "bg-error-container text-on-error-container"
                        }`}
                      >
                        {booking.status === "confirmed"
                          ? "Confirmed"
                          : booking.status === "completed"
                            ? "Completed"
                            : "Cancelled"}
                      </span>
                    </div>
                    <p className="text-body-md text-on-surface font-medium truncate mt-0.5">
                      {booking.serviceName}
                    </p>
                    <p className="text-body-sm text-on-surface-variant truncate">
                      {booking.providerLocation} • Code:{" "}
                      <span className="font-mono font-semibold text-on-surface">
                        {booking.confirmationCode}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-3.5 py-2.5">
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      calendar_month
                    </span>
                    <span className="text-label-md font-semibold tabular-nums">
                      {booking.dateLabel} • {booking.time}
                    </span>
                  </div>
                  <span className="text-label-lg font-bold text-primary tabular-nums">
                    {booking.priceLabel}
                  </span>
                </div>
              </div>

              {booking.status === "confirmed" ? (
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => openReschedule(booking)}
                    className="h-10 rounded-xl bg-surface-container text-primary text-label-md font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-[17px]">event_repeat</span>
                    <span>Reschedule</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onCancelBooking(booking.id)}
                    className="h-10 rounded-xl bg-error-container/60 text-on-error-container text-label-md font-semibold flex items-center justify-center gap-1.5 hover:bg-error-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[17px]">cancel</span>
                    <span>Cancel</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenProvider(booking.providerId)}
                  className="w-full h-10 rounded-xl bg-primary text-on-primary text-label-md font-semibold flex items-center justify-center gap-1.5 hover:bg-primary-container transition-colors"
                >
                  <span>Book Again</span>
                  <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      {/* 1-Click Reschedule Modal */}
      {rescheduleTarget && rescheduleProvider && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-on-surface/40 backdrop-blur-xs">
          <div className="w-full md:max-w-lg bg-surface-container-lowest rounded-t-3xl md:rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-headline-sm text-on-surface font-bold">
                  1-Click Reschedule
                </h3>
                <p className="text-body-sm text-on-surface-variant">
                  {rescheduleTarget.providerName} — {rescheduleTarget.serviceName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                className="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {DATE_OPTIONS.map((d) => {
                const selected = d.key === selectedNewDateKey;
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => {
                      setSelectedNewDateKey(d.key);
                      const firstOpen = (rescheduleProvider.slotsByDate[d.key] ?? []).find(
                        (s) => s.available
                      );
                      setSelectedNewTime(firstOpen?.time ?? "");
                    }}
                    className={`flex flex-col items-center py-2 rounded-xl text-center transition-all ${
                      selected
                        ? "bg-primary text-on-primary shadow-sm"
                        : "bg-surface-container-low text-on-surface"
                    }`}
                  >
                    <span className="text-label-sm opacity-80">{d.dayShort}</span>
                    <span className="text-label-md font-bold tabular-nums">{d.dayNum}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto">
              {rescheduleSlots.map((slot) => {
                const selected = slot.available && selectedNewTime === slot.time;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedNewTime(slot.time)}
                    className={`py-2.5 px-2 rounded-xl text-label-md font-semibold tabular-nums transition-all ${
                      !slot.available
                        ? "bg-surface-container-high/50 text-outline-variant line-through cursor-not-allowed"
                        : selected
                          ? "bg-primary text-on-primary shadow-sm"
                          : "bg-surface-container text-primary hover:bg-surface-container-highest"
                    }`}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                className="flex-1 h-11 rounded-xl bg-surface-container text-on-surface text-label-lg font-semibold"
              >
                Keep Current
              </button>
              <button
                type="button"
                disabled={!selectedNewTime}
                onClick={() => {
                  const dateObj =
                    DATE_OPTIONS.find((d) => d.key === selectedNewDateKey) ?? DATE_OPTIONS[2];
                  onRescheduleBooking(rescheduleTarget.id, dateObj, selectedNewTime);
                  setRescheduleTarget(null);
                }}
                className="flex-1 h-11 rounded-xl bg-primary text-on-primary text-label-lg font-semibold disabled:opacity-50"
              >
                Confirm New Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
