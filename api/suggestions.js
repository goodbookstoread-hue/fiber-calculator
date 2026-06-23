export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { remaining_g, goal_g, consumed_g } = req.body;
  if (typeof remaining_g !== "number" || remaining_g <= 0) {
    return res.status(400).json({ error: "Please provide a valid remaining fiber amount." });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server configuration error: API key not set." });
  }
  const systemPrompt = `You are a nutrition expert specializing in dietary fiber. When given a fiber gap (how many more grams someone needs today), you suggest realistic, common, easy-to-find foods that would help close that gap. Always respond with valid JSON only — no markdown, no explanation, just the JSON object.`;
  const userPrompt = `Someone has consumed ${consumed_g}g of fiber today out of a ${goal_g}g daily goal. They need about ${remaining_g}g more fiber.
Suggest 4 realistic, common foods (or simple snacks/meals) that would help them close this gap. Prefer whole foods over supplements.
Return a JSON object with this exact structure:
{
  "suggestions": [
    { "food": "Food name with portion", "fiber_g": 5.0, "note": "brief helpful note" }
  ]
}
Rules:
- fiber_g should be a realistic number for that portion (one decimal place)
- note should be short and practical (e.g. "easy snack", "add to breakfast", "great with dinner")
- Choose a variety of food types, not 4 similar items
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
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Suggestions API error:", err);
    return res.status(500).json({ error: "Failed to get suggestions. Please try again." });
  }
}
