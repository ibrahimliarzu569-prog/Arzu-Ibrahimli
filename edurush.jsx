import React, { useState, useEffect, useRef, useCallback } from "react";

// ---------- Design tokens ----------
const C = {
  bg: "#12141F",
  surface: "#1B1E2E",
  surfaceAlt: "#232842",
  line: "#2E3350",
  text: "#F5F3EE",
  muted: "#8B90A8",
  mint: "#4CE0B3",
  amber: "#FFB648",
  red: "#FF6B6B",
  blue: "#6FA8FF",
  purple: "#C792EA",
};

const SUBJECTS = {
  math: { label: "Math", color: C.blue },
  english: { label: "English", color: C.purple },
  history: { label: "History", color: C.amber },
  geography: { label: "Geography", color: C.mint },
};

// ---------- Question bank ----------
const BANK = [
  { id: 1, subject: "math", q: "What is 12 × 7?", opts: ["74", "84", "82", "94"], a: 1 },
  { id: 2, subject: "math", q: "What is the square root of 144?", opts: ["10", "11", "12", "13"], a: 2 },
  { id: 3, subject: "math", q: "What is 15% of 200?", opts: ["20", "25", "30", "35"], a: 2 },
  { id: 4, subject: "math", q: "Solve: 9 + 6 × 2", opts: ["30", "21", "18", "24"], a: 1 },
  { id: 5, subject: "math", q: "What is 3⁴?", opts: ["12", "64", "81", "27"], a: 2 },
  { id: 6, subject: "math", q: "How many sides does a hexagon have?", opts: ["5", "6", "7", "8"], a: 1 },
  { id: 7, subject: "math", q: "What is 100 ÷ 4?", opts: ["20", "25", "30", "40"], a: 1 },
  { id: 8, subject: "english", q: "What is the synonym of 'happy'?", opts: ["Sad", "Joyful", "Angry", "Tired"], a: 1 },
  { id: 9, subject: "english", q: "Choose the correctly spelled word:", opts: ["Recieve", "Receive", "Receeve", "Receve"], a: 1 },
  { id: 10, subject: "english", q: "What is the antonym of 'ancient'?", opts: ["Old", "Modern", "Historic", "Aged"], a: 1 },
  { id: 11, subject: "english", q: "Which word is a noun?", opts: ["Quickly", "Beautiful", "Freedom", "Run"], a: 2 },
  { id: 12, subject: "english", q: "Fill in: She ___ to school every day.", opts: ["go", "goes", "going", "gone"], a: 1 },
  { id: 13, subject: "english", q: "What is the plural of 'child'?", opts: ["Childs", "Childes", "Children", "Childrens"], a: 2 },
  { id: 14, subject: "english", q: "Which is a metaphor?", opts: ["Fast as lightning", "Time is money", "Like a lion", "As brave as a lion"], a: 1 },
  { id: 15, subject: "history", q: "Who was the first President of the USA?", opts: ["Lincoln", "Washington", "Jefferson", "Adams"], a: 1 },
  { id: 16, subject: "history", q: "In which year did World War II end?", opts: ["1943", "1944", "1945", "1946"], a: 2 },
  { id: 17, subject: "history", q: "Which ancient civilization built the pyramids of Giza?", opts: ["Romans", "Greeks", "Egyptians", "Mayans"], a: 2 },
  { id: 18, subject: "history", q: "The Berlin Wall fell in which year?", opts: ["1987", "1989", "1991", "1993"], a: 1 },
  { id: 19, subject: "history", q: "Who wrote the Declaration of Independence?", opts: ["Franklin", "Jefferson", "Washington", "Adams"], a: 1 },
  { id: 20, subject: "history", q: "The Great Wall was built to protect which country?", opts: ["Japan", "Korea", "China", "Mongolia"], a: 2 },
  { id: 21, subject: "geography", q: "What is the capital of Japan?", opts: ["Seoul", "Beijing", "Tokyo", "Bangkok"], a: 2 },
  { id: 22, subject: "geography", q: "Which is the longest river in the world?", opts: ["Amazon", "Nile", "Yangtze", "Mississippi"], a: 1 },
  { id: 23, subject: "geography", q: "Which continent is the Sahara Desert on?", opts: ["Asia", "Africa", "Australia", "South America"], a: 1 },
  { id: 24, subject: "geography", q: "What is the smallest country in the world?", opts: ["Monaco", "San Marino", "Vatican City", "Liechtenstein"], a: 2 },
  { id: 25, subject: "geography", q: "Which mountain range separates Europe and Asia?", opts: ["Alps", "Andes", "Ural", "Himalayas"], a: 2 },
  { id: 26, subject: "geography", q: "Which ocean is the largest?", opts: ["Atlantic", "Indian", "Arctic", "Pacific"], a: 3 },
  { id: 27, subject: "math", q: "What is the value of π rounded to 2 decimals?", opts: ["3.12", "3.14", "3.16", "3.18"], a: 1 },
  { id: 28, subject: "english", q: "What part of speech is 'quickly'?", opts: ["Noun", "Verb", "Adverb", "Adjective"], a: 2 },
];

