export interface Email {
  id: string;
  thread_id: string | null;
  from_email: string;
  to_email: string[];
  cc_email: string[];
  subject: string;
  body: string;
  is_read: boolean;
  is_sent: boolean;
  is_auto_reply: boolean;
  reply_to_id: string | null;
  created_at: string;
  user_id: string;
}

export interface EmailThread {
  id: string;
  subject: string;
  participants: string[];
  last_message_at: string;
  message_count: number;
  created_at: string;
  user_id: string;
}

export interface AutoReplyRule {
  id: string;
  name: string;
  enabled: boolean;
  keyword_match: string[];
  reply_template: string;
  created_at: string;
  user_id: string;
}

export interface EmailSettings {
  id: string;
  user_id: string;
  email_address: string;
  auto_reply_enabled: boolean;
  signature: string;
  created_at: string;
  updated_at: string;
}
