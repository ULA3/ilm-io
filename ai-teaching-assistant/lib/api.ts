/**
 * ilm.io — typed API client
 * Uses NEXT_PUBLIC_API_URL if set; otherwise same-origin /api (Next.js → FastAPI proxy).
 */

import { apiFetchHeaders, apiUrl, getApiBase } from "@/lib/api-base";

const BASE = getApiBase();

function formatApiError(detail: unknown, status: number): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => (typeof d === "object" && d && "msg" in d ? String((d as { msg: string }).msg) : String(d))).join("; ");
  }
  if (detail && typeof detail === "object" && "message" in detail) {
    return String((detail as { message: string }).message);
  }
  return `Request failed (${status})`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: apiFetchHeaders({
        "Content-Type": "application/json",
        ...init?.headers,
      }),
    });
  } catch {
    const hint = BASE ? BASE : "the Next.js proxy";
    throw new Error(
      `Cannot reach the backend (${hint}). Start it: cd backend → uvicorn main:app --reload --port 8000`
    );
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(formatApiError(err.detail, res.status));
  }
  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface UploadResponse {
  file_id: string;
  filename: string;
  file_type: string;
  text_content: string;
  word_count: number;
  storage_path: string;
}

export interface Slide {
  index: number;
  title: string;
  bullets: string[];
  visual_hint: string;
  speaker_note: string;
}

export interface GenerateSlidesResponse {
  job_id: string;
  slides: Slide[];
  download_url: string;
  condition: string;
}

export interface AudiobookResponse {
  job_id: string;
  audio_url: string;
  duration_seconds: number;
  transcript: string;
}

export interface VisualCard {
  concept: string;
  explanation: string;
  emoji: string;
  analogy: string;
}

export interface VisualSummaryResponse {
  job_id: string;
  cards: VisualCard[];
  download_url: string;
}

export interface WorksheetQuestion {
  number: number;
  question: string;
  type: string;
  options: string[];
  answer: string;
  difficulty: number;
}

export interface WorksheetResponse {
  job_id: string;
  title: string;
  questions: WorksheetQuestion[];
  download_url: string;
  adapted_for: string;
}

export interface SimplifiedSection {
  heading: string;
  text: string;
  key_idea: string;
}

export interface SimplifiedTextResponse {
  job_id: string;
  original_word_count: number;
  simplified_word_count: number;
  sections: SimplifiedSection[];
  download_url: string;
}

export interface EducatorGenerateResponse {
  job_id: string;
  kind: string;
  condition: string;
  content: Record<string, unknown>;
  download_url: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface IlmAssistantAction {
  id: string;
  label: string;
}

export interface ChatResponse {
  session_id: string;
  message: string;
  suggestions: string[];
  actions?: IlmAssistantAction[];
}

export interface LearningInsight {
  label: string;
  value: string;
  trend: "up" | "down" | "stable";
}

export interface StudentProfile {
  id: string;
  name: string;
  emoji: string;
  condition: string;
  learning_style: string;
  streak_days: number;
  weekly_progress: number;
  insights: LearningInsight[];
  attention_trend: number[];
  last_active: string;
}

export interface HeatmapCell {
  topic: string;
  week: number;
  difficulty: number;
  engagement: number;
}

export interface HeatmapResponse {
  topics: string[];
  weeks: string[];
  cells: HeatmapCell[];
}

export interface WeeklyReport {
  id: string;
  week_label: string;
  generated_at: string;
  summary: string;
  highlights: string[];
  recommendations: string[];
  download_url: string;
}

// ── Upload ─────────────────────────────────────────────────────────────────

export async function uploadFile(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const url = apiUrl("/api/upload");
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      body: form,
      headers: apiFetchHeaders(),
    });
  } catch {
    const hint = BASE ? BASE : "Next.js proxy (uvicorn on :8000 + npm run dev)";
    throw new Error(`Cannot reach the backend (${hint}).`);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(formatApiError(err.detail, res.status));
  }
  return res.json();
}

// ── Generate (student) ─────────────────────────────────────────────────────

export const generateSlides = (fileId: string, condition = "general") =>
  request<GenerateSlidesResponse>("/api/generate/slides", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId, condition }),
  });

export const generateAudiobook = (fileId: string) =>
  request<AudiobookResponse>("/api/generate/audiobook", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId }),
  });

export const generateVisualSummary = (fileId: string) =>
  request<VisualSummaryResponse>("/api/generate/visual-summary", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId }),
  });

