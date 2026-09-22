import { useState, useEffect, useRef } from "react";

type FocusMode = "focus" | "short" | "long";

const MODE_CONFIG: Record<FocusMode, { label: string; defaultMin: number; color: string }> = {
  focus: { label: "Enfoque", defaultMin: 25, color: "#E8001D" },
  short: { label: "Descanso corto", defaultMin: 5, color: "#22c55e" },
  long: { label: "Descanso largo", defaultMin: 15, color: "#3b82f6" },
};

export default function FocusView() {
  const [mode, setMode] = useState<FocusMode>("focus");
  const [config, setConfig] = useState({ focus: 25, short: 5, long: 15, sessionsBeforeLong: 4 });
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [totalFocusMin, setTotalFocusMin] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startSecondsRef = useRef(25 * 60);

  const total = config[mode] * 60;
  const progress = ((total - seconds) / total) * 100;
  const circumference = 2 * Math.PI * 80;
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  const color = MODE_CONFIG[mode].color;

  function switchMode(m: FocusMode) {
    setRunning(false);
    setMode(m);
    const newSecs = config[m] * 60;
    setSeconds(newSecs);
    startSecondsRef.current = newSecs;
  }

  useEffect(() => {
    const newSecs = config[mode] * 60;
    setSeconds(newSecs);
    startSecondsRef.current = newSecs;
    setRunning(false);
  }, [config, mode]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            setRunning(false);
            if (mode === "focus") {
              setSessions(n => n + 1);
              setTotalFocusMin(m => m + config.focus);
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode, config]);

  function reset() {
    setRunning(false);
    const newSecs = config[mode] * 60;
    setSeconds(newSecs);
  }

  function applyConfig(field: keyof typeof config, val: number) {
    setConfig(c => ({ ...c, [field]: val }));
  }

  const sessionDots = Array.from({ length: config.sessionsBeforeLong });

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full min-h-0">
      {/* Timer main */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 lg:gap-6 py-4 lg:py-0">
        {/* Mode tabs */}
        <div className="flex gap-2 bg-gray-100 rounded-2xl p-1.5">
          {(Object.keys(MODE_CONFIG) as FocusMode[]).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mode === m ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              {MODE_CONFIG[m].label}
            </button>
          ))}
        </div>

        {/* Circular timer */}
        <div className="relative">
          <svg className="w-44 h-44 md:w-56 md:h-56 -rotate-90" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="80" stroke="#f1f1f1" strokeWidth="10" fill="none" />
            <circle
              cx="90" cy="90" r="80"
              stroke={color}
              strokeWidth="10"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (circumference * progress) / 100}
              strokeLinecap="round"
              style={{ transition: running ? "stroke-dashoffset 1s linear" : "stroke-dashoffset 0.3s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span style={{ fontFamily: "'Outfit', sans-serif", color }} className="text-xs font-bold uppercase tracking-widest mb-1">
              {MODE_CONFIG[mode].label}
            </span>
            <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-5xl md:text-6xl font-extrabold text-gray-900 tabular-nums">
              {mins}:{secs}
            </span>
            <span className="text-xs text-gray-400 mt-1">{config[mode]} min</span>
          </div>
        </div>

        {/* Session dots */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Sesión</span>
          {sessionDots.map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full border-2 transition-all ${
              i < (sessions % config.sessionsBeforeLong)
                ? "border-[#E8001D] bg-[#E8001D]"
                : "border-gray-300 bg-transparent"
            }`} />
          ))}
          <span className="text-xs text-gray-400 font-medium">→ descanso largo</span>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button onClick={reset} className="p-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button
            onClick={() => setRunning(r => !r)}
            className="flex items-center gap-2 px-8 py-3.5 font-bold text-white rounded-2xl transition-all text-base shadow-lg"
            style={{ background: color }}
          >
            {running ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                Pausar
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                {seconds === total ? "Iniciar" : "Continuar"}
              </>
            )}
          </button>
          <button onClick={() => setSoundOn(s => !s)} className={`p-3.5 rounded-2xl transition-colors ${soundOn ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-red-50 text-[#E8001D]"}`}>
            {soundOn ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0c-1.657 0-3-1.343-3-3V9a3 3 0 016 0v6c0 1.657-1.343 3-3 3zm-3-3H6a2 2 0 01-2-2v-2a2 2 0 012-2h3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </button>
        </div>

        {/* Stats row */}
        <div className="flex gap-6 text-center">
          <div>
            <p style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-bold text-gray-900">{sessions}</p>
            <p className="text-xs text-gray-400">Sesiones hoy</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div>
            <p style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-bold text-gray-900">{totalFocusMin}</p>
            <p className="text-xs text-gray-400">Min enfocado</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div>
            <p style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-bold text-gray-900">{Math.floor(sessions / config.sessionsBeforeLong)}</p>
            <p className="text-xs text-gray-400">Ciclos completos</p>
          </div>
        </div>
      </div>

      {/* Config sidebar */}
      <div className="w-full lg:w-72 flex flex-col gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="font-bold text-gray-900 text-sm">Configuración</h3>
            <button onClick={() => setShowConfig(s => !s)} className="text-xs text-[#E8001D] font-semibold">
              {showConfig ? "Cerrar" : "Editar"}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { key: "focus" as const, label: "Enfoque", unit: "min", min: 5, max: 60 },
              { key: "short" as const, label: "Descanso corto", unit: "min", min: 1, max: 15 },
              { key: "long" as const, label: "Descanso largo", unit: "min", min: 5, max: 30 },
              { key: "sessionsBeforeLong" as const, label: "Sesiones antes de descanso largo", unit: "", min: 2, max: 8 },
            ].map(({ key, label, unit, min, max }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-sm font-bold text-gray-900">
                    {config[key]}{unit}
                  </span>
                </div>
                {showConfig ? (
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={config[key]}
                    onChange={e => applyConfig(key, parseInt(e.target.value))}
                    className="w-full accent-[#E8001D]"
                  />
                ) : (
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#E8001D]" style={{ width: `${((config[key] - min) / (max - min)) * 100}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Method explanation */}
        <div className="bg-gray-950 rounded-2xl p-5 flex-1">
          <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="font-bold text-white text-sm mb-3">Técnica Pomodoro</h3>
          <div className="flex flex-col gap-3">
            {[
              { num: "1", text: "Trabaja durante el tiempo de enfoque sin distracciones", color: "#E8001D" },
              { num: "2", text: "Toma un descanso corto al completar la sesión", color: "#22c55e" },
              { num: "3", text: "Después de 4 sesiones, toma un descanso largo", color: "#3b82f6" },
              { num: "4", text: "Repite el ciclo para máxima productividad", color: "#f59e0b" },
            ].map(step => (
              <div key={step.num} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold mt-0.5"
                  style={{ background: step.color }}>
                  {step.num}
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick session log */}
        {sessions > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="font-bold text-gray-800 text-sm mb-3">Hoy</h3>
            <div className="grid grid-cols-4 gap-1">
              {Array.from({ length: sessions }).map((_, i) => (
                <div key={i} className="h-6 bg-red-100 border border-red-200 rounded flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[#E8001D]">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
