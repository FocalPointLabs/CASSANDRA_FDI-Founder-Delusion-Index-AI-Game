import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OracleProfile {
  name: string;
  followers: string;
  motivation: string;
}

interface Props {
  userId: string;
  onComplete: (profile: OracleProfile) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const PROFILE_CACHE_KEY = "oracle_profile_cache";

const MOTIVATIONS = [
  { value: "fun",        label: "Fun",        glyph: "♣" },
  { value: "hype",       label: "Hype",       glyph: "♦" },
  { value: "profit",     label: "Profit",     glyph: "♠" },
  { value: "reputation", label: "Reputation", glyph: "♥" },
];

const STEPS = [
  {
    id: "name",
    question: "What are you called?",
    hint: "Your name, handle, alias — whatever the Oracle should know you as.",
    type: "text" as const,
    placeholder: "Enter your name...",
  },
  {
    id: "followers",
    question: "How many follow you?",
    hint: "Across all platforms. The Oracle is not judging. (It is absolutely judging.)",
    type: "text" as const,
    placeholder: "e.g. 420, 12000, painfully few...",
  },
  {
    id: "motivation",
    question: "Why do you code?",
    hint: "Choose the truest answer. There is only one.",
    type: "choice" as const,
    placeholder: "",
  },
];

// ─── Typewriter Hook ──────────────────────────────────────────────────────────

function useTypewriter(text: string, speed = 38) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayed, done };
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

export function getCachedProfile(): OracleProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedProfile(profile: OracleProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
}

