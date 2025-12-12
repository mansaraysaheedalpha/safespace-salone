# SafeSpace Salone

An anonymous, low-bandwidth therapy platform designed for Sierra Leone.

## Overview

Unlike Western apps that rely on expensive live video, SafeSpace Salone uses **asynchronous voice notes and text** (similar to WhatsApp) to connect users with verified counselors. It prioritizes data privacy and functions seamlessly on 3G networks.

## Features

- **Anonymous Sign-up**: Users create accounts with avatars - no real names required
- **Topic Selection**: Choose from categories like "Trauma," "Addiction," and more
- **Encrypted Messaging**: Secure voice notes and text communication
- **Low-Bandwidth Optimized**: Works seamlessly on 3G networks
- **PWA**: Installable mobile web app for easy access

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database/Auth**: Supabase
- **Icons**: Lucide React
- **PWA**: next-pwa

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## License

*TBD*
