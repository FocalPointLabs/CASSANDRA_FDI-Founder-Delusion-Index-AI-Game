import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { LRUCache } from "lru-cache";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Rate Limiter ─────────────────────────────────────────────────────────────

const rateLimiter = new LRUCache<string, number>({
  max: 500,
  ttl: 1000 * 60 * 60, // 1 hour window
});

const REQUESTS_PER_HOUR = 5;

function getRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const current = rateLimiter.get(ip) ?? 0;
  if (current >= REQUESTS_PER_HOUR) {
    return { allowed: false, remaining: 0 };
  }
  rateLimiter.set(ip, current + 1);
  return { allowed: true, remaining: REQUESTS_PER_HOUR - (current + 1) };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ScoreResponse = {
  ai_hype_beast: number;
  buzzword_density: number;
  cringe_founder_energy: number;
  market_viability: number;
  pivot_to_ai_probability: number;
  yc_bait_score: number;
  delusion_index: number;
  founder_rank: string;
  goblin_verdict: string;
  composite_score: number;
};

// ─── Keyword Lists ────────────────────────────────────────────────────────────

const AI_KEYWORDS = [
  "ai", "artificial intelligence", "machine learning", "ml", "llm", "gpt",
  "neural", "deep learning", "nlp", "computer vision", "generative", "agent",
  "autonomous", "copilot", "chatbot", "embedding", "vector", "diffusion",
  "transformer", "fine-tun", "rag", "multimodal",
];

const BUZZWORDS = [
  "blockchain", "web3", "nft", "crypto", "metaverse", "defi", "dao",
  "disrupt", "disruption", "10x", "100x", "democratize", "revolutionize",
  "paradigm", "synergy", "ecosystem", "scalable", "scale", "platform",
  "network effect", "frictionless", "seamless", "uber for", "airbnb for",
  "tinder for", "future of", "next generation", "next-gen", "world-class",
  "best-in-class", "end-to-end", "full-stack", "holistic", "leverage",
  "ideate", "pivot", "mvp", "b2b", "b2c", "saas", "paas",
];

const CRINGE_PHRASES = [
  "change the world", "make the world a better place", "passionate",
  "on a mission", "we believe", "i believe", "journey", "space",
  "in the x space", "the x space", "move fast", "hustle", "grind",
  "thought leader", "serial entrepreneur", "visionary", "disrupting the",
  "pain point", "game changer", "game-changer", "low-hanging fruit",
  "move the needle", "circle back", "deep dive", "at the end of the day",
  "skin in the game", "fail fast", "growth hacking", "north star",
  "bleeding edge", "cutting edge", "first principles",
];

// ─── Scoring Helpers ──────────────────────────────────────────────────────────

function countMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((count, kw) => {
    const regex = new RegExp(kw.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "gi");
    return count + (lower.match(regex)?.length || 0);
  }, 0);
}

function clamp(val: number, min = 0, max = 100): number {
  return Math.min(Math.max(Math.round(val), min), max);
}

