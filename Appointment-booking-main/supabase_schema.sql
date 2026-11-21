-- ============================================================================
-- SLOTWISE APPOINTMENT BOOKING PLATFORM - SUPABASE POSTGRESQL SCHEMA
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. DROP EXISTING TABLES (Safe Re-run)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================================
-- 3. TABLES DEFINITION
-- ============================================================================

-- PROFILES (Syncs with Supabase Auth or stores app users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT DEFAULT 'https://lh3.googleusercontent.com/aida-public/AB6AXuACCnZwDxNb18UuNnI1cMmc77mFM1uqKBysoNqqbzbtk28YMpSZhjGfNhLgJZGLASvkBoWC88tAQ0MTw7BTJV75kNvN-paNm8N3JPVYo1lsHzxZabds_T6LJetOKuelwT70e2-y6bk6HkfZGDxuI2P0ef4wuMRSGYJk5Ui0LTIJ632r_yc_ZXsX9h7vRWIO2lhl1l53LqMf2hsL4oWTi5rD0CDXrQpcEdM_IHjNh0I',
    welcome_discount_available BOOLEAN DEFAULT TRUE,
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'provider')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PROVIDERS (Studios, Salons, Tutors, Mechanics, Consultants)
CREATE TABLE providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Salon & Spa', 'Tutoring & Prep', 'Auto Care', 'Fitness & Yoga', 'Legal & Consulting')),
    badge_label TEXT,
    short_tagline TEXT,
    description TEXT,
    location TEXT NOT NULL,
    distance TEXT,
    distance_miles NUMERIC(4, 2) DEFAULT 0.0,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    price_tier TEXT CHECK (price_tier IN ('$', '$$', '$$$')) DEFAULT '$$',
    starting_price NUMERIC(10, 2) NOT NULL,
    starting_price_display TEXT NOT NULL,
    price_unit TEXT,
    verified BOOLEAN DEFAULT FALSE,
    top_rated BOOLEAN DEFAULT FALSE,
    open_now_label TEXT,
    instant_confirmation BOOLEAN DEFAULT TRUE,
    availability_pill_label TEXT,
    availability_status_tone TEXT CHECK (availability_status_tone IN ('secondary', 'neutral', 'primary')) DEFAULT 'neutral',
    next_available_label TEXT,
    next_slot_is_today BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}'::TEXT[],
    thumb_url TEXT,
    explore_thumb_url TEXT,
    hero_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SERVICES (Services offered by each provider)
