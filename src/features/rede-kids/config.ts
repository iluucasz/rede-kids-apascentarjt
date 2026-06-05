import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Church,
  HandHeart,
  Layers3,
  Package,
  Tags,
  TrendingUp,
  UserCog,
  Users,
} from "lucide-react";
import type { AppUser, AttendanceStatus, ScheduleEntry } from "@/lib/types";
import type { ModuleId } from "./types";

export const modules: { id: ModuleId; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Resumo", icon: Church },
  { id: "lessons", label: "Aulas", icon: BookOpen },
  { id: "members", label: "Membros", icon: Users },
  { id: "classes", label: "Turmas", icon: Layers3 },
  { id: "workers", label: "Trabalhadores", icon: HandHeart },
  { id: "schedule", label: "Escala", icon: CalendarDays },
  { id: "categories", label: "Categorias", icon: Tags },
  { id: "progress", label: "Progresso", icon: TrendingUp },
  { id: "reports", label: "Relatório", icon: BarChart3 },
  { id: "inventory", label: "Estoque", icon: Package },
  { id: "users", label: "Usuários", icon: UserCog },
];

export const moduleHeaders: Record<
  ModuleId,
  { title: string; subtitle: string }
> = {
  dashboard: {
    title: "Resumo da Rede Kids",
    subtitle: "Visão geral de aulas, membros, alertas e estoque.",
  },
  lessons: {
    title: "Controle de aulas",
    subtitle: "Crie aulas, registre chamada, finalize encontros e organize anexos.",
  },
  members: {
    title: "Cadastro de membros",
    subtitle: "Gerencie crianças, responsáveis e vínculos entre eles.",
  },
  progress: {
    title: "Progresso das crianças",
    subtitle: "Acompanhe idade, turma atual e indicações de mudança.",
  },
  workers: {
    title: "Trabalhadores",
    subtitle: "Organize ministros, apoios e equipes de serviço.",
  },
  classes: {
    title: "Turmas",
    subtitle: "Configure faixas etárias, escalas e vínculo das crianças.",
  },
  inventory: {
    title: "Estoque",
    subtitle: "Controle materiais, quantidades e alertas de reposição.",
  },
  schedule: {
    title: "Escala",
    subtitle: "Veja em calendário quem está escalado nas aulas.",
  },
  reports: {
    title: "Relatórios",
    subtitle: "Consulte frequência e indicadores de participação.",
  },
  categories: {
    title: "Categorias",
    subtitle: "Crie tags para classificar membros e ministérios.",
  },
  users: {
    title: "Usuários",
    subtitle: "Gerencie acessos e perfis da plataforma.",
  },
};

export const attendanceLabels: Record<AttendanceStatus, string> = {
  present: "Presença",
  absent: "Falta",
  justified: "Justificativa",
};

export const scheduleRoleLabels: Record<ScheduleEntry["role"], string> = {
  coordinator: "Coordenação",
  minister: "Ministro",
  support: "Apoio",
  snack: "Lanche",
  cleaning: "Limpeza",
};

export const userRoleLabels: Record<AppUser["role"], string> = {
  admin: "Administrador",
  coordinator: "Coordenação",
  worker: "Trabalhador",
};
