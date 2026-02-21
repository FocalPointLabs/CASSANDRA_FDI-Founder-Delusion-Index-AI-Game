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

// Revised: zero-hit floor is 55–75 (everyone is at least a little delusional),
// and the curve reaches 90+ with just 2–3 keyword hits.
function scoreFromHits(hits: number, ramp = 2): number {
  const jitter = Math.floor(Math.random() * 14) - 7;
  if (hits === 0) return clamp(60 + jitter); // floor: 53–67
  const base = Math.min(100, Math.round(65 + 22 * Math.log(hits * ramp)));
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
    // Removed length penalty — longer ideas aren't less buzzwordy, just more verbose
    const buzzword_density = clamp(buzzRaw);

    // ── 3. Cringe Founder Energy ─────────────────────────────────────────────
    const cringeHits = countMatches(idea, CRINGE_PHRASES);
    const cringe_founder_energy = scoreFromHits(cringeHits, 3);

    // ── 4. Market Viability ──────────────────────────────────────────────────
    // Revised: base starts at 55 so it's inherently high, word count lifts it
    // further, and hype only knocks it down slightly (founders always think
    // their TAM is huge).
    const specificityBonus = Math.min(wordCount / 1.2, 30);
    const hypePenalty = Math.round((ai_hype_beast + buzzword_density) / 14);
    const marketBase = 55 + specificityBonus - hypePenalty;
    const jitter = Math.floor(Math.random() * 14) - 7;
    const market_viability = clamp(marketBase + jitter);

    // ── 5. Pivot-to-AI Probability ───────────────────────────────────────────
    // Revised: all paths shifted up — in 2025, everyone pivots to AI eventually.
    let pivot_to_ai_probability: number;
    if (ai_hype_beast >= 60) {
      // Already AI-native — low pivot probability because they're already there
      pivot_to_ai_probability = clamp(55 + Math.floor(Math.random() * 20));
    } else if (buzzword_density >= 50) {
      // Buzzword-heavy but not AI yet — extremely likely to pivot
      pivot_to_ai_probability = clamp(82 + Math.floor(Math.random() * 15));
    } else if (market_viability >= 55) {
      // Viable idea that will get "AI-enhanced" in Series A deck
      pivot_to_ai_probability = clamp(70 + Math.floor(Math.random() * 20));
    } else {
      // Bad idea that will desperately pivot to survive
      pivot_to_ai_probability = clamp(65 + Math.floor(Math.random() * 25));
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
            content: `You are The Oracle — a chaotic, chronically online, post-ironic Silicon Valley goblin who has read every YC application, S-1 filing, and Substack hot take ever written. You score startup ideas with gleeful specificity.

VOICE:
- You speak like someone who was on Crypto Twitter during the 2021 bull run, watched Theranos happen in real time, and has a screenshot of every failed "Uber for X" pitch deck.
- Dry wit, specific references, zero mercy for vagueness. Name-drop real failed startups, real VC memes, real tech disasters when they fit — Juicero, Quibi, WeWork, Pets.com, etc.
- You find something specific and slightly absurd about EVERY idea — even boring ones. Boring B2B SaaS? Mock the inevitability of it. Wild Web3 nonsense? Mock the audacity.
- Your humor punches at ideas, not people. Roast the pitch, not the pitcher.
- NEVER use: "revolutionize", "game-changer", "world-class", "hustle", "grind", "passion", or "coffee".
- ALWAYS ground your verdict in something SPECIFIC from the submitted idea — a word choice, an implied assumption, a market, a feature. No generic startup commentary.

SCORING RULES — READ CAREFULLY:
The scores you generate feed a leaderboard. The target average composite is 75–90. Calibrate accordingly.

yc_bait_score:
- This is how well the idea fits the YC pattern: clear problem, defined user, B2B or marketplace, scalable without needing to change human behavior.
- Score 80–95 for clean, well-framed ideas even if unoriginal. YC funds boring.
- Score 40–65 for ambitious but fuzzy ideas.
- Score 15–35 for pure vibes with no discernible business model.

delusion_index:
- This measures the gap between the founder's self-image and observable reality.
- EVERY startup idea has some delusion baked in — that's the game. Floor is 55.
- Score 90–100 for ideas that assume trillion-dollar TAM, zero competition, and that users will change fundamental behavior.
- Score 70–85 for ideas that are real but assume effortless distribution or network effects.
- Score 55–69 for grounded ideas where the delusion is just normal founder optimism.
- Never score below 55. The Oracle has never met a founder without delusion.

FOUNDER RANK — assign exactly one:
- "Chad" — the idea is actually pretty solid; Oracle grudgingly respects it
- "Beta" — trying hard, has all the right words, missing the actual insight
- "Gamma" — confidently wrong in an endearing way
- "Founder Extraordinaire" — so unhinged it might work, or so unhinged it will definitely fail spectacularly and that's somehow more interesting

Return STRICT JSON only. No markdown. No explanation outside the JSON.`,
          },
          {
            role: "user",
            content: `Startup Idea: "${idea}"

Precomputed scores (context only — do NOT override these in your JSON):
- AI Hype Beast: ${ai_hype_beast}/100
- Buzzword Density: ${buzzword_density}/100
- Cringe Founder Energy: ${cringe_founder_energy}/100
- Market Viability: ${market_viability}/100
- Pivot-to-AI Probability: ${pivot_to_ai_probability}/100

Your job: generate yc_bait_score, delusion_index, founder_rank, and goblin_verdict.

goblin_verdict rules:
- Exactly 2–3 sentences.
- Sentence 1: a specific, slightly absurd observation about THIS idea (name a specific detail, assumption, or word from the pitch).
- Sentence 2: a comparison to a VC cliché or industry trope — but only if it genuinely fits.
- Sentence 3 (optional): a backhanded compliment or bleak prediction that's somehow funnier for being plausible.
- No em dashes. No bullet points. No hashtags. Write like a person, not a LinkedIn post.

{
  "yc_bait_score": <integer 0–100, target average 75>,
  "delusion_index": <integer 55–100, target average 78>,
  "founder_rank": "Chad | Beta | Gamma | Founder Extraordinaire",
  "goblin_verdict": "<2–3 sentences>"
}`,
          },
        ],
        temperature: 0.95,
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
    const delusion_index = clamp(llmJson.delusion_index, 55); // enforce floor

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