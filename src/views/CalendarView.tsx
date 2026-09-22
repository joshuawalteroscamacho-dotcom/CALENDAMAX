import { useState } from "react";
import type { Task, Priority } from "../types";

const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAY_NAMES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

const PRIORITY_COLORS: Record<Priority, string> = {
  alta: "#E8001D",
  media: "#f97316",
  baja: "#22c55e",
};
const PRIORITY_BG: Record<Priority, string> = {
  alta: "bg-red-50 text-red-700 border-red-200",
  media: "bg-orange-50 text-orange-700 border-orange-200",
  baja: "bg-green-50 text-green-700 border-green-200",
};
const PRIORITY_LABEL: Record<Priority, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

function uid() {
  return Math.random().toString(36).slice(2);
}

export default function CalendarView({ tasks, setTasks }: {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", priority: "media" as Priority, description: "" });
  const [editId, setEditId] = useState<string | null>(null);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function openAdd(day: number) {
    setSelectedDate(dateStr(day));
    setForm({ title: "", priority: "media", description: "" });
    setEditId(null);
    setShowModal(true);
  }

  function openEdit(task: Task) {
    setSelectedDate(task.date);
    setForm({ title: task.title, priority: task.priority, description: task.description || "" });
    setEditId(task.id);
    setShowModal(true);
  }

  function saveTask() {
    if (!form.title.trim() || !selectedDate) return;
    if (editId) {
      setTasks(prev => prev.map(t => t.id === editId ? { ...t, ...form } : t));
    } else {
      setTasks(prev => [...prev, { id: uid(), date: selectedDate, completed: false, ...form }]);
    }
    setShowModal(false);
  }

  function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function toggleTask(id: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }

  const selectedDayTasks = selectedDate
    ? tasks.filter(t => t.date === selectedDate).sort((a, b) => {
        const order: Record<Priority, number> = { alta: 0, media: 1, baja: 2 };
        return order[a.priority] - order[b.priority];
      })
    : [];

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full min-h-0">
      {/* Calendar grid */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-4 md:p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-bold text-gray-900">
            {MONTH_NAMES[month]} {year}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); }} className="px-3 py-1.5 text-xs font-semibold text-[#E8001D] hover:bg-red-50 rounded-lg transition-colors">
              Hoy
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 pb-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 flex-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const ds = dateStr(day);
            const dayTasks = tasks.filter(t => t.date === ds);
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = ds === selectedDate;

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(ds)}
                className={`min-h-[72px] p-1.5 rounded-xl cursor-pointer border transition-all ${
                  isSelected ? "border-[#E8001D] bg-red-50" :
                  isToday ? "border-[#E8001D]/30 bg-red-50/40" :
                  "border-transparent hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday ? "bg-[#E8001D] text-white" : "text-gray-700"
                }`}>
                  {day}
                </div>
                <div className="flex flex-col gap-0.5">
                  {dayTasks.slice(0, 2).map(t => (
                    <div key={t.id} className="flex items-center gap-1 overflow-hidden">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: PRIORITY_COLORS[t.priority] }} />
                      <span className={`text-[10px] truncate leading-tight ${t.completed ? "line-through text-gray-400" : "text-gray-700"}`}>{t.title}</span>
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <span className="text-[10px] text-gray-400">+{dayTasks.length - 2} más</span>
                  )}
                  {dayTasks.length === 0 && (
                    <button onClick={(e) => { e.stopPropagation(); openAdd(day); }} className="text-[10px] text-gray-300 hover:text-[#E8001D] transition-colors text-left">+ añadir</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side panel */}
      <div className="w-full lg:w-72 flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="font-bold text-gray-900 text-sm">
              {selectedDate
                ? new Date(selectedDate + "T12:00:00").toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })
                : "Selecciona un día"}
            </h3>
            {selectedDate && (
              <button onClick={() => openAdd(parseInt(selectedDate.split("-")[2]))} className="p-1.5 bg-[#E8001D] text-white rounded-lg hover:bg-[#B8001A] transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
              </button>
            )}
          </div>

          {!selectedDate && (
            <div className="flex-1 flex items-center justify-center text-center">
              <p className="text-gray-400 text-sm">Haz clic en un día del calendario para ver o añadir tareas</p>
            </div>
          )}

          {selectedDate && selectedDayTasks.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round"/></svg>
              </div>
              <p className="text-gray-400 text-sm">Sin tareas este día</p>
              <button onClick={() => openAdd(parseInt(selectedDate.split("-")[2]))} className="text-sm text-[#E8001D] font-semibold hover:opacity-80">+ Añadir tarea</button>
            </div>
          )}

          <div className="flex flex-col gap-2 overflow-y-auto">
            {selectedDayTasks.map(t => (
              <div key={t.id} className={`p-3 rounded-xl border transition-all ${t.completed ? "opacity-50" : ""} ${PRIORITY_BG[t.priority]}`}>
                <div className="flex items-start gap-2">
                  <button onClick={() => toggleTask(t.id)} className="mt-0.5 flex-shrink-0">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${t.completed ? "bg-current border-current" : "border-current bg-transparent"}`}>
                      {t.completed && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round"/></svg>}
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${t.completed ? "line-through" : ""}`}>{t.title}</p>
                    {t.description && <p className="text-[10px] opacity-70 mt-0.5 truncate">{t.description}</p>}
                    <span className="text-[10px] font-medium opacity-80">{PRIORITY_LABEL[t.priority]}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(t)} className="p-1 hover:bg-black/10 rounded transition-colors opacity-70">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button onClick={() => deleteTask(t.id)} className="p-1 hover:bg-black/10 rounded transition-colors opacity-70">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming tasks */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="font-bold text-gray-800 text-sm mb-3">Próximas tareas</h3>
          <div className="flex flex-col gap-2">
            {tasks
              .filter(t => !t.completed && t.date >= today.toISOString().split("T")[0])
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 5)
              .map(t => (
                <div key={t.id} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: PRIORITY_COLORS[t.priority] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 truncate">{t.title}</p>
                    <p className="text-[10px] text-gray-400">{new Date(t.date + "T12:00:00").toLocaleDateString("es", { day: "numeric", month: "short" })}</p>
                  </div>
                </div>
              ))}
            {tasks.filter(t => !t.completed && t.date >= today.toISOString().split("T")[0]).length === 0 && (
              <p className="text-xs text-gray-400">Sin tareas pendientes</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-bold text-gray-900">
                {editId ? "Editar tarea" : "Nueva tarea"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Título de la tarea</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Ej: Estudiar álgebra"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8001D] focus:border-transparent"
                  onKeyDown={e => e.key === "Enter" && saveTask()}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Descripción <span className="font-normal text-gray-400">(opcional)</span></label>
                <textarea
                  placeholder="Detalles de la tarea..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8001D] focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Prioridad</label>
                <div className="flex gap-2">
                  {(["alta", "media", "baja"] as Priority[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setForm(f => ({ ...f, priority: p }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all capitalize ${
                        form.priority === p ? PRIORITY_BG[p] : "border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {PRIORITY_LABEL[p]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={saveTask} disabled={!form.title.trim()} className="flex-1 py-2.5 bg-[#E8001D] hover:bg-[#B8001A] disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
                {editId ? "Guardar" : "Añadir tarea"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