function scoreFromHits(hits: number, ramp = 2): number {
  if (hits === 0) return Math.floor(Math.random() * 20);
  const base = Math.min(100, Math.round(40 + 30 * Math.log(hits * ramp)));
  const jitter = Math.floor(Math.random() * 10) - 5;
  return clamp(base + jitter);
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  // ── Rate limiting ───────────────────────────────────────────────────────────
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ??
    req.socket.remoteAddress ??
    "unknown";

  const { allowed } = getRateLimit(ip);
  if (!allowed) {
    return res.status(429).json({ error: "The Oracle needs rest. Try again later." });
  }

  const { idea, idea_id, user_id } = req.body;
  if (!idea)
    return res.status(400).json({ error: "Missing idea" });

  try {
    const wordCount = idea.trim().split(/\s+/).length;

    // ── 1. AI Hype Beast ─────────────────────────────────────────────────────
    const aiHits = countMatches(idea, AI_KEYWORDS);
    const ai_hype_beast = scoreFromHits(aiHits, 2.5);

    // ── 2. Buzzword Density ──────────────────────────────────────────────────
    const buzzHits = countMatches(idea, BUZZWORDS);
    const buzzRaw = scoreFromHits(buzzHits, 2);
    const lengthPenalty = wordCount > 80 ? 10 : wordCount > 40 ? 5 : 0;
    const buzzword_density = clamp(buzzRaw - lengthPenalty);

    // ── 3. Cringe Founder Energy ─────────────────────────────────────────────
    const cringeHits = countMatches(idea, CRINGE_PHRASES);
    const cringe_founder_energy = scoreFromHits(cringeHits, 3);

    // ── 4. Market Viability ──────────────────────────────────────────────────
    const specificityBonus = Math.min(wordCount / 1.5, 40);
    const hypePenalty = Math.round((ai_hype_beast + buzzword_density) / 8);
    const marketBase = 20 + specificityBonus - hypePenalty;
    const jitter = Math.floor(Math.random() * 14) - 7;
    const market_viability = clamp(marketBase + jitter);

    // ── 5. Pivot-to-AI Probability ───────────────────────────────────────────
    let pivot_to_ai_probability: number;
    if (ai_hype_beast >= 60) {
      pivot_to_ai_probability = clamp(15 + Math.floor(Math.random() * 20));
    } else if (buzzword_density >= 50) {
      pivot_to_ai_probability = clamp(65 + Math.floor(Math.random() * 30));
    } else if (market_viability >= 55) {
      pivot_to_ai_probability = clamp(35 + Math.floor(Math.random() * 25));
    } else {
      pivot_to_ai_probability = clamp(20 + Math.floor(Math.random() * 30));
    }

    // ── LLM Call (Cerebras) ──────────────────────────────────────────────────
    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: `You are The Oracle — a chaotic, chronically online, meme-brained Silicon Valley goblin who scores startup ideas.

VOICE:
- Post-ironic and self-aware. You've seen every startup pitch deck ever made.
- You speak in the cadence of someone who has been on Crypto Twitter, HackerNews, and r/startups simultaneously for 10 years.
- Dry wit. Specific callouts. No generic observations.
- NEVER mention coffee, caffeine, hustle, grind, or passion.
- NEVER say "revolutionize", "game-changer", or "world-class".
- DO reference specific startup failures, VC memes, tech tropes when relevant.
- The verdict must reference something SPECIFIC from the actual idea submitted — not generic startup commentary.

SCORING RULES for yc_bait_score and delusion_index:
- Use the FULL 0–100 range. Don't cluster around 50–75.
- A genuinely bad idea with no redeeming qualities should score 5–15.
- A perfectly YC-shaped idea (marketplace, B2B SaaS, clear problem) scores 75–95.
- Truly delusional ideas (e.g. "decentralized AI blockchain for dog emotions") score 85–100 delusion.
- Grounded, boring ideas score 5–20 delusion.

FOUNDER RANK rules:
- "Chad" — actually has something here, surprisingly competent
- "Beta" — trying hard, missing the point
- "Gamma" — deeply confused but confident
- "Founder Extraordinaire" — reserved for ideas so unhinged they loop back around to visionary

Return STRICT JSON only. No markdown. No explanation outside the JSON.`,
          },
          {
            role: "user",
            content: `Startup Idea: "${idea}"

Precomputed scores (for context, do NOT override these):
- AI Hype Beast: ${ai_hype_beast}/100
- Buzzword Density: ${buzzword_density}/100
- Cringe Founder Energy: ${cringe_founder_energy}/100
- Market Viability: ${market_viability}/100
- Pivot-to-AI Probability: ${pivot_to_ai_probability}/100

Generate this JSON:
{
  "yc_bait_score": <0-100 integer>,
  "delusion_index": <0-100 integer>,
  "founder_rank": "Chad | Beta | Gamma | Founder Extraordinaire",
  "goblin_verdict": "<2-3 sentences, meme-brained, specific to this idea, no generic startup platitudes>"
}`,
          },
        ],
        temperature: 0.92,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Cerebras API error:", text);
      return res.status(500).json({ error: "LLM request failed" });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const cleaned = content.replace(/```json|```/g, "").trim();
    const llmJson = JSON.parse(cleaned);

    const yc_bait_score  = clamp(llmJson.yc_bait_score);
    const delusion_index = clamp(llmJson.delusion_index);

    // ── Composite Score ───────────────────────────────────────────────────────
    const composite_score = clamp(Math.round(
      (ai_hype_beast +
        buzzword_density +
        cringe_founder_energy +
        market_viability +
        pivot_to_ai_probability +
        yc_bait_score +
        delusion_index) / 7
    ));

    const result: ScoreResponse = {
      ai_hype_beast,
      buzzword_density,
      cringe_founder_energy,
      market_viability,
      pivot_to_ai_probability,
      yc_bait_score,
      delusion_index,
      founder_rank: llmJson.founder_rank,
      goblin_verdict: llmJson.goblin_verdict,
      composite_score,
    };

    // ── Persist to Supabase ───────────────────────────────────────────────────
    if (idea_id && user_id) {
      const { error: scoreError } = await supabase.from("scores").insert([{
        idea_id,
        user_id,
        ai_hype_beast,
        buzzword_density,
        cringe_founder_energy,
        market_viability,
        pivot_to_ai_probability,
        yc_bait_score,
        delusion_index,
        founder_rank: llmJson.founder_rank,
        goblin_verdict: llmJson.goblin_verdict,
        composite_score,
      }]);

      if (scoreError) {
        console.error("Failed to persist scores:", scoreError);
      }
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}