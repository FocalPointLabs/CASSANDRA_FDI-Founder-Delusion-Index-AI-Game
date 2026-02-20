import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import OnboardingModal, {
  OracleProfile,
  getCachedProfile,
  setCachedProfile,
  clearCachedProfile,
} from "../components/OnboardingModal";

// ─── Score config ─────────────────────────────────────────────────────────────

const SCORE_FIELDS: { key: string; label: string }[] = [
  { key: "ai_hype_beast",           label: "AI Hype Beast"           },
  { key: "buzzword_density",        label: "Buzzword Density"        },
  { key: "cringe_founder_energy",   label: "Cringe Founder Energy"   },
  { key: "market_viability",        label: "Market Viability"        },
  { key: "pivot_to_ai_probability", label: "Pivot-to-AI Probability" },
  { key: "yc_bait_score",           label: "YC Bait Score"           },
  { key: "delusion_index",          label: "Delusion Index"          },
];

function scoreTier(val: number): "high" | "mid" | "low" {
  if (val >= 70) return "high";
  if (val >= 35) return "mid";
  return "low";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function IdeaPage() {
  const router = useRouter();

  const [userId, setUserId]                 = useState<string | null>(null);
  const [authChecked, setAuthChecked]       = useState(false);
  const [profile, setProfile]               = useState<OracleProfile | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [idea, setIdea]                     = useState("");
  const [scores, setScores]                 = useState<any>(null);
  const [loading, setLoading]               = useState(false);
  const [loggingOut, setLoggingOut]         = useState(false);

  const MAX_CHARS = 500;

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
      } else {
        setUserId(user.id);
        setAuthChecked(true);
      }
    });
  }, []);

  // ── Profile check ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authChecked || !userId) return;

    const checkProfile = async () => {
      const cached = getCachedProfile();
      if (cached) {
        setProfile(cached);
        setProfileChecked(true);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("name, followers, motivation")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) console.error("Profile fetch error:", error);

      if (data) {
        const p: OracleProfile = { name: data.name, followers: data.followers, motivation: data.motivation };
        setCachedProfile(p);
        setProfile(p);
      } else {
        setShowOnboarding(true);
      }

      setProfileChecked(true);
    };

    checkProfile();
  }, [authChecked, userId]);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setLoggingOut(true);
    clearCachedProfile();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  // ── Onboarding complete ─────────────────────────────────────────────────────
  const handleOnboardingComplete = (p: OracleProfile) => {
    setProfile(p);
    setShowOnboarding(false);
  };

  // ── Submit idea ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!idea.trim() || !userId) return;
    setLoading(true);
    setScores(null);

    const { data: inserted, error: insertError } = await supabase
      .from("ideas")
      .insert([{ idea_text: idea, user_id: userId }])
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("Insert failed:", insertError);
      setLoading(false);
      return alert("Insert failed");
    }

    const res = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea, idea_id: inserted.id, user_id: userId }),
    });

    if (!res.ok) {
      console.error("Score API error:", await res.text());
      setLoading(false);
      return alert("Error computing scores");
    }

    setScores(await res.json());
    setLoading(false);
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (!authChecked || !profileChecked) {
    return (
      <div className="oracle-page" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="scanlines" />
        <span className="loading-dots" style={{ fontSize: "1.5rem", color: "var(--gold-dim)" }}>
          <span>·</span><span>·</span><span>·</span>
        </span>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="oracle-page" style={{ minHeight: "100vh", position: "relative", zIndex: 1 }}>

      <div className="scanlines" />
      <div className="corner corner-tl" />
      <div className="corner corner-tr" />
      <div className="corner corner-bl" />
      <div className="corner corner-br" />

      {showOnboarding && userId && (
        <OnboardingModal userId={userId} onComplete={handleOnboardingComplete} />
      )}

      <main
        style={{
          minHeight: "100vh",
          padding: "var(--space-xl) var(--space-md)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Nav */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            maxWidth: "560px",
            marginBottom: "var(--space-lg)",
          }}
        >
          <Link href="/" className="t-label reveal" style={{ letterSpacing: "0.25em", opacity: 0.5 }}>
            ← The Oracle
          </Link>
          <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "center" }}>
            <Link href="/leaderboard" className="t-label reveal" style={{ letterSpacing: "0.25em", opacity: 0.5 }}>
              Leaderboard ♦
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn btn-ghost reveal"
              style={{ fontSize: "0.6rem", padding: "0.5rem 1rem" }}
            >
              {loggingOut ? (
                <span className="loading-dots"><span>·</span><span>·</span><span>·</span></span>
              ) : "Logout ♠"}
            </button>
          </div>
        </div>

        {/* Input card */}
        <div className="oracle-card reveal" style={{ width: "100%", maxWidth: "560px" }}>
          <div className="text-center mb-lg">
            <img
              src="/oracle.png"
              alt="The Oracle"
              className="crystal-ball crystal-ball--md"
              style={{ width: "8rem", height: "8rem", objectFit: "contain", display: "inline-block", marginBottom: "var(--space-sm)" }}
            />
            <h1 className="t-heading">Consult the Oracle</h1>
            {profile && (
              <p className="t-label mt-sm">
                Seeker: {profile.name} · {profile.followers} followers · motivated by {profile.motivation}
              </p>
            )}
          </div>

          <div className="divider mb-lg">
            <div className="divider-line" />
            <div className="divider-diamond" />
            <div className="divider-line" />
          </div>

          <div>
            <label className="t-label mb-xs">Your Startup Idea</label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Describe your idea... the more unhinged, the better."
              className="oracle-textarea"
              rows={5}
            />
          </div>

          <div
            className="flex items-center mt-md submit-row-mobile"
            style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-sm)" }}
          >
            <span className="t-meta">{idea.length} / {MAX_CHARS}</span>
            <button
              onClick={handleSubmit}
              disabled={loading || !idea.trim() || showOnboarding}
              className="btn btn-primary"
            >
              {loading ? (
                <>Divining <span className="loading-dots" style={{ marginLeft: "0.25rem" }}><span>·</span><span>·</span><span>·</span></span></>
              ) : "Submit Idea ♦"}
            </button>
          </div>
        </div>

        {/* Results */}
        {scores && (
          <div className="oracle-card reveal" style={{ width: "100%", maxWidth: "560px", marginTop: "var(--space-md)" }}>

            <div className="text-center mb-lg">
              <h2 className="t-heading">The Verdict</h2>
              {scores.composite_score !== undefined && (
                <p className="t-label mt-sm">Composite Score: {scores.composite_score}</p>
              )}
            </div>

            <div className="divider mb-lg">
              <div className="divider-line" />
              <div className="divider-diamond" />
              <div className="divider-line" />
            </div>

            <div className="score-list mb-lg">
              {SCORE_FIELDS.map(({ key, label }) => {
                const val = scores[key] ?? 0;
                const tier = scoreTier(val);
                return (
                  <div className="score-row" key={key}>
                    <div className="score-meta">
                      <span className="score-icon">◈</span>
                      <span className="score-label">{label}</span>
                      <span className={`score-value score-value--${tier}`}>{val}</span>
                    </div>
                    <div className="score-track">
                      <div className={`score-fill score-fill--${tier}`} style={{ width: `${Math.min(val, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {scores.founder_rank && (
              <div className="text-center mb-lg">
                <span className="t-label">Founder Rank</span>
                <p className="t-subheading mt-xs">{scores.founder_rank}</p>
              </div>
            )}

            {scores.goblin_verdict && (
              <>
                <div className="divider mb-lg">
                  <div className="divider-line" />
                  <div className="divider-diamond" />
                  <div className="divider-line" />
                </div>
                <label className="t-label mb-md text-center">Goblin Verdict</label>
                <div className="verdict-block">
                  <p className="verdict-text">{scores.goblin_verdict}</p>
                </div>
              </>
            )}

            <div className="text-center mt-lg">
              <Link href="/leaderboard" className="btn btn-ghost" style={{ display: "inline-flex" }}>
                View Leaderboard ♦
              </Link>
            </div>

            <div className="suits mt-lg">
              <span>♠</span><span>♥</span><span>♣</span><span>♦</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}