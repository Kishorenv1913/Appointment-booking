import { Booking, DateOption, NotificationItem, Provider, TimeSlot } from "../types";

export const SLOTWISE_LOGO_URL =
  "https://lh3.googleusercontent.com/aida/ALJJyrDrySId8s3ANrWjpZXcNfMT2Skwj3hLfGCa8Pa7TnvK2YxV8iHeqXTLUYy-3m2soeJsjPUfhPYWFtzdlJMQnxuD8HD7Hck6m8vJfFKfBLuevRE9SCaHo9q3rpv_HrBVbwAgH8wAkfrs8383B01BdruUBghea1Glxn6tUQzrfpixlDwl3feBrK5hkYTwNICFcQp9uKYPlghAUOps1g-W5_URq_27jWXdlXiDt57IQLbA";

export const DEFAULT_AVATAR_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuACCnZwDxNb18UuNnI1cMmc77mFM1uqKBysoNqqbzbtk28YMpSZhjGfNhLgJZGLASvkBoWC88tAQ0MTw7BTJV75kNvN-paNm8N3JPVYo1lsHzxZabds_T6LJetOKuelwT70e2-y6bk6HkfZGDxuI2P0ef4wuMRSGYJk5Ui0LTIJ632r_yc_ZXsX9h7vRWIO2lhl1l53LqMf2hsL4oWTi5rD0CDXrQpcEdM_IHjNh0I";

export const DATE_OPTIONS: DateOption[] = [
  { key: "2024-10-16", dayShort: "Mon", dayNum: "16", fullLabel: "Mon, Oct 16" },
  { key: "2024-10-17", dayShort: "Tue", dayNum: "17", fullLabel: "Tue, Oct 17" },
  { key: "2024-10-18", dayShort: "Wed", dayNum: "18", fullLabel: "Today, Oct 18", isToday: true },
  { key: "2024-10-19", dayShort: "Thu", dayNum: "19", fullLabel: "Thu, Oct 19" },
  { key: "2024-10-20", dayShort: "Fri", dayNum: "20", fullLabel: "Fri, Oct 20" },
  { key: "2024-10-21", dayShort: "Sat", dayNum: "21", fullLabel: "Sat, Oct 21" },
];

export const FULL_OCTOBER_DATES: DateOption[] = [
  ...DATE_OPTIONS,
  { key: "2024-10-22", dayShort: "Sun", dayNum: "22", fullLabel: "Sun, Oct 22" },
  { key: "2024-10-23", dayShort: "Mon", dayNum: "23", fullLabel: "Mon, Oct 23" },
  { key: "2024-10-24", dayShort: "Tue", dayNum: "24", fullLabel: "Tue, Oct 24" },
  { key: "2024-10-25", dayShort: "Wed", dayNum: "25", fullLabel: "Wed, Oct 25" },
  { key: "2024-10-26", dayShort: "Thu", dayNum: "26", fullLabel: "Thu, Oct 26" },
  { key: "2024-10-27", dayShort: "Fri", dayNum: "27", fullLabel: "Fri, Oct 27" },
];

function createDefaultSlots(overrides: Partial<Record<string, boolean>> = {}): TimeSlot[] {
  const base: Array<{ time: string; period: TimeSlot["period"]; available: boolean }> = [
    { time: "09:30 AM", period: "Morning", available: true },
    { time: "10:15 AM", period: "Morning", available: false },
    { time: "11:30 AM", period: "Morning", available: true },
    { time: "01:00 PM", period: "Afternoon", available: false },
    { time: "02:15 PM", period: "Afternoon", available: true },
    { time: "03:30 PM", period: "Afternoon", available: true },
    { time: "04:45 PM", period: "Afternoon", available: true },
    { time: "05:30 PM", period: "Evening", available: true },
    { time: "06:15 PM", period: "Evening", available: false },
  ];
  return base.map((slot, idx) => ({
    id: `slot-${idx}-${slot.time.replace(/[^a-z0-9]/gi, "")}`,
    time: slot.time,
    period: slot.period,
    available: overrides[slot.time] !== undefined ? Boolean(overrides[slot.time]) : slot.available,
  }));
}