export const generateWorksheet = (fileId: string, condition = "general", difficulty = 2) =>
  request<WorksheetResponse>("/api/generate/worksheet", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId, condition, difficulty }),
  });

export const generateSimplifiedText = (fileId: string) =>
  request<SimplifiedTextResponse>("/api/generate/simplified-text", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId }),
  });

// ── Generate (educator) ────────────────────────────────────────────────────

export const generateEducatorContent = (
  kind: string,
  fileId: string,
  condition = "general"
) =>
  request<EducatorGenerateResponse>(`/api/generate/educator/${kind}`, {
    method: "POST",
    body: JSON.stringify({ file_id: fileId, condition }),
  });

// ── Chat ───────────────────────────────────────────────────────────────────

export const newChatSession = () =>
  request<{ session_id: string }>("/api/chat/session/new", { method: "POST" });

export const sendChat = (
  sessionId: string,
  message: string,
  role: "student" | "educator",
  contextFileId?: string,
  mood = "okay",
  lang: Language = "en",
  app?: AppChatContext
) =>
  request<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      message,
      role,
      context_file_id: contextFileId,
      mood,
      lang,
      app_page: app?.appPage ?? "student",
      app_context: app?.appContext ?? "",
    }),
  });

export const getChatHistory = (sessionId: string) =>
  request<{ messages: ChatMessage[] }>(`/api/chat/session/${sessionId}/history`);

// ── Students ───────────────────────────────────────────────────────────────

export const getStudents = () =>
  request<{ students: StudentProfile[] }>("/api/students");

export const refreshStudentInsights = (studentId: string) =>
  request<StudentProfile>(`/api/students/${studentId}/refresh-insights`, {
    method: "POST",
  });

// ── Analytics ──────────────────────────────────────────────────────────────

export const logEvent = (
  studentId: string,
  sessionId: string,
  eventType: string,
  metadata: Record<string, unknown> = {}
) =>
  request("/api/analytics/event", {
    method: "POST",
    body: JSON.stringify({ student_id: studentId, session_id: sessionId, event_type: eventType, metadata }),
  });

export const getAnalyticsBars = () =>
  request<{ label: string; value: number; color: string }[]>("/api/analytics/bars");

export const getHeatmap = () =>
  request<HeatmapResponse>("/api/analytics/heatmap");

// ── Reports ────────────────────────────────────────────────────────────────

export const getReports = () => request<WeeklyReport[]>("/api/reports");

export const generateReport = () =>
  request<WeeklyReport>("/api/reports/generate", { method: "POST" });

// ── Download helper ────────────────────────────────────────────────────────

export function downloadUrl(jobId: string, _ext?: string): string {
  return apiUrl(`/api/download/${jobId}`);
}

// ── Agent pipeline (educator mode) ────────────────────────────────────────

export type Language = "en" | "ms" | "zh" | "ta" | "rojak";

export interface Pocket {
  id: number;
  concept: string;
  key_points: string[];
  examples: string[];
  complexity: number;
  pocket_type: string;
}

export interface PocketsResponse {
  topic: string;
  summary: string;
  learning_objectives: string[];
  vocabulary: { term: string; definition: string }[];
  pockets: Pocket[];
  truncated?: boolean;
  lang?: string;
}

export interface ADHDSlide {
  index: number;
  title: string;
  bullets: string[];
  visual_hint: string;
  focus_question: string;
  timer_minutes: number;
  color_theme: "teal" | "amber" | "rose" | "violet";
}

export interface AutismSlide {
  index: number;
  heading: string;
  what: string;
  details: string[];
  why_it_matters: string;
  visual_description: string;
}

export interface TranscriptSegment {
  concept: string;
  narrative: string;
  transition: string;
}

export interface TranscribeResponse {
  script: {
    title: string;
    estimated_duration_minutes: number;
    word_count: number;
    intro: string;
    segments: TranscriptSegment[];
    outro: string;
  };
  full_text: string;
  audio_url: string | null;
  estimated_duration_minutes: number;
  word_count: number;
  topic: string;
}

export interface AgentSlidesResponse {
  job_id: string;
  slides: ADHDSlide[] | AutismSlide[] | DyslexiaSlide[];
  download_url: string;
  topic: string;
  slide_count: number;
}

export const agentRead = (fileId: string, lang: Language = "en") =>
  request<PocketsResponse>("/api/agents/read", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId, lang }),
  });

export const agentADHDSlides = (fileId: string, lang: Language = "en") =>
  request<AgentSlidesResponse>("/api/agents/adhd-slides", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId, lang }),
  });

