import { useState, useEffect } from "react";
import type { Section, AppUser, Task, ScheduleItem, Alarm, UploadedFile, Priority } from "./types";
import CalendarView from "./views/CalendarView";
import ScheduleView from "./views/ScheduleView";
import AlarmsView from "./views/AlarmsView";
import FocusView from "./views/FocusView";
import FolderView from "./views/FolderView";

// Clave de localStorage para no repetir el tour una vez completado/omitido.
const TOUR_STORAGE_KEY = "calendamax_tour_completed";

// Pasos del recorrido guiado. Se muestra solo la primera vez que el usuario
// entra al panel y todas las secciones están en cero (sin datos aún).
const TOUR_STEPS: { title: string; description: string; icon: JSX.Element }[] = [
  {
    title: "¡Bienvenido a Calendamax! 👋",
    description: "Te damos un recorrido de 30 segundos para que sepas por dónde empezar a organizar tu tiempo.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" /><path d="M12 8v4l2.5 2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Calendario",
    description: "Aquí organizas tus tareas y exámenes por fecha y prioridad, y ves de un vistazo lo que se acerca.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    title: "Cronograma",
    description: "Visualiza tu semana completa, ordenada de mayor a menor prioridad, para planear con calma.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Alarmas",
    description: "Configura recordatorios inteligentes para que nunca se te pase una entrega o un examen.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Focus Zone",
    description: "Sesiones Pomodoro configurables para estudiar con más concentración y menos distracciones.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" /><path d="M12 8v4l2.5 2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Mi Carpeta",
    description: "Sube tus apuntes y documentos, y vincúlalos directamente a una tarea del calendario.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Crea tu primera tarea",
    description: "Usa el botón rojo flotante (+) disponible en cualquier sección para crear una tarea o evento en segundos.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
    ),
  },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "alta", label: "Alta" },
  { value: "media", label: "Media" },
  { value: "baja", label: "Baja" },
];

