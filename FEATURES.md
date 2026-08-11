# DomDock Features

## 🔍 Instant Live Domain Inspector

**Description**: Look up domain expiration (via RDAP protocol), website status, and DNS records live right from the home page.

DomDock provides a live control room on the landing page where users can instantly inspect any domain. This feature queries:
- **RDAP (Registration Data Access Protocol)**: To find the exact expiration date of the domain registration.
- **Website Status**: Performs a lightweight HTTP/HTTPS check to verify if the domain is currently resolving and returning a healthy status code.
- **DNS Records**: Fetches core DNS records (A, AAAA, MX, NS, TXT) to give a comprehensive overview of the domain's configuration.

This allows quick diagnostics without requiring a user to log in or add the domain to their permanent dashboard.

---

## 🛡️ Personalized Monitoring Dashboard

**Description**: Authenticated workspace at `/dashboard` to add, view, refresh, inspect detailed DNS records, and manage tracked domains.

Once logged in, users gain access to a persistent, personalized dashboard tailored for domain management:
- **Domain List**: A clean, Arc-browser inspired interface displaying all tracked domains.
- **Management**: Users can easily add new domains to monitor or remove ones they no longer need.
- **Live Sync**: The dashboard provides a "Refresh Status" action to manually trigger an immediate re-check of all domain statuses.
- **Deep Inspection**: Clicking into a specific domain opens a detailed view showing comprehensive monitoring data, including historical events, full DNS records, and SSL certificate details.

---

## ⏳ Expiry Countdowns & Warning Alerts

**Description**: Visual alerts for domains nearing registration expiration (within 30 days) and offline/unreachable sites.

DomDock ensures you never lose a domain by accident or miss a critical outage:
- **30-Day Warning**: Any domain with a registration expiration date within 30 days is highlighted with visual alerts (e.g., yellow warning indicators).
- **Offline Alerts**: If the automated HTTP checks detect that a domain is returning an error (e.g., 404, 500) or is completely unreachable, its health status changes to `offline` or `warning`.
- **At-a-Glance Stats**: The top of the dashboard summarizes how many domains are healthy, how many are offline, and how many are expiring soon.

---

## ⚡ Real-Time Health Diagnostics & Redirect Handling

**Description**: Measures response latency (ms), status codes (`200 OK`, `307 Redirect`, `404`, `500`), and safe SSRF redirect guards.

The monitoring engine goes beyond simple pinging:
- **Latency Tracking**: Measures and records the response time in milliseconds for the HTTP request, helping identify slow websites.
- **Status Code Resolution**: Captures the exact HTTP status code returned by the server.
- **Redirects**: Follows redirects safely up to a defined limit to find the final destination URL. It counts the number of redirects and logs the final status.
- **SSRF Protection**: Implements guards against Server-Side Request Forgery, ensuring the monitoring agent cannot be used maliciously to scan internal networks.

---

## 🌐 Cookie-Free Domain Favicons

**Description**: High-resolution favicon integration powered by the Favicone API (`favicone.com`).

To make the dashboard visually appealing and easily scannable, DomDock displays the favicon for every monitored domain.
- **Favicone API**: Uses a privacy-friendly, cookie-free API to fetch high-quality favicons without tracking users.
- **Fallback UI**: If a domain doesn't have a favicon or the API fails, a beautiful placeholder globe icon is displayed in its place, maintaining the premium design aesthetic.

---

## 💡 User Feature Requests

**Description**: Built-in modal and API route (`/api/feature-request`) allowing visitors and users to submit feature ideas.

DomDock embraces user feedback directly within the application:
- **Interactive Modal**: A sleek, animated modal accessible from the dashboard header allows users to request features, report bugs, or suggest improvements.
- **API Integration**: A robust Next.js API route securely receives the submissions and stores them in the Supabase `feature_requests` table.
- **Anonymous Support**: The form gracefully handles both signed-in users (automatically attaching their user ID and email) and anonymous users.



## 🔒 Secure Supabase Auth

**Description**: Password authentication, server-side session checks, and RLS (Row Level Security) data isolation via `@supabase/ssr`.

Security and data privacy are foundational to DomDock:
- **Next.js App Router Support**: Implements `@supabase/ssr` to safely handle authentication cookies across server components, API routes, and client components.
- **Data Isolation**: All user data (domains, monitoring history) is strictly protected by Postgres Row Level Security (RLS) policies. Users can only read, update, or delete domains that belong to their specific `user_id`.
- **Complete Auth Flow**: Includes sign-up, login, and secure session management.
