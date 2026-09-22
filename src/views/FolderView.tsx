import { useState, useRef } from "react";
import type { UploadedFile, Task } from "../types";

function uid() { return Math.random().toString(36).slice(2); }

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string): JSX.Element {
  if (type.startsWith("image/")) return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (type === "application/pdf") return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (type.includes("word") || type.includes("document")) return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv")) return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M3 10h18M3 14h18M10 3v18M6 3h12a1 1 0 011 1v16a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function fileColor(type: string): string {
  if (type.startsWith("image/")) return "bg-purple-100 text-purple-600";
  if (type === "application/pdf") return "bg-red-100 text-red-600";
  if (type.includes("word") || type.includes("document")) return "bg-blue-100 text-blue-600";
  if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv")) return "bg-green-100 text-green-600";
  return "bg-gray-100 text-gray-600";
}

type FilterType = "all" | "task" | "free";

export default function FolderView({ files, setFiles, tasks }: {
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  tasks: Task[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [preview, setPreview] = useState<UploadedFile | null>(null);
  const [search, setSearch] = useState("");

  function handleFiles(raw: FileList | null) {
    if (!raw) return;
    Array.from(raw).forEach(f => {
      const url = URL.createObjectURL(f);
      const newFile: UploadedFile = {
        id: uid(),
        name: f.name,
        size: f.size,
        fileType: f.type,
        url,
        uploadedAt: new Date().toISOString(),
      };
      setFiles(prev => [newFile, ...prev]);
    });
  }

  function deleteFile(id: string) {
    setFiles(prev => {
      const f = prev.find(x => x.id === id);
      if (f) URL.revokeObjectURL(f.url);
      return prev.filter(x => x.id !== id);
    });
  }

  function assignTask(fileId: string, taskId: string | undefined) {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, taskId } : f));
    setAssignModal(null);
  }

  const displayed = files.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === "task") return !!f.taskId;
    if (filter === "free") return !f.taskId;
    return true;
  });

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-bold text-gray-900">Mi Carpeta</h2>
          <p className="text-sm text-gray-500">{files.length} archivo{files.length !== 1 ? "s" : ""} · {formatSize(totalSize)}</p>
        </div>
        <button onClick={() => inputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-[#E8001D] hover:bg-[#B8001A] text-white rounded-xl text-sm font-semibold transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Subir archivo
        </button>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          dragging ? "border-[#E8001D] bg-red-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${dragging ? "bg-[#E8001D] text-white" : "bg-gray-100 text-gray-400"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p className="text-sm font-medium text-gray-600">
            {dragging ? "Suelta para subir" : "Arrastra archivos aquí o haz clic"}
          </p>
          <p className="text-xs text-gray-400">PDF, imágenes, documentos, hojas de cálculo y más</p>
        </div>
      </div>

      {/* Filters + search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
          {([["all","Todos"],["task","Con tarea"],["free","Sin tarea"]] as [FilterType, string][]).map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === val ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1 relative min-w-40">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <input
            type="text"
            placeholder="Buscar archivos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E8001D] focus:border-transparent"
          />
        </div>
      </div>

      {/* Files list */}
      {displayed.length === 0 ? (
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-4 py-16">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p className="text-gray-500 text-sm text-center">
            {files.length === 0 ? "No tienes archivos aún. ¡Sube el primero!" : "No hay archivos que coincidan"}
          </p>
        </div>
      ) : (
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="divide-y divide-gray-100">
            {displayed.map(f => {
              const linkedTask = tasks.find(t => t.id === f.taskId);
              return (
                <div key={f.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${fileColor(f.fileType)}`}>
                    {fileIcon(f.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{f.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{formatSize(f.size)}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400">
                        {new Date(f.uploadedAt).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {linkedTask && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium truncate max-w-32">
                            {linkedTask.title}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {f.fileType.startsWith("image/") && (
                      <button onClick={() => setPreview(f)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors" title="Vista previa">
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    )}
                    <button onClick={() => setAssignModal(f.id)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors" title="Asignar a tarea">
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <a href={f.url} download={f.name} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors" title="Descargar">
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </a>
                    <button onClick={() => deleteFile(f.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                      <svg className="w-3.5 h-3.5 text-gray-400 hover:text-[#E8001D]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Assign task modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-lg font-bold text-gray-900">Asignar a tarea</h3>
              <button onClick={() => setAssignModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Selecciona la tarea a la que quieres vincular este archivo:</p>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              <button onClick={() => assignTask(assignModal, undefined)}
                className={`text-left px-3 py-2.5 rounded-xl text-sm border transition-all hover:bg-gray-50 ${!files.find(f => f.id === assignModal)?.taskId ? "border-[#E8001D] bg-red-50" : "border-gray-200"}`}>
                <span className="font-medium text-gray-700">Sin tarea (libre)</span>
              </button>
              {tasks.map(t => {
                const current = files.find(f => f.id === assignModal)?.taskId === t.id;
                return (
                  <button key={t.id} onClick={() => assignTask(assignModal, t.id)}
                    className={`text-left px-3 py-2.5 rounded-xl text-sm border transition-all hover:bg-gray-50 ${current ? "border-[#E8001D] bg-red-50" : "border-gray-200"}`}>
                    <p className="font-medium text-gray-800 truncate">{t.title}</p>
                    <p className="text-[10px] text-gray-400">{new Date(t.date + "T12:00:00").toLocaleDateString("es", { day: "numeric", month: "short" })}</p>
                  </button>
                );
              })}
              {tasks.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No tienes tareas creadas aún</p>}
            </div>
          </div>
        </div>
      )}

      {/* Image preview */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="max-w-3xl max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={preview.url} alt={preview.name} className="w-full h-full object-contain" />
            <div className="bg-gray-900 px-4 py-2 flex items-center justify-between">
              <span className="text-white text-sm">{preview.name}</span>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-white text-sm">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