function buildWeekSlots(
  todayOverrides: Partial<Record<string, boolean>> = {},
  tomorrowOverrides: Partial<Record<string, boolean>> = {}
): Record<string, TimeSlot[]> {
  return {
    "2024-10-16": createDefaultSlots({ "10:15 AM": true, "03:30 PM": false }),
    "2024-10-17": createDefaultSlots({ "01:00 PM": true, "06:15 PM": true }),
    "2024-10-18": createDefaultSlots(todayOverrides),
    "2024-10-19": createDefaultSlots(tomorrowOverrides),
    "2024-10-20": createDefaultSlots({ "10:15 AM": true, "01:00 PM": true }),
    "2024-10-21": createDefaultSlots({ "09:30 AM": true, "06:15 PM": true }),
    "2024-10-22": createDefaultSlots({ "11:30 AM": true, "02:15 PM": true }),
    "2024-10-23": createDefaultSlots(),
    "2024-10-24": createDefaultSlots(),
    "2024-10-25": createDefaultSlots(),
    "2024-10-26": createDefaultSlots(),
    "2024-10-27": createDefaultSlots(),
  };
}

export const INITIAL_PROVIDERS: Provider[] = [
  {
    id: "glow-studio",
    name: "Glow Studio Salon",
    category: "Salon & Spa",
    badgeLabel: "Hair & Beauty",
    shortTagline: "Salon & Spa • Downtown",
    description:
      "Award-winning boutique studio specializing in contemporary hair design, artisanal color glazes, and restorative scalp therapy.",
    location: "Downtown Metro",
    distance: "1.2 mi",
    distanceMiles: 1.2,
    rating: 4.9,
    reviewsCount: 142,
    priceTier: "$$",
    startingPrice: 45,
    startingPriceDisplay: "From $45",
    verified: true,
    topRated: true,
    openNowLabel: "Open Now • Free Parking",
    instantConfirmation: true,
    availabilityPillLabel: "Instant",
    availabilityStatusTone: "secondary",
    nextAvailableLabel: "Today 3:30 PM",
    nextSlotIsToday: true,
    tags: ["Balayage", "Precision Cut", "Scalp Spa"],
    thumbUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD710pXuMVdofmA0YJ9E5QBHr2vKPAk6deXIQ-uDeS9mcv3qwnLo3P_86c5St-airVg-c651REHCJrDHk1uAtLdg0fOaLeAr1j7YqUmlcH8j0W5Sms9Yy4ZtOKlQh3u10k00jE7yNAaP7DAClMSsallSlHQc6liDoUU5q_MGe6YXeM4TSQpm4FBDLosFv_DH9sclkFKbiKMYKMX5OLaFlNgY8ePu-hcHCC9LrEROd0",
    exploreThumbUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDX4_md5rP1yv5xmqarkgwaU3tw4xbaj2h1bIU-zfMwR-rmVh1fmekpVGV-0KjDpkFP6wdaIkaGwJP1OEyL6vcoyJp4Ph_j2K0RhKIOUX9Om_9TrJrA-xK5o_NxFBCVO-swzMtBWOh28Apks04J1gUMlE-Fx5nDtU5qZD6-7TqOq9SgCZ1VY-CmogSOgkiue7r8yGwgD05frbNgj6V4n53X6bdM8wp7BCdLXkVUYNU",
    heroUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDdXJUdzWty2L956zzQXJkfqUe_BWk0O3JL76S5S2Tx6qicNnMiHnrCgMn0RIv7zjz80CznxoJrHYMSK9ntnBUCCvyfxGYSO2loh6CmeWRzYx-Yw9gy85daFQEQfeF4K3F3aJ8gXUa0hmSVsYyCg7Yf5HYr_j4kdqbi8eCXpT5Xc568mSoVP-OuXwJZmvBG-A8Cda2fkPE5mRTyin_j68RzG6PKSu2KFpWwPVz454U",
    services: [
      {
        id: "glow-cut",
        name: "Signature Haircut & Styling",
        price: 55,
        priceLabel: "$55",
        duration: "45 min",
        icon: "content_cut",
      },
      {
        id: "glow-balayage",
        name: "Balayage & Color Gloss",
        price: 135,
        priceLabel: "$135",
        duration: "120 min",
        icon: "palette",
      },
      {
        id: "glow-spa",
        name: "Deep Nourishing Hair Spa",
        price: 40,
        priceLabel: "$40",
        duration: "30 min",
        icon: "water_drop",
      },
    ],
    slotsByDate: buildWeekSlots(),
  },
  {
    id: "zen-yoga",
    name: "Zen Yoga Studio",
    category: "Fitness & Yoga",
    badgeLabel: "Wellness & Fitness",
    shortTagline: "Wellness & Fitness • Midtown",
    description:
      "Sunlit bamboo sanctuary offering mindful Vinyasa flows, restorative breathwork, and private 1-on-1 alignment coaching.",
    location: "Downtown Metro",
    distance: "0.8 mi",
    distanceMiles: 0.8,
    rating: 4.9,
    reviewsCount: 98,
    priceTier: "$",
    startingPrice: 25,
    startingPriceDisplay: "From $25",
    verified: true,
    topRated: true,
    openNowLabel: "Open Now • Mats Included",
    instantConfirmation: true,
    availabilityPillLabel: "3 spots left",
    availabilityStatusTone: "neutral",
    nextAvailableLabel: "Today 5:15 PM",
    nextSlotIsToday: true,
    tags: ["Vinyasa Flow", "Private Session"],
    thumbUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDqV6yIOpawuSrImm4BiZCzVbBLzAlfPVnJCPFcMCkl_mxIp-wLT3WkudBTTTOdeYxOWTx76DXByGrJU0VSgwPeuCb__kaDiXNgsxsK2NLvMYmjCPoQQElftWJJSBgxVlJRAB5waA3tZk42k7uC7Embz9IJjJT4P0rXY7LEXpV-JcBk4FxJZ_3Y70Rd-gtEOvQesUqgid-COOibRLEhwX-DbGiWg1CVcaT6dBbNGyY",
    exploreThumbUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDqV6yIOpawuSrImm4BiZCzVbBLzAlfPVnJCPFcMCkl_mxIp-wLT3WkudBTTTOdeYxOWTx76DXByGrJU0VSgwPeuCb__kaDiXNgsxsK2NLvMYmjCPoQQElftWJJSBgxVlJRAB5waA3tZk42k7uC7Embz9IJjJT4P0rXY7LEXpV-JcBk4FxJZ_3Y70Rd-gtEOvQesUqgid-COOibRLEhwX-DbGiWg1CVcaT6dBbNGyY",
    heroUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDqV6yIOpawuSrImm4BiZCzVbBLzAlfPVnJCPFcMCkl_mxIp-wLT3WkudBTTTOdeYxOWTx76DXByGrJU0VSgwPeuCb__kaDiXNgsxsK2NLvMYmjCPoQQElftWJJSBgxVlJRAB5waA3tZk42k7uC7Embz9IJjJT4P0rXY7LEXpV-JcBk4FxJZ_3Y70Rd-gtEOvQesUqgid-COOibRLEhwX-DbGiWg1CVcaT6dBbNGyY",
    services: [
      {
        id: "zen-vinyasa",
        name: "Vinyasa Flow Group Class",
        price: 25,
        priceLabel: "$25",
        duration: "60 min",
        icon: "self_improvement",
      },
      {
        id: "zen-private",
        name: "Private 1-on-1 Alignment",
        price: 75,
        priceLabel: "$75",
        duration: "60 min",
        icon: "fitness_center",
      },
      {
        id: "zen-sound",
        name: "Evening Breath & Sound Bath",
        price: 35,
        priceLabel: "$35",
        duration: "45 min",
        icon: "spa",
      },
    ],
    slotsByDate: buildWeekSlots({ "02:15 PM": false, "03:30 PM": false, "05:30 PM": true }),
  },
  {
    id: "quickfix-auto",
    name: "QuickFix Auto Care",
    category: "Auto Care",
    badgeLabel: "Auto Service",
    shortTagline: "Maintenance & Diagnostics • Westside",
    description:
      "Certified diagnostic bays with transparent upfront estimates, synthetic oil express service, and digital multi-point inspections.",
    location: "Westside",
    distance: "3.1 mi",
    distanceMiles: 3.1,
    rating: 4.8,
    reviewsCount: 215,
    priceTier: "$$",
    startingPrice: 65,
    startingPriceDisplay: "From $65",
    verified: true,
    topRated: false,
    openNowLabel: "Open Now • Express Bay",
    instantConfirmation: true,
    availabilityPillLabel: "Express Bay",
    availabilityStatusTone: "secondary",
    nextAvailableLabel: "Today 4:00 PM",
    nextSlotIsToday: true,
    tags: ["Synthetic Oil Change", "Brake Inspection"],
    thumbUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA1Wckg9oQ_BZK5o72k6euCYcK_AVPxsOnqCZtXGpsQSchO8EW9q_AyBiLyWibbBVWni9WwH6bt70ugIcW0Zx-ozkrGI4EAPCzIsNTuCbD5MHTRpkqSNW5YAk8LUehKWsQBtmE_ffQgLTzBSYsOzTyZwL1pDGCGsehzxgB0b7sU7-4HneTTvcf6dCDZ4Ayz2xvJBiW_ncI8zgrRJyIqx2y3BkrWckM7XKSJSxOA990",
    exploreThumbUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA0VhHomUybi3tExMf38kiz2fM-LazLm_gDiN16JJwSO56oDV32RC9EDDEeiOXGfZxjK0ExgVsaSmL63Tk5CucAJvi6WbjSusqPnlinXLimVDa3VQj4aoUibFEmc5hLFGek7GBergQi8xx3ZLnBxqaM4cw4MyZBe5dKf0xKG3lAc9P4YUPLxnab3K3l0itE9iPNTlE7yCcliZxQ3SJDCX0Q6HtX5plaxTLH8IC5L1o",
    heroUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA0VhHomUybi3tExMf38kiz2fM-LazLm_gDiN16JJwSO56oDV32RC9EDDEeiOXGfZxjK0ExgVsaSmL63Tk5CucAJvi6WbjSusqPnlinXLimVDa3VQj4aoUibFEmc5hLFGek7GBergQi8xx3ZLnBxqaM4cw4MyZBe5dKf0xKG3lAc9P4YUPLxnab3K3l0itE9iPNTlE7yCcliZxQ3SJDCX0Q6HtX5plaxTLH8IC5L1o",
    services: [
      {
        id: "auto-oil",
        name: "Full Synthetic Oil Change",
        price: 65,
        priceLabel: "$65",
        duration: "35 min",
        icon: "oil_barrel",
      },
      {
        id: "auto-diag",
        name: "Maintenance & Diagnostics",
        price: 89,
        priceLabel: "$89",
        duration: "60 min",
        icon: "build",
      },
      {
        id: "auto-brake",
        name: "Brake & Tire Safety Check",
        price: 45,
        priceLabel: "$45",
        duration: "30 min",
        icon: "directions_car",
      },
    ],
    slotsByDate: buildWeekSlots({ "09:30 AM": false, "04:45 PM": true }),
  },
  {
    id: "brightpath-tutoring",
    name: "BrightPath Tutoring",
    category: "Tutoring & Prep",
    badgeLabel: "Education",
    shortTagline: "Math & SAT Prep • Online / In-person",
    description:
      "Personalized academic coaching for Calculus, AP Sciences, and SAT/ACT mastery with interactive whiteboard sessions.",
    location: "Online & In-Person",
    distance: "2.0 mi",
    distanceMiles: 2.0,
    rating: 5.0,
    reviewsCount: 87,
    priceTier: "$$",
    startingPrice: 60,
    startingPriceDisplay: "$60/hr",
    priceUnit: "standard",
    verified: true,
    topRated: true,
    openNowLabel: "Virtual & Studio Ready",
    instantConfirmation: true,
    availabilityPillLabel: "Virtual Room",
    availabilityStatusTone: "primary",
    nextAvailableLabel: "Tomorrow 10:00 AM",
    nextSlotIsToday: false,
    tags: ["Math & SAT Prep", "AP Science", "Essay Coaching"],
    thumbUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBHPeFAzL9lWwPKf7l1AtGGr_z-DGIRTuBOIfvFAxqS_FOjz6RIbVSYNYr0TLR-RkkObFR8PPvYwb4OK6WL9oPBgvrrhQhBN58WDTnruJ2oBEYx-NB2fimprA3DtaR36a_I0qLFlryN46Hh_mLrkkK0nco5bpYf-d67YWY3-N2vqPGOwuKQI1ftLIhJFrxbSzd0SSvmdqr7W_DrYsirNbJu3vBF5FLb1ajYb-u1GnY",
    exploreThumbUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDGKVjkJoVQLVZewazJgiUpf8h18o_yo365GESDCavzKeb1ziAMc2dAZZhyW2PW2ugM-BUXq8qRNrXx26Nzo7Lo6_d9ADkjX1a2xqeDwuUxCs4CNYQeZ8C6R2RfYQ1BUoYS_WRA3A0s5qSgkE-ilbukfymojZabrGX318P1yhaNBoajOB3LR27QGczNpGwpBQ5bsraPoEJlZt4crq50ioRitiPGhYFRM-M8c0WJJyY",
    heroUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDGKVjkJoVQLVZewazJgiUpf8h18o_yo365GESDCavzKeb1ziAMc2dAZZhyW2PW2ugM-BUXq8qRNrXx26Nzo7Lo6_d9ADkjX1a2xqeDwuUxCs4CNYQeZ8C6R2RfYQ1BUoYS_WRA3A0s5qSgkE-ilbukfymojZabrGX318P1yhaNBoajOB3LR27QGczNpGwpBQ5bsraPoEJlZt4crq50ioRitiPGhYFRM-M8c0WJJyY",
    services: [
      {
        id: "bp-sat",
        name: "SAT & Math Mastery Session",
        price: 60,
        priceLabel: "$60",
        duration: "60 min",
        icon: "school",
      },
      {
        id: "bp-stem",
        name: "AP Calculus / Physics Prep",
        price: 75,
        priceLabel: "$75",
        duration: "60 min",
        icon: "calculate",
      },
      {
        id: "bp-essay",
        name: "College Essay Review",
        price: 55,
        priceLabel: "$55",
        duration: "45 min",
        icon: "edit_note",
      },
    ],
    slotsByDate: buildWeekSlots(
      { "09:30 AM": false, "11:30 AM": false, "02:15 PM": false, "03:30 PM": false, "04:45 PM": false, "05:30 PM": false },
      { "10:15 AM": true, "11:30 AM": true, "02:15 PM": true }
    ),
  },
  {
    id: "legalease",
    name: "LegalEase Consultations",
    category: "Legal & Consulting",
    badgeLabel: "Legal & Business",
    shortTagline: "Business & Contracts • Downtown",
    description:
      "Startup-friendly legal advisory for incorporation, IP protection, SaaS contracts, and founder agreements with transparent flat intro rates.",
    location: "Downtown Metro",
    distance: "1.6 mi",
    distanceMiles: 1.6,
    rating: 4.7,
    reviewsCount: 62,
    priceTier: "$$$",
    startingPrice: 120,
    startingPriceDisplay: "$120/hr",
    priceUnit: "retainer intro",
    verified: true,
    topRated: false,
    openNowLabel: "In-Office & Video",
    instantConfirmation: true,
    availabilityPillLabel: "In-office",
    availabilityStatusTone: "neutral",
    nextAvailableLabel: "Friday 2:00 PM",
    nextSlotIsToday: false,
    tags: ["Contract Review", "Startup Formation"],
    thumbUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDbp_ynGsJ7D2DZkkDqV7Z-QogGiLykmsmbQY936x44XjVlT1M2OrkJe8hS98xD9G8scF5ERYJ3GsTyzoFN0ZrU1NTzTueY_IPOrAnnRnlgo-a2PRIWcdmVFGuCfcR_OdNFGVCXk5d7fxKjO3Xwt-wZsa0kFZTCWVDJW2R_Nd7AKAmwANBqJacrD8xAJex4PuwYYCwZWoHq-5RyITwT8dpruKn-v2x5-SmCVKmaaR8",
    exploreThumbUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDbp_ynGsJ7D2DZkkDqV7Z-QogGiLykmsmbQY936x44XjVlT1M2OrkJe8hS98xD9G8scF5ERYJ3GsTyzoFN0ZrU1NTzTueY_IPOrAnnRnlgo-a2PRIWcdmVFGuCfcR_OdNFGVCXk5d7fxKjO3Xwt-wZsa0kFZTCWVDJW2R_Nd7AKAmwANBqJacrD8xAJex4PuwYYCwZWoHq-5RyITwT8dpruKn-v2x5-SmCVKmaaR8",
    heroUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDbp_ynGsJ7D2DZkkDqV7Z-QogGiLykmsmbQY936x44XjVlT1M2OrkJe8hS98xD9G8scF5ERYJ3GsTyzoFN0ZrU1NTzTueY_IPOrAnnRnlgo-a2PRIWcdmVFGuCfcR_OdNFGVCXk5d7fxKjO3Xwt-wZsa0kFZTCWVDJW2R_Nd7AKAmwANBqJacrD8xAJex4PuwYYCwZWoHq-5RyITwT8dpruKn-v2x5-SmCVKmaaR8",
    services: [
      {
        id: "legal-intro",
        name: "Startup Retainer Intro",
        price: 120,
        priceLabel: "$120",
        duration: "60 min",
        icon: "gavel",
      },
      {
        id: "legal-contract",
        name: "MSA & NDA Contract Review",
        price: 185,
        priceLabel: "$185",
        duration: "90 min",
        icon: "description",
      },
    ],
    slotsByDate: buildWeekSlots(
      { "09:30 AM": false, "11:30 AM": false, "02:15 PM": false, "03:30 PM": false, "04:45 PM": false, "05:30 PM": false },
      { "09:30 AM": false, "11:30 AM": false }
    ),
  },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: "bk-101",
    confirmationCode: "SW-8492",
    providerId: "zen-yoga",
    providerName: "Zen Yoga Studio",
    providerImage: INITIAL_PROVIDERS[1].thumbUrl,
    providerLocation: "Downtown Metro • 0.8 mi",
    serviceId: "zen-vinyasa",
    serviceName: "Vinyasa Flow Group Class",
    price: 25,
    priceLabel: "$25",
    duration: "60 min",
    dateKey: "2024-10-19",
    dateLabel: "Thu, Oct 19",
    time: "09:30 AM",
    status: "confirmed",
    customerName: "Alex Morgan",
    createdAt: "2024-10-17T14:20:00Z",
  },
  {
    id: "bk-102",
    confirmationCode: "SW-7315",
    providerId: "glow-studio",
    providerName: "Glow Studio Salon",
    providerImage: INITIAL_PROVIDERS[0].thumbUrl,
    providerLocation: "Downtown Metro • 1.2 mi",
    serviceId: "glow-spa",
    serviceName: "Deep Nourishing Hair Spa",
    price: 40,
    priceLabel: "$40",
    duration: "30 min",
    dateKey: "2024-10-16",
    dateLabel: "Mon, Oct 16",
    time: "11:30 AM",
    status: "completed",
    customerName: "Alex Morgan",
    createdAt: "2024-10-14T10:15:00Z",
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Upcoming Session Tomorrow",
    message: "Zen Yoga Studio — Vinyasa Flow at 09:30 AM (SW-8492).",
    timeAgo: "12m ago",
    read: false,
    icon: "event_upcoming",
  },
  {
    id: "notif-2",
    title: "$10 Welcome Credit Ready",
    message: "Sign up or book any provider today to apply your first-booking credit.",
    timeAgo: "2h ago",
    read: false,
    icon: "redeem",
  },
];
