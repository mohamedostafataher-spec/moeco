-- 🚀 FULL PERFORMANCE OPTIMIZATION SCRIPT - MoEco

-- 1️⃣ USERS & PROFILES (Primary lookup tables)
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- 2️⃣ CARBON ACTIVITY & LOGS (High Write/Read, filtered by user_id & created_at)
CREATE INDEX IF NOT EXISTS idx_carbon_logs_user_id_created ON carbon_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_carbon_activity_user_created ON carbon_activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_carbon_footprint_logs_user_date ON carbon_footprint_logs(user_id, date DESC);

-- 3️⃣ COMMUNITY & POSTS (Frequent Pagination & Sorting)
CREATE INDEX IF NOT EXISTS idx_community_posts_author_created ON community_posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_created ON community_comments(post_id, created_at DESC);

-- 4️⃣ TRANSACTIONS & BILLS (Wallet & Meter Tracking)
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_created ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_utility_meters_user_id ON utility_meters(user_id);

-- 5️⃣ GOV ALERTS & SERVICES
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_service ON user_favorites(user_id, service_id);
CREATE INDEX IF NOT EXISTS idx_service_usage_logs_user ON service_usage_logs(user_id);

-- 6️⃣ ENVIRONMENTAL DATA (Maps & News)
CREATE INDEX IF NOT EXISTS idx_pollution_hotspots_type ON pollution_hotspots(type);
CREATE INDEX IF NOT EXISTS idx_environmental_reports_user_created ON environmental_reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eco_news_created ON eco_news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_items_created ON news_items(created_at DESC);

-- 7️⃣ TRANSPORT & RIDES
CREATE INDEX IF NOT EXISTS idx_transport_history_user_created ON user_transport_history(user_id, created_at DESC);

-- 8️⃣ CHALLENGES & GAMIFICATION
CREATE INDEX IF NOT EXISTS idx_challenges_created ON challenges(created_at DESC);
