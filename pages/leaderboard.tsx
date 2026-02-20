import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  rank: number;
  name: string;
  founder_rank: string;
  composite_score: number;
  delusion_index: number;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreTier(val: number): "high" | "mid" | "low" {
  if (val >= 70) return "high";
  if (val >= 35) return "mid";
  return "low";
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

const RANK_GLYPHS: Record<number, string> = { 1: "♔", 2: "♕", 3: "♖" };

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [entries, setEntries]     = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [weekLabel, setWeekLabel] = useState("");

  useEffect(() => {
    const now = new Date();
    const day = now.getUTCDay();
    const diff = (day === 0 ? -6 : 1 - day);
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() + diff);
    monday.setUTCHours(0, 0, 0, 0);
    const weekStart = monday.toISOString();

    setWeekLabel(
      `Week of ${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    );

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("scores")
        .select(`
          composite_score,
          delusion_index,
          founder_rank,
          created_at,
          profiles!inner ( name )
        `)
        .gte("created_at", weekStart)
        .order("composite_score", { ascending: false })
        .limit(10);

      if (fetchError) {
        console.error("Leaderboard fetch error:", fetchError);
        setError("The Oracle's records are momentarily sealed.");
        setLoading(false);
        return;
      }

      const shaped: LeaderboardEntry[] = (data ?? []).map((row: any, i: number) => ({
        rank: i + 1,
        name: row.profiles?.name ?? "Unknown",
        founder_rank: row.founder_rank ?? "—",
        composite_score: row.composite_score ?? 0,
        delusion_index: row.delusion_index ?? 0,
        created_at: row.created_at,
      }));

      setEntries(shaped);
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="oracle-page" style={{ minHeight: "100vh", position: "relative", zIndex: 1 }}>

      <div className="scanlines" />
      <div className="corner corner-tl" />
      <div className="corner corner-tr" />
      <div className="corner corner-bl" />
      <div className="corner corner-br" />

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
            maxWidth: "600px",
            marginBottom: "var(--space-lg)",
          }}
        >
          <Link href="/" className="t-label reveal" style={{ letterSpacing: "0.25em", opacity: 0.5 }}>
            ← The Oracle
          </Link>
          <Link href="/idea" className="t-label reveal" style={{ letterSpacing: "0.25em", opacity: 0.5 }}>
            Submit Idea ♦
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-lg reveal" style={{ width: "100%", maxWidth: "600px" }}>
          <img
            src="/orb.png"
            alt="The Oracle"
            className="crystal-ball crystal-ball--md"
            style={{ width: "8rem", height: "8rem", objectFit: "contain", display: "inline-block", marginBottom: "var(--space-sm)" }}
          />
          <h1 className="t-heading">Hall of Delusion</h1>
          <p className="t-label mt-sm">Top 10 Most Delusional · {weekLabel}</p>
        </div>

        {/* Ornament */}
        <div className="ornament mb-lg reveal" style={{ width: "100%", maxWidth: "600px", animationDelay: "0.05s" }}>
          <div className="ornament-line" />
          <span className="ornament-label">ranked by composite score</span>
          <div className="ornament-line" />
        </div>

        {/* Content */}
        <div style={{ width: "100%", maxWidth: "600px" }}>

          {loading && (
            <div className="text-center reveal" style={{ padding: "var(--space-xl) 0" }}>
              <span className="loading-dots" style={{ fontSize: "1.5rem", color: "var(--gold-dim)" }}>
                <span>·</span><span>·</span><span>·</span>
              </span>
              <p className="t-label mt-sm">Consulting the records</p>
            </div>
          )}

          {!loading && error && (
            <div className="oracle-card reveal text-center" style={{ padding: "var(--space-lg)" }}>
              <p className="t-body">{error}</p>
            </div>
          )}

          {!loading && !error && entries.length === 0 && (
            <div className="oracle-card reveal text-center" style={{ padding: "var(--space-xl)" }}>
              <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "var(--space-md)", opacity: 0.4 }}>♦</span>
              <p className="t-subheading mb-sm">No delusions recorded this week.</p>
              <p className="t-body mb-lg">Be the first to consult the Oracle.</p>
              <Link href="/idea" className="btn btn-primary" style={{ display: "inline-flex" }}>
                Submit an Idea ♦
              </Link>
            </div>
          )}

          {!loading && !error && entries.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {entries.map((entry, i) => {
                const tier = scoreTier(entry.composite_score);
                const isTop3 = entry.rank <= 3;
                const glyph = RANK_GLYPHS[entry.rank];
                const animDelay = `${0.05 * i}s`;

                return (
                  <div
                    key={i}
                    className="oracle-card reveal"
                    style={{
                      animationDelay: animDelay,
                      padding: "var(--space-md) var(--space-lg)",
                      borderColor: isTop3 ? "var(--gold-dim)" : "var(--ash)",
                      boxShadow: isTop3
                        ? "0 0 40px rgba(0,0,0,0.8), 0 0 60px rgba(201,168,76,0.07)"
                        : undefined,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>

                      <div style={{ flexShrink: 0, width: "3rem", textAlign: "center" }}>
                        {glyph ? (
                          <span style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "1.5rem",
                            color: "var(--gold)",
                            filter: "drop-shadow(0 0 6px rgba(201,168,76,0.5))",
                            display: "block",
                          }}>
                            {glyph}
                          </span>
                        ) : (
                          <span style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.6rem",
                            letterSpacing: "0.1em",
                            color: "var(--faint)",
                            display: "block",
                          }}>
                            {ordinal(entry.rank)}
                          </span>
                        )}
                      </div>

                      <div style={{ width: "1px", height: "2.5rem", background: "var(--ash)", flexShrink: 0 }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontFamily: "var(--font-display)",
                          fontStyle: "italic",
                          fontWeight: 700,
                          fontSize: "1rem",
                          color: isTop3 ? "var(--gold)" : "var(--cream)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>
                          {entry.name}
                        </p>
                        <span className="t-label" style={{ marginTop: "0.2rem" }}>
                          {entry.founder_rank} · {fmtDate(entry.created_at)}
                        </span>
                      </div>

                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span className={`score-value score-value--${tier}`} style={{ fontSize: "1.3rem", display: "block" }}>
                          {entry.composite_score}
                        </span>
                        <span className="t-label" style={{ color: "var(--faint)" }}>
                          Delusion {entry.delusion_index}
                        </span>
                      </div>

                    </div>

                    <div className="score-track" style={{ marginTop: "0.75rem" }}>
                      <div
                        className={`score-fill score-fill--${tier}`}
                        style={{ width: `${Math.min(entry.composite_score, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && entries.length > 0 && (
            <>
              <div className="ornament mt-lg mb-md reveal" style={{ animationDelay: "0.6s" }}>
                <div className="ornament-line" />
                <span className="ornament-label">end of records</span>
                <div className="ornament-line" />
              </div>
              <div className="text-center reveal" style={{ animationDelay: "0.65s" }}>
                <Link href="/idea" className="btn btn-ghost" style={{ display: "inline-flex" }}>
                  Challenge the Board ♦
                </Link>
              </div>
            </>
          )}

          <div className="suits mt-xl reveal" style={{ animationDelay: "0.7s" }}>
            <span>♠</span><span>♥</span><span>♣</span><span>♦</span>
          </div>
        </div>
      </main>
    </div>
  );
}