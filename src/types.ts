export type Priority = "alta" | "media" | "baja";

export type Task = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  priority: Priority;
  completed: boolean;
  description?: string;
};

export type ScheduleItem = {
  id: string;
  title: string;
  day: string;
  priority: Priority;
  timeFrom?: string;
  timeTo?: string;
};

export type Alarm = {
  id: string;
  time: string;
  label: string;
  active: boolean;
  days: string[];
};

export type UploadedFile = {
  id: string;
  name: string;
  size: number;
  fileType: string;
  url: string;
  taskId?: string;
  uploadedAt: string;
};

export type Section = "calendar" | "schedule" | "alarms" | "focus" | "folder";

export type AppUser = { name: string; email: string; grade: string };