const todayStr = () => new Date().toISOString().slice(0, 10);
const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

const DEFAULT_PROGRESS = {
  xp: 0,
  coins: 0,
  streak: 0,
  lastPlayedDate: null,
  wrongCounts: { math: 0, english: 0, history: 0, geography: 0 },
  totalAnswered: 0,
  totalCorrect: 0,
};

function pickDailySet(wrongCounts) {
  const bySubject = {};
  Object.keys(SUBJECTS).forEach((s) => (bySubject[s] = BANK.filter((q) => q.subject === s)));
  const weighted = [];
  BANK.forEach((q) => {
    const weight = 1 + (wrongCounts[q.subject] || 0) * 2;
    for (let i = 0; i < weight; i++) weighted.push(q);
  });
  const chosen = [];
  const usedIds = new Set();
  // guarantee one from each subject first
  Object.keys(SUBJECTS).forEach((s) => {
    const pool = bySubject[s];
    if (pool.length) {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      chosen.push(pick);
      usedIds.add(pick.id);
    }
  });
  let guard = 0;
  while (chosen.length < 10 && guard < 500) {
    guard++;
    const pick = weighted[Math.floor(Math.random() * weighted.length)];
    if (!usedIds.has(pick.id)) {
      chosen.push(pick);
      usedIds.add(pick.id);
    }
  }
  // shuffle
  for (let i = chosen.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
  }
  return chosen.slice(0, 10);
}

function levelFromXp(xp) {
  const level = Math.floor(xp / 100) + 1;
  const into = xp % 100;
  return { level, into, need: 100 };
}

