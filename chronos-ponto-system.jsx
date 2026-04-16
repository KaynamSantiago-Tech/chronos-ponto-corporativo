import { useState, useEffect, useRef } from "react";

// ─── ICON COMPONENTS ───
const Icons = {
  Clock: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  BarChart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  FileText: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
  Activity: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Fingerprint: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/><path d="M5 19.5C5.5 18 6 15 6 12c0-.7.12-1.37.34-2"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2"/></svg>,
  LogOut: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Home: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Bell: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Eye: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  AlertTriangle: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Scan: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/></svg>,
  Download: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Filter: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  ArrowUp: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  ArrowDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  Zap: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

// ─── DATA ───
const employees = [
  { id: 1, name: "Ana Carolina Silva", registration: "MAT-001", role: "Analista de Sistemas", team: "Tecnologia", unit: "Matriz São Paulo", manager: "Rafael Gestor", status: "active", biometric: true },
  { id: 2, name: "Bruno Oliveira Santos", registration: "MAT-002", role: "Desenvolvedor Pleno", team: "Tecnologia", unit: "Matriz São Paulo", manager: "Rafael Gestor", status: "active", biometric: true },
  { id: 3, name: "Camila Ferreira Lima", registration: "MAT-003", role: "Analista de RH", team: "Recursos Humanos", unit: "Matriz São Paulo", manager: "Juliana RH", status: "active", biometric: true },
  { id: 4, name: "Diego Martins Costa", registration: "MAT-004", role: "Vendedor Senior", team: "Vendas", unit: "Unidade Comercial", manager: "Rafael Gestor", status: "active", biometric: false },
  { id: 5, name: "Elena Rodrigues Pereira", registration: "MAT-005", role: "Coordenadora Comercial", team: "Vendas", unit: "Unidade Comercial", manager: "Rafael Gestor", status: "active", biometric: true },
  { id: 6, name: "Fernando Almeida", registration: "MAT-006", role: "Operador de Produção", team: "Operações", unit: "Unidade Operacional", manager: "Rafael Gestor", status: "active", biometric: true },
  { id: 7, name: "Gabriela Sousa Nunes", registration: "MAT-007", role: "Assistente Administrativo", team: "Administrativo", unit: "Matriz São Paulo", manager: "Juliana RH", status: "inactive", biometric: false },
  { id: 8, name: "Henrique Barbosa", registration: "MAT-008", role: "Analista Financeiro", team: "Financeiro", unit: "Matriz São Paulo", manager: "Rafael Gestor", status: "active", biometric: true },
  { id: 9, name: "Isabela Moreira", registration: "MAT-009", role: "Designer UX", team: "Tecnologia", unit: "Matriz São Paulo", manager: "Rafael Gestor", status: "active", biometric: true },
  { id: 10, name: "João Pedro Ribeiro", registration: "MAT-010", role: "Técnico de Manutenção", team: "Operações", unit: "Unidade Operacional", manager: "Rafael Gestor", status: "active", biometric: false },
  { id: 11, name: "Karen Lopes", registration: "MAT-011", role: "Analista de Marketing", team: "Marketing", unit: "Unidade Comercial", manager: "Rafael Gestor", status: "active", biometric: true },
  { id: 12, name: "Lucas Mendes", registration: "MAT-012", role: "Desenvolvedor Junior", team: "Tecnologia", unit: "Matriz São Paulo", manager: "Rafael Gestor", status: "active", biometric: true },
];

const auditEvents = [
  { id: 1, type: "LOGIN", user: "admin@slowmancy.com", date: "06/04/2026 08:01:23", ip: "192.168.1.100", action: "Login realizado com sucesso", detail: "Perfil: Administrador" },
  { id: 2, type: "MARCAÇÃO", user: "ana.silva@slowmancy.com", date: "06/04/2026 08:05:12", ip: "192.168.1.45", action: "Entrada registrada", detail: "Método: Reconhecimento Facial | Score: 98.7%" },
  { id: 3, type: "MARCAÇÃO", user: "bruno.oliveira@slowmancy.com", date: "06/04/2026 08:32:45", ip: "192.168.1.45", action: "Entrada registrada — ATRASO", detail: "Método: Digital | Score: 99.1% | Atraso: 32min" },
  { id: 4, type: "AJUSTE", user: "diego.martins@slowmancy.com", date: "05/04/2026 17:45:00", ip: "192.168.1.80", action: "Solicitação de ajuste criada", detail: "Tipo: Esquecimento de marcação | Data: 04/04/2026" },
  { id: 5, type: "APROVAÇÃO", user: "gestor@slowmancy.com", date: "05/04/2026 18:10:33", ip: "192.168.1.60", action: "Ajuste aprovado", detail: "Colaborador: Diego Martins | Motivo: Esquecimento justificado" },
  { id: 6, type: "FALHA", user: "fernando.almeida@slowmancy.com", date: "06/04/2026 07:02:11", ip: "192.168.2.10", action: "Falha na validação biométrica", detail: "Método: Facial | Score: 42.3% | Abaixo do limiar" },
  { id: 7, type: "ADMIN", user: "rh@slowmancy.com", date: "05/04/2026 14:20:00", ip: "192.168.1.55", action: "Colaborador inativado", detail: "Gabriela Sousa Nunes — MAT-007" },
  { id: 8, type: "LOGIN", user: "gestor@slowmancy.com", date: "06/04/2026 07:55:00", ip: "192.168.1.60", action: "Login realizado com sucesso", detail: "Perfil: Gestor" },
];

const approvalRequests = [
  { id: 1, employee: "Diego Martins Costa", date: "04/04/2026", type: "Esquecimento de marcação", reason: "Esqueci de registrar saída — estava em reunião externa", manager: "Rafael Gestor", status: "pending" },
  { id: 2, employee: "Fernando Almeida", date: "03/04/2026", type: "Ajuste de horário", reason: "Entrada registrada às 07:32 mas cheguei às 07:00 — falha no terminal", manager: "Rafael Gestor", status: "pending" },
  { id: 3, employee: "Karen Lopes", date: "02/04/2026", type: "Abono de falta", reason: "Consulta médica — atestado anexado", manager: "Rafael Gestor", status: "approved" },
  { id: 4, employee: "Lucas Mendes", date: "01/04/2026", type: "Ajuste de horário", reason: "Saída antecipada autorizada pelo gestor para compromisso pessoal", manager: "Rafael Gestor", status: "rejected" },
  { id: 5, employee: "Ana Carolina Silva", date: "31/03/2026", type: "Esquecimento de marcação", reason: "Não registrei retorno do almoço — fui direto para sala de reunião", manager: "Rafael Gestor", status: "approved" },
];

// ─── MINI CHART COMPONENT ───
const MiniBarChart = ({ data, color = "#3b82f6", height = 60 }) => {
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1, background: color, borderRadius: 2, opacity: 0.15 + (v / max) * 0.85,
          height: `${Math.max(8, (v / max) * 100)}%`, transition: "height 0.5s ease"
        }} />
      ))}
    </div>
  );
};

