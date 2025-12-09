# Email Manager - Smart Auto-Reply System

A modern email management application built with Angular and Supabase, featuring intelligent auto-reply capabilities based on customizable rules.

## Features

- **Inbox Management**: View and organize incoming emails with unread indicators
- **Email Composition**: Send emails with support for multiple recipients and CC
- **Auto-Reply Rules**: Create smart rules that automatically respond to incoming emails based on keywords
- **Email Threading**: Organize conversations in threaded views
- **Customizable Settings**: Configure your email address, signature, and auto-reply preferences
- **Simulation Mode**: Test the system by simulating incoming emails without actual SMTP integration

## Getting Started

### 1. First-Time Setup

Go to Settings and configure:
- Your email address
- Email signature
- Enable/disable auto-reply

### 2. Create Auto-Reply Rules

Navigate to "Auto-Reply Rules" and create rules with:
- Rule name
- Keywords to match (comma-separated)
- Reply template message

When an email arrives containing any of your keywords, the system will automatically respond with your template.

### 3. Using the App

**Compose Email:**
- Click "Compose" in the header
- Enter recipient, subject, and message
- Send

**Read & Reply:**
- Click any email in your inbox to view details
- Click "Reply" to respond to the sender

**Simulate Incoming Email:**
- Click "Simulate Incoming Email" in the sidebar
- Enter sender email, subject, and message
- The email will appear in your inbox

## Technical Stack

- **Frontend**: Angular 20 with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Custom CSS with modern design patterns
- **State Management**: RxJS & Angular Services

## Database Schema

The application uses four main tables:

1. **emails** - Stores all email messages
2. **email_threads** - Groups related emails together
3. **auto_reply_rules** - Manages auto-response rules
4. **email_settings** - User preferences and configuration

All tables are protected with Row Level Security (RLS) policies to ensure data privacy.

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## Architecture

The application follows a clean, modular architecture:

- `src/types.ts` - TypeScript interfaces for data models
- `src/services/email.service.ts` - Core email operations and API calls
- `src/supabase.client.ts` - Supabase client configuration
- `src/main.ts` - Main Angular component with UI logic
- `src/global_styles.css` - Application styling

## Future Enhancements

- Real SMTP/IMAP integration for actual email sending/receiving
- Rich text email editor
- File attachments
- Search and filtering capabilities
- Email labels and folders
- Advanced threading algorithms
- AI-powered auto-reply suggestions