export const agentAutismSlides = (fileId: string, lang: Language = "en") =>
  request<AgentSlidesResponse>("/api/agents/autism-slides", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId, lang }),
  });

export const agentTranscribe = (fileId: string, lang: Language = "en") =>
  request<TranscribeResponse>("/api/agents/transcribe", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId, lang }),
  });

export interface DyslexiaSlide {
  index: number;
  title: string;
  bullets: string[];
  key_phrase: string;
  visual_hint: string;
  reading_note: string;
}

export interface WorksheetItem {
  question: string;
  answer: string;
}

export interface WorksheetSection {
  title: string;
  instructions: string;
  items: WorksheetItem[];
}

export interface AgentWorksheetResponse {
  worksheet: {
    title: string;
    sections: WorksheetSection[];
    exercises: { prompt: string; space_lines: number }[];
  };
  condition: string;
  topic: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  hint: string;
  explanation: string;
}

export interface AgentQuizResponse {
  quiz: { questions: QuizQuestion[] };
  condition: string;
  topic: string;
}

export interface StudentObserverResult {
  student_id: string;
  name: string;
  condition: string;
  preferred_mode: string;
  coverage_pct: number;
  needs_attention: boolean;
  recommendation: string;
}

export interface AgentStudentObserverResponse {
  students: StudentObserverResult[];
  topic: string;
}

export interface IlmuistResponse {
  message: string;
  suggestions: string[];
  actions?: IlmAssistantAction[];
}

export type AppChatContext = {
  appPage?: "landing" | "student" | "educator";
  appContext?: string;
};

export const agentDyslexiaSlides = (fileId: string, lang: Language = "en") =>
  request<AgentSlidesResponse>("/api/agents/dyslexia-slides", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId, lang }),
  });

export const agentWorksheet = (fileId: string, condition = "general", lang: Language = "en") =>
  request<AgentWorksheetResponse>("/api/agents/worksheet", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId, condition, lang }),
  });

export const agentQuiz = (fileId: string, condition = "general", lang: Language = "en") =>
  request<AgentQuizResponse>("/api/agents/quiz", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId, condition, lang }),
  });

export const agentStudentObserver = (
  students: object[],
  sessionEvents: object[] = [],
  topic = ""
) =>
  request<AgentStudentObserverResponse>("/api/agents/student-observer", {
    method: "POST",
    body: JSON.stringify({ students, session_events: sessionEvents, topic }),
  });

export interface StudentChatActionResponse {
  action: string;
  message: string;
  payload: Record<string, unknown>;
}

export const studentChatAction = (
  fileId: string,
  action: "summarize" | "quiz" | "vocab" | "study_plan" | "focus_tip",
  lang: Language = "en",
  mood = "okay"
) =>
  request<StudentChatActionResponse>("/api/agents/student-chat-action", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId, action, lang, mood }),
  });

export type EducatorChatContext = {
  filename?: string;
  topic?: string;
  pocketCount?: number;
  generatedOutputs?: string[];
};

export const agentIlmuist = (
  message: string,
  history: { role: string; content: string }[] = [],
  fileId?: string,
  role: "teacher" | "student" = "teacher",
  lang: Language = "en",
  app?: AppChatContext
) =>
  request<IlmuistResponse>("/api/agents/ilmuist", {
    method: "POST",
    body: JSON.stringify({
      message,
      history,
      file_id: fileId,
      role,
      lang,
      app_page: app?.appPage ?? (role === "teacher" ? "educator" : "student"),
      app_context: app?.appContext ?? "",
    }),
  });

/** Educator-mode Ilm — same ILMU endpoint, richer session context */
export const agentEducatorChat = (
  message: string,
  history: { role: string; content: string }[] = [],
  opts: { fileId?: string; lang?: Language } & EducatorChatContext & AppChatContext = {}
) =>
  request<IlmuistResponse>("/api/agents/ilmuist", {
    method: "POST",
    body: JSON.stringify({
      message,
      history,
      file_id: opts.fileId,
      role: "teacher",
      lang: opts.lang ?? "en",
      filename: opts.filename,
      topic: opts.topic,
      pocket_count: opts.pocketCount,
      generated_outputs: opts.generatedOutputs ?? [],
      app_page: opts.appPage ?? "educator",
      app_context: opts.appContext ?? "",
    }),
  });

// ── Student pipeline types ─────────────────────────────────────────────────

export interface StudentADHDSlide {
  index: number;
  title: string;
  bullets: string[];
  fun_fact: string;
  mind_map_hint: string;
  visual_hint: string;
  focus_question: string;
  timer_minutes: number;
  color_theme: "teal" | "amber" | "rose" | "violet";
}

