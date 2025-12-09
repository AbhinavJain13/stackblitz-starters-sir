import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { Email, EmailThread, AutoReplyRule, EmailSettings } from '../types';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  async getEmails(isSent: boolean = false): Promise<Email[]> {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('is_sent', isSent)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getEmailById(id: string): Promise<Email | null> {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async markAsRead(emailId: string): Promise<void> {
    const { error } = await supabase
      .from('emails')
      .update({ is_read: true })
      .eq('id', emailId);

    if (error) throw error;
  }

  async sendEmail(email: {
    to_email: string[];
    cc_email?: string[];
    subject: string;
    body: string;
    thread_id?: string;
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: settings } = await supabase
      .from('email_settings')
      .select('email_address, signature')
      .eq('user_id', user.id)
      .maybeSingle();

    const fromEmail = settings?.email_address || 'user@example.com';
    const bodyWithSignature = settings?.signature
      ? `${email.body}\n\n${settings.signature}`
      : email.body;

    let threadId = email.thread_id;

    if (!threadId) {
      const { data: thread, error: threadError } = await supabase
        .from('email_threads')
        .insert({
          subject: email.subject,
          participants: [fromEmail, ...email.to_email],
          user_id: user.id
        })
        .select()
        .single();

      if (threadError) throw threadError;
      threadId = thread.id;
    }

    const { error } = await supabase
      .from('emails')
      .insert({
        thread_id: threadId,
        from_email: fromEmail,
        to_email: email.to_email,
        cc_email: email.cc_email || [],
        subject: email.subject,
        body: bodyWithSignature,
        is_sent: true,
        user_id: user.id
      });

    if (error) throw error;
  }

  async getAutoReplyRules(): Promise<AutoReplyRule[]> {
    const { data, error } = await supabase
      .from('auto_reply_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createAutoReplyRule(rule: {
    name: string;
    keyword_match: string[];
    reply_template: string;
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('auto_reply_rules')
      .insert({
        ...rule,
        user_id: user.id
      });

    if (error) throw error;
  }

  async updateAutoReplyRule(id: string, updates: Partial<AutoReplyRule>): Promise<void> {
    const { error } = await supabase
      .from('auto_reply_rules')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  async deleteAutoReplyRule(id: string): Promise<void> {
    const { error } = await supabase
      .from('auto_reply_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getEmailSettings(): Promise<EmailSettings | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('email_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async updateEmailSettings(settings: Partial<EmailSettings>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const existing = await this.getEmailSettings();

    if (existing) {
      const { error } = await supabase
        .from('email_settings')
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('email_settings')
        .insert({
          ...settings,
          user_id: user.id
        });

      if (error) throw error;
    }
  }

  async simulateReceiveEmail(email: {
    from_email: string;
    subject: string;
    body: string;
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: settings } = await supabase
      .from('email_settings')
      .select('email_address')
      .eq('user_id', user.id)
      .maybeSingle();

    const toEmail = settings?.email_address || 'user@example.com';

    const { data: thread, error: threadError } = await supabase
      .from('email_threads')
      .insert({
        subject: email.subject,
        participants: [email.from_email, toEmail],
        user_id: user.id
      })
      .select()
      .single();

    if (threadError) throw threadError;

    const { error } = await supabase
      .from('emails')
      .insert({
        thread_id: thread.id,
        from_email: email.from_email,
        to_email: [toEmail],
        subject: email.subject,
        body: email.body,
        is_sent: false,
        user_id: user.id
      });

    if (error) throw error;
  }
}
