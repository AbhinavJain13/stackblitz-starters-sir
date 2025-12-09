import { Component, OnInit } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmailService } from './services/email.service';
import { Email, AutoReplyRule, EmailSettings } from './types';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="email-app">
      <header class="app-header">
        <h1>📧 Email Manager</h1>
        <div class="header-actions">
          <button class="btn-primary" (click)="showComposeModal = true">✉️ Compose</button>
        </div>
      </header>

      <div class="app-container">
        <nav class="sidebar">
          <button
            [class.active]="activeTab === 'inbox'"
            (click)="switchTab('inbox')"
            class="nav-btn">
            📥 Inbox <span class="badge">{{ unreadCount }}</span>
          </button>
          <button
            [class.active]="activeTab === 'sent'"
            (click)="switchTab('sent')"
            class="nav-btn">
            📤 Sent
          </button>
          <button
            [class.active]="activeTab === 'auto-reply'"
            (click)="switchTab('auto-reply')"
            class="nav-btn">
            🤖 Auto-Reply Rules
          </button>
          <button
            [class.active]="activeTab === 'settings'"
            (click)="switchTab('settings')"
            class="nav-btn">
            ⚙️ Settings
          </button>
          <button
            (click)="simulateIncomingEmail()"
            class="nav-btn simulate-btn">
            🎯 Simulate Incoming Email
          </button>
        </nav>

        <main class="main-content">
          <div *ngIf="activeTab === 'inbox' || activeTab === 'sent'" class="email-list-view">
            <h2>{{ activeTab === 'inbox' ? 'Inbox' : 'Sent Emails' }}</h2>

            <div *ngIf="emails.length === 0" class="empty-state">
              <p>No emails yet</p>
            </div>

            <div class="email-list">
              <div
                *ngFor="let email of emails"
                class="email-item"
                [class.unread]="!email.is_read && !email.is_sent"
                [class.auto-reply]="email.is_auto_reply"
                (click)="selectEmail(email)">
                <div class="email-header">
                  <span class="email-from">
                    {{ email.is_sent ? 'To: ' + email.to_email.join(', ') : 'From: ' + email.from_email }}
                  </span>
                  <span class="email-date">{{ formatDate(email.created_at) }}</span>
                </div>
                <div class="email-subject">
                  {{ email.subject }}
                  <span *ngIf="email.is_auto_reply" class="auto-reply-badge">🤖 Auto-reply</span>
                </div>
                <div class="email-preview">{{ getPreview(email.body) }}</div>
              </div>
            </div>
          </div>

          <div *ngIf="activeTab === 'auto-reply'" class="auto-reply-view">
            <div class="section-header">
              <h2>Auto-Reply Rules</h2>
              <button class="btn-primary" (click)="showRuleModal = true">+ Add Rule</button>
            </div>

            <div *ngIf="autoReplyRules.length === 0" class="empty-state">
              <p>No auto-reply rules configured</p>
            </div>

            <div class="rules-list">
              <div *ngFor="let rule of autoReplyRules" class="rule-item">
                <div class="rule-header">
                  <div class="rule-info">
                    <h3>{{ rule.name }}</h3>
                    <span class="rule-status" [class.enabled]="rule.enabled">
                      {{ rule.enabled ? '✓ Enabled' : '✗ Disabled' }}
                    </span>
                  </div>
                  <div class="rule-actions">
                    <button (click)="toggleRule(rule)" class="btn-small">
                      {{ rule.enabled ? 'Disable' : 'Enable' }}
                    </button>
                    <button (click)="deleteRule(rule.id)" class="btn-small btn-danger">Delete</button>
                  </div>
                </div>
                <div class="rule-details">
                  <p><strong>Keywords:</strong> {{ rule.keyword_match.join(', ') }}</p>
                  <p><strong>Reply Template:</strong></p>
                  <div class="template-preview">{{ rule.reply_template }}</div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="activeTab === 'settings'" class="settings-view">
            <h2>Email Settings</h2>

            <form class="settings-form" (ngSubmit)="saveSettings()">
              <div class="form-group">
                <label>Your Email Address</label>
                <input
                  type="email"
                  [(ngModel)]="emailSettings.email_address"
                  name="email_address"
                  placeholder="your.email@example.com"
                  required>
              </div>

              <div class="form-group">
                <label>
                  <input
                    type="checkbox"
                    [(ngModel)]="emailSettings.auto_reply_enabled"
                    name="auto_reply_enabled">
                  Enable Auto-Reply
                </label>
              </div>

              <div class="form-group">
                <label>Email Signature</label>
                <textarea
                  [(ngModel)]="emailSettings.signature"
                  name="signature"
                  rows="4"
                  placeholder="Best regards,&#10;Your Name"></textarea>
              </div>

              <button type="submit" class="btn-primary">Save Settings</button>
            </form>
          </div>
        </main>

        <aside class="email-detail" *ngIf="selectedEmail">
          <div class="detail-header">
            <button class="btn-close" (click)="selectedEmail = null">✕</button>
            <h2>{{ selectedEmail.subject }}</h2>
          </div>

          <div class="detail-meta">
            <div class="meta-row">
              <strong>From:</strong> {{ selectedEmail.from_email }}
            </div>
            <div class="meta-row">
              <strong>To:</strong> {{ selectedEmail.to_email.join(', ') }}
            </div>
            <div class="meta-row" *ngIf="selectedEmail.cc_email.length > 0">
              <strong>CC:</strong> {{ selectedEmail.cc_email.join(', ') }}
            </div>
            <div class="meta-row">
              <strong>Date:</strong> {{ formatDate(selectedEmail.created_at) }}
            </div>
          </div>

          <div class="detail-body">
            {{ selectedEmail.body }}
          </div>

          <div class="detail-actions" *ngIf="!selectedEmail.is_sent">
            <button class="btn-primary" (click)="replyToEmail(selectedEmail)">↩️ Reply</button>
          </div>
        </aside>
      </div>
    </div>

    <div class="modal" *ngIf="showComposeModal" (click)="showComposeModal = false">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ composeForm.isReply ? 'Reply to Email' : 'Compose Email' }}</h2>
          <button class="btn-close" (click)="closeComposeModal()">✕</button>
        </div>

        <form class="compose-form" (ngSubmit)="sendEmail()">
          <div class="form-group">
            <label>To</label>
            <input
              type="text"
              [(ngModel)]="composeForm.to"
              name="to"
              placeholder="recipient@example.com (comma-separated for multiple)"
              required>
          </div>

          <div class="form-group">
            <label>CC (optional)</label>
            <input
              type="text"
              [(ngModel)]="composeForm.cc"
              name="cc"
              placeholder="cc@example.com">
          </div>

          <div class="form-group">
            <label>Subject</label>
            <input
              type="text"
              [(ngModel)]="composeForm.subject"
              name="subject"
              required>
          </div>

          <div class="form-group">
            <label>Message</label>
            <textarea
              [(ngModel)]="composeForm.body"
              name="body"
              rows="10"
              required></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" (click)="closeComposeModal()">Cancel</button>
            <button type="submit" class="btn-primary">Send Email</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal" *ngIf="showRuleModal" (click)="showRuleModal = false">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Add Auto-Reply Rule</h2>
          <button class="btn-close" (click)="showRuleModal = false">✕</button>
        </div>

        <form class="compose-form" (ngSubmit)="createRule()">
          <div class="form-group">
            <label>Rule Name</label>
            <input
              type="text"
              [(ngModel)]="ruleForm.name"
              name="name"
              placeholder="e.g., Support Request Auto-Reply"
              required>
          </div>

          <div class="form-group">
            <label>Keywords (comma-separated)</label>
            <input
              type="text"
              [(ngModel)]="ruleForm.keywords"
              name="keywords"
              placeholder="help, support, question"
              required>
            <small>Auto-reply will trigger if email contains any of these keywords</small>
          </div>

          <div class="form-group">
            <label>Reply Template</label>
            <textarea
              [(ngModel)]="ruleForm.template"
              name="template"
              rows="6"
              placeholder="Thank you for your email. We'll get back to you soon."
              required></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" (click)="showRuleModal = false">Cancel</button>
            <button type="submit" class="btn-primary">Create Rule</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal" *ngIf="showSimulateModal" (click)="showSimulateModal = false">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Simulate Incoming Email</h2>
          <button class="btn-close" (click)="showSimulateModal = false">✕</button>
        </div>

        <form class="compose-form" (ngSubmit)="submitSimulatedEmail()">
          <div class="form-group">
            <label>From Email</label>
            <input
              type="email"
              [(ngModel)]="simulateForm.from"
              name="from"
              placeholder="sender@example.com"
              required>
          </div>

          <div class="form-group">
            <label>Subject</label>
            <input
              type="text"
              [(ngModel)]="simulateForm.subject"
              name="subject"
              placeholder="Email subject"
              required>
          </div>

          <div class="form-group">
            <label>Message</label>
            <textarea
              [(ngModel)]="simulateForm.body"
              name="body"
              rows="6"
              placeholder="Email body content..."
              required></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" (click)="showSimulateModal = false">Cancel</button>
            <button type="submit" class="btn-primary">Receive Email</button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class App implements OnInit {
  activeTab: 'inbox' | 'sent' | 'auto-reply' | 'settings' = 'inbox';
  emails: Email[] = [];
  autoReplyRules: AutoReplyRule[] = [];
  selectedEmail: Email | null = null;
  showComposeModal = false;
  showRuleModal = false;
  showSimulateModal = false;

  emailSettings: Partial<EmailSettings> = {
    email_address: '',
    auto_reply_enabled: false,
    signature: ''
  };

  composeForm = {
    to: '',
    cc: '',
    subject: '',
    body: '',
    isReply: false,
    threadId: ''
  };

  ruleForm = {
    name: '',
    keywords: '',
    template: ''
  };

  simulateForm = {
    from: 'sender@example.com',
    subject: 'Test Email',
    body: 'This is a test email message.'
  };

  get unreadCount(): number {
    return this.emails.filter(e => !e.is_read && !e.is_sent).length;
  }

  constructor(private emailService: EmailService) {}

  async ngOnInit() {
    await this.loadEmailSettings();
    await this.loadEmails();
    await this.loadAutoReplyRules();
  }

  async switchTab(tab: 'inbox' | 'sent' | 'auto-reply' | 'settings') {
    this.activeTab = tab;
    this.selectedEmail = null;

    if (tab === 'inbox' || tab === 'sent') {
      await this.loadEmails();
    } else if (tab === 'auto-reply') {
      await this.loadAutoReplyRules();
    }
  }

  async loadEmails() {
    try {
      this.emails = await this.emailService.getEmails(this.activeTab === 'sent');
    } catch (error) {
      console.error('Error loading emails:', error);
    }
  }

  async loadAutoReplyRules() {
    try {
      this.autoReplyRules = await this.emailService.getAutoReplyRules();
    } catch (error) {
      console.error('Error loading rules:', error);
    }
  }

  async loadEmailSettings() {
    try {
      const settings = await this.emailService.getEmailSettings();
      if (settings) {
        this.emailSettings = settings;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async selectEmail(email: Email) {
    this.selectedEmail = email;
    if (!email.is_read && !email.is_sent) {
      await this.emailService.markAsRead(email.id);
      email.is_read = true;
    }
  }

  replyToEmail(email: Email) {
    this.composeForm = {
      to: email.from_email,
      cc: '',
      subject: email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`,
      body: `\n\n--- Original Message ---\nFrom: ${email.from_email}\nDate: ${this.formatDate(email.created_at)}\n\n${email.body}`,
      isReply: true,
      threadId: email.thread_id || ''
    };
    this.showComposeModal = true;
  }

  async sendEmail() {
    try {
      const toEmails = this.composeForm.to.split(',').map(e => e.trim());
      const ccEmails = this.composeForm.cc ? this.composeForm.cc.split(',').map(e => e.trim()) : [];

      await this.emailService.sendEmail({
        to_email: toEmails,
        cc_email: ccEmails,
        subject: this.composeForm.subject,
        body: this.composeForm.body,
        thread_id: this.composeForm.threadId || undefined
      });

      alert('Email sent successfully!');
      this.closeComposeModal();
      await this.loadEmails();
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    }
  }

  closeComposeModal() {
    this.showComposeModal = false;
    this.composeForm = {
      to: '',
      cc: '',
      subject: '',
      body: '',
      isReply: false,
      threadId: ''
    };
  }

  async createRule() {
    try {
      const keywords = this.ruleForm.keywords.split(',').map(k => k.trim());
      await this.emailService.createAutoReplyRule({
        name: this.ruleForm.name,
        keyword_match: keywords,
        reply_template: this.ruleForm.template
      });

      alert('Auto-reply rule created!');
      this.showRuleModal = false;
      this.ruleForm = { name: '', keywords: '', template: '' };
      await this.loadAutoReplyRules();
    } catch (error) {
      console.error('Error creating rule:', error);
      alert('Failed to create rule. Please try again.');
    }
  }

  async toggleRule(rule: AutoReplyRule) {
    try {
      await this.emailService.updateAutoReplyRule(rule.id, { enabled: !rule.enabled });
      await this.loadAutoReplyRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  }

  async deleteRule(id: string) {
    if (confirm('Are you sure you want to delete this rule?')) {
      try {
        await this.emailService.deleteAutoReplyRule(id);
        await this.loadAutoReplyRules();
      } catch (error) {
        console.error('Error deleting rule:', error);
      }
    }
  }

  async saveSettings() {
    try {
      await this.emailService.updateEmailSettings(this.emailSettings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  }

  simulateIncomingEmail() {
    this.showSimulateModal = true;
  }

  async submitSimulatedEmail() {
    try {
      await this.emailService.simulateReceiveEmail({
        from_email: this.simulateForm.from,
        subject: this.simulateForm.subject,
        body: this.simulateForm.body
      });

      alert('Email received! Check your inbox.');
      this.showSimulateModal = false;
      this.simulateForm = {
        from: 'sender@example.com',
        subject: 'Test Email',
        body: 'This is a test email message.'
      };

      if (this.activeTab === 'inbox') {
        await this.loadEmails();
      }
    } catch (error) {
      console.error('Error simulating email:', error);
      alert('Failed to simulate email. Please try again.');
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }

  getPreview(body: string): string {
    return body.length > 100 ? body.substring(0, 100) + '...' : body;
  }
}

bootstrapApplication(App);