export default function EduRush() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(DEFAULT_PROGRESS);
  const [screen, setScreen] = useState("home"); // home | quiz | results
  const [dailySet, setDailySet] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]); // {correct, subject, fast}
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [saveError, setSaveError] = useState(false);
  const timerRef = useRef(null);

  // load progress
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("progress");
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setProgress({ ...DEFAULT_PROGRESS, ...parsed });
        }
      } catch (e) {
        // no existing progress yet — use defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (next) => {
    try {
      const result = await window.storage.set("progress", JSON.stringify(next));
      if (!result) setSaveError(true);
      else setSaveError(false);
    } catch (e) {
      setSaveError(true);
    }
  }, []);

  const playedToday = progress.lastPlayedDate === todayStr();

  const startRush = () => {
    const set = pickDailySet(progress.wrongCounts);
    setDailySet(set);
    setQIndex(0);
    setSelected(null);
    setAnswers([]);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(10);
    setScreen("quiz");
  };

  // per-question countdown timer
  useEffect(() => {
    if (screen !== "quiz" || selected !== null) return;
    setTimeLeft(10);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleAnswer(-1); // time's up, no selection
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex, screen]);

  const handleAnswer = (optIndex) => {
    if (selected !== null) return;
    clearInterval(timerRef.current);
    const current = dailySet[qIndex];
    const isCorrect = optIndex === current.a;
    const fast = isCorrect && timeLeft >= 6;
    setSelected(optIndex);
    setAnswers((prev) => [...prev, { subject: current.subject, correct: isCorrect, fast }]);
    setCombo((c) => {
      const next = isCorrect ? c + 1 : 0;
      setMaxCombo((m) => Math.max(m, next));
      return next;
    });
    setTimeout(() => {
      if (qIndex + 1 < dailySet.length) {
        setQIndex((i) => i + 1);
        setSelected(null);
      } else {
        finishRush([...answers, { subject: current.subject, correct: isCorrect, fast }]);
      }
    }, 900);
  };

  const finishRush = (finalAnswers) => {
    const correctCount = finalAnswers.filter((a) => a.correct).length;
    const baseXp = correctCount * 10;
    const speedBonus = finalAnswers.filter((a) => a.fast).length * 3;
    const comboBonus = maxCombo >= 3 ? maxCombo * 2 : 0;
    const xpGained = baseXp + speedBonus + comboBonus;
    const coinsGained = correctCount * 5 + (maxCombo >= 5 ? 10 : 0);

    const wrongCounts = { ...progress.wrongCounts };
    finalAnswers.forEach((a) => {
      if (!a.correct) wrongCounts[a.subject] = (wrongCounts[a.subject] || 0) + 1;
    });

    let streak = progress.streak;
    if (progress.lastPlayedDate === yesterdayStr()) streak += 1;
    else if (progress.lastPlayedDate !== todayStr()) streak = 1;

    const next = {
      xp: progress.xp + xpGained,
      coins: progress.coins + coinsGained,
      streak,
      lastPlayedDate: todayStr(),
      wrongCounts,
      totalAnswered: progress.totalAnswered + finalAnswers.length,
      totalCorrect: progress.totalCorrect + correctCount,
    };
    setProgress(next);
    persist(next);
    setScreen("results");
  };

  const lastRunStats = () => {
    const correctCount = answers.filter((a) => a.correct).length;
    const baseXp = correctCount * 10;
    const speedBonus = answers.filter((a) => a.fast).length * 3;
    const comboBonus = maxCombo >= 3 ? maxCombo * 2 : 0;
    return {
      correctCount,
      total: answers.length,
      xpGained: baseXp + speedBonus + comboBonus,
      coinsGained: correctCount * 5 + (maxCombo >= 5 ? 10 : 0),
      maxCombo,
    };
  };

  const weakestSubject = () => {
    const entries = Object.entries(progress.wrongCounts);
    if (entries.every(([, v]) => v === 0)) return null;
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  };

  const { level, into, need } = levelFromXp(progress.xp);

  const font = {
    display: "'Space Grotesk', sans-serif",
    body: "'Inter', sans-serif",
  };

  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontFamily: font.body }}>
        Loading your rush…
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: font.body, color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        button { font-family: inherit; cursor: pointer; }
        button:focus-visible, [tabindex]:focus-visible { outline: 2px solid ${C.mint}; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; } }
        .optbtn:hover:not(:disabled) { border-color: ${C.mint} !important; }
        @keyframes pulseIn { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px 48px", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {screen === "home" && (
          <Home
            progress={progress}
            level={level}
            into={into}
            need={need}
            weakest={weakestSubject()}
            playedToday={playedToday}
            onStart={startRush}
            font={font}
            saveError={saveError}
          />
        )}

        {screen === "quiz" && dailySet.length > 0 && (
          <Quiz
            dailySet={dailySet}
            qIndex={qIndex}
            selected={selected}
            timeLeft={timeLeft}
            combo={combo}
            onAnswer={handleAnswer}
            font={font}
          />
        )}

        {screen === "results" && (
          <Results
            stats={lastRunStats()}
            progress={progress}
            level={level}
            font={font}
            onHome={() => setScreen("home")}
          />
        )}
      </div>
    </div>
  );
}

function XpBar({ into, need, color }) {
  return (
    <div style={{ height: 8, background: C.surfaceAlt, borderRadius: 999, overflow: "hidden" }}>
      <div style={{ width: `${(into / need) * 100}%`, height: "100%", background: color, transition: "width 0.5s ease" }} />
    </div>
  );
}

function Home({ progress, level, into, need, weakest, playedToday, onStart, font, saveError }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ fontFamily: font.display, fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>
          Edu<span style={{ color: C.mint }}>Rush</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Pill icon="🪙" value={progress.coins} color={C.amber} />
          <Pill icon="🔥" value={progress.streak} color={C.red} />
        </div>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 20, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 18 }}>Level {level}</span>
          <span style={{ color: C.muted, fontSize: 13 }}>{into} / {need} XP</span>
        </div>
        <XpBar into={into} need={need} color={C.mint} />
      </div>

      {weakest && (
        <div style={{ background: C.surfaceAlt, borderRadius: 16, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, border: `1px solid ${C.line}` }}>
          <span style={{ fontSize: 20 }}>🎯</span>
          <div>
            <div style={{ fontSize: 13, color: C.muted }}>Your weak spot</div>
            <div style={{ fontWeight: 600, color: SUBJECTS[weakest].color }}>{SUBJECTS[weakest].label} — today's rush leans here</div>
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>Subjects in the mix</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(SUBJECTS).map(([key, s]) => (
            <span key={key} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 999, background: C.surfaceAlt, color: s.color, border: `1px solid ${C.line}` }}>
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {playedToday ? (
        <div style={{ textAlign: "center" }}>
          <button
            disabled
            style={{
              width: "100%", padding: "16px", borderRadius: 16, border: "none",
              background: C.surfaceAlt, color: C.muted, fontFamily: font.display, fontWeight: 700, fontSize: 16,
            }}
          >
            Come back tomorrow ✓
          </button>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 10 }}>You've already rushed today — nice consistency.</div>
        </div>
      ) : (
        <button
          onClick={onStart}
          style={{
            width: "100%", padding: "18px", borderRadius: 16, border: "none",
            background: `linear-gradient(90deg, ${C.mint}, #35C39A)`, color: "#0B1410", fontFamily: font.display, fontWeight: 700, fontSize: 17,
            boxShadow: `0 8px 24px -8px ${C.mint}80`,
          }}
        >
          Start today's rush ⚡
        </button>
      )}

      {saveError && (
        <div style={{ fontSize: 12, color: C.red, marginTop: 12, textAlign: "center" }}>
          Progress couldn't be saved this time — you can keep playing, but it may not persist.
        </div>
      )}
    </div>
  );
}

