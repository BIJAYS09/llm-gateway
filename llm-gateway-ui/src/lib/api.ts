const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchSummary() {
  const res = await fetch(`${BASE}/metrics/summary`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}

export async function fetchRecent(limit = 50) {
  const res = await fetch(`${BASE}/metrics/recent?limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch recent calls");
  return res.json();
}

export async function fetchCostByDay(days = 7) {
  const res = await fetch(`${BASE}/metrics/cost-by-day?days=${days}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch cost by day");
  return res.json();
}

export async function fetchRoutingBreakdown() {
  const res = await fetch(`${BASE}/metrics/routing-breakdown`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch routing breakdown");
  return res.json();
}

export async function fetchHealth() {
  try {
    const res = await fetch(`${BASE}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendChatMessage(messages: { role: string; content: string }[], model = "gpt-4o") {
  const res = await fetch(`${BASE}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, max_tokens: 1000 }),
  });
  if (!res.ok) throw new Error("Chat request failed");
  return res.json();
}
