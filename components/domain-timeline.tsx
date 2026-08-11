import React from "react";
import {
  Globe,
  ShieldCheck,
  Server,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Network,
  Clock
} from "lucide-react";

export type DomainEvent = {
  id: string;
  event_type: string;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
};

export function DomainTimeline({ events }: { events: DomainEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <Clock className="mx-auto size-8 text-muted-foreground/60" />
        <p className="mt-2 text-sm font-medium text-foreground">No domain changes detected yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          DomDock automatically records domain, DNS, SSL, registrar, and hosting events whenever you run a domain check.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
      {events.map((evt) => {
        const icon = getEventIcon(evt.event_type);
        const dateStr = new Date(evt.created_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric"
        });
        const timeStr = new Date(evt.created_at).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit"
        });

        return (
          <div key={evt.id} className="relative group">
            {/* Timeline bullet icon */}
            <div className="absolute -left-6 top-0.5 grid size-5 place-items-center rounded-full bg-background border border-border shadow-xs group-hover:border-[#3139fb]">
              {icon}
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-border">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-foreground">{evt.title}</h4>
                <div className="text-[11px] font-medium text-muted-foreground">
                  {dateStr} at {timeStr}
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{evt.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getEventIcon(type: string) {
  switch (type) {
    case "DOMAIN_ADDED":
      return <Globe className="size-3 text-[#3139fb]" />;
    case "SSL_RENEWED":
    case "SSL_CERTIFICATE_CHANGED":
      return <Lock className="size-3 text-emerald-500" />;
    case "SSL_EXPIRED":
      return <AlertTriangle className="size-3 text-red-500" />;
    case "WEBSITE_ONLINE":
      return <CheckCircle2 className="size-3 text-emerald-500" />;
    case "WEBSITE_OFFLINE":
      return <AlertTriangle className="size-3 text-red-500" />;
    case "REGISTRAR_CHANGED":
    case "EXPIRY_CHANGED":
      return <RefreshCw className="size-3 text-blue-500" />;
    case "NAMESERVERS_CHANGED":
    case "DNS_PROVIDER_CHANGED":
      return <Network className="size-3 text-purple-500" />;
    case "HOSTING_PROVIDER_CHANGED":
      return <Server className="size-3 text-amber-500" />;
    default:
      return <ShieldCheck className="size-3 text-muted-foreground" />;
  }
}
