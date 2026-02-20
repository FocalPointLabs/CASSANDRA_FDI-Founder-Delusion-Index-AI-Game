import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { clearCachedProfile } from "../components/OnboardingModal";

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(!!user);
    });
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    clearCachedProfile();
    await supabase.auth.signOut();
    setAuthed(false);
    setLoggingOut(false);
  };

  return (
    <div className="oracle-page" style={{ minHeight: "100vh", position: "relative", zIndex: 1 }}>

      <div className="scanlines" />
      <div className="corner corner-tl" />
      <div className="corner corner-tr" />
      <div className="corner corner-bl" />
      <div className="corner corner-br" />

      {authed && (
        <div style={{ position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 150 }}>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="btn btn-ghost"
            style={{ fontSize: "0.6rem", padding: "0.5rem 1rem" }}
          >
            {loggingOut ? (
              <span className="loading-dots"><span>·</span><span>·</span><span>·</span></span>
            ) : "Logout ♠"}
          </button>
        </div>
      )}

      <main
        className="flex flex-col items-center justify-center"
        style={{ minHeight: "100vh", padding: "var(--space-xl) var(--space-md)", position: "relative", zIndex: 1 }}
      >
        {/* Oracle image — lg size on home page */}
        <img
          src="/oracle.png"
          alt="Cassandra"
          className="crystal-ball crystal-ball--lg mb-md"
          style={{ width: "17rem", height: "16rem", objectFit: "contain" }}
        />

        <h1 className="t-display text-center mb-md reveal" style={{ animationDelay: "0.05s" }}>
          Cassandra
        </h1>

        <div className="ornament mb-md reveal" style={{ width: "100%", maxWidth: "420px", animationDelay: "0.1s" }}>
          <div className="ornament-line" />
          <span className="ornament-label">FOUNDER DELUSION INDEX</span>
          <div className="ornament-line" />
        </div>

        <p
          className="t-body text-center reveal"
          style={{ maxWidth: "480px", marginBottom: "var(--space-xl)", animationDelay: "0.15s" }}
        >
          Submit your startup idea. Receive your scores. Face the verdict.
        </p>

        <div
          className="flex gap-md reveal"
          style={{ flexWrap: "wrap", justifyContent: "center", animationDelay: "0.2s" }}
        >
          {authed ? (
            <>
              <Link href="/idea" className="btn btn-primary">Submit an Idea ♦</Link>
              <Link href="/leaderboard" className="btn btn-ghost">Leaderboard ♣</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Log In ♠</Link>
              <Link href="/leaderboard" className="btn btn-ghost">Leaderboard ♣</Link>
              <Link href="/login" className="btn btn-primary">Get Started ♦</Link>
            </>
          )}
        </div>

        <div className="suits mt-xl reveal" style={{ animationDelay: "0.3s" }}>
          <span>♠</span><span>♥</span><span>♣</span><span>♦</span>
        </div>

        <p className="t-meta text-center mt-sm reveal" style={{ animationDelay: "0.35s" }}>
          Built with Next.js · Supabase · Cerebra LLM
        </p>
      </main>
    </div>
  );
}