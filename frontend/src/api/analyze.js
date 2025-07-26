// frontend/pages/api/analyze.js

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const filteredHeaders = { ...req.headers };
    delete filteredHeaders['content-length'];
    delete filteredHeaders['host'];
    delete filteredHeaders['connection'];
    delete filteredHeaders['accept-encoding'];

    const response = await fetch("https://insightberry-backend.fly.dev/analyze", {
      method: "POST",
      headers: filteredHeaders,
      body: req,
    });

    const contentType = response.headers.get("content-type");
    res.status(response.status);
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy failed", message: err.message });
  }
}
