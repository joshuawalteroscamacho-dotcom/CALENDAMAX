import { useState } from "react";
import type { ScheduleItem, Task, Priority } from "../types";

const DAYS = [
  { key: "lun", label: "Lunes" },
  { key: "mar", label: "Martes" },
  { key: "mie", label: "Miércoles" },
  { key: "jue", label: "Jueves" },
  { key: "vie", label: "Viernes" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

// JS getDay(): 0=Sun,1=Mon,...,6=Sat → our key index
const JS_DAY_TO_KEY = ["dom","lun","mar","mie","jue","vie","sab"];

const PRIORITY_ORDER: Record<Priority, number> = { alta: 0, media: 1, baja: 2 };
const PRIORITY_LABEL: Record<Priority, string> = { alta: "Alta", media: "Media", baja: "Baja" };
const PRIORITY_STYLE: Record<Priority, string> = {
  alta: "bg-red-100 text-red-700 border-red-200",
  media: "bg-orange-100 text-orange-700 border-orange-200",
  baja: "bg-green-100 text-green-700 border-green-200",
};
const PRIORITY_DOT: Record<Priority, string> = {
  alta: "bg-[#E8001D]",
  media: "bg-orange-500",
  baja: "bg-green-500",
};

function uid() { return Math.random().toString(36).slice(2); }

// Returns the Monday of the week containing `date`
function weekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Returns YYYY-MM-DD for a date offset from a base
function dateOf(base: Date, offset: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

const today = new Date();
const todayKey = JS_DAY_TO_KEY[today.getDay()];

export default function ScheduleView({ items, setItems, tasks, setTasks }: {
  items: ScheduleItem[];
  setItems: React.Dispatch<React.SetStateAction<ScheduleItem[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}) {
  const [showModal, setShowModal] = useState(false);
  const [activeDay, setActiveDay] = useState<string>(todayKey);
  const [form, setForm] = useState({ title: "", priority: "media" as Priority, timeFrom: "", timeTo: "", day: todayKey });
  const [editId, setEditId] = useState<string | null>(null);

  // Task edit modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", priority: "media" as Priority, description: "" });
  const [editTaskId, setEditTaskId] = useState<string | null>(null);

  // Current week: Mon offset 0 … Sun offset 6
  const [weekOffset, setWeekOffset] = useState(0);
  const monday = weekStart(new Date(today.getFullYear(), today.getMonth(), today.getDate() + weekOffset * 7));

  // Map DAYS index → date string for this week
  const dayDates: Record<string, string> = {
    lun: dateOf(monday, 0),
    mar: dateOf(monday, 1),
    mie: dateOf(monday, 2),
    jue: dateOf(monday, 3),
    vie: dateOf(monday, 4),
    sab: dateOf(monday, 5),
    dom: dateOf(monday, 6),
  };

  // Tasks for a given day key this week
  function dayTasks(dayKey: string): Task[] {
    const ds = dayDates[dayKey];
    return tasks
      .filter(t => t.date === ds)
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  }

  // Schedule items for a day
  function dayScheduleItems(dayKey: string): ScheduleItem[] {
    return items
      .filter(i => i.day === dayKey)
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  }

  // Combined count for badge
  function dayCount(dayKey: string) {
    return dayTasks(dayKey).length + dayScheduleItems(dayKey).length;
  }

  // ── Schedule item CRUD ──
  function openAdd(day: string) {
    setForm({ title: "", priority: "media", timeFrom: "", timeTo: "", day });
    setEditId(null);
    setShowModal(true);
  }

  function openEdit(item: ScheduleItem) {
    setForm({ title: item.title, priority: item.priority, timeFrom: item.timeFrom || "", timeTo: item.timeTo || "", day: item.day });
    setEditId(item.id);
    setShowModal(true);
  }

  function saveItem() {
    if (!form.title.trim()) return;
    if (editId) {
      setItems(prev => prev.map(i => i.id === editId ? { ...i, ...form } : i));
    } else {
      setItems(prev => [...prev, { id: uid(), ...form }]);
    }
    setShowModal(false);
  }

  function deleteItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  // ── Task CRUD from schedule ──
  function openEditTask(task: Task) {
    setTaskForm({ title: task.title, priority: task.priority, description: task.description || "" });
    setEditTaskId(task.id);
    setShowTaskModal(true);
  }

  function saveTask() {
    if (!taskForm.title.trim() || !editTaskId) return;
    setTasks(prev => prev.map(t => t.id === editTaskId ? { ...t, ...taskForm } : t));
    setShowTaskModal(false);
  }

  function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function toggleTask(id: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }

  const totalItems = items.length + tasks.length;
  const highCount = items.filter(i => i.priority === "alta").length + tasks.filter(t => t.priority === "alta").length;

  const isCurrentWeek = weekOffset === 0;
  const weekLabel = isCurrentWeek
    ? "Esta semana"
    : weekOffset === 1 ? "Próxima semana"
    : weekOffset === -1 ? "Semana pasada"
    : `Semana del ${monday.toLocaleDateString("es", { day: "numeric", month: "short" })}`;

  return (
    <div className="flex flex-col h-full gap-4 md:gap-5">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-3 md:p-4">
          <p className="text-xs text-gray-500 mb-1">Total actividades</p>
          <p style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl md:text-2xl font-bold text-gray-900">{totalItems}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-3 md:p-4">
          <p className="text-xs text-gray-500 mb-1">Prioridad alta</p>
          <p style={{ fontFamily: "'Outfit', sans-serif" }} className="text-xl md:text-2xl font-bold text-[#E8001D]">{highCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-3 md:p-4">
          <p className="text-xs text-gray-500 mb-1">Semana</p>
          <p style={{ fontFamily: "'Outfit', sans-serif" }} className="text-sm md:text-base font-bold text-gray-900 truncate">{weekLabel}</p>
        </div>
      </div>

      {/* Week navigator + day tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setWeekOffset(o => o - 1)} className="p-1.5 hover:bg-gray-200 bg-white border border-gray-200 rounded-xl transition-colors">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button onClick={() => setWeekOffset(0)} className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${isCurrentWeek ? "bg-[#E8001D] text-white border-[#E8001D]" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
          Hoy
        </button>
        <button onClick={() => setWeekOffset(o => o + 1)} className="p-1.5 hover:bg-gray-200 bg-white border border-gray-200 rounded-xl transition-colors">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <div className="flex gap-1.5 flex-wrap">
          {DAYS.map(d => {
            const count = dayCount(d.key);
            const isToday = isCurrentWeek && d.key === todayKey;
            return (
              <button
                key={d.key}
                onClick={() => setActiveDay(d.key)}
                className={`px-2.5 md:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeDay === d.key
                    ? "bg-[#E8001D] text-white"
                    : isToday
                    ? "bg-red-50 text-[#E8001D] border border-red-200"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {d.label.slice(0, 3)}
                {isToday && <span className="hidden sm:inline"> (hoy)</span>}
                {count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeDay === d.key ? "bg-white/25" : "bg-gray-100 text-gray-500"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active day panel */}
      <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-4 md:p-5 overflow-y-auto min-h-0">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="font-bold text-gray-900">
              {DAYS.find(d => d.key === activeDay)?.label}
              {isCurrentWeek && activeDay === todayKey && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-[#E8001D] text-xs rounded-full font-semibold">Hoy</span>
              )}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(dayDates[activeDay] + "T12:00:00").toLocaleDateString("es", { day: "numeric", month: "long" })}
              {" · "}ordenado de más a menos importante
            </p>
          </div>
          <button onClick={() => openAdd(activeDay)} className="flex items-center gap-1.5 px-3 py-2 bg-[#E8001D] hover:bg-[#B8001A] text-white rounded-xl text-xs font-semibold transition-colors flex-shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
            Añadir
          </button>
        </div>

        {/* Tasks from calendar */}
        {dayTasks(activeDay).length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">Del calendario</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <div className="flex flex-col gap-2">
              {dayTasks(activeDay).map((task, idx) => (
                <div key={task.id} className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${PRIORITY_STYLE[task.priority]} ${task.completed ? "opacity-50" : ""}`}>
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/60 flex items-center justify-center text-xs font-bold text-gray-500">
                    {idx + 1}
                  </div>
                  <button onClick={() => toggleTask(task.id)} className="mt-0.5 flex-shrink-0">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all border-current ${task.completed ? "bg-current" : "bg-transparent"}`}>
                      {task.completed && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round"/></svg>}
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-semibold text-sm ${task.completed ? "line-through" : ""}`}>{task.title}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-white/50 rounded-full border">{PRIORITY_LABEL[task.priority]}</span>
                    </div>
                    {task.description && <p className="text-xs opacity-70 mt-0.5 truncate">{task.description}</p>}
                    <span className="text-[10px] opacity-60 font-medium">📅 Tarea del calendario</span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEditTask(task)} className="p-1.5 hover:bg-black/10 rounded-lg transition-colors">
                      <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button onClick={() => deleteTask(task.id)} className="p-1.5 hover:bg-black/10 rounded-lg transition-colors">
                      <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule-only items */}
        {dayScheduleItems(activeDay).length > 0 && (
          <div className="mb-3">
            {dayTasks(activeDay).length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">Actividades del cronograma</span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              {dayScheduleItems(activeDay).map((item, idx) => (
                <div key={item.id} className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${PRIORITY_STYLE[item.priority]}`}>
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/60 flex items-center justify-center text-xs font-bold text-gray-500">
                    {dayTasks(activeDay).length + idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{item.title}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-white/50 rounded-full border">{PRIORITY_LABEL[item.priority]}</span>
                    </div>
                    {(item.timeFrom || item.timeTo) && (
                      <p className="text-xs opacity-70 mt-0.5">
                        {item.timeFrom && item.timeTo ? `${item.timeFrom} – ${item.timeTo}` : item.timeFrom || item.timeTo}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-black/10 rounded-lg transition-colors">
                      <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="p-1.5 hover:bg-black/10 rounded-lg transition-colors">
                      <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {dayCount(activeDay) === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p className="text-gray-400 text-sm text-center">Sin actividades este día.<br/>Las tareas del calendario aparecerán aquí.</p>
            <button onClick={() => openAdd(activeDay)} className="text-sm text-[#E8001D] font-semibold hover:opacity-80">+ Añadir actividad</button>
          </div>
        )}
      </div>

      {/* Week summary bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5">
        <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="font-bold text-gray-800 text-sm mb-3">Vista semanal</h3>
        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
          {DAYS.map(d => {
            const tasks_ = dayTasks(d.key);
            const items_ = dayScheduleItems(d.key);
            const all = [...tasks_, ...items_];
            const isToday_ = isCurrentWeek && d.key === todayKey;
            return (
              <div key={d.key} onClick={() => setActiveDay(d.key)}
                className={`cursor-pointer rounded-xl p-2 text-center transition-all ${activeDay === d.key ? "bg-red-50 border border-[#E8001D]" : "hover:bg-gray-50"}`}>
                <p className={`text-[10px] font-semibold mb-1 ${isToday_ ? "text-[#E8001D]" : "text-gray-500"}`}>{d.label.slice(0, 3)}</p>
                <p className="text-[10px] text-gray-400 mb-1">
                  {new Date(dayDates[d.key] + "T12:00:00").toLocaleDateString("es", { day: "numeric" })}
                </p>
                <div className="flex flex-col gap-0.5 items-center">
                  {all.length === 0 && <div className="w-full h-1 bg-gray-100 rounded-full" />}
                  {all.slice(0, 3).map((i, idx) => (
                    <div key={idx} className={`w-full h-1 rounded-full ${PRIORITY_DOT[i.priority]}`} />
                  ))}
                  {all.length > 3 && <span className="text-[9px] text-gray-400">+{all.length - 3}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Schedule item modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-bold text-gray-900">
                {editId ? "Editar actividad" : "Nueva actividad"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Actividad</label>
                <input autoFocus type="text" placeholder="Ej: Repasar química"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8001D] focus:border-transparent"
                  onKeyDown={e => e.key === "Enter" && saveItem()} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Día</label>
                <select value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8001D] bg-white">
                  {DAYS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Desde</label>
                  <input type="time" value={form.timeFrom} onChange={e => setForm(f => ({ ...f, timeFrom: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8001D]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Hasta</label>
                  <input type="time" value={form.timeTo} onChange={e => setForm(f => ({ ...f, timeTo: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8001D]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Prioridad</label>
                <div className="flex gap-2">
                  {(["alta","media","baja"] as Priority[]).map(p => (
                    <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${form.priority === p ? PRIORITY_STYLE[p] : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                      {PRIORITY_LABEL[p]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={saveItem} disabled={!form.title.trim()} className="flex-1 py-2.5 bg-[#E8001D] hover:bg-[#B8001A] disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
                {editId ? "Guardar" : "Añadir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Task edit modal (from calendar) ── */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-bold text-gray-900">Editar tarea</h3>
              <button onClick={() => setShowTaskModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Título</label>
                <input autoFocus type="text" value={taskForm.title}
                  onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8001D] focus:border-transparent"
                  onKeyDown={e => e.key === "Enter" && saveTask()} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Descripción <span className="font-normal text-gray-400">(opcional)</span></label>
                <textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8001D] focus:border-transparent resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Prioridad</label>
                <div className="flex gap-2">
                  {(["alta","media","baja"] as Priority[]).map(p => (
                    <button key={p} onClick={() => setTaskForm(f => ({ ...f, priority: p }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${taskForm.priority === p ? PRIORITY_STYLE[p] : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                      {PRIORITY_LABEL[p]}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
                Los cambios también se reflejarán en el Calendario.
              </p>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowTaskModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={saveTask} disabled={!taskForm.title.trim()} className="flex-1 py-2.5 bg-[#E8001D] hover:bg-[#B8001A] disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
