export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-goog-api-key");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  // тело добываем всеми способами: req.body, буфер вручную
  let body = req.body;
  if (!body || typeof body !== "object" || !body.model) {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString("utf8");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.model) body = parsed;
      }
    } catch (e) { /* тело не читается — пойдём с тем что есть */ }
  }

  // если модели всё ещё нет — честная ошибка вместо пустого запроса к google
  if (!body || !body.model) {
    res.status(400).json({ error: { message: "proxy: model missing in request body (body received: " + JSON.stringify(body || null).slice(0, 200) + ")" } });
    return;
  }

  const key = String(req.headers["x-goog-api-key"] || (req.headers.authorization || "").replace(/^Bearer\s+/i, "")).trim();

  const upstream = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  try {
    const r = await fetch(upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + key,
        "x-goog-api-key": key
      },
      body: JSON.stringify(body)
    });
    const text = await r.text();
    res.setHeader("Content-Type", "application/json");
    res.status(r.status).send(text);
  } catch (e) {
    res.status(502).json({ error: { message: "proxy error: " + (e && e.message ? e.message : e) } });
  }
}