export function clearCachedProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROFILE_CACHE_KEY);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingModal({ userId, onComplete }: Props) {
  const [step, setStep]           = useState(0);
  const [answers, setAnswers]     = useState({ name: "", followers: "", motivation: "" });
  const [inputVal, setInputVal]   = useState("");
  const [greeting, setGreeting]   = useState(false);
  const [exiting, setExiting]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  const currentStep = STEPS[step];
  const { displayed: typedQuestion, done: questionReady } = useTypewriter(
    greeting ? `Interesting, ${answers.name}...` : currentStep.question,
    greeting ? 55 : 38
  );

  useEffect(() => {
    if (questionReady && !greeting && currentStep.type === "text") {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [questionReady, greeting, currentStep.type]);

  useEffect(() => {
    if (!greeting) return;
    const t = setTimeout(() => { setGreeting(false); setStep(2); }, 2000);
    return () => clearTimeout(t);
  }, [greeting]);

  const handleNext = () => {
    const key = currentStep.id as keyof typeof answers;
    if (!inputVal.trim()) return;
    const updated = { ...answers, [key]: inputVal.trim() };
    setAnswers(updated);
    setInputVal("");
    if (step === 0) { setStep(1); }
    else if (step === 1) { setGreeting(true); }
  };

  const handleChoice = async (value: string) => {
    const profile: OracleProfile = { ...answers, motivation: value };
    setSaving(true);
    setSaveError(null);

    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: userId, ...profile }, { onConflict: "user_id" });

    setSaving(false);

    if (error) {
      console.error("Profile save failed:", error);
      setSaveError("The Oracle failed to record your essence. Try again.");
      return;
    }

    setCachedProfile(profile);
    setExiting(true);
    setTimeout(() => onComplete(profile), 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleNext();
  };

  const isTextStep   = !greeting && currentStep.type === "text";
  const isChoiceStep = !greeting && currentStep.type === "choice";

  return (
    <div className={`onboard-backdrop ${exiting ? "onboard-backdrop--exit" : ""}`}>
      <div className={`onboard-modal ${exiting ? "onboard-modal--exit" : ""}`}>

        <div className="onboard-pips">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`onboard-pip ${i === step ? "onboard-pip--active" : i < step ? "onboard-pip--done" : ""}`}
            />
          ))}
        </div>

        {/* orb.png replacing the emoji */}
        <div className="onboard-glyph">
          <img
            src="/orb.png"
            alt="The Oracle"
            className="crystal-ball crystal-ball--sm"
            style={{ width: "4.5rem", height: "4.5rem", objectFit: "contain", display: "inline-block" }}
          />
        </div>

        <h2 className="onboard-question">
          {typedQuestion}
          {!questionReady && <span className="onboard-cursor">|</span>}
        </h2>

        {questionReady && !greeting && (
          <p className="onboard-hint reveal">{currentStep.hint}</p>
        )}

        {questionReady && isTextStep && (
          <div className="onboard-input-row reveal">
            <input
              ref={inputRef}
              type="text"
              className="oracle-input onboard-input"
              placeholder={currentStep.placeholder}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!inputVal.trim()}
            >
              Continue ♦
            </button>
          </div>
        )}

        {questionReady && isChoiceStep && (
          <>
            {saving ? (
              <div className="text-center" style={{ padding: "var(--space-lg) 0" }}>
                <span className="loading-dots" style={{ fontSize: "1.5rem", color: "var(--gold-dim)" }}>
                  <span>·</span><span>·</span><span>·</span>
                </span>
                <p className="t-label mt-sm">Sealing your essence...</p>
              </div>
            ) : (
              <div className="onboard-choices reveal">
                {MOTIVATIONS.map(({ value, label, glyph }) => (
                  <button
                    key={value}
                    className="onboard-choice"
                    onClick={() => handleChoice(value)}
                  >
                    <span className="onboard-choice-glyph">{glyph}</span>
                    <span className="onboard-choice-label">{label}</span>
                  </button>
                ))}
              </div>
            )}
            {saveError && (
              <p className="t-label mt-sm" style={{ color: "var(--red)", textAlign: "center" }}>
                {saveError}
              </p>
            )}
          </>
        )}

      </div>

      <style>{`
        .onboard-backdrop {
          position: fixed; inset: 0;
          background: rgba(8,8,8,0.92);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 1.5rem; z-index: 200;
          animation: backdropIn 0.4s ease forwards;
        }
        .onboard-backdrop--exit { animation: backdropOut 0.5s ease forwards; }
        @keyframes backdropIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes backdropOut { from { opacity: 1; } to { opacity: 0; } }

        .onboard-modal {
          background: var(--smoke); border: 1px solid var(--ash);
          width: 100%; max-width: 480px; padding: 3rem 2.5rem;
          position: relative; text-align: center;
          animation: modalIn 0.45s cubic-bezier(0.16,1,0.3,1) forwards;
          box-shadow: 0 0 80px rgba(0,0,0,0.9), 0 0 120px rgba(201,168,76,0.06);
        }
        .onboard-modal--exit { animation: modalOut 0.5s ease forwards; }
        .onboard-modal::before {
          content: ''; position: absolute; inset: 6px;
          border: 1px solid rgba(201,168,76,0.08); pointer-events: none;
        }
        @keyframes modalIn  { from { opacity:0; transform: translateY(24px) scale(0.97); } to { opacity:1; transform: translateY(0) scale(1); } }
        @keyframes modalOut { from { opacity:1; transform: scale(1); } to { opacity:0; transform: scale(0.96); } }

        .onboard-pips { display:flex; gap:0.5rem; justify-content:center; margin-bottom:2rem; }
        .onboard-pip { width:24px; height:3px; background:var(--ash); transition:background 0.3s,box-shadow 0.3s; }
        .onboard-pip--active { background:var(--gold); box-shadow:0 0 8px rgba(201,168,76,0.5); }
        .onboard-pip--done   { background:var(--gold-dim); }

        .onboard-glyph { margin-bottom:1.5rem; }

        .onboard-question {
          font-family:var(--font-display); font-style:italic; font-weight:700;
          font-size:clamp(1.4rem,4vw,1.9rem); color:var(--gold);
          line-height:1.2; min-height:3rem; margin-bottom:1rem;
        }
        .onboard-cursor { display:inline-block; color:var(--gold); animation:cursorBlink 0.8s step-end infinite; margin-left:2px; }
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }

        .onboard-hint { font-size:0.75rem; color:var(--muted); font-style:italic; margin-bottom:2rem; line-height:1.6; }

        .onboard-input-row { display:flex; gap:0.75rem; align-items:stretch; }
        .onboard-input { flex:1; min-width:0; }

        .onboard-choices { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; }
        .onboard-choice {
          background:var(--black); border:1px solid var(--ash); color:var(--cream);
          padding:1.1rem 1rem; cursor:pointer;
          transition:border-color 0.2s,background 0.2s,box-shadow 0.2s,transform 0.15s;
          display:flex; flex-direction:column; align-items:center; gap:0.4rem;
        }
        .onboard-choice:hover {
          border-color:var(--gold); background:rgba(201,168,76,0.06);
          box-shadow:0 0 20px rgba(201,168,76,0.1); transform:translateY(-2px);
        }
        .onboard-choice-glyph { font-size:1.4rem; color:var(--gold-dim); transition:color 0.2s; }
        .onboard-choice:hover .onboard-choice-glyph { color:var(--gold); }
        .onboard-choice-label {
          font-family:var(--font-mono); font-size:0.65rem; font-weight:700;
          letter-spacing:0.25em; text-transform:uppercase; color:var(--muted);
        }

        @media (max-width:480px) {
          .onboard-modal { padding:2rem 1.25rem; }
          .onboard-input-row { flex-direction:column; }
          .onboard-input-row .btn { width:100%; justify-content:center; }
        }
      `}</style>
    </div>
  );
}