const NAV_ITEMS: { id: Section; label: string; icon: JSX.Element }[] = [
  {
    id: "calendar",
    label: "Calendario",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeLinecap="round" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: "schedule",
    label: "Cronograma",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round"/>
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "alarms",
    label: "Alarmas",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "focus",
    label: "Focus",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9"/><path d="M12 8v4l2.5 2.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "folder",
    label: "Carpeta",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function Dashboard({ user, onLogout }: { user: AppUser; onLogout: () => void }) {
  const [section, setSection] = useState<Section>("calendar");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Recorrido guiado (tour) ──
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // ── Botón flotante de acción rápida ──
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [qcForm, setQcForm] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    priority: "media" as Priority,
    description: "",
  });

  // Muestra el tour solo la primera vez que el usuario entra al panel
  // y todas las secciones están vacías (calendario, cronograma, alarmas, carpeta en cero).
  useEffect(() => {
    const alreadySeen = localStorage.getItem(TOUR_STORAGE_KEY);
    const allSectionsEmpty =
      tasks.length === 0 && scheduleItems.length === 0 && alarms.length === 0 && files.length === 0;
    if (!alreadySeen && allSectionsEmpty) {
      setShowTour(true);
    }
    // Solo debe evaluarse al montar el dashboard, no en cada cambio de datos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function closeTour(openQuickCreateAfter: boolean) {
    localStorage.setItem(TOUR_STORAGE_KEY, "1");
    setShowTour(false);
    setTourStep(0);
    if (openQuickCreateAfter) {
      // Al terminar el tour, invitamos de inmediato a crear la primera tarea
      // para que el usuario identifique cómo empezar sin más pasos.
      setQuickCreateOpen(true);
    }
  }

  function handleTourNext() {
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep(s => s + 1);
    } else {
      closeTour(true);
    }
  }

  function handleTourSkip() {
    closeTour(false);
  }

  function openQuickCreate() {
    setQcForm({ title: "", date: new Date().toISOString().split("T")[0], priority: "media", description: "" });
    setQuickCreateOpen(true);
  }

  function handleQuickCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!qcForm.title.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: qcForm.title.trim(),
      date: qcForm.date,
      priority: qcForm.priority,
      completed: false,
      description: qcForm.description.trim() || undefined,
    };
    setTasks(t => [...t, newTask]);
    setQuickCreateOpen(false);
    setSection("calendar");
  }

  const today = new Date();
  const todayStr = today.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
  const pendingTasks = tasks.filter(t => !t.completed && t.date >= today.toISOString().split("T")[0]).length;
  const activeAlarms = alarms.filter(a => a.active).length;

  function badge(id: Section) {
    if (id === "calendar") return pendingTasks;
    if (id === "alarms") return activeAlarms;
    if (id === "folder") return files.length;
    return 0;
  }

  return (
    <div className="flex h-full min-h-screen bg-gray-50">

      {/* ── Desktop sidebar ── */}
      <aside className={`hidden md:flex flex-col bg-gray-950 transition-all duration-300 flex-shrink-0 ${sidebarOpen ? "w-56" : "w-16"}`}>
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${!sidebarOpen && "justify-center px-0"}`}>
          <div className="w-8 h-8 bg-[#E8001D] rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="9"/><path d="M12 8v4l2.5 2.5" strokeLinecap="round"/>
            </svg>
          </div>
          {sidebarOpen && (
            <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-bold text-white">
              Calenda<span className="text-[#E8001D]">max</span>
            </span>
          )}
        </div>

        {/* User */}
        {sidebarOpen && (
          <div className="px-4 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-700 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{user.name.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user.name}</p>
                {user.grade && <p className="text-gray-500 text-[10px] truncate">{user.grade}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
          {NAV_ITEMS.map(item => {
            const active = section === item.id;
            const b = badge(item.id);
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                  active ? "bg-[#E8001D] text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
                } ${!sidebarOpen && "justify-center px-0"}`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="text-sm font-medium flex-1 text-left">{item.label}</span>}
                {b > 0 && sidebarOpen && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/25 text-white" : "bg-white/10 text-gray-300"}`}>{b}</span>
                )}
                {b > 0 && !sidebarOpen && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#E8001D] rounded-full border border-gray-950" />
                )}
                {!sidebarOpen && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-2 pb-4 flex flex-col gap-1">
          <button onClick={() => setSidebarOpen(s => !s)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-all">
            <svg className={`w-5 h-5 flex-shrink-0 transition-transform ${!sidebarOpen && "rotate-180"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {sidebarOpen && <span className="text-xs font-medium">Colapsar</span>}
          </button>
          <button onClick={onLogout} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all ${!sidebarOpen && "justify-center px-0"}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {sidebarOpen && <span className="text-xs font-medium">Salir</span>}
          </button>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between flex-shrink-0">
          <div>
            {/* Mobile: logo */}
            <div className="flex items-center gap-2 md:hidden mb-0.5">
              <div className="w-6 h-6 bg-[#E8001D] rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="9"/><path d="M12 8v4l2.5 2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-base font-bold text-gray-900">
                Calenda<span className="text-[#E8001D]">max</span>
              </span>
            </div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-base md:text-xl font-bold text-gray-900">
              {NAV_ITEMS.find(n => n.id === section)?.label}
            </h1>
            {/* text-gray-600 en vez de text-gray-400: ratio ~4.7:1 sobre blanco, cumple WCAG AA */}
            <p className="text-[10px] md:text-xs text-gray-600 capitalize hidden sm:block">{todayStr}</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
              {pendingTasks > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  <span>{pendingTasks} pendiente{pendingTasks !== 1 ? "s" : ""}</span>
                </div>
              )}
              {activeAlarms > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#E8001D]" />
                  <span>{activeAlarms} alarma{activeAlarms !== 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
            {/* Mobile: avatar + logout */}
            <div className="flex items-center gap-2 md:hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-700 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{user.name.slice(0, 2).toUpperCase()}</span>
              </div>
              <button onClick={onLogout} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-3 md:p-6 overflow-y-auto min-h-0 pb-24 md:pb-6">
          {section === "calendar" && <CalendarView tasks={tasks} setTasks={setTasks} />}
          {section === "schedule" && <ScheduleView items={scheduleItems} setItems={setScheduleItems} tasks={tasks} setTasks={setTasks} />}
          {section === "alarms" && <AlarmsView alarms={alarms} setAlarms={setAlarms} />}
          {section === "focus" && <FocusView />}
          {section === "folder" && <FolderView files={files} setFiles={setFiles} tasks={tasks} />}
        </main>

        {/* ── Mobile bottom nav ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
          <div className="flex items-center justify-around px-2 py-2">
            {NAV_ITEMS.map(item => {
              const active = section === item.id;
              const b = badge(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative min-w-0"
                >
                  {/* text-gray-500 en vez de text-gray-400 sobre fondo blanco: mejora el contraste (~4.6:1) */}
                  <span className={`transition-colors ${active ? "text-[#E8001D]" : "text-gray-500"}`}>
                    {item.icon}
                  </span>
                  <span className={`text-[10px] font-semibold transition-colors truncate ${active ? "text-[#E8001D]" : "text-gray-500"}`}>
                    {item.label}
                  </span>
                  {b > 0 && (
                    <span className="absolute top-0.5 right-1 w-4 h-4 bg-[#E8001D] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {b > 9 ? "9+" : b}
                    </span>
                  )}
                  {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#E8001D] rounded-full" />}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* ── Botón flotante de acción rápida (visible en cualquier sección) ── */}
      <button
        onClick={openQuickCreate}
        aria-label="Crear tarea o evento"
        className="fixed right-4 md:right-8 bottom-24 md:bottom-8 z-40 flex items-center gap-2 pl-4 pr-5 py-3.5 md:pl-5 md:pr-6 bg-[#E8001D] hover:bg-[#B8001A] text-white font-semibold rounded-full shadow-lg shadow-red-900/20 hover:shadow-xl transition-all active:scale-95"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
        <span className="text-sm hidden sm:inline">Crear tarea / evento</span>
      </button>

      {/* ── Recorrido guiado (primera vez, todo en cero) ── */}
      {showTour && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="w-12 h-12 bg-red-50 text-[#E8001D] rounded-xl flex items-center justify-center mb-5">
              {TOUR_STEPS[tourStep].icon}
            </div>
            <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-bold text-gray-900 mb-2">
              {TOUR_STEPS[tourStep].title}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              {TOUR_STEPS[tourStep].description}
            </p>

            <div className="flex items-center gap-1.5 mb-6">
              {TOUR_STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === tourStep ? "w-6 bg-[#E8001D]" : "w-1.5 bg-gray-200"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleTourSkip}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors px-2 py-2"
              >
                Omitir
              </button>
              <button
                onClick={handleTourNext}
                className="px-5 py-2.5 bg-[#E8001D] hover:bg-[#B8001A] text-white text-sm font-semibold rounded-xl transition-all"
              >
                {tourStep < TOUR_STEPS.length - 1 ? "Siguiente" : "Crear mi primera tarea"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de creación rápida de tarea / evento ── */}
      {quickCreateOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-bold text-gray-900">
                Crear tarea / evento
              </h2>
              <button
                onClick={() => setQuickCreateOpen(false)}
                aria-label="Cerrar"
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleQuickCreateSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Título</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Ej: Entrega de matemáticas"
                  value={qcForm.title}
                  onChange={e => setQcForm(f => ({ ...f, title: e.target.value }))}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8001D] focus:border-transparent transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha</label>
                  <input
                    type="date"
                    value={qcForm.date}
                    onChange={e => setQcForm(f => ({ ...f, date: e.target.value }))}
                    required
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8001D] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Prioridad</label>
                  <select
                    value={qcForm.priority}
                    onChange={e => setQcForm(f => ({ ...f, priority: e.target.value as Priority }))}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8001D] focus:border-transparent transition-all bg-white text-gray-700"
                  >
                    {PRIORITY_OPTIONS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Descripción <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles adicionales..."
                  value={qcForm.description}
                  onChange={e => setQcForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8001D] focus:border-transparent transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-[#E8001D] hover:bg-[#B8001A] text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-red-200 text-base mt-1"
              >
                Crear tarea
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