export interface StudentAutismSlide {
  index: number;
  heading: string;
  what: string;
  details: string[];
  why_it_matters: string;
  visual_description: string;
}

export interface MindmapBranch {
  label: string;
  emoji: string;
  color: string;
  subnodes: string[];
}

export interface MindmapResponse {
  mindmap: {
    topic: string;
    summary: string;
    branches: MindmapBranch[];
    fun_facts: string[];
  };
  download_url: string;
  topic: string;
  job_id: string;
}

export interface ExaminerFillBlank {
  sentence: string;
  answer: string;
  word_bank_word: string;
}

export interface ExaminerTrueFalse {
  statement: string;
  answer: boolean;
  explanation: string;
}

export interface ExaminerShortAnswer {
  prompt: string;
  hint: string;
  model_answer: string;
}

export interface ExaminerMatchIt {
  term: string;
  definition: string;
}

export interface ExaminerWorksheet {
  title: string;
  instructions: string;
  word_bank: string[];
  fill_blanks: ExaminerFillBlank[];
  true_false: ExaminerTrueFalse[];
  short_answer: ExaminerShortAnswer[];
  match_it: ExaminerMatchIt[];
  challenge: { title: string; prompt: string };
}

export interface ExaminerWorksheetResponse {
  worksheet: ExaminerWorksheet;
  topic: string;
}

// ── Student pipeline functions ─────────────────────────────────────────────

export const agentStudentADHDSlides = (fileId: string, lang: Language = "en") =>
  request<AgentSlidesResponse & { slides: StudentADHDSlide[] }>("/api/agents/student-adhd-slides", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId, lang }),
  });

export const agentStudentAutismSlides = (fileId: string, lang: Language = "en") =>
  request<AgentSlidesResponse & { slides: StudentAutismSlide[] }>("/api/agents/student-autism-slides", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId, lang }),
  });

export const agentVisualMindmap = (fileId: string, lang: Language = "en") =>
  request<MindmapResponse>("/api/agents/visual-mindmap", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId, lang }),
  });

export const agentExaminerWorksheet = (fileId: string, lang: Language = "en") =>
  request<ExaminerWorksheetResponse>("/api/agents/examiner-worksheet", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId, lang }),
  });

// ── Explain-It-Like ────────────────────────────────────────────────────────

export type ExplainStyle = "simple" | "story" | "steps" | "bullets";

export interface ExplainStyleResponse {
  style: ExplainStyle;
  title: string;
  content: string;
  condition: string;
  truncated?: boolean;
}

export const generateExplainStyle = (
  fileId: string,
  style: ExplainStyle,
  condition = "general",
  lang: Language = "en"
) =>
  request<ExplainStyleResponse>("/api/generate/explain-style", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId, style, condition, lang }),
  });

// ── Re-explain ─────────────────────────────────────────────────────────────

export interface ReexplainResponse {
  message: string;
  approach_used: string;
}

export const reexplainConcept = (
  concept: string,
  originalExplanation: string,
  condition = "general",
  lang: Language = "en",
  attempt = 1
) =>
  request<ReexplainResponse>("/api/chat/reexplain", {
    method: "POST",
    body: JSON.stringify({
      concept,
      original_explanation: originalExplanation,
      condition,
      lang,
      attempt,
    }),
  });

// ── Worksheet answer check ─────────────────────────────────────────────────

export interface CheckAnswerResponse {
  correct: boolean | "partial";
  feedback: string;
  suggestion: string;
}

export const checkAnswer = (
  question: string,
  studentAnswer: string,
  modelAnswer = "",
  hint = "",
  lang: Language = "en"
) =>
  request<CheckAnswerResponse>("/api/chat/check-answer", {
    method: "POST",
    body: JSON.stringify({
      question,
      student_answer: studentAnswer,
      model_answer: modelAnswer,
      hint,
      lang,
    }),
  });

// ── Financial Literacy ─────────────────────────────────────────────────────

export interface FinancialConcept {
  concept: string;
  explanation: string;
  example: string;
  takeaway: string;
  emoji: string;
}

export interface FinancialLiteracyResponse {
  job_id: string;
  title: string;
  concepts: FinancialConcept[];
  condition: string;
  truncated?: boolean;
}

export const generateFinancialLiteracy = (
  fileId: string,
  condition = "general",
  lang: Language = "en"
) =>
  request<FinancialLiteracyResponse>("/api/generate/financial-literacy", {
    method: "POST",
    body: JSON.stringify({ file_id: fileId, condition, lang }),
  });