const DonutChart = ({ value, total, color, size = 100 }) => {
  const pct = (value / total) * 100;
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 50 50)"
        style={{ transition: "stroke-dashoffset 1s ease" }} />
      <text x="50" y="46" textAnchor="middle" fill="#f8fafc" fontSize="18" fontWeight="700">{value}</text>
      <text x="50" y="62" textAnchor="middle" fill="#94a3b8" fontSize="10">de {total}</text>
    </svg>
  );
};

// ─── MAIN APP ───
export default function ChronosPontoSystem() {
  const [page, setPage] = useState("login");
  const [userProfile, setUserProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [clockStep, setClockStep] = useState(0);
  const [clockFeedback, setClockFeedback] = useState(null);
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [clockTimes, setClockTimes] = useState([null, null, null, null]);
  const [searchTerm, setSearchTerm] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [auditFilter, setAuditFilter] = useState("all");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (d) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formatDate = (d) => d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  const handleLogin = () => {
    setLoginError("");
    setLoginLoading(true);
    setTimeout(() => {
      const creds = {
        "admin@slowmancy.com": { name: "Admin Sistema", role: "admin", profile: "Administrador Global" },
        "rh@slowmancy.com": { name: "Juliana RH", role: "rh", profile: "Recursos Humanos" },
        "gestor@slowmancy.com": { name: "Rafael Gestor", role: "manager", profile: "Gestor" },
        "colab@slowmancy.com": { name: "Ana Carolina Silva", role: "employee", profile: "Colaborador" },
      };
      const user = creds[loginEmail];
      if (user && loginPassword === "123456") {
        setUserProfile(user);
        setPage("dashboard");
      } else {
        setLoginError("Credenciais inválidas. Verifique e-mail e senha.");
      }
      setLoginLoading(false);
    }, 1200);
  };

  const handleLogout = () => {
    setUserProfile(null);
    setPage("login");
    setLoginEmail("");
    setLoginPassword("");
    setClockStep(0);
    setClockTimes([null, null, null, null]);
  };

  const handleClock = (step) => {
    setBiometricScanning(true);
    setClockFeedback(null);
    setTimeout(() => {
      setBiometricScanning(false);
      const t = new Date();
      const newTimes = [...clockTimes];
      newTimes[step] = formatTime(t);
      setClockTimes(newTimes);
      setClockStep(step + 1);
      setClockFeedback({ type: "success", msg: ["Entrada registrada!", "Saída para intervalo registrada!", "Retorno registrado!", "Saída final registrada!"][step] });
      setTimeout(() => setClockFeedback(null), 4000);
    }, 2000);
  };

  // ─── STYLES ───
  const s = {
    bg: "#0a0f1a",
    sidebar: "#0d1321",
    sidebarBorder: "#1a2235",
    card: "#111827",
    cardBorder: "#1e293b",
    surface: "#0f172a",
    primary: "#2563eb",
    primaryHover: "#3b82f6",
    accent: "#06b6d4",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    text: "#f8fafc",
    textSecondary: "#94a3b8",
    textMuted: "#475569",
    font: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    fontMono: "'JetBrains Mono', 'Fira Code', monospace",
  };

  // ─── LOGIN PAGE ───
  if (page === "login") {
    return (
      <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${s.bg} 0%, #0d1b2a 50%, #1b2838 100%)`, display: "flex", fontFamily: s.font, color: s.text }}>
        {/* Left branding */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 80px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(37,99,235,0.08) 0%, transparent 60%)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 48 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${s.primary}, ${s.accent})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icons.Clock />
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>CHRONOS</div>
                <div style={{ fontSize: 11, color: s.accent, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>Ponto Corporativo</div>
              </div>
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.15, marginBottom: 20, letterSpacing: "-0.02em" }}>
              Gestão de jornada<br />
              <span style={{ color: s.accent }}>inteligente</span> e segura
            </h1>
            <p style={{ fontSize: 17, color: s.textSecondary, lineHeight: 1.7, maxWidth: 480, marginBottom: 48 }}>
              Plataforma corporativa de controle de ponto com biometria facial, gestão de escalas e conformidade total com a legislação trabalhista.
            </p>
            <div style={{ display: "flex", gap: 32 }}>
              {[
                { icon: <Icons.Fingerprint />, label: "Biometria Facial & Digital" },
                { icon: <Icons.Shield />, label: "LGPD Compliance" },
                { icon: <Icons.Zap />, label: "Tempo Real" },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ color: s.accent, opacity: 0.8 }}>{f.icon}</div>
                  <span style={{ fontSize: 13, color: s.textSecondary }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 40, left: 80, fontSize: 12, color: s.textMuted }}>
            © 2026 SlowMancy — Todos os direitos reservados
          </div>
        </div>

        {/* Right login form */}
        <div style={{ width: 520, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <div style={{
            width: "100%", maxWidth: 420, padding: 44, borderRadius: 20,
            background: "rgba(17,24,39,0.8)", border: `1px solid ${s.cardBorder}`,
            backdropFilter: "blur(20px)"
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Bem-vindo de volta</h2>
            <p style={{ color: s.textSecondary, fontSize: 14, marginBottom: 32 }}>Acesse sua conta para continuar</p>

            {loginError && (
              <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: s.danger, fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                <Icons.AlertTriangle /> {loginError}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: s.textSecondary, marginBottom: 8 }}>E-mail ou Matrícula</label>
              <input
                value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="seu@email.com"
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: 10, border: `1px solid ${s.cardBorder}`,
                  background: s.surface, color: s.text, fontSize: 15, outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = s.primary}
                onBlur={(e) => e.target.style.borderColor = s.cardBorder}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: s.textSecondary, marginBottom: 8 }}>Senha</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  style={{
                    width: "100%", padding: "14px 48px 14px 16px", borderRadius: 10, border: `1px solid ${s.cardBorder}`,
                    background: s.surface, color: s.text, fontSize: 15, outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = s.primary}
                  onBlur={(e) => e.target.style.borderColor = s.cardBorder}
                />
                <button onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: s.textMuted, cursor: "pointer", padding: 0 }}>
                  {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: s.textSecondary, cursor: "pointer" }}>
                <input type="checkbox" style={{ accentColor: s.primary }} /> Lembrar acesso
              </label>
              <a style={{ fontSize: 13, color: s.primary, textDecoration: "none", cursor: "pointer" }}>Recuperar senha</a>
            </div>

            <button onClick={handleLogin} disabled={loginLoading}
              style={{
                width: "100%", padding: "15px", borderRadius: 10, border: "none",
                background: loginLoading ? s.textMuted : `linear-gradient(135deg, ${s.primary}, #1d4ed8)`,
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: loginLoading ? "not-allowed" : "pointer",
                transition: "all 0.2s", letterSpacing: "0.02em"
              }}>
              {loginLoading ? "Autenticando..." : "Entrar"}
            </button>

            <div style={{ marginTop: 28, padding: "16px", borderRadius: 10, background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: s.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Credenciais de teste</div>
              <div style={{ fontSize: 12, color: s.textSecondary, lineHeight: 1.8 }}>
                admin@slowmancy.com · rh@slowmancy.com<br />
                gestor@slowmancy.com · colab@slowmancy.com<br />
                Senha: 123456
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── APP LAYOUT ───
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <Icons.Home /> },
    { id: "employee-panel", label: "Meu Painel", icon: <Icons.User /> },
    { id: "clock", label: "Registrar Ponto", icon: <Icons.Scan /> },
    { id: "employees", label: "Colaboradores", icon: <Icons.Users /> },
    { id: "schedules", label: "Jornadas & Escalas", icon: <Icons.Calendar /> },
    { id: "approvals", label: "Ajustes & Aprovações", icon: <Icons.Check /> },
    { id: "reports", label: "Relatórios", icon: <Icons.BarChart /> },
    { id: "audit", label: "Auditoria", icon: <Icons.Shield /> },
    { id: "biometrics", label: "Integrações Bio", icon: <Icons.Fingerprint /> },
  ];

  const Card = ({ children, style: cStyle = {}, ...props }) => (
    <div style={{
      background: s.card, border: `1px solid ${s.cardBorder}`, borderRadius: 14, padding: 24,
      ...cStyle
    }} {...props}>{children}</div>
  );

  const StatCard = ({ label, value, change, icon, color = s.primary }) => (
    <Card style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -10, right: -10, width: 60, height: 60, borderRadius: "50%", background: color, opacity: 0.06 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: s.textSecondary, fontWeight: 500 }}>{label}</span>
        <div style={{ color, opacity: 0.7 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>{value}</div>
      {change && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: change > 0 ? s.success : s.danger }}>
          {change > 0 ? <Icons.ArrowUp /> : <Icons.ArrowDown />}
          {Math.abs(change)}% vs. semana anterior
        </div>
      )}
    </Card>
  );

  const Badge = ({ type, children }) => {
    const colors = { success: s.success, warning: s.warning, danger: s.danger, info: s.primary, neutral: s.textMuted };
    const c = colors[type] || colors.neutral;
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 6,
        background: `${c}18`, color: c, fontSize: 12, fontWeight: 600
      }}>{children}</span>
    );
  };

  // ─── PAGE CONTENT ───
  const renderPage = () => {
    switch (page) {
      // ═══════════════ DASHBOARD ═══════════════
      case "dashboard": return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, letterSpacing: "-0.02em" }}>Visão Geral</h1>
            <p style={{ color: s.textSecondary, fontSize: 14 }}>{formatDate(now)} — {formatTime(now)}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            <StatCard label="Colaboradores Ativos" value="847" change={2.3} icon={<Icons.Users />} color={s.primary} />
            <StatCard label="Presentes Hoje" value="712" change={-1.1} icon={<Icons.Check />} color={s.success} />
            <StatCard label="Atrasos do Dia" value="23" change={-8} icon={<Icons.Clock />} color={s.warning} />
            <StatCard label="Faltas de Marcação" value="9" change={15} icon={<Icons.AlertTriangle />} color={s.danger} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Marcações por Horário</h3>
                  <p style={{ fontSize: 12, color: s.textSecondary }}>Distribuição de registros — hoje</p>
                </div>
                <Badge type="info">Tempo real</Badge>
              </div>
              <MiniBarChart data={[12, 45, 380, 120, 85, 15, 8, 320, 90, 55, 18, 410, 95]} color={s.primary} height={120} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: s.textMuted }}>
                <span>06:00</span><span>08:00</span><span>10:00</span><span>12:00</span><span>14:00</span><span>16:00</span><span>18:00</span>
              </div>
            </Card>
            <Card>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Status por Unidade</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
                <DonutChart value={712} total={847} color={s.success} size={130} />
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { name: "Matriz São Paulo", val: 342, total: 400, color: s.primary },
                    { name: "Unidade Comercial", val: 215, total: 247, color: s.accent },
                    { name: "Unidade Operacional", val: 155, total: 200, color: s.success },
                  ].map((u, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: s.textSecondary }}>{u.name}</span>
                        <span style={{ fontWeight: 600 }}>{u.val}/{u.total}</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: s.surface }}>
                        <div style={{ height: "100%", borderRadius: 3, background: u.color, width: `${(u.val / u.total) * 100}%`, transition: "width 0.8s ease" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Solicitações Pendentes</h3>
              {approvalRequests.filter(r => r.status === "pending").map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < 1 ? `1px solid ${s.cardBorder}` : "none" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{r.employee}</div>
                    <div style={{ fontSize: 12, color: s.textSecondary }}>{r.type} — {r.date}</div>
                  </div>
                  <Badge type="warning">Pendente</Badge>
                </div>
              ))}
            </Card>
            <Card>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Alertas Operacionais</h3>
              {[
                { msg: "23 atrasos registrados hoje", type: "warning" },
                { msg: "9 colaboradores sem marcação completa", type: "danger" },
                { msg: "Gateway biométrico facial: online", type: "success" },
                { msg: "Banco de horas: 47 colaboradores acima de 20h", type: "warning" },
              ].map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < 3 ? `1px solid ${s.cardBorder}` : "none" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: { success: s.success, warning: s.warning, danger: s.danger }[a.type], flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: s.textSecondary }}>{a.msg}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      );

      // ═══════════════ EMPLOYEE PANEL ═══════════════
      case "employee-panel": return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Olá, {userProfile?.name?.split(" ")[0]} 👋</h1>
            <p style={{ color: s.textSecondary, fontSize: 14 }}>{formatDate(now)}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <Card style={{ background: `linear-gradient(135deg, ${s.primary}15, ${s.accent}08)`, borderColor: `${s.primary}30` }}>
              <div style={{ fontSize: 12, color: s.accent, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Próxima Jornada</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>08:00 — 18:00</div>
              <div style={{ fontSize: 13, color: s.textSecondary, marginTop: 4 }}>Administrativa · 1h almoço</div>
            </Card>
            <Card>
              <div style={{ fontSize: 12, color: s.textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Status Hoje</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: clockStep > 0 ? s.success : s.warning }} />
                <span style={{ fontSize: 18, fontWeight: 700 }}>
                  {clockStep === 0 ? "Aguardando entrada" : clockStep === 4 ? "Jornada completa" : "Em andamento"}
                </span>
              </div>
              <div style={{ fontSize: 13, color: s.textSecondary, marginTop: 4 }}>{clockStep}/4 marcações</div>
            </Card>
            <Card>
              <div style={{ fontSize: 12, color: s.textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Banco de Horas</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.success }}>+12h 30min</div>
              <div style={{ fontSize: 13, color: s.textSecondary, marginTop: 4 }}>Acumulado no mês</div>
            </Card>
          </div>

          <Card>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Marcações de Hoje</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {["Entrada", "Saída Intervalo", "Retorno", "Saída Final"].map((label, i) => (
                <div key={i} style={{
                  padding: 16, borderRadius: 10, textAlign: "center",
                  background: clockTimes[i] ? `${s.success}10` : s.surface,
                  border: `1px solid ${clockTimes[i] ? `${s.success}30` : s.cardBorder}`
                }}>
                  <div style={{ fontSize: 12, color: s.textSecondary, marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: clockTimes[i] ? s.success : s.textMuted }}>
                    {clockTimes[i] || "--:--:--"}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Espelho da Semana</h3>
              {["Seg 31/03", "Ter 01/04", "Qua 02/04", "Qui 03/04", "Sex 04/04"].map((day, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 4 ? `1px solid ${s.cardBorder}` : "none" }}>
                  <span style={{ fontSize: 13, color: s.textSecondary, minWidth: 80 }}>{day}</span>
                  <span style={{ fontSize: 13, fontFamily: s.fontMono }}>08:02 · 12:00 · 13:01 · 18:05</span>
                  <Badge type={i === 3 ? "warning" : "success"}>{i === 3 ? "Atraso 12min" : "8h 02min"}</Badge>
                </div>
              ))}
            </Card>
            <Card>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Notificações</h3>
              {[
                { msg: "Seu ajuste de 31/03 foi aprovado", time: "Hoje, 09:15", type: "success" },
                { msg: "Marcação incompleta em 03/04", time: "Ontem, 18:30", type: "danger" },
                { msg: "Novo comunicado do RH disponível", time: "04/04, 14:00", type: "info" },
              ].map((n, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < 2 ? `1px solid ${s.cardBorder}` : "none" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: { success: s.success, danger: s.danger, info: s.primary }[n.type], marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13 }}>{n.msg}</div>
                    <div style={{ fontSize: 11, color: s.textMuted, marginTop: 2 }}>{n.time}</div>
                  </div>
                </div>
              ))}
            </Card>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setPage("clock")} style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${s.primary}, #1d4ed8)`, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Registrar Ponto
            </button>
            <button style={{ padding: "12px 24px", borderRadius: 10, border: `1px solid ${s.cardBorder}`, background: "transparent", color: s.text, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Solicitar Ajuste
            </button>
          </div>
        </div>
      );

      // ═══════════════ CLOCK ═══════════════
      case "clock": return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32, paddingTop: 20 }}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Registro de Ponto</h1>
            <p style={{ color: s.textSecondary, fontSize: 14 }}>{formatDate(now)}</p>
          </div>

          <div style={{
            fontSize: 56, fontWeight: 800, fontFamily: s.fontMono, letterSpacing: "0.05em",
            background: `linear-gradient(135deg, ${s.text}, ${s.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            {formatTime(now)}
          </div>

          {clockFeedback && (
            <div style={{
              padding: "14px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600,
              background: clockFeedback.type === "success" ? `${s.success}15` : `${s.danger}15`,
              border: `1px solid ${clockFeedback.type === "success" ? `${s.success}30` : `${s.danger}30`}`,
              color: clockFeedback.type === "success" ? s.success : s.danger,
              display: "flex", alignItems: "center", gap: 8
            }}>
              <Icons.Check /> {clockFeedback.msg}
            </div>
          )}

          <Card style={{ width: "100%", maxWidth: 560, textAlign: "center", padding: 32 }}>
            {biometricScanning ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: 24 }}>
                <div style={{
                  width: 100, height: 100, borderRadius: "50%", border: `3px solid ${s.accent}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: "pulse 1.5s ease-in-out infinite"
                }}>
                  <Icons.Scan />
                </div>
                <style>{`@keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(1.05); } }`}</style>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Validando biometria...</div>
                  <div style={{ fontSize: 13, color: s.textSecondary }}>Reconhecimento facial em andamento</div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 14, color: s.textSecondary, marginBottom: 20, fontWeight: 500 }}>
                  Próxima marcação esperada:
                  <span style={{ color: s.accent, fontWeight: 700, marginLeft: 6 }}>
                    {["Entrada", "Saída para Intervalo", "Retorno do Intervalo", "Saída Final", "Jornada Completa"][clockStep]}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Entrada", step: 0, color: s.success },
                    { label: "Saída Intervalo", step: 1, color: s.warning },
                    { label: "Retorno", step: 2, color: s.primary },
                    { label: "Saída Final", step: 3, color: s.danger },
                  ].map((btn) => {
                    const done = clockTimes[btn.step] !== null;
                    const active = btn.step === clockStep;
                    return (
                      <button key={btn.step} onClick={() => active && handleClock(btn.step)}
                        disabled={!active || biometricScanning}
                        style={{
                          padding: "18px 16px", borderRadius: 12, border: `1px solid ${done ? `${btn.color}40` : active ? btn.color : s.cardBorder}`,
                          background: done ? `${btn.color}10` : active ? `${btn.color}15` : s.surface,
                          color: done ? btn.color : active ? s.text : s.textMuted,
                          fontSize: 14, fontWeight: 700, cursor: active ? "pointer" : "default",
                          transition: "all 0.2s", opacity: !active && !done ? 0.4 : 1
                        }}>
                        {done ? `✓ ${clockTimes[btn.step]}` : btn.label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 20, fontSize: 12, color: s.textMuted }}>
                  Dispositivo: Terminal Web · IP: 192.168.1.100 · Método: Biometria Facial
                </div>
              </>
            )}
          </Card>

          <div style={{ display: "flex", gap: 12, fontSize: 13 }}>
            <button style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${s.cardBorder}`, background: "transparent", color: s.textSecondary, cursor: "pointer" }}>
              Validação por Digital
            </button>
            <button style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${s.cardBorder}`, background: "transparent", color: s.textSecondary, cursor: "pointer" }}>
              Método de Contingência
            </button>
          </div>
        </div>
      );

      // ═══════════════ EMPLOYEES ═══════════════
      case "employees": return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Colaboradores</h1>
              <p style={{ color: s.textSecondary, fontSize: 14 }}>{employees.length} registros</p>
            </div>
            <button style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: s.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              + Novo Colaborador
            </button>
          </div>

          <Card style={{ padding: 0 }}>
            <div style={{ display: "flex", gap: 12, padding: "16px 20px", borderBottom: `1px solid ${s.cardBorder}` }}>
              <div style={{ flex: 1, position: "relative" }}>
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: s.textMuted }}><Icons.Search /></div>
                <input
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, matrícula, equipe..."
                  style={{ width: "100%", padding: "10px 12px 10px 38px", borderRadius: 8, border: `1px solid ${s.cardBorder}`, background: s.surface, color: s.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <button style={{ padding: "10px 16px", borderRadius: 8, border: `1px solid ${s.cardBorder}`, background: "transparent", color: s.textSecondary, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Icons.Filter /> Filtros
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${s.cardBorder}` }}>
                    {["Colaborador", "Matrícula", "Cargo", "Equipe", "Unidade", "Status", "Biometria", "Ações"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: s.textSecondary, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.filter(e => !searchTerm || e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.team.toLowerCase().includes(searchTerm.toLowerCase())).map(emp => (
                    <tr key={emp.id} style={{ borderBottom: `1px solid ${s.cardBorder}`, transition: "background 0.15s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = `${s.primary}08`}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg, ${s.primary}30, ${s.accent}20)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: s.accent }}>
                            {emp.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                          </div>
                          <span style={{ fontWeight: 600 }}>{emp.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontFamily: s.fontMono, color: s.textSecondary }}>{emp.registration}</td>
                      <td style={{ padding: "14px 16px", color: s.textSecondary }}>{emp.role}</td>
                      <td style={{ padding: "14px 16px", color: s.textSecondary }}>{emp.team}</td>
                      <td style={{ padding: "14px 16px", color: s.textSecondary }}>{emp.unit}</td>
                      <td style={{ padding: "14px 16px" }}><Badge type={emp.status === "active" ? "success" : "neutral"}>{emp.status === "active" ? "Ativo" : "Inativo"}</Badge></td>
                      <td style={{ padding: "14px 16px" }}><Badge type={emp.biometric ? "info" : "neutral"}>{emp.biometric ? "Cadastrada" : "Pendente"}</Badge></td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${s.cardBorder}`, background: "transparent", color: s.textSecondary, fontSize: 11, cursor: "pointer" }}>Editar</button>
                          <button style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${s.cardBorder}`, background: "transparent", color: s.textSecondary, fontSize: 11, cursor: "pointer" }}>Histórico</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      );

      // ═══════════════ SCHEDULES ═══════════════
      case "schedules": return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Jornadas & Escalas</h1>
              <p style={{ color: s.textSecondary, fontSize: 14 }}>Gerencie jornadas, horários e escalas de trabalho</p>
            </div>
            <button style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: s.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              + Nova Jornada
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { name: "Administrativa", hours: "08:00 — 18:00", lunch: "12:00 — 13:00", load: "8h/dia · 44h/sem", tolerance: "10 min", assigned: 412, color: s.primary },
              { name: "Comercial", hours: "09:00 — 18:00", lunch: "12:00 — 13:00", load: "8h/dia · 40h/sem", tolerance: "10 min", assigned: 247, color: s.accent },
              { name: "Operacional", hours: "07:00 — 16:00", lunch: "11:00 — 12:00", load: "8h/dia · 44h/sem", tolerance: "10 min", assigned: 188, color: s.success },
            ].map((j, i) => (
              <Card key={i} style={{ position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: j.color }} />
                <div style={{ marginTop: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700 }}>{j.name}</h3>
                    <Badge type="info">{j.assigned} colab.</Badge>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { label: "Horário", value: j.hours },
                      { label: "Almoço", value: j.lunch },
                      { label: "Carga", value: j.load },
                      { label: "Tolerância", value: j.tolerance },
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: s.textSecondary }}>{item.label}</span>
                        <span style={{ fontWeight: 600, fontFamily: s.fontMono }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <button style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${s.cardBorder}`, background: "transparent", color: s.textSecondary, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Editar</button>
                    <button style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${s.cardBorder}`, background: "transparent", color: s.textSecondary, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Atribuir</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Escala Semanal — Administrativa</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day, i) => (
                <div key={i} style={{
                  padding: 14, borderRadius: 10, textAlign: "center",
                  background: i < 5 ? `${s.primary}10` : s.surface,
                  border: `1px solid ${i < 5 ? `${s.primary}25` : s.cardBorder}`
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: i < 5 ? s.primary : s.textMuted, marginBottom: 6 }}>{day}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: i < 5 ? s.text : s.textMuted }}>{i < 5 ? "08:00–18:00" : "Folga"}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Feriados & Exceções</h3>
            <p style={{ fontSize: 13, color: s.textSecondary, marginBottom: 16 }}>Datas com regras especiais de jornada</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { date: "21/04/2026", name: "Tiradentes", type: "Feriado Nacional" },
                { date: "01/05/2026", name: "Dia do Trabalho", type: "Feriado Nacional" },
                { date: "04/06/2026", name: "Corpus Christi", type: "Ponto Facultativo" },
              ].map((h, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 8, background: s.surface }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontFamily: s.fontMono, fontSize: 13, color: s.accent, fontWeight: 600 }}>{h.date}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{h.name}</span>
                  </div>
                  <Badge type="info">{h.type}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      );

      // ═══════════════ APPROVALS ═══════════════
      case "approvals": return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Ajustes & Aprovações</h1>
            <p style={{ color: s.textSecondary, fontSize: 14 }}>Fila de solicitações de ajuste de ponto</p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {[
              { id: "all", label: "Todas", count: approvalRequests.length },
              { id: "pending", label: "Pendentes", count: approvalRequests.filter(r => r.status === "pending").length },
              { id: "approved", label: "Aprovadas", count: approvalRequests.filter(r => r.status === "approved").length },
              { id: "rejected", label: "Reprovadas", count: approvalRequests.filter(r => r.status === "rejected").length },
            ].map(f => (
              <button key={f.id} onClick={() => setApprovalFilter(f.id)}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: `1px solid ${approvalFilter === f.id ? s.primary : s.cardBorder}`,
                  background: approvalFilter === f.id ? `${s.primary}15` : "transparent",
                  color: approvalFilter === f.id ? s.primary : s.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer"
                }}>
                {f.label} <span style={{ opacity: 0.6, marginLeft: 4 }}>{f.count}</span>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {approvalRequests
              .filter(r => approvalFilter === "all" || r.status === approvalFilter)
              .map(req => (
                <Card key={req.id} style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{req.employee}</div>
                      <div style={{ fontSize: 13, color: s.textSecondary }}>{req.type} · {req.date} · Gestor: {req.manager}</div>
                    </div>
                    <Badge type={req.status === "pending" ? "warning" : req.status === "approved" ? "success" : "danger"}>
                      {req.status === "pending" ? "Pendente" : req.status === "approved" ? "Aprovado" : "Reprovado"}
                    </Badge>
                  </div>
                  <div style={{ padding: "12px 16px", borderRadius: 8, background: s.surface, fontSize: 13, color: s.textSecondary, marginBottom: 12 }}>
                    {req.reason}
                  </div>
                  {req.status === "pending" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: s.success, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Aprovar</button>
                      <button style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: s.danger, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Reprovar</button>
                      <button style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${s.cardBorder}`, background: "transparent", color: s.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Ver Histórico</button>
                    </div>
                  )}
                </Card>
              ))}
          </div>
        </div>
      );

      // ═══════════════ REPORTS ═══════════════
      case "reports": return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Relatórios</h1>
              <p style={{ color: s.textSecondary, fontSize: 14 }}>Indicadores consolidados e análises de jornada</p>
            </div>
            <button style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${s.cardBorder}`, background: "transparent", color: s.text, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Icons.Download /> Exportar
            </button>
          </div>

          <Card style={{ padding: 16 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              {["Período", "Unidade", "Equipe", "Gestor", "Colaborador"].map((f, i) => (
                <select key={i} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${s.cardBorder}`, background: s.surface, color: s.text, fontSize: 13 }}>
                  <option>{f}</option>
                </select>
              ))}
              <button style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: s.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", marginLeft: "auto" }}>Aplicar</button>
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            <StatCard label="Horas Trabalhadas" value="6.248h" icon={<Icons.Clock />} color={s.primary} />
            <StatCard label="Atrasos no Mês" value="187" icon={<Icons.AlertTriangle />} color={s.warning} />
            <StatCard label="Taxa de Assiduidade" value="96.2%" icon={<Icons.Check />} color={s.success} />
            <StatCard label="Banco de Horas Total" value="+412h" icon={<Icons.Activity />} color={s.accent} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Atrasos por Semana</h3>
              <p style={{ fontSize: 12, color: s.textSecondary, marginBottom: 16 }}>Últimas 12 semanas</p>
              <MiniBarChart data={[23, 18, 31, 27, 19, 25, 22, 16, 29, 21, 24, 23]} color={s.warning} height={100} />
            </Card>
            <Card>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Inconsistências</h3>
              <p style={{ fontSize: 12, color: s.textSecondary, marginBottom: 16 }}>Marcações incompletas e divergências</p>
              <MiniBarChart data={[8, 5, 12, 7, 9, 6, 11, 4, 10, 8, 7, 9]} color={s.danger} height={100} />
            </Card>
          </div>

          <Card style={{ padding: 0 }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${s.cardBorder}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Detalhamento por Colaborador</h3>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${s.cardBorder}` }}>
                  {["Colaborador", "Horas Trabalhadas", "Atrasos", "Faltas", "Banco de Horas", "Assiduidade"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: s.textSecondary, fontSize: 12, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.slice(0, 8).map((emp, i) => (
                  <tr key={emp.id} style={{ borderBottom: `1px solid ${s.cardBorder}` }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600 }}>{emp.name}</td>
                    <td style={{ padding: "12px 16px", fontFamily: s.fontMono }}>{160 + Math.floor(Math.random() * 20)}h {Math.floor(Math.random() * 60)}min</td>
                    <td style={{ padding: "12px 16px" }}><Badge type={Math.random() > 0.7 ? "warning" : "success"}>{Math.floor(Math.random() * 5)}</Badge></td>
                    <td style={{ padding: "12px 16px" }}><Badge type={Math.random() > 0.85 ? "danger" : "success"}>{Math.floor(Math.random() * 2)}</Badge></td>
                    <td style={{ padding: "12px 16px", fontFamily: s.fontMono, color: s.success }}>+{Math.floor(Math.random() * 24)}h {Math.floor(Math.random() * 60)}min</td>
                    <td style={{ padding: "12px 16px" }}><Badge type="success">{(94 + Math.random() * 6).toFixed(1)}%</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      );

      // ═══════════════ AUDIT ═══════════════
      case "audit": return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Auditoria & Segurança</h1>
            <p style={{ color: s.textSecondary, fontSize: 14 }}>Trilha completa de eventos do sistema</p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {["all", "LOGIN", "MARCAÇÃO", "AJUSTE", "APROVAÇÃO", "FALHA", "ADMIN"].map(f => (
              <button key={f} onClick={() => setAuditFilter(f)}
                style={{
                  padding: "8px 14px", borderRadius: 8, border: `1px solid ${auditFilter === f ? s.primary : s.cardBorder}`,
                  background: auditFilter === f ? `${s.primary}15` : "transparent",
                  color: auditFilter === f ? s.primary : s.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer"
                }}>
                {f === "all" ? "Todos" : f}
              </button>
            ))}
          </div>

          <Card style={{ padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${s.cardBorder}` }}>
                  {["Tipo", "Usuário", "Data/Hora", "IP", "Ação", "Detalhes"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: s.textSecondary, fontSize: 12, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditEvents.filter(e => auditFilter === "all" || e.type === auditFilter).map(ev => {
                  const typeColors = { LOGIN: s.primary, MARCAÇÃO: s.success, AJUSTE: s.warning, APROVAÇÃO: s.accent, FALHA: s.danger, ADMIN: s.textMuted };
                  return (
                    <tr key={ev.id} style={{ borderBottom: `1px solid ${s.cardBorder}` }}>
                      <td style={{ padding: "12px 16px" }}><Badge type={ev.type === "FALHA" ? "danger" : ev.type === "LOGIN" ? "info" : ev.type === "MARCAÇÃO" ? "success" : ev.type === "AJUSTE" ? "warning" : "neutral"}>{ev.type}</Badge></td>
                      <td style={{ padding: "12px 16px", fontFamily: s.fontMono, fontSize: 12, color: s.textSecondary }}>{ev.user}</td>
                      <td style={{ padding: "12px 16px", fontFamily: s.fontMono, fontSize: 12 }}>{ev.date}</td>
                      <td style={{ padding: "12px 16px", fontFamily: s.fontMono, fontSize: 12, color: s.textMuted }}>{ev.ip}</td>
                      <td style={{ padding: "12px 16px" }}>{ev.action}</td>
                      <td style={{ padding: "12px 16px", color: s.textSecondary, fontSize: 12 }}>{ev.detail}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      );

      // ═══════════════ BIOMETRICS ═══════════════
      case "biometrics": return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Integrações Biométricas</h1>
            <p style={{ color: s.textSecondary, fontSize: 14 }}>Status dos serviços de biometria facial e digital</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { name: "Reconhecimento Facial", status: "online", score: "97.3%", latency: "142ms", endpoint: "biometric-gw:8090/api/v1/verify/face", lastSync: "06/04/2026 08:32:11", events: 1247, icon: <Icons.Scan /> },
              { name: "Biometria Digital", status: "online", score: "99.1%", latency: "89ms", endpoint: "biometric-gw:8090/api/v1/verify/fingerprint", lastSync: "06/04/2026 08:32:11", events: 892, icon: <Icons.Fingerprint /> },
            ].map((svc, i) => (
              <Card key={i} style={{ position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: svc.status === "online" ? s.success : s.danger }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, marginTop: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: `${s.accent}15`, display: "flex", alignItems: "center", justifyContent: "center", color: s.accent }}>
                      {svc.icon}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700 }}>{svc.name}</h3>
                      <div style={{ fontSize: 12, color: s.textSecondary }}>Ambiente: Local (mock)</div>
                    </div>
                  </div>
                  <Badge type="success">Online</Badge>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Score Médio", value: svc.score },
                    { label: "Latência", value: svc.latency },
                    { label: "Última Sincronização", value: svc.lastSync },
                    { label: "Eventos Processados", value: svc.events.toLocaleString() },
                  ].map((item, idx) => (
                    <div key={idx} style={{ padding: 12, borderRadius: 8, background: s.surface }}>
                      <div style={{ fontSize: 11, color: s.textMuted, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: s.fontMono }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: s.surface, fontFamily: s.fontMono, fontSize: 12, color: s.textMuted }}>
                  Endpoint: {svc.endpoint}
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Pontos de Integração Futura</h3>
            <p style={{ fontSize: 13, color: s.textSecondary, marginBottom: 16 }}>Serviços preparados para substituição por SDK/API real em produção</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { name: "SDK Facial", desc: "FaceAPI, Amazon Rekognition, Azure Face", status: "Mockado" },
                { name: "SDK Digital", desc: "DigitalPersona, Suprema, ZKTeco", status: "Mockado" },
                { name: "Motor Antifraude", desc: "Liveness detection, prova de vida", status: "Planejado" },
                { name: "APIs Externas", desc: "BioConnect, IDTech, Thales", status: "Planejado" },
              ].map((p, i) => (
                <div key={i} style={{ padding: 16, borderRadius: 10, background: s.surface, border: `1px solid ${s.cardBorder}` }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: s.textSecondary, marginBottom: 10, lineHeight: 1.5 }}>{p.desc}</div>
                  <Badge type={p.status === "Mockado" ? "warning" : "neutral"}>{p.status}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Histórico de Eventos Biométricos</h3>
            {[
              { time: "08:32:11", user: "Ana Carolina Silva", method: "Facial", score: "98.7%", result: "Sucesso" },
              { time: "08:32:45", user: "Bruno Oliveira Santos", method: "Digital", score: "99.1%", result: "Sucesso" },
              { time: "07:02:11", user: "Fernando Almeida", method: "Facial", score: "42.3%", result: "Falha" },
              { time: "08:45:22", user: "Isabela Moreira", method: "Facial", score: "96.5%", result: "Sucesso" },
              { time: "07:58:03", user: "Henrique Barbosa", method: "Digital", score: "98.9%", result: "Sucesso" },
            ].map((ev, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 0", borderBottom: i < 4 ? `1px solid ${s.cardBorder}` : "none" }}>
                <span style={{ fontFamily: s.fontMono, fontSize: 12, color: s.textMuted, minWidth: 65 }}>{ev.time}</span>
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{ev.user}</span>
                <Badge type="info">{ev.method}</Badge>
                <span style={{ fontFamily: s.fontMono, fontSize: 13, minWidth: 55 }}>{ev.score}</span>
                <Badge type={ev.result === "Sucesso" ? "success" : "danger"}>{ev.result}</Badge>
              </div>
            ))}
          </Card>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: s.bg, fontFamily: s.font, color: s.text }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 260 : 0, minHeight: "100vh", background: s.sidebar,
        borderRight: `1px solid ${s.sidebarBorder}`, display: "flex", flexDirection: "column",
        transition: "width 0.3s ease", overflow: "hidden", flexShrink: 0
      }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${s.sidebarBorder}`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${s.primary}, ${s.accent})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icons.Clock />
          </div>
          <div style={{ whiteSpace: "nowrap" }}>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>CHRONOS</div>
            <div style={{ fontSize: 10, color: s.accent, fontWeight: 600, letterSpacing: "0.12em" }}>PONTO CORPORATIVO</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map(item => {
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => setPage(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                  borderRadius: 8, border: "none", background: active ? `${s.primary}15` : "transparent",
                  color: active ? s.primary : s.textSecondary, fontSize: 13, fontWeight: active ? 700 : 500,
                  cursor: "pointer", transition: "all 0.15s", textAlign: "left", whiteSpace: "nowrap"
                }}>
                <span style={{ opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "16px 14px", borderTop: `1px solid ${s.sidebarBorder}` }}>
          <button onClick={handleLogout} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", width: "100%",
            borderRadius: 8, border: "none", background: "transparent", color: s.textMuted,
            fontSize: 13, cursor: "pointer", whiteSpace: "nowrap"
          }}>
            <Icons.LogOut /> Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          padding: "12px 28px", borderBottom: `1px solid ${s.cardBorder}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", background: s.sidebar
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: s.textSecondary, cursor: "pointer", padding: 4 }}>
              {sidebarOpen ? <Icons.X /> : <Icons.Menu />}
            </button>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: s.textMuted }}><Icons.Search /></div>
              <input placeholder="Buscar colaborador, equipe, unidade..."
                style={{ width: 320, padding: "8px 12px 8px 36px", borderRadius: 8, border: `1px solid ${s.cardBorder}`, background: s.surface, color: s.text, fontSize: 13, outline: "none" }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button style={{ background: "none", border: "none", color: s.textSecondary, cursor: "pointer", position: "relative", padding: 4 }}>
              <Icons.Bell />
              <div style={{ position: "absolute", top: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: s.danger }} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg, ${s.primary}, ${s.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
                {userProfile?.name?.split(" ").map(n => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{userProfile?.name}</div>
                <div style={{ fontSize: 11, color: s.textMuted }}>{userProfile?.profile}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, padding: 28, overflowY: "auto" }}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
