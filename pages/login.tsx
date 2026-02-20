import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import { clearCachedProfile } from "../components/OnboardingModal";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      router.push("/idea");
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    clearCachedProfile();
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      alert("Signup successful! Check your email to confirm, then log in.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="oracle-page" style={{ minHeight: "100vh", position: "relative", zIndex: 1 }}>

      <div className="scanlines" />
      <div className="corner corner-tl" />
      <div className="corner corner-tr" />
      <div className="corner corner-bl" />
      <div className="corner corner-br" />

      <main
        className="flex flex-col items-center justify-center"
        style={{ minHeight: "100vh", padding: "var(--space-xl) var(--space-md)", position: "relative", zIndex: 1 }}
      >
        <Link
          href="/"
          className="t-label mb-lg reveal"
          style={{ letterSpacing: "0.25em", opacity: 0.5, alignSelf: "flex-start", maxWidth: "420px", width: "100%" }}
        >
          ← The Oracle
        </Link>

        <div className="oracle-card reveal" style={{ width: "100%", maxWidth: "420px" }}>

          <div className="text-center mb-lg">
            <img
              src="/orb.png"
              alt="The Oracle"
              className="crystal-ball crystal-ball--sm"
              style={{ width: "4rem", height: "4rem", objectFit: "contain", display: "inline-block", marginBottom: "var(--space-sm)" }}
            />
            <h1 className="t-heading">Who goes there?</h1>
            <p className="t-body mt-sm" style={{ fontSize: "0.8rem" }}>
              The Oracle requires authentication.
            </p>
          </div>

          <div className="divider mb-lg">
            <div className="divider-line" />
            <div className="divider-diamond" />
            <div className="divider-line" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
            <div>
              <label className="t-label mb-xs">Email</label>
              <input
                type="email"
                placeholder="you@startup.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                className="oracle-input"
              />
            </div>
            <div>
              <label className="t-label mb-xs">Password</label>
              <input
                type="password"
                placeholder="············"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="oracle-input"
              />
            </div>
          </div>

          <div className="divider mt-lg mb-lg">
            <div className="divider-line" />
            <div className="divider-diamond" />
            <div className="divider-line" />
          </div>

          <div style={{ display: "flex", gap: "var(--space-sm)" }}>
            <button
              onClick={handleLogin}
              className="btn btn-primary"
              disabled={loading}
              style={{ flex: 1, justifyContent: "center" }}
            >
              {loading ? (
                <span className="loading-dots"><span>·</span><span>·</span><span>·</span></span>
              ) : "Login ♦"}
            </button>
            <button
              onClick={handleSignup}
              className="btn btn-ghost"
              disabled={loading}
              style={{ flex: 1, justifyContent: "center" }}
            >
              Sign Up ♠
            </button>
          </div>

          <div className="suits mt-lg">
            <span>♠</span><span>♥</span><span>♣</span><span>♦</span>
          </div>
        </div>
      </main>
    </div>
  );
}