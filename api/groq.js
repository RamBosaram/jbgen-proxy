export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const upstream = "https://api.groq.com/openai/v1/chat/completions";
  try {
    const r = await fetch(upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": req.headers.authorization || ""
      },
      body: JSON.stringify(req.body)
    });
    const text = await r.text();
    res.setHeader("Content-Type", "application/json");
    res.status(r.status).send(text);
  } catch (e) {
    res.status(502).json({ error: { message: "proxy error: " + (e && e.message ? e.message : e) } });
  }
}
