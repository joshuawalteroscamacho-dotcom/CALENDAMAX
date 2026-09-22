import { useState } from "react";
import type { Alarm } from "../types";

const ALL_DAYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

function uid() { return Math.random().toString(36).slice(2); }

function nextAlarmTime(time: string, days: string[]): string {
  if (!time) return "";
  const now = new Date();
  const [h, m] = time.split(":").map(Number);
  const dayMap: Record<string, number> = { Lun: 1, Mar: 2, Mié: 3, Jue: 4, Vie: 5, Sáb: 6, Dom: 0 };
  const today = now.getDay();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const alarmMins = h * 60 + m;

  if (days.length === 0) {
    if (alarmMins > currentMins) return "Hoy";
    return "Mañana";
  }

  for (let offset = 0; offset < 8; offset++) {
    const checkDay = (today + offset) % 7;
    const checkDayKey = Object.entries(dayMap).find(([, v]) => v === checkDay)?.[0];
    if (!checkDayKey) continue;
    if (days.includes(checkDayKey)) {
      if (offset === 0 && alarmMins > currentMins) return "Hoy";
      if (offset === 1) return "Mañana";
      if (offset > 0) return checkDayKey;
    }
  }
  return "";
}

export default function AlarmsView({ alarms, setAlarms }: {
  alarms: Alarm[];
  setAlarms: React.Dispatch<React.SetStateAction<Alarm[]>>;
}) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ time: "07:00", label: "", days: [] as string[] });
  const [editId, setEditId] = useState<string | null>(null);

  function openAdd() {
    setForm({ time: "07:00", label: "", days: [] });
    setEditId(null);
    setShowModal(true);
  }

  function openEdit(alarm: Alarm) {
    setForm({ time: alarm.time, label: alarm.label, days: [...alarm.days] });
    setEditId(alarm.id);
    setShowModal(true);
  }

  function save() {
    if (!form.time) return;
    if (editId) {
      setAlarms(prev => prev.map(a => a.id === editId ? { ...a, ...form } : a));
    } else {
      setAlarms(prev => [...prev, { id: uid(), active: true, ...form }]);
    }
    setShowModal(false);
  }

  function toggleDay(day: string) {
    setForm(f => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day],
    }));
  }

  function toggleAlarm(id: string) {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  }

  function deleteAlarm(id: string) {
    setAlarms(prev => prev.filter(a => a.id !== id));
  }

  const activeCount = alarms.filter(a => a.active).length;

  return (
    <div className="flex flex-col h-full gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-bold text-gray-900">Alarmas</h2>
          <p className="text-sm text-gray-500">{activeCount} activa{activeCount !== 1 ? "s" : ""} de {alarms.length}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-[#E8001D] hover:bg-[#B8001A] text-white rounded-xl text-sm font-semibold transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          Nueva alarma
        </button>
      </div>

      {alarms.length === 0 ? (
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-gray-500 text-center">No tienes alarmas configuradas.<br />¡Crea tu primera alarma!</p>
          <button onClick={openAdd} className="px-5 py-2.5 bg-[#E8001D] text-white rounded-xl text-sm font-semibold hover:bg-[#B8001A] transition-colors">
            Crear alarma
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {alarms
            .sort((a, b) => a.time.localeCompare(b.time))
            .map(alarm => {
              const next = nextAlarmTime(alarm.time, alarm.days);
              return (
                <div key={alarm.id} className={`bg-white border rounded-2xl p-5 transition-all ${alarm.active ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3">
                        <span style={{ fontFamily: "'Outfit', sans-serif" }} className={`text-4xl font-bold tracking-tight ${alarm.active ? "text-gray-900" : "text-gray-400"}`}>
                          {alarm.time}
                        </span>
                        {alarm.active && next && (
                          <span className="text-xs text-gray-400 font-medium">{next}</span>
                        )}
                      </div>
                      {alarm.label && <p className="text-sm text-gray-600 mt-0.5">{alarm.label}</p>}
                      <div className="flex gap-1 mt-2">
                        {ALL_DAYS.map(d => (
                          <span key={d} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            alarm.days.includes(d)
                              ? "bg-[#E8001D] text-white"
                              : alarm.days.length === 0
                              ? "bg-gray-100 text-gray-400"
                              : "text-gray-300"
                          }`}>
                            {d.slice(0, 2)}
                          </span>
                        ))}
                        {alarm.days.length === 0 && <span className="text-[10px] text-gray-400 px-1">Una sola vez</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEdit(alarm)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      <button onClick={() => deleteAlarm(alarm.id)} className="p-2 hover:bg-red-50 rounded-xl transition-colors">
                        <svg className="w-4 h-4 text-gray-400 hover:text-[#E8001D]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      <button onClick={() => toggleAlarm(alarm.id)}
                        className={`relative w-12 h-6 rounded-full transition-all ${alarm.active ? "bg-[#E8001D]" : "bg-gray-200"}`}>
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${alarm.active ? "left-7" : "left-1"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-bold text-gray-900">
                {editId ? "Editar alarma" : "Nueva alarma"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Hora</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-[#E8001D] focus:border-transparent"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Etiqueta <span className="font-normal text-gray-400">(opcional)</span></label>
                <input
                  type="text"
                  placeholder="Ej: Levantarse para clase"
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8001D] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Repetir <span className="font-normal text-gray-400">(deja vacío para una sola vez)</span></label>
                <div className="flex gap-1.5 flex-wrap">
                  {ALL_DAYS.map(d => (
                    <button
                      key={d}
                      onClick={() => toggleDay(d)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        form.days.includes(d)
                          ? "bg-[#E8001D] text-white border-[#E8001D]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={save} disabled={!form.time} className="flex-1 py-2.5 bg-[#E8001D] hover:bg-[#B8001A] disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
                {editId ? "Guardar" : "Crear alarma"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
