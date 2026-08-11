export type HealthCheckItem = {
  label: string;
  status: "healthy" | "warning" | "critical" | "unknown";
  points: number;
};

export type HealthScoreResult = {
  score: number;
  label: "Excellent" | "Good" | "Needs attention" | "Critical";
  checks: HealthCheckItem[];
};

export type HealthScoreInput = {
  domainActive: boolean;
  domainDaysRemaining: number | null;
  sslValid: boolean | null;
  sslDaysRemaining: number | null;
  websiteOnline: boolean | null;
  dnsHealthy: boolean;
};

export function calculateDomainHealthScore(input: HealthScoreInput): HealthScoreResult {
  let score = 0;
  const checks: HealthCheckItem[] = [];

  // 1. Domain Active (+25)
  if (input.domainActive) {
    score += 25;
    checks.push({ label: "Domain Active", status: "healthy", points: 25 });
  } else {
    checks.push({ label: "Domain Inactive / Unknown", status: "warning", points: 0 });
  }

  // 2. Domain Expiration (+20 base, with deductions)
  if (input.domainDaysRemaining !== null) {
    if (input.domainDaysRemaining > 30) {
      score += 20;
      checks.push({ label: "Domain Expiration (>30 days)", status: "healthy", points: 20 });
    } else if (input.domainDaysRemaining > 7) {
      score += 10; // -10 deduction
      checks.push({
        label: `Domain Renewal Due Soon (${input.domainDaysRemaining} days)`,
        status: "warning",
        points: 10
      });
    } else if (input.domainDaysRemaining > 0) {
      score += 0; // -20 deduction
      checks.push({
        label: `Domain Renewal Critical (${input.domainDaysRemaining} days)`,
        status: "critical",
        points: 0
      });
    } else {
      score -= 10;
      checks.push({ label: "Domain Expired", status: "critical", points: -10 });
    }
  } else {
    // Unknown expiration does not heavily penalize
    score += 15;
    checks.push({ label: "Domain Expiration (Unknown)", status: "unknown", points: 15 });
  }

  // 3. SSL Valid (+20 base)
  if (input.sslValid === true) {
    score += 20;
    checks.push({ label: "SSL Certificate Valid", status: "healthy", points: 20 });
  } else if (input.sslValid === false) {
    score -= 10;
    checks.push({ label: "SSL Certificate Invalid / Missing", status: "critical", points: -10 });
  } else {
    score += 10;
    checks.push({ label: "SSL Certificate (Unknown)", status: "unknown", points: 10 });
  }

  // 4. SSL Expiration Remaining (+10 base)
  if (input.sslDaysRemaining !== null) {
    if (input.sslDaysRemaining > 30) {
      score += 10;
      checks.push({ label: "SSL Expiration (>30 days)", status: "healthy", points: 10 });
    } else if (input.sslDaysRemaining > 7) {
      score += 0; // -10 deduction
      checks.push({
        label: `SSL Expiring Soon (${input.sslDaysRemaining} days)`,
        status: "warning",
        points: 0
      });
    } else if (input.sslDaysRemaining > 0) {
      score -= 10; // -20 deduction
      checks.push({
        label: `SSL Expiring Critically (${input.sslDaysRemaining} days)`,
        status: "critical",
        points: -10
      });
    } else {
      score -= 20; // -30 deduction
      checks.push({ label: "SSL Expired", status: "critical", points: -20 });
    }
  }

  // 5. Website Online (+15 base)
  if (input.websiteOnline === true) {
    score += 15;
    checks.push({ label: "Website Online", status: "healthy", points: 15 });
  } else if (input.websiteOnline === false) {
    score -= 15; // -20 deduction
    checks.push({ label: "Website Offline / Unreachable", status: "critical", points: -15 });
  } else {
    score += 10;
    checks.push({ label: "Website Status (Unknown)", status: "unknown", points: 10 });
  }

  // 6. DNS Healthy (+10 base)
  if (input.dnsHealthy) {
    score += 10;
    checks.push({ label: "DNS Resolution Healthy", status: "healthy", points: 10 });
  } else {
    score -= 15;
    checks.push({ label: "DNS Resolution Failed", status: "critical", points: -15 });
  }

  // Clamp final score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  let label: HealthScoreResult["label"] = "Critical";
  if (finalScore >= 90) label = "Excellent";
  else if (finalScore >= 75) label = "Good";
  else if (finalScore >= 50) label = "Needs attention";

  return {
    score: finalScore,
    label,
    checks
  };
}
