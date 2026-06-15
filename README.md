# 🌾 Fiber Tracker — Daily Fiber Calculator

A clean, single-page web app that uses the Claude API to estimate dietary fiber content from natural-language meal descriptions.

## Project structure

```
fiber-calc/
├── index.html          # Frontend UI
├── api/
│   └── fiber.js        # Vercel serverless function (keeps API key secret)
├── vercel.json         # Routing config
└── README.md
```

## Deploy to Vercel (5 minutes)

### 1. Install Vercel CLI (if needed)
```bash
npm i -g vercel
```

### 2. Deploy
```bash
cd fiber-calc
vercel
```

Follow the prompts (create new project, accept defaults).

### 3. Add your API key as an environment variable
In the Vercel dashboard → Your project → Settings → Environment Variables:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` |

Or via CLI:
```bash
vercel env add ANTHROPIC_API_KEY
```

### 4. Redeploy to pick up the env var
```bash
vercel --prod
```

That's it! Your API key stays server-side and is never exposed to the browser.

---

## Local development

```bash
# Install Vercel dev server
npm i -g vercel

# Create a .env.local file
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env.local

# Run locally
vercel dev
```

Then open http://localhost:3000

---

## How it works

1. User types their meals into the textarea
2. Frontend POSTs to `/api/fiber` (the serverless function)
3. The function reads `ANTHROPIC_API_KEY` from the environment and calls `claude-sonnet-4-6`
4. Claude returns a structured JSON breakdown of fiber per food item
5. The UI renders it as a styled nutrition-facts panel with a daily value progress bar

All estimates are clearly marked as approximate.