CREATE TABLE services (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    price_label TEXT NOT NULL,
    duration TEXT NOT NULL,
    icon TEXT DEFAULT 'calendar_today',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TIME SLOTS (Availability slots per provider and date)
CREATE TABLE time_slots (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    date_key TEXT NOT NULL, -- e.g. '2024-10-18'
    time TEXT NOT NULL,     -- e.g. '09:30 AM'
    period TEXT CHECK (period IN ('Morning', 'Afternoon', 'Evening')) NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_provider_slot UNIQUE (provider_id, date_key, time)
);

-- BOOKINGS (Customer appointments)
CREATE TABLE bookings (
    id TEXT PRIMARY KEY DEFAULT ('bk-' || substr(md5(random()::text), 1, 8)),
    confirmation_code TEXT UNIQUE NOT NULL, -- e.g. 'SW-8492'
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    provider_name TEXT NOT NULL,
    provider_image TEXT,
    provider_location TEXT,
    service_id TEXT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    service_name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    price_label TEXT NOT NULL,
    duration TEXT NOT NULL,
    date_key TEXT NOT NULL,  -- e.g. '2024-10-19'
    date_label TEXT NOT NULL, -- e.g. 'Thu, Oct 19'
    time TEXT NOT NULL,       -- e.g. '09:30 AM'
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- FAVORITES (User bookmarked providers)
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_provider_favorite UNIQUE (user_id, provider_id)
);

-- NOTIFICATIONS (User appointment alerts and announcements)
CREATE TABLE notifications (
    id TEXT PRIMARY KEY DEFAULT ('notif-' || substr(md5(random()::text), 1, 6)),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    time_ago TEXT DEFAULT 'Just now',
    read BOOLEAN DEFAULT FALSE,
    icon TEXT DEFAULT 'notifications',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 4. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX idx_providers_category ON providers(category);
CREATE INDEX idx_services_provider ON services(provider_id);
CREATE INDEX idx_time_slots_provider_date ON time_slots(provider_id, date_key);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_provider ON bookings(provider_id);
CREATE INDEX idx_bookings_code ON bookings(confirmation_code);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- ============================================================================
-- 5. AUTOMATIC TIMESTAMPS & USER PROFILE TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at
BEFORE UPDATE ON providers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new Supabase Auth sign-ups automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, avatar_url, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://lh3.googleusercontent.com/aida-public/AB6AXuACCnZwDxNb18UuNnI1cMmc77mFM1uqKBysoNqqbzbtk28YMpSZhjGfNhLgJZGLASvkBoWC88tAQ0MTw7BTJV75kNvN-paNm8N3JPVYo1lsHzxZabds_T6LJetOKuelwT70e2-y6bk6HkfZGDxuI2P0ef4wuMRSGYJk5Ui0LTIJ632r_yc_ZXsX9h7vRWIO2lhl1l53LqMf2hsL4oWTi5rD0CDXrQpcEdM_IHjNh0I'),
        'customer'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Providers, Services & Slots: Everyone (anon & authenticated) can view
CREATE POLICY "Allow public read on providers" ON providers FOR SELECT USING (true);
CREATE POLICY "Allow public read on services" ON services FOR SELECT USING (true);
CREATE POLICY "Allow public read on time_slots" ON time_slots FOR SELECT USING (true);

-- Allow authenticated users / admins to manage slots & providers
CREATE POLICY "Allow authenticated update on time_slots" ON time_slots FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert/update on providers" ON providers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert/update on services" ON services FOR ALL USING (auth.role() = 'authenticated');

-- Profiles: Users can view and update their own profile; public can view basic names
CREATE POLICY "Public read basic profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Bookings: Customers can view their own bookings, create bookings, or query by confirmation code
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (
    auth.uid() = user_id OR auth.role() = 'authenticated' OR user_id IS NULL
);
CREATE POLICY "Anyone can create bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users/Admins can update bookings" ON bookings FOR UPDATE USING (
    auth.uid() = user_id OR auth.role() = 'authenticated'
);

-- Favorites: Users manage their own favorites
CREATE POLICY "Users view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

-- Notifications: Users view and update their own notifications
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 7. INITIAL SEED DATA
-- ============================================================================

-- 7.1 Providers
INSERT INTO providers (
    id, name, category, badge_label, short_tagline, description, location, distance,
    distance_miles, rating, reviews_count, price_tier, starting_price, starting_price_display,
    price_unit, verified, top_rated, open_now_label, instant_confirmation,
    availability_pill_label, availability_status_tone, next_available_label, next_slot_is_today,
    tags, thumb_url, explore_thumb_url, hero_url
) VALUES
(
    'glow-studio',
    'Glow Studio Salon',
    'Salon & Spa',
    'Hair & Beauty',
    'Salon & Spa • Downtown',
    'Award-winning boutique studio specializing in contemporary hair design, artisanal color glazes, and restorative scalp therapy.',
    'Downtown Metro',
    '1.2 mi',
    1.2,
    4.9,
    142,
    '$$',
    45,
    'From $45',
    NULL,
    TRUE,
    TRUE,
    'Open Now • Free Parking',
    TRUE,
    'Instant',
    'secondary',
    'Today 3:30 PM',
    TRUE,
    ARRAY['Balayage', 'Precision Cut', 'Scalp Spa'],
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD710pXuMVdofmA0YJ9E5QBHr2vKPAk6deXIQ-uDeS9mcv3qwnLo3P_86c5St-airVg-c651REHCJrDHk1uAtLdg0fOaLeAr1j7YqUmlcH8j0W5Sms9Yy4ZtOKlQh3u10k00jE7yNAaP7DAClMSsallSlHQc6liDoUU5q_MGe6YXeM4TSQpm4FBDLosFv_DH9sclkFKbiKMYKMX5OLaFlNgY8ePu-hcHCC9LrEROd0',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDX4_md5rP1yv5xmqarkgwaU3tw4xbaj2h1bIU-zfMwR-rmVh1fmekpVGV-0KjDpkFP6wdaIkaGwJP1OEyL6vcoyJp4Ph_j2K0RhKIOUX9Om_9TrJrA-xK5o_NxFBCVO-swzMtBWOh28Apks04J1gUMlE-Fx5nDtU5qZD6-7TqOq9SgCZ1VY-CmogSOgkiue7r8yGwgD05frbNgj6V4n53X6bdM8wp7BCdLXkVUYNU',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDdXJUdzWty2L956zzQXJkfqUe_BWk0O3JL76S5S2Tx6qicNnMiHnrCgMn0RIv7zjz80CznxoJrHYMSK9ntnBUCCvyfxGYSO2loh6CmeWRzYx-Yw9gy85daFQEQfeF4K3F3aJ8gXUa0hmSVsYyCg7Yf5HYr_j4kdqbi8eCXpT5Xc568mSoVP-OuXwJZmvBG-A8Cda2fkPE5mRTyin_j68RzG6PKSu2KFpWwPVz454U'
),
(
    'zen-yoga',
    'Zen Yoga Studio',
    'Fitness & Yoga',
    'Wellness & Fitness',
    'Wellness & Fitness • Midtown',
    'Sunlit bamboo sanctuary offering mindful Vinyasa flows, restorative breathwork, and private 1-on-1 alignment coaching.',
    'Downtown Metro',
    '0.8 mi',
    0.8,
    4.9,
    98,
    '$',
    25,
    'From $25',
    NULL,
    TRUE,
    TRUE,
    'Open Now • Mats Included',
    TRUE,
    '3 spots left',
    'neutral',
    'Today 5:15 PM',
    TRUE,
    ARRAY['Vinyasa Flow', 'Private Session'],
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDqV6yIOpawuSrImm4BiZCzVbBLzAlfPVnJCPFcMCkl_mxIp-wLT3WkudBTTTOdeYxOWTx76DXByGrJU0VSgwPeuCb__kaDiXNgsxsK2NLvMYmjCPoQQElftWJJSBgxVlJRAB5waA3tZk42k7uC7Embz9IJjJT4P0rXY7LEXpV-JcBk4FxJZ_3Y70Rd-gtEOvQesUqgid-COOibRLEhwX-DbGiWg1CVcaT6dBbNGyY',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDqV6yIOpawuSrImm4BiZCzVbBLzAlfPVnJCPFcMCkl_mxIp-wLT3WkudBTTTOdeYxOWTx76DXByGrJU0VSgwPeuCb__kaDiXNgsxsK2NLvMYmjCPoQQElftWJJSBgxVlJRAB5waA3tZk42k7uC7Embz9IJjJT4P0rXY7LEXpV-JcBk4FxJZ_3Y70Rd-gtEOvQesUqgid-COOibRLEhwX-DbGiWg1CVcaT6dBbNGyY',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDqV6yIOpawuSrImm4BiZCzVbBLzAlfPVnJCPFcMCkl_mxIp-wLT3WkudBTTTOdeYxOWTx76DXByGrJU0VSgwPeuCb__kaDiXNgsxsK2NLvMYmjCPoQQElftWJJSBgxVlJRAB5waA3tZk42k7uC7Embz9IJjJT4P0rXY7LEXpV-JcBk4FxJZ_3Y70Rd-gtEOvQesUqgid-COOibRLEhwX-DbGiWg1CVcaT6dBbNGyY'
),
(
    'quickfix-auto',
    'QuickFix Auto Care',
    'Auto Care',
    'Auto Service',
    'Maintenance & Diagnostics • Westside',
    'Certified diagnostic bays with transparent upfront estimates, synthetic oil express service, and digital multi-point inspections.',
    'Westside',
    '3.1 mi',
    3.1,
    4.8,
    215,
    '$$',
    65,
    'From $65',
    NULL,
    TRUE,
    FALSE,
    'Open Now • Express Bay',
    TRUE,
    'Express Bay',
    'secondary',
    'Today 4:00 PM',
    TRUE,
    ARRAY['Synthetic Oil Change', 'Brake Inspection'],
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA1Wckg9oQ_BZK5o72k6euCYcK_AVPxsOnqCZtXGpsQSchO8EW9q_AyBiLyWibbBVWni9WwH6bt70ugIcW0Zx-ozkrGI4EAPCzIsNTuCbD5MHTRpkqSNW5YAk8LUehKWsQBtmE_ffQgLTzBSYsOzTyZwL1pDGCGsehzxgB0b7sU7-4HneTTvcf6dCDZ4Ayz2xvJBiW_ncI8zgrRJyIqx2y3BkrWckM7XKSJSxOA990',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA0VhHomUybi3tExMf38kiz2fM-LazLm_gDiN16JJwSO56oDV32RC9EDDEeiOXGfZxjK0ExgVsaSmL63Tk5CucAJvi6WbjSusqPnlinXLimVDa3VQj4aoUibFEmc5hLFGek7GBergQi8xx3ZLnBxqaM4cw4MyZBe5dKf0xKG3lAc9P4YUPLxnab3K3l0itE9iPNTlE7yCcliZxQ3SJDCX0Q6HtX5plaxTLH8IC5L1o',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA0VhHomUybi3tExMf38kiz2fM-LazLm_gDiN16JJwSO56oDV32RC9EDDEeiOXGfZxjK0ExgVsaSmL63Tk5CucAJvi6WbjSusqPnlinXLimVDa3VQj4aoUibFEmc5hLFGek7GBergQi8xx3ZLnBxqaM4cw4MyZBe5dKf0xKG3lAc9P4YUPLxnab3K3l0itE9iPNTlE7yCcliZxQ3SJDCX0Q6HtX5plaxTLH8IC5L1o'
),
(
    'brightpath-tutoring',
    'BrightPath Tutoring',
    'Tutoring & Prep',
    'Education',
    'Math & SAT Prep • Online / In-person',
    'Personalized academic coaching for Calculus, AP Sciences, and SAT/ACT mastery with interactive whiteboard sessions.',
    'Online & In-Person',
    '2.0 mi',
    2.0,
    5.0,
    87,
    '$$',
    60,
    '$60/hr',
    'standard',
    TRUE,
    TRUE,
    'Virtual & Studio Ready',
    TRUE,
    'Virtual Room',
    'primary',
    'Tomorrow 10:00 AM',
    FALSE,
    ARRAY['Math & SAT Prep', 'AP Science', 'Essay Coaching'],
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBHPeFAzL9lWwPKf7l1AtGGr_z-DGIRTuBOIfvFAxqS_FOjz6RIbVSYNYr0TLR-RkkObFR8PPvYwb4OK6WL9oPBgvrrhQhBN58WDTnruJ2oBEYx-NB2fimprA3DtaR36a_I0qLFlryN46Hh_mLrkkK0nco5bpYf-d67YWY3-N2vqPGOwuKQI1ftLIhJFrxbSzd0SSvmdqr7W_DrYsirNbJu3vBF5FLb1ajYb-u1GnY',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDGKVjkJoVQLVZewazJgiUpf8h18o_yo365GESDCavzKeb1ziAMc2dAZZhyW2PW2ugM-BUXq8qRNrXx26Nzo7Lo6_d9ADkjX1a2xqeDwuUxCs4CNYQeZ8C6R2RfYQ1BUoYS_WRA3A0s5qSgkE-ilbukfymojZabrGX318P1yhaNBoajOB3LR27QGczNpGwpBQ5bsraPoEJlZt4crq50ioRitiPGhYFRM-M8c0WJJyY',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDGKVjkJoVQLVZewazJgiUpf8h18o_yo365GESDCavzKeb1ziAMc2dAZZhyW2PW2ugM-BUXq8qRNrXx26Nzo7Lo6_d9ADkjX1a2xqeDwuUxCs4CNYQeZ8C6R2RfYQ1BUoYS_WRA3A0s5qSgkE-ilbukfymojZabrGX318P1yhaNBoajOB3LR27QGczNpGwpBQ5bsraPoEJlZt4crq50ioRitiPGhYFRM-M8c0WJJyY'
),
(
    'legalease',
    'LegalEase Consultations',
    'Legal & Consulting',
    'Legal & Business',
    'Business & Contracts • Downtown',
    'Startup-friendly legal advisory for incorporation, IP protection, SaaS contracts, and founder agreements with transparent flat intro rates.',
    'Downtown Metro',
    '1.6 mi',
    1.6,
    4.7,
    62,
    '$$$',
    120,
    '$120/hr',
    'retainer intro',
    TRUE,
    FALSE,
    'In-Office & Video',
    TRUE,
    'In-office',
    'neutral',
    'Friday 2:00 PM',
    FALSE,
    ARRAY['Contract Review', 'Startup Formation'],
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDbp_ynGsJ7D2DZkkDqV7Z-QogGiLykmsmbQY936x44XjVlT1M2OrkJe8hS98xD9G8scF5ERYJ3GsTyzoFN0ZrU1NTzTueY_IPOrAnnRnlgo-a2PRIWcdmVFGuCfcR_OdNFGVCXk5d7fxKjO3Xwt-wZsa0kFZTCWVDJW2R_Nd7AKAmwANBqJacrD8xAJex4PuwYYCwZWoHq-5RyITwT8dpruKn-v2x5-SmCVKmaaR8',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDbp_ynGsJ7D2DZkkDqV7Z-QogGiLykmsmbQY936x44XjVlT1M2OrkJe8hS98xD9G8scF5ERYJ3GsTyzoFN0ZrU1NTzTueY_IPOrAnnRnlgo-a2PRIWcdmVFGuCfcR_OdNFGVCXk5d7fxKjO3Xwt-wZsa0kFZTCWVDJW2R_Nd7AKAmwANBqJacrD8xAJex4PuwYYCwZWoHq-5RyITwT8dpruKn-v2x5-SmCVKmaaR8',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDbp_ynGsJ7D2DZkkDqV7Z-QogGiLykmsmbQY936x44XjVlT1M2OrkJe8hS98xD9G8scF5ERYJ3GsTyzoFN0ZrU1NTzTueY_IPOrAnnRnlgo-a2PRIWcdmVFGuCfcR_OdNFGVCXk5d7fxKjO3Xwt-wZsa0kFZTCWVDJW2R_Nd7AKAmwANBqJacrD8xAJex4PuwYYCwZWoHq-5RyITwT8dpruKn-v2x5-SmCVKmaaR8'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    starting_price = EXCLUDED.starting_price,
    updated_at = timezone('utc'::text, now());

-- 7.2 Services
INSERT INTO services (id, provider_id, name, price, price_label, duration, icon) VALUES
-- Glow Studio Salon
('glow-cut', 'glow-studio', 'Signature Haircut & Styling', 55, '$55', '45 min', 'content_cut'),
('glow-balayage', 'glow-studio', 'Balayage & Color Gloss', 135, '$135', '120 min', 'palette'),
('glow-spa', 'glow-studio', 'Deep Nourishing Hair Spa', 40, '$40', '30 min', 'water_drop'),

-- Zen Yoga Studio
('zen-vinyasa', 'zen-yoga', 'Vinyasa Flow Group Class', 25, '$25', '60 min', 'self_improvement'),
('zen-private', 'zen-yoga', 'Private 1-on-1 Alignment', 75, '$75', '60 min', 'fitness_center'),
('zen-sound', 'zen-yoga', 'Evening Breath & Sound Bath', 35, '$35', '45 min', 'spa'),

-- QuickFix Auto Care
('auto-oil', 'quickfix-auto', 'Full Synthetic Oil Change', 65, '$65', '35 min', 'oil_barrel'),
('auto-diag', 'quickfix-auto', 'Maintenance & Diagnostics', 89, '$89', '60 min', 'build'),
('auto-brake', 'quickfix-auto', 'Brake & Tire Safety Check', 45, '$45', '30 min', 'directions_car'),

-- BrightPath Tutoring
('bp-sat', 'brightpath-tutoring', 'SAT & Math Mastery Session', 60, '$60', '60 min', 'school'),
('bp-stem', 'brightpath-tutoring', 'AP Calculus / Physics Prep', 75, '$75', '60 min', 'calculate'),
('bp-essay', 'brightpath-tutoring', 'College Essay Review', 55, '$55', '45 min', 'edit_note'),

-- LegalEase Consultations
('legal-intro', 'legalease', 'Startup Retainer Intro', 120, '$120', '60 min', 'gavel'),
('legal-contract', 'legalease', 'MSA & NDA Contract Review', 185, '$185', '90 min', 'description')
ON CONFLICT (id) DO UPDATE SET
    price = EXCLUDED.price,
    price_label = EXCLUDED.price_label;

-- 7.3 Sample Initial Bookings
INSERT INTO bookings (
    id, confirmation_code, provider_id, provider_name, provider_image, provider_location,
    service_id, service_name, price, price_label, duration, date_key, date_label, time,
    status, customer_name, created_at
) VALUES
(
    'bk-101',
    'SW-8492',
    'zen-yoga',
    'Zen Yoga Studio',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDqV6yIOpawuSrImm4BiZCzVbBLzAlfPVnJCPFcMCkl_mxIp-wLT3WkudBTTTOdeYxOWTx76DXByGrJU0VSgwPeuCb__kaDiXNgsxsK2NLvMYmjCPoQQElftWJJSBgxVlJRAB5waA3tZk42k7uC7Embz9IJjJT4P0rXY7LEXpV-JcBk4FxJZ_3Y70Rd-gtEOvQesUqgid-COOibRLEhwX-DbGiWg1CVcaT6dBbNGyY',
    'Downtown Metro • 0.8 mi',
    'zen-vinyasa',
    'Vinyasa Flow Group Class',
    25,
    '$25',
    '60 min',
    '2024-10-19',
    'Thu, Oct 19',
    '09:30 AM',
    'confirmed',
    'Alex Morgan',
    '2024-10-17T14:20:00Z'
),
(
    'bk-102',
    'SW-7315',
    'glow-studio',
    'Glow Studio Salon',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD710pXuMVdofmA0YJ9E5QBHr2vKPAk6deXIQ-uDeS9mcv3qwnLo3P_86c5St-airVg-c651REHCJrDHk1uAtLdg0fOaLeAr1j7YqUmlcH8j0W5Sms9Yy4ZtOKlQh3u10k00jE7yNAaP7DAClMSsallSlHQc6liDoUU5q_MGe6YXeM4TSQpm4FBDLosFv_DH9sclkFKbiKMYKMX5OLaFlNgY8ePu-hcHCC9LrEROd0',
    'Downtown Metro • 1.2 mi',
    'glow-spa',
    'Deep Nourishing Hair Spa',
    40,
    '$40',
    '30 min',
    '2024-10-16',
    'Mon, Oct 16',
    '11:30 AM',
    'completed',
    'Alex Morgan',
    '2024-10-14T10:15:00Z'
)
ON CONFLICT (confirmation_code) DO NOTHING;

-- 7.4 Sample Notifications
INSERT INTO notifications (id, title, message, time_ago, read, icon) VALUES
('notif-1', 'Upcoming Session Tomorrow', 'Zen Yoga Studio — Vinyasa Flow at 09:30 AM (SW-8492).', '12m ago', FALSE, 'event_upcoming'),
('notif-2', '$10 Welcome Credit Ready', 'Sign up or book any provider today to apply your first-booking credit.', '2h ago', FALSE, 'redeem')
ON CONFLICT (id) DO NOTHING;

-- 7.5 Generate Standard Time Slots for Providers across dates
DO $$
DECLARE
    p_id TEXT;
    d_date TEXT;
    dates_array TEXT[] := ARRAY['2024-10-16', '2024-10-17', '2024-10-18', '2024-10-19', '2024-10-20', '2024-10-21', '2024-10-22'];
    slots_record RECORD;
BEGIN
    FOR p_id IN SELECT id FROM providers LOOP
        FOREACH d_date IN ARRAY dates_array LOOP
            INSERT INTO time_slots (provider_id, date_key, time, period, available)
            VALUES
                (p_id, d_date, '09:30 AM', 'Morning', TRUE),
                (p_id, d_date, '10:15 AM', 'Morning', CASE WHEN d_date = '2024-10-18' THEN FALSE ELSE TRUE END),
                (p_id, d_date, '11:30 AM', 'Morning', TRUE),
                (p_id, d_date, '01:00 PM', 'Afternoon', CASE WHEN d_date = '2024-10-18' THEN FALSE ELSE TRUE END),
                (p_id, d_date, '02:15 PM', 'Afternoon', TRUE),
                (p_id, d_date, '03:30 PM', 'Afternoon', TRUE),
                (p_id, d_date, '04:45 PM', 'Afternoon', TRUE),
                (p_id, d_date, '05:30 PM', 'Evening', TRUE),
                (p_id, d_date, '06:15 PM', 'Evening', FALSE)
            ON CONFLICT (provider_id, date_key, time) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;


-- ============================================================================
-- 8. RAG VECTOR DATABASE (PGVECTOR) & CHATBOT LOGGING
-- ============================================================================

-- 8.1 Vector Extension (Supabase pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

-- 8.2 Knowledge Documents Table (Stored with 1536-dimensional embeddings)
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    source_type TEXT NOT NULL DEFAULT 'faq' CHECK (source_type IN ('provider', 'service', 'faq', 'policy', 'admin', 'upload')),
    provider_id TEXT REFERENCES providers(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    chunk_index INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(1536), -- Compatible with OpenAI text-embedding-3-small and text-embedding-ada-002
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index on document_id and category
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_doc_id ON knowledge_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_cat ON knowledge_documents(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_provider ON knowledge_documents(provider_id);

-- 8.3 Chat Logs & Analytics Table
CREATE TABLE IF NOT EXISTS chat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_query TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    retrieved_sources JSONB DEFAULT '[]'::jsonb,
    intent TEXT DEFAULT 'general',
    response_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_logs_conv ON chat_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_user ON chat_logs(user_id);

-- 8.4 RLS for Knowledge Documents & Chat Logs
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on knowledge_documents" ON knowledge_documents FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage on knowledge_documents" ON knowledge_documents FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public insert on chat_logs" ON chat_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow users/admins view own chat_logs" ON chat_logs FOR SELECT USING (
    auth.uid() = user_id OR auth.role() = 'authenticated' OR user_id IS NULL
);

-- 8.5 Semantic Similarity Search RPC Function
CREATE OR REPLACE FUNCTION match_knowledge_documents (
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.28,
  match_count int DEFAULT 5,
  filter_category text DEFAULT NULL,
  filter_provider_id text DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id TEXT,
  title TEXT,
  category TEXT,
  source_type TEXT,
  provider_id TEXT,
  content TEXT,
  chunk_index INTEGER,
  metadata JSONB,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kd.id,
    kd.document_id,
    kd.title,
    kd.category,
    kd.source_type,
    kd.provider_id,
    kd.content,
    kd.chunk_index,
    kd.metadata,
    (1 - (kd.embedding <=> query_embedding))::float AS similarity
  FROM knowledge_documents kd
  WHERE (kd.embedding IS NOT NULL)
    AND (1 - (kd.embedding <=> query_embedding)) > match_threshold
    AND (filter_category IS NULL OR kd.category = filter_category)
    AND (filter_provider_id IS NULL OR kd.provider_id = filter_provider_id)
  ORDER BY kd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 8.6 Seed Verified Knowledge Documents
INSERT INTO knowledge_documents (document_id, title, category, source_type, provider_id, content, chunk_index) VALUES
(
    'doc-kb-glow',
    'Glow Studio Salon - Hair & Beauty',
    'Salon & Spa',
    'provider',
    'glow-studio',
    'Glow Studio Salon is an award-winning boutique studio located in Downtown Metro (1.2 miles away). Rated 4.9 stars across 142 reviews. Services: Signature Haircut & Styling: $55 (45 min duration), Balayage & Color Gloss: $135 (120 min duration), Deep Nourishing Hair Spa: $40 (30 min duration). Features: Instant Confirmation, Open Now with Free Parking. Starting price from $45.',
    0
),
(
    'doc-kb-zen',
    'Zen Yoga Studio - Wellness & Fitness',
    'Fitness & Yoga',
    'provider',
    'zen-yoga',
    'Zen Yoga Studio is a sunlit bamboo sanctuary in Downtown Metro (0.8 miles away). Rated 4.9 stars across 98 reviews. Services: Vinyasa Flow Group Class: $25 (60 min duration), Private 1-on-1 Alignment: $75 (60 min duration), Evening Breath & Sound Bath: $35 (45 min duration). Features: Mats included, instant booking, starting price from $25.',
    0
),
(
    'doc-kb-auto',
    'QuickFix Auto Care - Maintenance & Diagnostics',
    'Auto Care',
    'provider',
    'quickfix-auto',
    'QuickFix Auto Care is a certified diagnostic shop in Westside (3.1 miles away). Rated 4.8 stars across 215 reviews. Services: Full Synthetic Oil Change: $65 (35 min duration), Maintenance & Diagnostics: $89 (60 min duration), Brake & Tire Safety Check: $45 (30 min duration). Features: Express Bay available today, transparent upfront estimates, starting price from $65.',
    0
),
(
    'doc-kb-tutor',
    'BrightPath Tutoring - Math & SAT Prep',
    'Tutoring & Prep',
    'provider',
    'brightpath-tutoring',
    'BrightPath Tutoring offers personalized academic coaching online and in-person (2.0 miles away). Rated 5.0 stars with 87 reviews. Services: SAT & Math Mastery Session: $60/hr (60 min duration), AP Calculus / Physics Prep: $75/hr (60 min duration), College Essay Review: $55 (45 min duration). Features: Virtual whiteboard, verified tutors, starting price $60/hr.',
    0
),
(
    'doc-kb-legal',
    'LegalEase Consultations - Business & Contracts',
    'Legal & Consulting',
    'provider',
    'legalease',
    'LegalEase Consultations provides startup-friendly legal advisory in Downtown Metro (1.6 miles away). Rated 4.7 stars with 62 reviews. Services: Startup Retainer Intro: $120/hr (60 min duration), MSA & NDA Contract Review: $185 (90 min duration). Features: In-office & encrypted video conference, flat rates, starting price from $120/hr.',
    0
),
(
    'doc-kb-booking-instructions',
    'Appointment Booking Instructions & Workflow',
    'Booking Policies',
    'policy',
    NULL,
    'How to book an appointment on SlotWise: 1. Browse studios from the Explore or Providers view, or ask the AI Concierge for recommendations. 2. Select your preferred provider and view their available services. 3. Choose a service and pick an open date from the calendar ribbon. 4. Select an available time slot (Morning, Afternoon, or Evening). 5. Enter your customer details and confirm. 6. Upon booking, you receive an instant confirmation code (format: SW-XXXX), and the appointment appears in My Bookings.',
    0
),
(
    'doc-kb-cancellation-policy',
    'Appointment Cancellation Policy & Refund Rules',
    'Booking Policies',
    'policy',
    NULL,
    'SlotWise Cancellation Policy: Free Cancellation is permitted up to 24 hours prior to the scheduled appointment start time without penalty. Late Cancellations made within 24 hours of the appointment time may be subject to a 25% late cancellation fee at the studio discretion. No-shows without notice are non-refundable. To cancel, navigate to My Bookings, find the appointment card, click Cancel Booking, and confirm.',
    0
),
(
    'doc-kb-rescheduling',
    'Appointment Rescheduling Procedures',
    'Booking Policies',
    'policy',
    NULL,
    'SlotWise Rescheduling Procedure: Appointments may be rescheduled at no additional cost up to 4 hours before the appointment time, subject to the studio available slots. To reschedule: Go to My Bookings, click Reschedule on the active booking, choose a new date and open time slot, and confirm. Your confirmation code (SW-XXXX) remains the same after rescheduling.',
    0
),
(
    'doc-kb-accounts',
    'User Accounts & $10 Welcome Credit',
    'User Accounts',
    'policy',
    NULL,
    'SlotWise User Accounts: Guest bookings are fully supported without an account. Creating an account unlocks saved favorite studios, synchronized booking history across devices, and instant 1-tap rebooking. Welcome Bonus: All newly registered accounts automatically receive a $10 Welcome Booking Credit applicable toward their first service appointment.',
    0
),
(
    'doc-kb-faq',
    'Frequently Asked Questions (FAQ)',
    'FAQ',
    'faq',
    NULL,
    'Frequently Asked Questions: Q: Can I pay at the studio? A: Yes, payment can be settled upon arrival or charged to your card on file. Q: How do I know my booking is confirmed? A: You receive an instant confirmation screen with your SW-XXXX code and an alert in your notifications. Q: Are all providers verified? A: Yes, providers with the Verified badge are certified, insured, and identity-checked. Q: Can I book for someone else? A: Yes, simply enter the recipient name in the Customer Name field during checkout.',
    0
),
(
    'doc-kb-admin',
    'Studio Admin Management & Slot Control Guide',
    'Booking Policies',
    'admin',
    NULL,
    'SlotWise Provider Admin Console Features: Bookings Queue allows studio managers to view active, completed, and cancelled client appointments in real time. Live Slot Management enables toggling individual slots between Open and Blocked. RAG Knowledge Base Management lets admins upload TXT, PDF, and FAQ documents, monitor indexing statistics, and test semantic vector search directly.',
    0
),
(
    'doc-kb-billing',
    'Payment Methods & Billing FAQ',
    'FAQ',
    'faq',
    NULL,
    'Payment & Billing Information: Q: When am I charged for my appointment? A: You can pay at the studio at check-in (cash or card) or charge your card on file upon appointment completion. Q: How do discounts work? A: $10 Welcome Credit is automatically deducted from your total checkout price at the studio. All prices listed on SlotWise are upfront with no hidden booking fees.',
    0
),
(
    'doc-kb-verification',
    'Provider Verification & Safety Standards',
    'FAQ',
    'faq',
    NULL,
    'Verification & Quality Standards: Q: What does the Verified badge mean? A: Service providers with the Verified badge have completed business identity verification, professional credential checks, and adhere to clean studio and insurance requirements. Top Rated studios maintain an average rating of 4.8 stars or higher across verified client reviews.',
    0
)
ON CONFLICT DO NOTHING;
