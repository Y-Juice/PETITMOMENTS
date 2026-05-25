-- Moderatiesysteem: meldingen + content warnings
-- Voer uit in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('moment', 'thread')),
  target_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN (
    'spam', 'harassment', 'hate', 'violence', 'nudity', 'misinformation', 'other'
  )),
  details text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, target_type, target_id)
);

ALTER TABLE moments
  ADD COLUMN IF NOT EXISTS content_warning text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'visible'
    CHECK (moderation_status IN ('visible', 'warned', 'hidden', 'removed'));

ALTER TABLE threads
  ADD COLUMN IF NOT EXISTS content_warning text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'visible'
    CHECK (moderation_status IN ('visible', 'warned', 'hidden', 'removed'));

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own reports"
  ON content_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can read own reports"
  ON content_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);
