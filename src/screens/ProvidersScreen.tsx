import { useMemo, useState } from "react";
import { CategorySlug, Provider } from "../types";

interface ProvidersScreenProps {
  providers: Provider[];
  favorites: string[];
  initialQuery?: string;
  initialCategory?: CategorySlug;
  onToggleFavorite: (providerId: string) => void;
  onOpenProvider: (providerId: string) => void;
}

type SortOption = "best" | "rating" | "price" | "distance";
type PriceFilter = "All" | "$" | "$$" | "$$$";

const CATEGORY_FILTER_OPTIONS: Array<{ label: string; value: CategorySlug }> = [
  { label: "All", value: "All" },
  { label: "Salon", value: "Salon & Spa" },
  { label: "Fitness", value: "Fitness & Yoga" },
  { label: "Auto", value: "Auto Care" },
  { label: "Education", value: "Tutoring & Prep" },
  { label: "Legal", value: "Legal & Consulting" },
];

export function ProvidersScreen({
  providers,
  favorites,
  initialQuery = "",
  initialCategory = "All",
  onToggleFavorite,
  onOpenProvider,
}: ProvidersScreenProps) {
  const [query, setQuery] = useState(initialQuery);
  const [locationFilter, setLocationFilter] = useState("Downtown Metro");
  const [availableTodayOnly, setAvailableTodayOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug>(initialCategory);
  const [minRating45, setMinRating45] = useState(false);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("All");
  const [within5Miles, setWithin5Miles] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("best");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount =
    (availableTodayOnly ? 1 : 0) +
    (selectedCategory !== "All" ? 1 : 0) +
    (minRating45 ? 1 : 0) +
    (priceFilter !== "All" ? 1 : 0) +
    (within5Miles ? 1 : 0);

  const filteredProviders = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = providers.filter((p) => {
      if (q) {
        const hay = [p.name, p.category, p.badgeLabel, ...p.tags, ...p.services.map((s) => s.name)]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
      if (availableTodayOnly && !p.nextSlotIsToday) return false;
      if (minRating45 && p.rating < 4.5) return false;
      if (priceFilter !== "All" && p.priceTier !== priceFilter) return false;
      if (within5Miles && p.distanceMiles > 5) return false;
      return true;
    });

    const sorted = [...list];
    if (sortBy === "rating") sorted.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "price") sorted.sort((a, b) => a.startingPrice - b.startingPrice);
    else if (sortBy === "distance") sorted.sort((a, b) => a.distanceMiles - b.distanceMiles);
    return sorted;
  }, [
    providers,
    query,
    selectedCategory,
    availableTodayOnly,
    minRating45,
    priceFilter,
    within5Miles,
    sortBy,
  ]);

  const cycleSort = () => {
    const order: SortOption[] = ["best", "rating", "price", "distance"];
    const next = order[(order.indexOf(sortBy) + 1) % order.length];
    setSortBy(next);
  };

  const sortLabels: Record<SortOption, string> = {
    best: "Best match",
    rating: "Top rated",
    price: "Lowest price",
    distance: "Nearest",
  };

  const cyclePrice = () => {
    const order: PriceFilter[] = ["All", "$", "$$", "$$$"];
    setPriceFilter(order[(order.indexOf(priceFilter) + 1) % order.length]);
  };

  const resetFilters = () => {
    setQuery("");
    setAvailableTodayOnly(false);
    setSelectedCategory("All");
    setMinRating45(false);
    setPriceFilter("All");
    setWithin5Miles(false);
    setSortBy("best");
  };

  return (
    <div className="flex flex-col w-full pb-8 space-y-4">
      {/* Search & Location Combined Bar */}
      <div className="flex items-center gap-space-xs p-space-sm bg-surface-container-lowest rounded-xl shadow-sm">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface-container text-primary shrink-0">
          <span className="material-symbols-outlined text-[20px]">search</span>
        </div>

        <div className="flex flex-col flex-1 min-w-0 pr-space-xs">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Haircut & Styling, Yoga, Auto..."
            aria-label="Search providers or services"
            className="w-full bg-transparent text-label-lg text-on-surface font-semibold placeholder:text-outline focus:outline-none truncate"
          />
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-[13px] text-secondary">location_on</span>
            <select
              aria-label="Select location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-transparent text-body-sm text-on-surface-variant focus:outline-none cursor-pointer"
            >
              <option value="Downtown Metro">Downtown Metro</option>
              <option value="Westside">Westside</option>
              <option value="Online & In-Person">Online &amp; In-Person</option>
            </select>
          </div>
        </div>

        <button
          aria-label="Filters"
          onClick={() => setFiltersOpen(true)}
          className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-variant active:scale-95 transition-all shrink-0"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">tune</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center px-1.5 h-4 min-w-[16px] rounded-full bg-primary text-on-primary text-[10px] leading-none font-bold shadow-sm">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Chips Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-margin-mobile md:mx-0 px-margin-mobile md:px-0 py-0.5">
        <button
          type="button"
          onClick={() => setAvailableTodayOnly((v) => !v)}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-xs active:scale-95 transition-all whitespace-nowrap ${
            availableTodayOnly
              ? "bg-secondary-container text-on-secondary-container font-semibold"
              : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-secondary" />
          <span className="text-label-md font-semibold">Available Today</span>
        </button>

        {CATEGORY_FILTER_OPTIONS.filter((c) => c.value !== "All").map((cat) => {
          const isSelected = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(isSelected ? "All" : cat.value)}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full shadow-xs active:scale-95 transition-all whitespace-nowrap ${
                isSelected
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-low"
              }`}
            >
              <span className="text-label-md font-semibold">{cat.label}</span>
              {isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setMinRating45((v) => !v)}
          className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full shadow-xs active:scale-95 transition-all whitespace-nowrap ${
            minRating45
              ? "bg-primary text-on-primary"
              : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <span
            className={`material-symbols-outlined material-symbols-filled text-[15px] ${
              minRating45 ? "text-on-primary" : "text-tertiary-container"
            }`}
          >
            star
          </span>
          <span className="text-label-md font-medium">4.5+</span>
        </button>

        <button
          type="button"
          onClick={cyclePrice}
          className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full shadow-xs active:scale-95 transition-all whitespace-nowrap ${
            priceFilter !== "All"
              ? "bg-primary text-on-primary"
              : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <span className="text-label-md font-medium">
            Price: {priceFilter === "All" ? "Any" : priceFilter}
          </span>
          <span className="material-symbols-outlined text-[14px] opacity-80">expand_more</span>
        </button>

        <button
          type="button"
          onClick={() => setWithin5Miles((v) => !v)}
          className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full shadow-xs active:scale-95 transition-all whitespace-nowrap ${
            within5Miles
              ? "bg-primary text-on-primary"
              : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <span className="text-label-md font-medium">&lt; 5 mi</span>
        </button>
      </div>

      {/* Results Count & Live Status */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-secondary">bolt</span>
          <span className="text-label-md text-on-surface font-semibold tabular-nums">
            {filteredProviders.length} {filteredProviders.length === 1 ? "provider" : "providers"}
          </span>
          <span className="text-body-sm text-on-surface-variant">with verified slots</span>
        </div>

        <button
          type="button"
          onClick={cycleSort}
          className="flex items-center gap-0.5 text-primary text-label-sm font-semibold active:opacity-75 whitespace-nowrap"
        >
          <span>Sort: {sortLabels[sortBy]}</span>
          <span className="material-symbols-outlined text-[14px]">swap_vert</span>
        </button>
      </div>

      {/* Provider Feed */}
      {filteredProviders.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-lowest p-8 text-center shadow-sm space-y-3">
          <span className="material-symbols-outlined text-[40px] text-outline">search_off</span>
          <h3 className="text-headline-sm text-on-surface font-semibold">
            No matching providers
          </h3>
          <p className="text-body-md text-on-surface-variant max-w-sm mx-auto">
            Try clearing one of your active filters or searching a broader service keyword.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-label-lg font-semibold shadow-sm hover:bg-primary-container transition-colors"
          >
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredProviders.map((provider) => {
            const isFav = favorites.includes(provider.id);
            const openTodayCount = (provider.slotsByDate["2024-10-18"] ?? []).filter(
              (s) => s.available
            ).length;

            return (
              <article
                key={provider.id}
                className="flex flex-col justify-between bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-surface-container">
                      <img
                        alt={provider.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        src={provider.thumbUrl}
                      />
                      <span
                        className={`absolute bottom-1 right-1 w-3 h-3 rounded-full flex items-center justify-center ${
                          provider.nextSlotIsToday ? "bg-secondary-container" : "bg-primary-fixed-dim"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            provider.nextSlotIsToday ? "bg-secondary" : "bg-primary"
                          }`}
                        />
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenProvider(provider.id)}
                          className="text-headline-sm text-on-surface font-bold truncate text-left hover:text-primary transition-colors"
                        >
                          {provider.name}
                        </button>
                        <button
                          aria-label="Save to favorites"
                          onClick={() => onToggleFavorite(provider.id)}
                          className={`w-9 h-9 -mr-1.5 -mt-1 flex items-center justify-center rounded-full active:scale-90 transition-all ${
                            isFav
                              ? "text-error"
                              : "text-on-surface-variant hover:text-error"
                          }`}
                          type="button"
                        >
                          <span
                            className={`material-symbols-outlined text-[20px] ${
                              isFav ? "material-symbols-filled" : ""
                            }`}
                          >
                            favorite
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant text-label-sm">
                          {provider.badgeLabel}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined material-symbols-filled text-[14px] text-tertiary-container">
                            star
                          </span>
                          <span className="text-label-md font-bold text-on-surface tabular-nums">
                            {provider.rating.toFixed(1)}
                          </span>
                          <span className="text-body-sm text-on-surface-variant">
                            ({provider.reviewsCount})
                          </span>
                        </div>
                        <span className="text-outline-variant text-body-sm">•</span>
                        <span className="text-body-sm text-on-surface-variant">
                          {provider.id === "brightpath-tutoring"
                            ? "Online & In-Person"
                            : provider.id === "legalease"
                              ? "Downtown"
                              : provider.distance}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1 mt-1">
                        {!provider.priceUnit && (
                          <span className="text-label-sm text-on-surface-variant">Starting</span>
                        )}
                        <span className="text-headline-sm font-bold text-primary tabular-nums">
                          {provider.startingPriceDisplay}
                        </span>
                        {provider.priceUnit && (
                          <span className="text-body-sm text-on-surface-variant">
                            {provider.priceUnit}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Real-Time Availability Pill */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-low text-on-surface">
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        provider.nextSlotIsToday
                          ? "text-secondary"
                          : provider.availabilityStatusTone === "primary"
                            ? "text-primary"
                            : "text-on-surface-variant"
                      }`}
                    >
                      {provider.nextSlotIsToday
                        ? "schedule"
                        : provider.availabilityStatusTone === "primary"
                          ? "event_available"
                          : "calendar_today"}
                    </span>
                    <div className="flex-1 min-w-0 text-body-sm">
                      <span>Next available: </span>
                      <span
                        className={`text-label-md font-semibold ${
                          provider.nextSlotIsToday
                            ? "text-secondary"
                            : provider.availabilityStatusTone === "primary"
                              ? "text-primary"
                              : "text-on-surface"
                        }`}
                      >
                        {provider.nextAvailableLabel}
                      </span>
                    </div>
                    <span
                      className={`text-label-sm px-1.5 py-0.5 rounded font-medium whitespace-nowrap ${
                        provider.availabilityStatusTone === "secondary"
                          ? "bg-secondary-fixed text-on-secondary-fixed"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {openTodayCount > 0 && provider.id === "zen-yoga"
                        ? `${openTodayCount} spots left`
                        : provider.availabilityPillLabel}
                    </span>
                  </div>

                  {/* Key Services Preview Tags */}
                  {provider.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {provider.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-label-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenProvider(provider.id)}
                  className="w-full h-11 flex items-center justify-center gap-1.5 rounded-xl bg-primary text-on-primary text-label-lg font-semibold shadow-sm hover:bg-primary-container active:scale-[0.98] transition-all"
                >
                  <span>View Slots &amp; Book</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </article>
            );
          })}
        </div>
      )}

      {/* End of Results */}
      <div className="flex items-center justify-center gap-2 py-4 text-on-surface-variant text-body-sm">
        <span className="material-symbols-outlined text-[16px]">verified</span>
        <span>All providers vetted with verified open slots</span>
      </div>

      {/* Filters Sheet Modal */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-on-surface/40 backdrop-blur-xs">
          <div className="w-full md:max-w-md bg-surface-container-lowest rounded-t-3xl md:rounded-2xl p-5 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-headline-sm text-on-surface font-bold">Filter Providers</h3>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-label-md text-on-surface-variant mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_FILTER_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setSelectedCategory(c.value)}
                      className={`px-3 py-1.5 rounded-full text-label-md font-medium transition-colors ${
                        selectedCategory === c.value
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-label-md text-on-surface-variant mb-2">Price Tier</p>
                <div className="grid grid-cols-4 gap-2">
                  {(["All", "$", "$$", "$$$"] as PriceFilter[]).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setPriceFilter(tier)}
                      className={`py-2 rounded-xl text-label-md font-semibold transition-colors ${
                        priceFilter === tier
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container text-on-surface"
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low cursor-pointer">
                  <span className="text-label-md text-on-surface font-medium">
                    Open slots today only
                  </span>
                  <input
                    type="checkbox"
                    checked={availableTodayOnly}
                    onChange={(e) => setAvailableTodayOnly(e.target.checked)}
                    className="w-5 h-5 accent-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low cursor-pointer">
                  <span className="text-label-md text-on-surface font-medium">
                    Top Rated (4.5+ stars)
                  </span>
                  <input
                    type="checkbox"
                    checked={minRating45}
                    onChange={(e) => setMinRating45(e.target.checked)}
                    className="w-5 h-5 accent-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low cursor-pointer">
                  <span className="text-label-md text-on-surface font-medium">
                    Within 5 miles
                  </span>
                  <input
                    type="checkbox"
                    checked={within5Miles}
                    onChange={(e) => setWithin5Miles(e.target.checked)}
                    className="w-5 h-5 accent-primary"
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={resetFilters}
                className="flex-1 h-11 rounded-xl bg-surface-container text-on-surface text-label-lg font-semibold hover:bg-surface-container-high transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex-1 h-11 rounded-xl bg-primary text-on-primary text-label-lg font-semibold hover:bg-primary-container transition-colors"
              >
                Show {filteredProviders.length} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
