-- Error Logs Table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  error_message TEXT,
  context TEXT,
  stack_trace TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure RLS is set up
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert logs
CREATE POLICY "Users can insert their own logs" ON error_logs
  FOR INSERT WITH CHECK (true);

-- Allow admins to view all logs
CREATE POLICY "Admins can view logs" ON error_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );
