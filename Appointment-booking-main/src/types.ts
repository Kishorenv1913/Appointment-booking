export type AppView =
  | "explore"
  | "providers"
  | "my-bookings"
  | "admin"
  | "provider-detail"
  | "auth";

export type CategorySlug =
  | "All"
  | "Salon & Spa"
  | "Tutoring & Prep"
  | "Auto Care"
  | "Fitness & Yoga"
  | "Legal & Consulting";

export type SlotPeriod = "Morning" | "Afternoon" | "Evening";

export interface TimeSlot {
  id: string;
  time: string;
  period: SlotPeriod;
  available: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  duration: string;
  icon: string;
}

export interface DateOption {
  key: string; // e.g. '2024-10-18'
  dayShort: string; // 'Wed'
  dayNum: string; // '18'
  fullLabel: string; // 'Today, Oct 18'
  isToday?: boolean;
}

export interface Provider {
  id: string;
  name: string;
  category: Exclude<CategorySlug, "All">;
  badgeLabel: string;
  shortTagline: string;
  description: string;
  location: string;
  distance: string;
  distanceMiles: number;
  rating: number;
  reviewsCount: number;
  priceTier: "$" | "$$" | "$$$";
  startingPrice: number;
  startingPriceDisplay: string;
  priceUnit?: string;
  verified: boolean;
  topRated?: boolean;
  openNowLabel: string;
  instantConfirmation: boolean;
  availabilityPillLabel: string;
  availabilityStatusTone: "secondary" | "neutral" | "primary";
  nextAvailableLabel: string;
  nextSlotIsToday: boolean;
  tags: string[];
  thumbUrl: string;
  exploreThumbUrl: string;
  heroUrl: string;
  services: ServiceItem[];
  slotsByDate: Record<string, TimeSlot[]>;
}

export type BookingStatus = "confirmed" | "completed" | "cancelled";

export interface Booking {
  id: string;
  confirmationCode: string;
  providerId: string;
  providerName: string;
  providerImage: string;
  providerLocation: string;
  serviceId: string;
  serviceName: string;
  price: number;
  priceLabel: string;
  duration: string;
  dateKey: string;
  dateLabel: string;
  time: string;
  status: BookingStatus;
  customerName: string;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  welcomeDiscountAvailable: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  read: boolean;
  icon: string;
}
