export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { meals } = req.body;
  if (!meals || typeof meals !== "string" || meals.trim().length === 0) {
    return res.status(400).json({ error: "Please provide a meals description." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server configuration error: API key not set." });
  }

  const systemPrompt = `You are a nutrition expert specializing in dietary fiber. When given a description of foods, you estimate the dietary fiber content for each item. Always respond with valid JSON only — no markdown, no explanation, just the JSON object. Be realistic and use typical serving-size estimates when amounts are unspecified.`;

  const userPrompt = `Estimate the dietary fiber content for each food item in this meal description: "${meals}"

Return a JSON object with this exact structure:
{
  "items": [
    { "food": "Food name with portion", "fiber_g": 2.5, "note": "brief source note" }
  ],
  "total_g": 8.5,
  "disclaimer": "These are estimates based on typical values. Actual fiber content may vary by brand, ripeness, preparation method, and portion size."
}

Rules:
- fiber_g should be a number (decimals allowed, one decimal place)
- total_g is the sum of all fiber_g values, rounded to one decimal
- note should be very short (e.g. "whole grain", "fresh fruit", "refined flour")
- If a food has negligible fiber (under 0.1g), set fiber_g to 0
- Parse out individual foods even if listed together
- Use realistic USDA-style estimates`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(502).json({ error: err.error?.message || "Upstream API error" });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    // Strip any accidental markdown fences
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Fiber API error:", err);
    return res.status(500).json({ error: "Failed to analyze fiber content. Please try again." });
  }
}
