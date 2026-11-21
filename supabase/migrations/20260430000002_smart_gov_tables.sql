-- Create missing tables for Smart Government Platform

-- 1. user_requests
CREATE TABLE IF NOT EXISTS user_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    service_id UUID, -- References government_services
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Completed', 'Rejected')),
    type TEXT DEFAULT 'General',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    request_id UUID, -- References user_requests (nullable)
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., 'PDF', 'Contract', 'Request'
    url TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure mapping for notifications is also possible and triggers work
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_user_requests_updated ON user_requests;
CREATE TRIGGER tr_user_requests_updated
BEFORE UPDATE ON user_requests
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

DROP TRIGGER IF EXISTS tr_documents_updated ON documents;
CREATE TRIGGER tr_documents_updated
BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
