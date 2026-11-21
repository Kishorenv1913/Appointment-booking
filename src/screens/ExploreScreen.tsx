import { useState } from "react";
import { CategorySlug, DateOption, Provider, UserAccount } from "../types";
import { DATE_OPTIONS } from "../data/providers";

interface ExploreScreenProps {
  providers: Provider[];
  user: UserAccount | null;
  onSearchSlots: (query: string, dateKey: string) => void;
  onSelectCategory: (category: CategorySlug) => void;
  onViewAllProviders: () => void;
  onOpenProvider: (providerId: string) => void;
  onOpenAuth: () => void;
}

const CATEGORIES: Array<{ label: Exclude<CategorySlug, "All">; icon: string }> = [
  { label: "Salon & Spa", icon: "spa" },
  { label: "Tutoring & Prep", icon: "school" },
  { label: "Auto Care", icon: "directions_car" },
  { label: "Fitness & Yoga", icon: "fitness_center" },
  { label: "Legal & Consulting", icon: "gavel" },
];

export function ExploreScreen({
  providers,
  user,
  onSearchSlots,
  onSelectCategory,
  onViewAllProviders,
  onOpenProvider,
  onOpenAuth,
}: ExploreScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<DateOption>(DATE_OPTIONS[2]); // Today, Oct 18
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategorySlug>("Salon & Spa");

  const featuredProviders =
    activeCategory === "All"
      ? providers.slice(0, 3)
      : (() => {
          const matching = providers.filter((p) => p.category === activeCategory);
          const others = providers.filter((p) => p.category !== activeCategory);
          return [...matching, ...others].slice(0, 3);
        })();

  return (
    <div className="flex flex-col w-full space-y-space-lg pb-space-xl">
      {/* Hero Section */}
      <section className="flex flex-col space-y-space-sm pt-space-xs">
        <div className="inline-flex items-center gap-1.5 self-start px-space-sm py-1 rounded-full bg-surface-container-high text-primary">
          <span className="material-symbols-outlined material-symbols-filled text-[16px] text-primary">
            bolt
          </span>
          <span className="text-label-sm uppercase tracking-wider text-primary">
            Instant Service Scheduling
          </span>
        </div>

        <div className="flex flex-col space-y-1 max-w-2xl">
          <h1 className="text-headline-xl-mobile md:text-headline-xl text-on-surface tracking-tight text-balance">
            Find and book appointments in seconds
          </h1>
          <p className="text-body-md md:text-body-lg text-on-surface-variant">
            Discover top-rated local providers with real-time available time slots.
          </p>
        </div>

        {/* Search & Filter Card Widget */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSlots(searchQuery, selectedDate.key);
          }}
          className="mt-space-xs rounded-xl bg-surface-container-lowest p-space-md shadow-md space-y-space-sm md:space-y-0 md:flex md:items-center md:gap-3"
        >
          <div className="flex-1 flex items-center gap-space-sm rounded-lg bg-surface-container-low px-space-md py-2.5">
            <span className="material-symbols-outlined text-outline text-[20px]">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-body-md text-on-surface placeholder:text-outline focus:outline-none"
              placeholder="e.g., Haircut, Tutoring, Oil change"
              type="text"
            />
          </div>

          <div className="flex items-center gap-space-xs md:shrink-0 relative">
            <button
              type="button"
              onClick={() => setDateMenuOpen((prev) => !prev)}
              className="flex-1 md:w-48 flex items-center justify-between rounded-lg bg-surface-container-low px-space-md py-2.5 active:bg-surface-container-high transition-colors text-left"
            >
              <div className="flex items-center gap-space-xs min-w-0">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  calendar_today
                </span>
                <span className="text-label-md text-on-surface truncate">
                  {selectedDate.fullLabel}
                </span>
              </div>
              <span className="material-symbols-outlined text-outline text-[18px]">
                expand_more
              </span>
            </button>

            {dateMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setDateMenuOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute left-0 top-12 z-40 w-52 rounded-xl bg-surface-container-lowest shadow-xl p-1.5 border border-outline-variant/30">
                  {DATE_OPTIONS.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => {
                        setSelectedDate(d);
                        setDateMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-label-md transition-colors flex items-center justify-between ${
                        d.key === selectedDate.key
                          ? "bg-primary text-on-primary font-semibold"
                          : "text-on-surface hover:bg-surface-container-low"
                      }`}
                    >
                      <span>{d.fullLabel}</span>
                      {d.isToday && (
                        <span className="text-[10px] uppercase tracking-wider opacity-80">
                          Today
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            <button
              type="submit"
              className="flex items-center justify-center gap-1 bg-primary text-on-primary text-label-lg px-space-lg py-2.5 rounded-lg hover:bg-primary-container active:scale-95 transition-all shadow-sm whitespace-nowrap shrink-0"
            >
              <span>Search Slots</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </form>
      </section>

      {/* Horizontal Category Chips */}
      <section className="flex flex-col space-y-space-xs -mx-margin-mobile md:mx-0">
        <div className="px-margin-mobile md:px-0 flex items-center justify-between">
          <span className="text-label-lg text-on-surface">Explore Categories</span>
          <button
            type="button"
            onClick={onViewAllProviders}
            className="text-label-sm text-primary font-semibold hover:underline"
          >
            View all
          </button>
        </div>

        <div className="flex items-center gap-space-xs overflow-x-auto no-scrollbar px-margin-mobile md:px-0 py-1 scroll-smooth">
          {CATEGORIES.map((cat) => {
            const selected = activeCategory === cat.label;
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.label);
                  onSelectCategory(cat.label);
                }}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-label-md shadow-sm active:scale-95 transition-all whitespace-nowrap ${
                  selected
                    ? "bg-secondary-container text-on-secondary-container font-semibold"
                    : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-low"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    selected ? "text-on-secondary-container" : "text-primary"
                  }`}
                >
                  {cat.icon}
                </span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Providers Section */}
      <section className="flex flex-col space-y-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined material-symbols-filled text-secondary text-[22px]">
              stars
            </span>
            <h2 className="text-headline-sm text-on-surface">Featured Providers</h2>
          </div>
          <button
            type="button"
            onClick={onViewAllProviders}
            className="text-label-sm text-primary font-semibold hover:underline"
          >
            See {providers.length} nearby
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {featuredProviders.map((provider) => (
            <article
              key={provider.id}
              className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-md shadow-sm space-y-space-sm relative overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-space-sm">
                <div className="relative shrink-0">
                  <img
                    alt={provider.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-full object-cover shadow-sm bg-surface-container"
                    src={provider.exploreThumbUrl}
                  />
                  {provider.verified && (
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-on-secondary shadow">
                      <span className="material-symbols-outlined text-[13px]">verified</span>
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-label-lg text-on-surface truncate">{provider.name}</h3>
                    <span className="text-headline-sm text-primary font-bold shrink-0 tabular-nums">
                      {provider.id === "glow-studio"
                        ? "$45+"
                        : provider.id === "brightpath-tutoring"
                          ? "$60"
                          : `$${provider.startingPrice}`}
                      {provider.id === "brightpath-tutoring" && (
                        <span className="text-body-sm text-on-surface-variant font-normal">/hr</span>
                      )}
                    </span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant truncate">
                    {provider.shortTagline}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined material-symbols-filled text-[15px] text-tertiary-container">
                      star
                    </span>
                    <span className="text-label-sm text-on-surface font-semibold tabular-nums">
                      {provider.rating.toFixed(1)}
                    </span>
                    <span className="text-body-sm text-on-surface-variant">
                      ({provider.reviewsCount} reviews)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-space-md py-2 gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="material-symbols-outlined text-secondary text-[18px] shrink-0">
                    schedule
                  </span>
                  <span className="text-body-sm text-on-surface truncate">
                    Next:{" "}
                    <strong className="text-label-md text-primary font-semibold">
                      {provider.nextAvailableLabel}
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenProvider(provider.id)}
                  className="bg-primary text-on-primary px-3 py-1.5 rounded-lg text-label-md font-semibold hover:bg-primary-container active:scale-95 transition-all shadow-sm shrink-0 whitespace-nowrap"
                >
                  Book Slot
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="flex flex-col space-y-space-md pt-space-xs">
        <div className="flex flex-col space-y-0.5">
          <span className="text-label-sm text-primary uppercase tracking-wider">
            Effortless Flow
          </span>
          <h2 className="text-headline-sm text-on-surface">How SlotWise Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
          <div className="flex items-start gap-space-md p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-fixed text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">manage_search</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-label-sm text-primary font-bold">01</span>
                <h3 className="text-label-lg text-on-surface">Discover</h3>
              </div>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                Browse verified local specialists, authentic customer reviews, and clear upfront pricing.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-space-md p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-fixed text-secondary shrink-0">
              <span className="material-symbols-outlined text-[20px]">touch_app</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-label-sm text-secondary font-bold">02</span>
                <h3 className="text-label-lg text-on-surface">Pick a Slot</h3>
              </div>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                View live provider availability and tap your preferred time slot to instantly reserve.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-space-md p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-tertiary-fixed text-tertiary shrink-0">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-label-sm text-tertiary font-bold">03</span>
                <h3 className="text-label-lg text-on-surface">Manage with Ease</h3>
              </div>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                Get instant confirmations, automatic calendar synchronization, and conversational AI rescheduling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Promotion Card */}
      <section className="relative rounded-2xl bg-gradient-to-br from-primary via-primary-container to-surface-tint p-space-lg text-on-primary shadow-lg overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-space-md">
          <div className="space-y-space-sm max-w-xl">
            <div className="inline-flex items-center gap-1 self-start px-2.5 py-1 rounded-full bg-on-primary/15 backdrop-blur-md text-on-primary">
              <span className="material-symbols-outlined text-[14px]">redeem</span>
              <span className="text-label-sm uppercase tracking-wide">
                {user ? "Member Credit Active" : "Welcome Offer"}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-headline-lg-mobile text-on-primary font-bold">
                {user ? `Welcome back, ${user.name.split(" ")[0]}!` : "New to SlotWise?"}
              </h3>
              <p className="text-body-md text-on-primary-container">
                {user
                  ? "Your account is active with 1-click rescheduling and instant SMS reminders."
                  : "Get $10 off your first appointment booking when you register today."}
              </p>
            </div>
          </div>

          <div className="md:shrink-0">
            <button
              type="button"
              onClick={user ? onViewAllProviders : onOpenAuth}
              className="w-full md:w-auto md:px-6 bg-surface-container-lowest text-primary hover:bg-surface-container-low text-label-lg py-3 px-5 rounded-xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>{user ? "Browse Providers" : "Sign Up Free"}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-secondary-fixed opacity-20 blur-xl pointer-events-none" />
      </section>

      {/* Trust Badges Footer */}
      <footer className="pt-space-xs">
        <div className="grid grid-cols-3 gap-space-xs p-space-md rounded-xl bg-surface-container-low text-center">
          <div className="flex flex-col items-center space-y-1">
            <span className="material-symbols-outlined text-primary text-[22px]">check_circle</span>
            <span className="text-label-sm text-on-surface font-semibold">
              Instant confirmation
            </span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <span className="material-symbols-outlined text-secondary text-[22px]">
              format_image_left
            </span>
            <span className="text-label-sm text-on-surface font-semibold">No hidden fees</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <span className="material-symbols-outlined text-tertiary text-[22px]">
              event_repeat
            </span>
            <span className="text-label-sm text-on-surface font-semibold">Free cancellation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
