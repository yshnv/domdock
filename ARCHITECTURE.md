# DomDock Architecture

This document provides a high-level overview of the DomDock application architecture, designed to quickly onboard AI agents and developers.

## 1. Project Overview

**DomDock** is a web-based domain monitoring application. It allows users to track domain expiration dates (via RDAP), HTTP/HTTPS website availability, DNS records (A, AAAA, MX, NS, TXT, etc.), SSL certificates, and SEO health.

## 2. Tech Stack

*   **Framework**: Next.js 16 (App Router) & React 19
*   **Language**: TypeScript
*   **Database & Auth**: Supabase (PostgreSQL) using `@supabase/ssr`
*   **Styling**: Tailwind CSS & Lucide React
*   **Monitoring APIs**: Node.js built-ins (`node:dns/promises`, `node:tls`, `node:http/https`), RDAP (`rdap.org`), and Favicone API for icons.

## 3. Directory Structure

```text
domdock/
├── app/
│   ├── api/                    # Next.js Route Handlers
│   │   ├── check-domain/       # Public-facing live inspector route
│   │   ├── domains/[id]/       # Authenticated domain management routes
│   │   └── feature-request/    # Feature request submission
│   ├── auth/                   # Authentication pages (Login/Signup)
│   ├── dashboard/              # Authenticated user dashboard & domain detail pages
│   ├── layout.tsx              # Root layout & Metadata
│   └── page.tsx                # Landing page
├── components/                 # Reusable React components (UI & Layout)
│   ├── arc-feature-bento.tsx   # Marketing bento grid
│   ├── domain-timeline.tsx     # History events timeline for domains
│   └── health-score-badge.tsx  # Domain health visualization
├── lib/
│   ├── monitoring/             # Core monitoring engine logic (DNS, SSL, HTTP, RDAP)
│   └── supabase/               # Supabase clients (Server & Browser)
└── public/                     # Static assets (logo, llms.txt)
```

## 4. Database Schema (Supabase)

Data is protected using Row Level Security (RLS) to ensure users can only access their own tracked domains.

*   `domains`: The root table containing domains tracked by users. Links to `auth.users`.
*   `domain_monitoring`: Detailed 1-to-1 extension of `domains` storing the latest results from monitoring checks (DNS records, SSL info, SEO scores, Hosting providers, etc.).
*   `domain_snapshots`: Stores historical state snapshots to track changes over time.
*   `domain_events`: Log of detected changes (e.g., DNS updated, SSL expired) derived by comparing snapshots.
*   `feature_requests`: Stores user submitted feedback and feature ideas.

## 5. Core Monitoring Engine (`lib/monitoring`)

The monitoring logic runs server-side and uses standard Node.js APIs to prevent CORS issues and access low-level protocols:

*   **`domainService.ts`**: The main orchestrator (`runFullDomainCheck`) that runs all checks in parallel.
*   **`dnsService.ts`**: Uses `node:dns/promises` to resolve A, AAAA, MX, TXT, NS, CNAME, DMARC, and DKIM records.
*   **`sslMonitor.ts`**: Uses `node:tls` to establish a socket and retrieve peer certificate details, validity, and issuer.
*   **`websiteMonitor.ts`**: Uses `node:http` and `node:https` to track response times, status codes, and handle redirects safely.
*   **`seoMonitor.ts`**: Fetches the HTML and analyzes meta tags, Open Graph, Twitter cards, canonical links, and `robots.txt`.
*   **`rdapService.ts`**: Queries `rdap.org` for registrar info and domain expiry dates.
*   **`ssrfGuard.ts`**: Essential security layer to prevent the monitoring engine from hitting private/internal IP addresses (SSRF protection).

## 6. Important AI Context & Conventions

*   **Server Components & Next.js 15+**: The project heavily relies on Next.js App Router patterns. Keep in mind that `params` and `searchParams` in layouts/pages/route handlers are **Promises** in Next.js 15+ and must be `await`ed.
*   **Supabase SSR**: Always use `createClient()` from `@/lib/supabase/server` in Server Components/Route Handlers, and `createClient()` from `@/lib/supabase/client` in Client Components. Do not use global singletons for server clients.
*   **Styling**: The design aesthetic is "Arc-browser inspired" with clean borders, vibrant accent colors (`#3139fb`), and rounded corners. Rely on Tailwind utility classes and avoid ad-hoc CSS when possible.
