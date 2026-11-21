
-- ==========================================
-- CIVIC PULSE & CROWDFUNDING SYSTEM
-- ==========================================

-- 1. ECO PROPOSALS (Civic Innovation)
CREATE TABLE IF NOT EXISTS public.eco_proposals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    category TEXT, -- 'infrastructure', 'greenery', 'waste', 'energy'
    target_funding INTEGER DEFAULT 0,
    current_funding INTEGER DEFAULT 0,
    votes_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'funded', 'completed'
    image_url TEXT,
    location_name TEXT,
    lat FLOAT,
    lng FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROPOSAL VOTES
CREATE TABLE IF NOT EXISTS public.proposal_votes (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES public.eco_proposals(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(user_id, proposal_id)
);

-- 3. PROPOSAL CONTRIBUTIONS (Crowdfunding)
CREATE TABLE IF NOT EXISTS public.proposal_contributions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES public.eco_proposals(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- contributed in Green Coins
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CITY FEEDBACK (Green Pulse)
CREATE TABLE IF NOT EXISTS public.city_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    governorate TEXT,
    category TEXT, -- 'cleanliness', 'air_quality', 'traffic', 'green_spaces'
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RPC to vote on proposal
CREATE OR REPLACE FUNCTION public.vote_for_proposal(proposal_id_param UUID, user_id_param UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.proposal_votes (user_id, proposal_id)
    VALUES (user_id_param, proposal_id_param);
    
    UPDATE public.eco_proposals
    SET votes_count = votes_count + 1
    WHERE id = proposal_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC to contribute to proposal
CREATE OR REPLACE FUNCTION public.contribute_to_proposal(proposal_id_param UUID, user_id_param UUID, amount_param INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Check if user has enough coins
    IF (SELECT green_coins FROM public.profiles WHERE id = user_id_param) >= amount_param THEN
        -- Add contribution
        INSERT INTO public.proposal_contributions (user_id, proposal_id, amount)
        VALUES (user_id_param, proposal_id_param, amount_param);
        
        -- Update proposal funding
        UPDATE public.eco_proposals
        SET current_funding = current_funding + amount_param
        WHERE id = proposal_id_param;
        
        -- Deduct from user
        UPDATE public.profiles
        SET green_coins = green_coins - amount_param
        WHERE id = user_id_param;
    ELSE
        RAISE EXCEPTION 'Insufficient green coins';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed some initial proposals
INSERT INTO public.eco_proposals (title_ar, title_en, description_ar, description_en, category, target_funding, votes_count, status) VALUES
('محطة شحن شمسية في المعادي', 'Solar Charging Station in Maadi', 'تركيب محطات شحن تعمل بالطاقة الشمسية للهواتف والدراجات الكهربائية.', 'Installing solar-powered charging stations for phones and e-bikes.', 'energy', 10000, 145, 'approved'),
('مبادرة تشجير شوارع مدينة نصر', 'Nasr City Street Greening', 'زراعة 500 شجرة محلية لتقليل درجة الحرارة وتحسين المنظر.', 'Planting 500 native trees to reduce heat and improve aesthetics.', 'greenery', 5000, 230, 'approved'),
('نظام ذكي لفرز النفايات في الإسكندرية', 'Smart Waste Sorting in Alexandria', 'توفير صناديق ذكية تعطي نقاطاً للمواطنين عند الفرز الصحيح.', 'Providing smart bins that reward citizens for correct waste sorting.', 'waste', 15000, 89, 'pending')
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE public.eco_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view proposals" ON public.eco_proposals FOR SELECT USING (true);
CREATE POLICY "Users can create proposals" ON public.eco_proposals FOR INSERT WITH CHECK (auth.uid() = creator_id);

ALTER TABLE public.proposal_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view votes" ON public.proposal_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON public.proposal_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.city_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view feedback" ON public.city_feedback FOR SELECT USING (true);
CREATE POLICY "Users can submit feedback" ON public.city_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
