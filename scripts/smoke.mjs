async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function main() {
  const api = process.env.PUBLIC_API_URL ?? "http://localhost:3001";
  console.log("Smoke against", api);
  const health = await get(`${api}/api/health`);
  console.log("health", health);
  const events = await get(`${api}/api/events`);
  console.log("events", events.length);
  const pay = await fetch(`${api}/api/payments/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amountRub: 1000,
      description: "smoke",
      serviceId: "personal",
    }),
  }).then((r) => r.json());
  console.log("payment", pay.provider, Boolean(pay.confirmationUrl));
  console.log("OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
