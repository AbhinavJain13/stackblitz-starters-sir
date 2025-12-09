/*
  # Email System Schema

  1. New Tables
    - `email_threads`
      - `id` (uuid, primary key)
      - `subject` (text) - Email thread subject
      - `participants` (text[]) - Array of email addresses involved
      - `last_message_at` (timestamptz) - Timestamp of last message
      - `created_at` (timestamptz)
      - `user_id` (uuid) - Owner of the thread

    - `emails`
      - `id` (uuid, primary key)
      - `thread_id` (uuid, foreign key) - Reference to email_threads
      - `from_email` (text) - Sender email address
      - `to_email` (text[]) - Recipient email addresses
      - `cc_email` (text[]) - CC recipients
      - `subject` (text) - Email subject
      - `body` (text) - Email body content
      - `is_read` (boolean) - Read status
      - `is_sent` (boolean) - Whether this is a sent email
      - `is_auto_reply` (boolean) - Whether this was auto-generated
      - `created_at` (timestamptz)
      - `user_id` (uuid) - Owner of the email

    - `auto_reply_rules`
      - `id` (uuid, primary key)
      - `name` (text) - Rule name
      - `enabled` (boolean) - Whether rule is active
      - `keyword_match` (text[]) - Keywords to match in subject/body
      - `reply_template` (text) - Template for auto-reply
      - `created_at` (timestamptz)
      - `user_id` (uuid) - Owner of the rule

    - `email_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - User reference
      - `email_address` (text) - User's email address
      - `auto_reply_enabled` (boolean) - Global auto-reply toggle
      - `signature` (text) - Email signature
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create email_threads table
CREATE TABLE IF NOT EXISTS email_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  participants text[] DEFAULT '{}',
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL
);

ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email threads"
  ON email_threads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own email threads"
  ON email_threads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email threads"
  ON email_threads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own email threads"
  ON email_threads FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create emails table
CREATE TABLE IF NOT EXISTS emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES email_threads(id) ON DELETE CASCADE,
  from_email text NOT NULL,
  to_email text[] NOT NULL,
  cc_email text[] DEFAULT '{}',
  subject text NOT NULL,
  body text NOT NULL,
  is_read boolean DEFAULT false,
  is_sent boolean DEFAULT false,
  is_auto_reply boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL
);

ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own emails"
  ON emails FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own emails"
  ON emails FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emails"
  ON emails FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own emails"
  ON emails FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create auto_reply_rules table
CREATE TABLE IF NOT EXISTS auto_reply_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  enabled boolean DEFAULT true,
  keyword_match text[] DEFAULT '{}',
  reply_template text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL
);

ALTER TABLE auto_reply_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own auto reply rules"
  ON auto_reply_rules FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own auto reply rules"
  ON auto_reply_rules FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own auto reply rules"
  ON auto_reply_rules FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own auto reply rules"
  ON auto_reply_rules FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create email_settings table
CREATE TABLE IF NOT EXISTS email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  email_address text NOT NULL,
  auto_reply_enabled boolean DEFAULT false,
  signature text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email settings"
  ON email_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own email settings"
  ON email_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email settings"
  ON email_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own email settings"
  ON email_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emails_thread_id ON emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_user_id ON email_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_reply_rules_user_id ON auto_reply_rules(user_id);