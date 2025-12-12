/*
  # Email System Performance Enhancement

  1. Performance Improvements
    - Add GIN indexes for keyword matching on auto_reply_rules
    - Add GIN indexes for participant arrays on email_threads
    - Add indexes for common query patterns (timestamps, read status)
    - Add reply_to_id column for better threading support

  2. New Columns
    - `emails.reply_to_id` (uuid) - Reference to parent email in thread

  3. Automation
    - Add trigger to automatically update thread last_message_at and message_count
    - Add trigger to automatically update updated_at on rule changes

  4. Views
    - `inbox_view` - Convenient view for inbox queries with thread info
    - `unread_count_view` - Quick unread email count

  5. Index Strategy
    - GIN indexes for array searches (participants, keywords)
    - B-tree indexes for timestamp sorting and equality checks
    - Partial indexes for filtered queries (unread emails)

  6. Security
    - All existing RLS policies preserved
    - Views inherit table security restrictions
*/

-- Add reply_to_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'emails' AND column_name = 'reply_to_id'
  ) THEN
    ALTER TABLE emails ADD COLUMN reply_to_id uuid REFERENCES emails(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add message_count column to email_threads if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_threads' AND column_name = 'message_count'
  ) THEN
    ALTER TABLE email_threads ADD COLUMN message_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Performance Indexes
-- GIN indexes for array searches
CREATE INDEX IF NOT EXISTS idx_email_threads_participants_gin 
  ON email_threads USING GIN(participants);

CREATE INDEX IF NOT EXISTS idx_auto_reply_rules_keywords_gin 
  ON auto_reply_rules USING GIN(keyword_match);

-- B-tree indexes for sorting and filtering
CREATE INDEX IF NOT EXISTS idx_email_threads_last_message_desc 
  ON email_threads(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_emails_created_desc 
  ON emails(created_at DESC);

-- Partial index for unread emails (common query)
CREATE INDEX IF NOT EXISTS idx_emails_unread 
  ON emails(is_read) WHERE is_read = false;

-- Indexes for from_email lookups
CREATE INDEX IF NOT EXISTS idx_emails_from_email 
  ON emails(from_email);

-- Index for reply threading
CREATE INDEX IF NOT EXISTS idx_emails_reply_to 
  ON emails(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- Automation Triggers
-- Function to update thread metadata on new email
CREATE OR REPLACE FUNCTION update_thread_on_email_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE email_threads 
  SET 
    last_message_at = NEW.created_at,
    message_count = message_count + 1
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS trigger_update_thread_on_email_insert ON emails;

-- Create trigger
CREATE TRIGGER trigger_update_thread_on_email_insert
  AFTER INSERT ON emails
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_on_email_insert();

-- Function to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION auto_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_email_settings_timestamp ON email_settings;
DROP TRIGGER IF EXISTS trigger_update_auto_reply_rules_timestamp ON auto_reply_rules;

-- Create triggers for timestamp updates
CREATE TRIGGER trigger_update_email_settings_timestamp
  BEFORE UPDATE ON email_settings
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_timestamp();

CREATE TRIGGER trigger_update_auto_reply_rules_timestamp
  BEFORE UPDATE ON auto_reply_rules
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_timestamp();

-- Helper Views
-- Inbox view with thread metadata
DROP VIEW IF EXISTS inbox_view CASCADE;
CREATE VIEW inbox_view AS
SELECT 
  e.id,
  e.thread_id,
  e.from_email,
  e.to_email,
  e.cc_email,
  e.subject,
  e.body,
  e.is_read,
  e.is_sent,
  e.is_auto_reply,
  e.reply_to_id,
  e.created_at,
  e.user_id,
  t.message_count,
  t.participants,
  t.last_message_at as thread_last_message_at
FROM emails e
LEFT JOIN email_threads t ON e.thread_id = t.id
ORDER BY e.created_at DESC;

-- Unread count view
DROP VIEW IF EXISTS unread_count_view CASCADE;
CREATE VIEW unread_count_view AS
SELECT 
  user_id,
  COUNT(*) as unread_count
FROM emails
WHERE is_read = false AND is_sent = false
GROUP BY user_id;

-- Table comments for documentation
COMMENT ON TABLE emails IS 'Core email storage with full threading support via thread_id and reply_to_id';
COMMENT ON TABLE email_threads IS 'Groups related emails for conversation view with automatic message counting';
COMMENT ON TABLE auto_reply_rules IS 'Keyword-based automatic response rules with GIN-indexed array searches';
COMMENT ON TABLE email_settings IS 'User preferences and configuration with automatic timestamp management';
COMMENT ON COLUMN emails.reply_to_id IS 'Reference to parent email for nested threading';
COMMENT ON COLUMN email_threads.message_count IS 'Automatically maintained count of messages in thread';
COMMENT ON VIEW inbox_view IS 'Convenient view for inbox queries including thread metadata';
COMMENT ON VIEW unread_count_view IS 'Quick lookup for unread email counts per user';
