<p align="center">
  <img src="./public/logo.svg" alt="DomDock Logo" width="80" height="80" />
</p>

<h1 align="center">DomDock</h1>

<p align="center">
  <strong>Calm Domain Monitoring</strong> — Track every domain, registrar expiration date, and health status in one clear, quiet workspace.
</p>

<p align="center">
  <a href="#-features"><strong>Features</strong></a> ·
  <a href="#-tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#-getting-started"><strong>Getting Started</strong></a> ·
  <a href="#-project-structure"><strong>Project Structure</strong></a>
</p>

<br/>

![DomDock Banner](app/opengraph-image.png)

DomDock is a modern web application designed for web creators, developers, and agency owners to effortlessly monitor domain expiry dates, HTTP/HTTPS availability, status codes, and response times. Built with **Next.js 15**, **React 19**, **Supabase**, and **Tailwind CSS**, DomDock combines robust real-time monitoring with Arc-inspired design aesthetics.

---

## ✨ Features

- 🔍 **Instant Live Domain Inspector**: Look up domain expiration (via RDAP protocol) and website health status without leaving the home page.
- 🛡️ **Personalized Monitoring Dashboard**: Authenticated workspace to add, view, refresh, and remove tracked domains.
- ⏳ **Expiry Countdowns & Warning Alerts**: Visual alerts for domains nearing registration expiration (e.g. within 30 days) and offline/unreachable sites.
- ⚡ **Real-Time Health Diagnostics**: Measures response latency (ms), HTTP status codes (200 OK, 404, 500, etc.), and protocol fallbacks (HTTPS/HTTP).
- 🎨 **Arc Design System Aesthetics**: Features high-contrast electric blue accents (`#3139fb`), soft warm background tones, asymmetric bento grids, and responsive layouts.
- 🔒 **Secure Supabase Authentication**: Password-based signup/login, password reset flows, and cookie-backed SSR authentication via `@supabase/ssr`.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router) & [React 19](https://react.dev/)
- **Backend & Database**: [Supabase](https://supabase.com/) (`@supabase/supabase-js`, `@supabase/ssr`)
- **Styling & UI**: [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), Radix UI Primitives
- **External Protocols & APIs**: RDAP (Registration Data Access Protocol) via `rdap.org` and native fetch status checking
- **Language**: TypeScript

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **Package Manager**: `npm`, `pnpm`, or `yarn`
- **Supabase Account**: A free project at [supabase.com](https://supabase.com)

### 1. Clone the Repository

```bash
git clone https://github.com/yshnv/domdock.git
cd domdock
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_or_anon_key
```

> **Note**: Both legacy `anon` keys and new `publishable` keys work with `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

### 4. Set Up Supabase Database Schema

Run the following SQL snippet in your Supabase SQL Editor to create the `domains` table:

```sql
create table public.domains (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  expires_at date,
  health text check (health in ('healthy', 'warning', 'offline', 'pending')) default 'pending',
  last_checked_at timestamp with time zone,
  status_code integer,
  response_time_ms integer,
  dns_records jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.domains enable row level security;

-- Create policies for user-isolated access
create policy "Users can view their own domains"
  on public.domains for select
  using (auth.uid() = user_id);

create policy "Users can insert their own domains"
  on public.domains for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own domains"
  on public.domains for update
  using (auth.uid() = user_id);

create policy "Users can delete their own domains"
  on public.domains for delete
  using (auth.uid() = user_id);
```

### 5. Run the Local Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to explore DomDock.

---

## 📁 Project Structure

```text
domdock/
├── app/
│   ├── about/            # About page
│   ├── api/
│   │   └── check-domain/ # Domain RDAP & website health checker API endpoint
│   ├── auth/             # Sign-up, Login, Forgot & Reset password pages
│   ├── protected/        # Authenticated Dashboard client & pages
│   ├── globals.css       # Design tokens & base styles
│   ├── layout.tsx        # Root layout with font setup & providers
│   └── page.tsx          # Landing page with live domain inspector & bento features
├── components/
│   ├── arc-header.tsx            # Navigation header component
│   ├── arc-feature-bento.tsx     # Bento grid feature showcase
│   ├── arc-cta-section.tsx       # Bottom call-to-action section
│   ├── domain-health-widget.tsx  # Interactive live inspector widget
│   ├── domdock-logo.tsx          # Official DomDock SVG logo component
│   └── ui/                       # Reusable UI primitives (Buttons, Cards, Inputs)
├── lib/
│   ├── supabase/         # Client & Server Supabase instantiation helpers
│   └── utils.ts          # Utility functions (`cn` class merger)
├── public/
│   └── logo.svg          # Public SVG logo asset & favicon
└── proxy.ts              # Custom middleware / proxy handler
```

---

## 📜 Available Scripts

| Script          | Command         | Description                       |
| :-------------- | :-------------- | :-------------------------------- |
| **Development** | `npm run dev`   | Starts the Next.js dev server     |
| **Build**       | `npm run build` | Builds the production bundle      |
| **Start**       | `npm run start` | Starts Next.js in production mode |
| **Lint**        | `npm run lint`  | Runs ESLint type & syntax checks  |

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