function Pill({ icon, value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 999, padding: "6px 12px", fontWeight: 600, fontSize: 14 }}>
      <span>{icon}</span>
      <span style={{ color }}>{value}</span>
    </div>
  );
}

function Quiz({ dailySet, qIndex, selected, timeLeft, combo, onAnswer, font }) {
  const current = dailySet[qIndex];
  const subj = SUBJECTS[current.subject];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      {/* Track / checkpoints */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {dailySet.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 6, borderRadius: 999,
              background: i < qIndex ? C.mint : i === qIndex ? C.amber : C.surfaceAlt,
              transition: "background 0.3s ease",
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: C.muted }}>Question {qIndex + 1} of {dailySet.length}</span>
        {combo >= 2 && (
          <span style={{ fontSize: 13, fontWeight: 700, color: C.amber }}>🔥 x{combo} combo</span>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: subj.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {subj.label}
        </span>
        <span style={{ fontSize: 13, color: timeLeft <= 3 ? C.red : C.muted, fontWeight: 600 }}>
          ⏱ {timeLeft}s
        </span>
      </div>

      <div
        key={current.id}
        style={{
          background: C.surface, border: `1px solid ${C.line}`, borderRadius: 20, padding: 24, marginBottom: 20,
          animation: "pulseIn 0.25s ease",
        }}
      >
        <div style={{ fontFamily: font.display, fontSize: 19, fontWeight: 700, lineHeight: 1.4 }}>
          {current.q}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {current.opts.map((opt, i) => {
          let bg = C.surface;
          let border = C.line;
          let textColor = C.text;
          if (selected !== null) {
            if (i === current.a) { bg = `${C.mint}22`; border = C.mint; textColor = C.mint; }
            else if (i === selected) { bg = `${C.red}22`; border = C.red; textColor = C.red; }
          }
          return (
            <button
              key={i}
              className="optbtn"
              disabled={selected !== null}
              onClick={() => onAnswer(i)}
              style={{
                textAlign: "left", padding: "14px 16px", borderRadius: 14, border: `1.5px solid ${border}`,
                background: bg, color: textColor, fontSize: 15, fontWeight: 500, transition: "all 0.15s ease",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Results({ stats, progress, level, font, onHome }) {
  const { level: levelAfter } = levelFromXp(progress.xp);
  const leveledUp = levelAfter > level || levelAfter > Math.floor((progress.xp - stats.xpGained) / 100) + 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, textAlign: "center" }}>
      <div style={{ marginTop: 20, marginBottom: 8, fontSize: 40 }}>
        {stats.correctCount === stats.total ? "🏆" : stats.correctCount >= stats.total * 0.6 ? "⚡" : "💪"}
      </div>
      <div style={{ fontFamily: font.display, fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
        {stats.correctCount} / {stats.total} correct
      </div>
      <div style={{ color: C.muted, fontSize: 14, marginBottom: 28 }}>
        {leveledUp ? `Level up — you're now level ${levelFromXp(progress.xp).level}!` : "Nice work — see you tomorrow."}
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
        <StatCard icon="⚡" label="XP earned" value={`+${stats.xpGained}`} color={C.mint} />
        <StatCard icon="🪙" label="Coins" value={`+${stats.coinsGained}`} color={C.amber} />
        <StatCard icon="🔥" label="Streak" value={progress.streak} color={C.red} />
      </div>

      {stats.maxCombo >= 3 && (
        <div style={{ fontSize: 13, color: C.amber, marginBottom: 24 }}>
          Best combo this run: {stats.maxCombo} in a row 🔥
        </div>
      )}

      <div style={{ flex: 1 }} />

      <button
        onClick={onHome}
        style={{
          width: "100%", padding: "16px", borderRadius: 16, border: "none",
          background: C.surfaceAlt, color: C.text, fontFamily: font.display, fontWeight: 700, fontSize: 16,
        }}
      >
        Back home
      </button>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: "14px 8px" }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color }}>{value}</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
    </div>
  );
}
