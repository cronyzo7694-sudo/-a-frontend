/**
 * API client — all backend calls go through here.
 * --------------------------------------------
 * EXTENSION POINT: Add interceptors / offline queue here
 * --------------------------------------------
 */

const API_BASE = (import.meta.env.VITE_API_URL?.trim() || "/api").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function getToken(): string | null {
  return localStorage.getItem("access_token");
}

export function setTokens(access: string, refresh?: string) {
  localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = options.method || "GET";
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  console.log(`[api] -> ${method} ${url}`);
  if (options.body && typeof options.body === "string") {
    console.log(`[api] body ${options.body}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  let data: any = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  console.log(`[api] <- ${res.status} ${method} ${url}`);
  console.log(`[api] payload ${JSON.stringify(data)}`);

  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) ||
      res.statusText ||
      "Request failed";
    if (res.status === 401) {
      // token dead — clear (router will bounce to login)
      if (!path.includes("/auth/login")) {
        clearTokens();
      }
    }
    throw new ApiError(String(msg), res.status, data);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ---------- Auth ----------
export type User = {
  id: number;
  email: string | null;
  full_name: string;
  role: "admin" | "student" | "guest";
  is_active: boolean;
  avatar_url?: string | null;
  phone?: string | null;
  is_guest?: boolean;
  auth_provider?: string | null;
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{
      user: User;
      access_token: string;
      refresh_token: string;
      message: string;
    }>("/auth/login", { email, password }),
  register: (payload: { email: string; password: string; full_name: string }) =>
    api.post<{
      user: User;
      access_token: string;
      refresh_token: string;
    }>("/auth/register", payload),
  /** Anonymous session — no email/password */
  guest: (display_name?: string) =>
    api.post<{
      user: User;
      access_token: string;
      refresh_token: string;
      message: string;
      is_guest?: boolean;
    }>("/auth/guest", display_name ? { display_name } : {}),
  /** Google Identity Services credential (ID token) */
  google: (id_token: string) =>
    api.post<{
      user: User;
      access_token: string;
      refresh_token: string;
      message: string;
    }>("/auth/google", { id_token }),
  phoneSendOtp: (phone: string) =>
    api.post<{
      message: string;
      phone_hint?: string;
      expires_in?: number;
      dev_otp?: string;
    }>("/auth/phone/send-otp", { phone }),
  phoneVerifyOtp: (phone: string, otp: string, full_name?: string) =>
    api.post<{
      user: User;
      access_token: string;
      refresh_token: string;
      message: string;
    }>("/auth/phone/verify-otp", { phone, otp, full_name }),
  methods: () =>
    api.get<{
      guest: boolean;
      email_password: boolean;
      google: boolean;
      google_client_id: string;
      phone_otp: boolean;
    }>("/auth/methods"),
  me: () => api.get<{ user: User }>("/auth/me"),
  updateMe: (data: {
    full_name?: string;
    phone?: string | null;
    avatar_url?: string | null;
    password?: string;
  }) =>
    api.put<{ message: string; user: User }>("/auth/me", data),
};

// ---------- Subjects / Chapters ----------
export type Subject = {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  icon?: string;
  color?: string;
  order_index: number;
  is_active: boolean;
  chapter_count?: number;
  question_count?: number;
};

export type Chapter = {
  id: number;
  subject_id: number;
  name: string;
  description?: string | null;
  order_index: number;
  is_active: boolean;
  question_count?: number;
  subject_name?: string;
};

export const subjectsApi = {
  list: (params?: string) =>
    api.get<{ items: Subject[]; total: number }>(`/subjects${params ? `?${params}` : ""}`),
  get: (id: number) => api.get<Subject & { chapters: Chapter[] }>(`/subjects/${id}`),
  create: (data: Partial<Subject>) => api.post<{ item: Subject }>("/subjects", data),
  update: (id: number, data: Partial<Subject>) =>
    api.put<{ item: Subject }>(`/subjects/${id}`, data),
  remove: (id: number) => api.delete(`/subjects/${id}`),
};

export const chaptersApi = {
  list: (params?: string) =>
    api.get<{ items: Chapter[]; total: number }>(`/chapters${params ? `?${params}` : ""}`),
  create: (data: Partial<Chapter> & { name: string; subject_id: number }) =>
    api.post<{ item: Chapter }>("/chapters", data),
  update: (id: number, data: Partial<Chapter>) =>
    api.put<{ item: Chapter }>(`/chapters/${id}`, data),
  remove: (id: number) => api.delete(`/chapters/${id}`),
};

// ---------- Questions ----------
export type QuestionOption = {
  id?: number;
  option_key: string;
  option_text: string;
  option_html?: string | null;
  image_url?: string | null;
  order_index?: number;
};

export type Question = {
  id: number;
  subject_id?: number | null;
  chapter_id?: number | null;
  subject_name?: string | null;
  chapter_name?: string | null;
  question_type: string;
  difficulty: string;
  question_text: string;
  question_html?: string | null;
  paragraph_text?: string | null;
  paragraph_html?: string | null;
  image_url?: string | null;
  media?: Record<string, unknown>;
  marks: number;
  negative_marks: number;
  time_seconds?: number | null;
  tags?: string[];
  language?: string;
  is_active: boolean;
  options: QuestionOption[];
  correct_answer?: string | string[];
  explanation?: string | null;
  explanation_html?: string | null;
};

export const questionsApi = {
  list: (params?: string) =>
    api.get<{ items: Question[]; total: number; page: number; per_page: number }>(
      `/questions${params ? `?${params}` : ""}`,
    ),
  get: (id: number) => api.get<Question>(`/questions/${id}?include_answer=true`),
  types: () =>
    api.get<{ question_types: string[]; difficulties: string[] }>("/questions/types"),
  create: (data: Record<string, unknown>) =>
    api.post<{ item: Question }>("/questions", data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put<{ item: Question }>(`/questions/${id}`, data),
  remove: (id: number) => api.delete(`/questions/${id}`),
};

// ---------- Exams ----------
export type ExamSection = {
  id: number;
  exam_id: number;
  title: string;
  description?: string | null;
  order_index: number;
  duration_seconds?: number | null;
  subject_id?: number | null;
  question_count?: number;
  questions?: ExamQuestion[];
};

export type ExamQuestion = {
  id: number;
  exam_id: number;
  section_id?: number | null;
  question_id: number;
  order_index: number;
  marks: number;
  negative_marks: number;
  question?: Question;
};

export type Exam = {
  id: number;
  title: string;
  description?: string | null;
  instructions?: string | null;
  exam_mode: string;
  status: string;
  duration_seconds: number;
  strict_sections: boolean;
  default_marks: number;
  default_negative_marks: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  require_fullscreen: boolean;
  max_tab_switches: number;
  show_result_immediately: boolean;
  total_questions: number;
  total_marks: number;
  parent_exam_id?: number | null;
  children?: Exam[];
  sections: ExamSection[];
  created_at?: string;
  /** Additive from Rule Engine — optional */
  resolved_rules?: ExamRulesPublic;
  rules?: ExamRulesPublic;
};

export const examsApi = {
  list: (params?: string) =>
    api.get<{ items: Exam[]; total: number }>(`/exams${params ? `?${params}` : ""}`),
  get: (id: number, includeQuestions = false) =>
    api.get<Exam>(`/exams/${id}${includeQuestions ? "?include_questions=true" : ""}`),
  create: (data: Record<string, unknown>) => api.post<{ item: Exam }>("/exams", data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put<{ item: Exam }>(`/exams/${id}`, data),
  remove: (id: number) => api.delete(`/exams/${id}`),
  addSection: (examId: number, data: Record<string, unknown>) =>
    api.post<{ item: ExamSection }>(`/exams/${examId}/sections`, data),
  updateSection: (examId: number, sectionId: number, data: Record<string, unknown>) =>
    api.put<{ item: ExamSection }>(`/exams/${examId}/sections/${sectionId}`, data),
  deleteSection: (examId: number, sectionId: number) =>
    api.delete(`/exams/${examId}/sections/${sectionId}`),
  assignQuestions: (examId: number, data: Record<string, unknown>) =>
    api.post<{ item: Exam; added: number[] }>(`/exams/${examId}/questions`, data),
  removeQuestion: (examId: number, examQuestionId: number) =>
    api.delete(`/exams/${examId}/questions/${examQuestionId}`),
  publish: (examId: number) => api.post<{ item: Exam }>(`/exams/${examId}/publish`),
  unpublish: (examId: number) => api.post<{ item: Exam }>(`/exams/${examId}/unpublish`),
  // File bank + auto test generation
  fileBankStats: () => api.get<any>("/exams/file-bank/stats"),
  reloadFileBank: () => api.post<any>("/exams/file-bank/reload", {}),
  makeTestsByAi: (examId: number) => api.post<any>(`/exams/${examId}/make-tests-by-ai`, {}),
};

// ---------- Attempts ----------
export type Attempt = {
  id: number;
  exam_id: number;
  user_id: number;
  status: string;
  started_at?: string;
  submitted_at?: string;
  expires_at?: string;
  duration_seconds: number;
  time_spent_seconds: number;
  total_questions: number;
  attempted_count: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  score: number;
  max_score: number;
  percentage: number;
  negative_marks_total: number;
  tab_switch_count: number;
  section_results?: unknown[];
  exam_title?: string;
  user_name?: string;
  current_section_index?: number;
  current_question_index?: number;
};

export type PlayerQuestion = {
  exam_question_id: number;
  question_id: number;
  order_index: number;
  marks: number;
  negative_marks: number;
  section_id?: number | null;
  question: Question;
  answer: {
    selected_answer: string | string[] | null;
    is_answered: boolean;
    is_marked_for_review: boolean;
    is_visited: boolean;
    time_spent_seconds: number;
  };
};

export type PlayerSection = {
  id: number | null;
  title: string;
  description?: string | null;
  order_index: number;
  duration_seconds?: number | null;
  questions: PlayerQuestion[];
};

/** Configuration-driven exam rules from backend Rule Engine (additive). */
export type ExamRulesPublic = {
  version?: number;
  timing?: {
    overall_seconds?: number;
    auto_submit_on_expiry?: boolean;
    allow_pause?: boolean;
    max_pauses?: number;
    section_timers?: boolean;
    section_auto_submit_on_expiry?: boolean;
    warnings?: unknown[];
  };
  sections?: {
    strict_order?: boolean;
    lock_on_complete?: boolean;
    allow_previous_section?: boolean;
    allow_next_section?: boolean;
    show_section_tabs?: boolean;
  };
  navigation?: {
    allow_skip?: boolean;
    allow_review?: boolean;
    allow_mark_for_review?: boolean;
    allow_clear_response?: boolean;
    free_question_navigation?: boolean;
    resume_allowed?: boolean;
  };
  questions?: {
    shuffle_questions?: boolean;
    shuffle_options?: boolean;
    mandatory_question_ids?: number[];
    optional_question_ids?: number[];
  };
  marking?: {
    negative_marking?: boolean;
    default_marks?: number;
    default_negative_marks?: number;
    partial_marking?: boolean;
  };
  language?: {
    allowed?: string[];
    default?: string;
    allow_switch?: boolean;
  };
  security?: {
    require_fullscreen?: boolean;
    detect_tab_switch?: boolean;
    max_tab_switches?: number;
    force_submit_on_max_tab_switches?: boolean;
    prevent_copy?: boolean;
    prevent_paste?: boolean;
    prevent_right_click?: boolean;
  };
  aids?: {
    calculator_allowed?: boolean;
    rough_sheet_allowed?: boolean;
  };
  modes?: {
    exam_mode?: string;
    show_answer_after_each?: boolean;
    show_solution_after_submit?: boolean;
    allow_multiple_attempts?: boolean;
    max_attempts_per_user?: number;
  };
  submission?: {
    confirm_before_submit?: boolean;
    warn_unanswered?: boolean;
    warn_marked_review?: boolean;
    auto_submit_on_expiry?: boolean;
  };
  result?: {
    show_immediate?: boolean;
    show_correct_answers?: boolean;
    show_explanations?: boolean;
    show_section_breakdown?: boolean;
    show_time_analysis?: boolean;
    show_percentile?: boolean;
    show_rank_prediction?: boolean;
  };
  ui?: Record<string, unknown>;
};

export type PlayerPayload = {
  attempt: Attempt;
  exam: {
    id: number;
    title: string;
    instructions?: string | null;
    duration_seconds: number;
    strict_sections: boolean;
    require_fullscreen: boolean;
    max_tab_switches: number;
    show_result_immediately: boolean;
    total_questions: number;
    total_marks: number;
    exam_mode?: string;
  };
  /** Present when backend Rule Engine is active — optional for older payloads */
  rules?: ExamRulesPublic;
  sections: PlayerSection[];
  time_remaining_seconds: number | null;
};

export type ResultPayload = {
  attempt_id: number;
  exam_id: number;
  exam_title?: string;
  status: string;
  score: number;
  max_score: number;
  percentage: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  attempted_count: number;
  total_questions: number;
  negative_marks_total: number;
  time_spent_seconds: number;
  section_results?: unknown[];
  submitted_at?: string;
};

export type AttemptAnalytics = {
  attempt_id?: number;
  accuracy?: number;
  attempt_rate?: number;
  speed_qpm?: number;
  avg_time_per_question?: number;
  median_time_per_question?: number;
  total_time_seconds?: number;
  guess_count?: number;
  guess_rate?: number;
  attempt_quality?: number;
  percentile?: number | null;
  rank_prediction?: number | null;
  peer_count?: number;
  wrong_pattern?: Record<string, number>;
  score_loss?: {
    total?: number;
    from_wrong?: number;
    from_negative?: number;
    from_skipped?: number;
  };
  weak_subjects?: Array<Record<string, unknown>>;
  strong_subjects?: Array<Record<string, unknown>>;
  weak_chapters?: Array<Record<string, unknown>>;
  by_subject?: Array<Record<string, unknown>>;
  by_section?: Array<Record<string, unknown>>;
  by_difficulty?: Record<string, Record<string, unknown>>;
  ai_coach?: {
    summary?: string;
    focus_areas?: string[];
    suggestions?: string[];
    next_best_action?: string;
  };
  suggestions?: string[];
  mistakes?: Array<Record<string, unknown>>;
  revision_queue?: Array<Record<string, unknown>>;
  question_timing?: Array<Record<string, unknown>>;
};

export const attemptsApi = {
  start: (examId: number) =>
    api.post<PlayerPayload>("/attempts/start", { exam_id: examId }),
  get: (id: number) => api.get<PlayerPayload | Attempt>(`/attempts/${id}`),
  list: (params?: string) =>
    api.get<{ items: Attempt[]; total: number }>(`/attempts${params ? `?${params}` : ""}`),
  saveAnswer: (attemptId: number, data: Record<string, unknown>) =>
    api.post(`/attempts/${attemptId}/answer`, data),
  bulkAnswers: (attemptId: number, answers: unknown[]) =>
    api.post(`/attempts/${attemptId}/answers/bulk`, { answers }),
  security: (attemptId: number, data: Record<string, unknown>) =>
    api.post(`/attempts/${attemptId}/security`, data),
  submit: (attemptId: number, data?: Record<string, unknown>) =>
    api.post<{ attempt: Attempt; result: ResultPayload; message: string }>(
      `/attempts/${attemptId}/submit`,
      data || {},
    ),
  result: (attemptId: number) => api.get<ResultPayload>(`/attempts/${attemptId}/result`),
  review: (attemptId: number) =>
    api.get<{
      result: ResultPayload;
      items: any[];
      analytics?: AttemptAnalytics;
      message?: string;
    }>(`/attempts/${attemptId}/review`),
};

// ---------- Analytics / Import / Admin ----------
export const analyticsApi = {
  dashboard: () => api.get<any>("/analytics/dashboard"),
  exam: (examId: number) => api.get<any>(`/analytics/exams/${examId}`),
  attempt: (attemptId: number) => api.get<AttemptAnalytics>(`/analytics/attempts/${attemptId}`),
};

// AI Knowledge Engine types
export type KnowledgeQuestion = {
  id: string;
  qid: string;
  raw_text: string;
  normalized_question: string;
  semantic_summary: string;
  question_text: string;
  question_type: string;
  options: { option_key: string; option_text: string; is_correct?: boolean }[];
  correct_answer: string | string[] | null;
  explanation: string | null;
  classification: {
    subject: string | null;
    chapter: string | null;
    topic: string | null;
    subtopic?: string | null;
    micro_topic?: string | null;
    concepts?: string[];
    pattern?: string | null;
    question_family?: string | null;
    bloom_taxonomy?: string | null;
    difficulty: string;
    difficulty_score?: number;
    expected_time_seconds?: number;
  };
  metadata: {
    exam_name?: string | null;
    exam_year?: number | null;
    shift?: string | null;
    source_book?: string | null;
    page_number?: number | null;
    source_type?: string;
  };
  tags: string[];
  keywords: string[];
  duplicate_info: {
    is_duplicate: boolean;
    duplicate_of: number | null;
    fingerprint_hash: string;
    semantic_hash: string;
    similarity_score: number | null;
  };
  appearance_history: any[];
  confidence_score: number;
  needs_human_review?: boolean;
  needs_review?: boolean;
  review_reasons?: string[];
  frontend_compatible?: any;
};

export type KnowledgeImportResult = {
  message: string;
  knowledge_job?: any;
  job?: any;
  total_blocks_found: number;
  questions_created: number;
  duplicates_found: number;
  needs_review: number;
  created_ids?: number[];
  duplicate_ids?: number[];
  needs_review_ids?: number[];
  errors: any[];
  success_count: number;
  error_count: number;
  duplicate_count: number;
  questions?: KnowledgeQuestion[];
  preview?: any[];
  filename?: string;
  extracted_preview?: string;
};

export const importsApi = {
  json: (payload: Record<string, unknown>) =>
    api.post<any>("/imports/questions/json", payload),
  csv: (form: FormData) => api.post<any>("/imports/questions/csv", form),
  template: () => api.get<{ content: string; filename: string }>("/imports/questions/template"),
  jobs: () => api.get<{ items: any[]; total: number }>("/imports/jobs"),
  // Knowledge Engine - Internal Brain - ANY format
  aiText: (payload: {
    raw_text: string;
    source_book?: string;
    exam_name?: string;
    exam_year?: number;
    source_type?: string;
    marks?: number;
    negative_marks?: number;
    skip_duplicates?: boolean;
    preview?: boolean;
  }) => api.post<KnowledgeImportResult>("/imports/questions/ai", payload),
  aiTextPreview: (payload: {
    raw_text: string;
    source_book?: string;
    exam_name?: string;
    source_type?: string;
  }) => api.post<KnowledgeImportResult>("/imports/questions/ai/preview", { ...payload, preview: true }),
  aiFile: (form: FormData) => api.post<KnowledgeImportResult>("/imports/questions/ai/file", form),
  knowledgeJobs: () => api.get<{ items: any[]; total: number }>("/imports/knowledge/jobs"),
  knowledgeJob: (id: number) => api.get<any>(`/imports/knowledge/jobs/${id}`),
  questionAppearances: (questionId: number) =>
    api.get<{ question_id: number; qid: string | null; items: any[]; total: number }>(
      `/imports/knowledge/question/${questionId}/appearances`
    ),
  knowledgeStats: () => api.get<any>("/imports/knowledge/reindex"),
};

export const adminApi = {
  users: (params?: string) =>
    api.get<{ items: User[]; total: number }>(`/admin/users${params ? `?${params}` : ""}`),
  createUser: (data: Record<string, unknown>) =>
    api.post<{ item: User }>("/admin/users", data),
  updateUser: (id: number, data: Record<string, unknown>) =>
    api.put<{ item: User }>(`/admin/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
};

// ---------- Platform (configuration / flags / monetization) ----------
export type PlatformPublicConfig = {
  app?: {
    name?: string;
    version?: string;
    environment?: string;
    timezone?: string;
    default_theme?: string;
    default_locale?: string;
  };
  features?: Record<string, boolean>;
  monetization?: {
    mode?: string;
    currency?: string;
    trial_days?: number;
  };
  ads?: {
    enabled?: boolean;
    provider?: string;
    client_id?: string;
    slots?: Record<string, boolean>;
    show_for_free_users?: boolean;
    hide_for_premium?: boolean;
    disable_during_exam?: boolean;
    disable_during_review?: boolean;
  };
  subscriptions?: {
    enabled?: boolean;
    plans?: Array<Record<string, unknown>>;
  };
  payments?: {
    enabled?: boolean;
    provider?: string;
    currency?: string;
  };
  localization?: {
    default?: string;
    allowed?: string[];
  };
  maintenance?: {
    enabled?: boolean;
    message?: string;
  };
  theme?: string;
};

export const platformApi = {
  config: () => api.get<PlatformPublicConfig>("/platform/config"),
  features: () => api.get<{ features: Record<string, boolean> }>("/platform/features"),
  monetization: () => api.get<Record<string, unknown>>("/platform/monetization"),
  ads: (placement = "dashboard") =>
    api.get<Record<string, unknown>>(`/platform/ads?placement=${encodeURIComponent(placement)}`),
  entitlements: () =>
    api.get<{
      plan_code?: string;
      is_premium?: boolean;
      status?: string;
      features?: string[];
      permissions?: Record<string, boolean>;
    }>("/platform/me/entitlements"),
};

export const banksApi = {
  list: () => api.get<{ items: Array<{ id: number; name: string; code?: string; question_count?: number }>; total: number }>("/banks"),
  create: (data: Record<string, unknown>) => api.post<{ item: any }>("/banks", data),
};

// ---------- Notifications ----------
export type AppNotification = {
  id: number;
  user_id?: number | null;
  category: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: string;
  status?: string;
  channels?: string[];
  created_at?: string;
  read_at?: string | null;
  is_read?: boolean;
};

export type NotificationPreferences = {
  user_id?: number;
  channels: {
    in_app: boolean;
    email: boolean;
    telegram: boolean;
    push: boolean;
    whatsapp: boolean;
    sms: boolean;
  };
  categories: {
    exam_alerts: boolean;
    result_alerts: boolean;
    reminders: boolean;
    marketing: boolean;
    system: boolean;
    security: boolean;
  };
  telegram_chat_id?: string | null;
};

export const notificationsApi = {
  list: (params?: string) =>
    api.get<{ items: AppNotification[]; total: number; unread: number; page: number }>(
      `/notifications${params ? `?${params}` : ""}`,
    ),
  unreadCount: () => api.get<{ unread: number }>("/notifications/unread-count"),
  markRead: (id: number) => api.post<{ item: AppNotification }>(`/notifications/${id}/read`, {}),
  markAllRead: () => api.post<{ count: number }>("/notifications/read-all", {}),
  getPreferences: () => api.get<NotificationPreferences>("/notifications/preferences"),
  updatePreferences: (data: Partial<NotificationPreferences> & Record<string, unknown>) =>
    api.put<{ item: NotificationPreferences }>("/notifications/preferences", data),
  adminStatus: () => api.get<Record<string, unknown>>("/notifications/admin/status"),
  adminTemplates: () =>
    api.get<{ items: Array<Record<string, unknown>>; total: number }>("/notifications/admin/templates"),
  adminBroadcast: (data: Record<string, unknown>) =>
    api.post<{ recipients: number }>("/notifications/admin/broadcast", data),
  adminHistory: (params?: string) =>
    api.get<{ items: AppNotification[]; total: number }>(
      `/notifications/admin/history${params ? `?${params}` : ""}`,
    ),
  adminProcessQueue: () => api.post<{ processed: number }>("/notifications/admin/process-queue", {}),
};
