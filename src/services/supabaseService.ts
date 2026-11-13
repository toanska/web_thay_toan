import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

const SB_CONFIG_KEY = 'thcs_supabase_config_v1';
const LEGACY_CF_KEYS = ['thcs_cloudflare_d1_config_v2', 'thcs_cloudflare_config_v1'];

const ENV_SUPABASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || '';
const ENV_SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || '';

export type SupabaseTableName =
  | 'users'
  | 'questions'
  | 'exams'
  | 'attempts'
  | 'news'
  | 'materials'
  | 'notifications'
  | 'lessons';

export const SUPABASE_TABLES: SupabaseTableName[] = [
  'users',
  'questions',
  'exams',
  'attempts',
  'news',
  'materials',
  'notifications',
  'lessons',
];

const DEFAULT_CONFIG: SupabaseConfig = {
  projectUrl: ENV_SUPABASE_URL,
  anonKey: ENV_SUPABASE_ANON_KEY,
  enabled: Boolean(ENV_SUPABASE_URL && ENV_SUPABASE_ANON_KEY),
  autoSync: true,
  status: ENV_SUPABASE_URL && ENV_SUPABASE_ANON_KEY ? 'connected' : 'idle',
};

export const SUPABASE_SCHEMA_SQL = `-- ============================================================================
-- SUPABASE (POSTGRESQL) SCHEMA FOR PORTAL THCS NGO QUYEN - THAY TOAN
-- Chạy toàn bộ đoạn SQL này trong Supabase Dashboard -> SQL Editor -> Run
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  code TEXT,
  email TEXT,
  role TEXT DEFAULT 'student',
  class_name TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_code ON public.users (code);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);

CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  code TEXT,
  grade INTEGER,
  subject TEXT,
  difficulty TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_questions_grade ON public.questions (grade);

CREATE TABLE IF NOT EXISTS public.exams (
  id TEXT PRIMARY KEY,
  code TEXT,
  grade INTEGER,
  status TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exams_grade ON public.exams (grade);

CREATE TABLE IF NOT EXISTS public.attempts (
  id TEXT PRIMARY KEY,
  exam_id TEXT,
  student_id TEXT,
  student_code TEXT,
  score DOUBLE PRECISION,
  submitted_at TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attempts_submitted_at ON public.attempts (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_exam_id ON public.attempts (exam_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student_code ON public.attempts (student_code);

CREATE TABLE IF NOT EXISTS public.news (
  id TEXT PRIMARY KEY,
  category TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  published_at TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON public.news (published_at DESC);

CREATE TABLE IF NOT EXISTS public.materials (
  id TEXT PRIMARY KEY,
  grade INTEGER,
  type TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_materials_grade ON public.materials (grade);

CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  type TEXT,
  timestamp TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON public.notifications (timestamp DESC);

CREATE TABLE IF NOT EXISTS public.lessons (
  id TEXT PRIMARY KEY,
  grade TEXT,
  subject TEXT,
  semester TEXT,
  visibility TEXT DEFAULT 'public',
  views INTEGER DEFAULT 0,
  created_at TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON public.lessons (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_grade ON public.lessons (grade);

CREATE OR REPLACE FUNCTION public.increment_lesson_view(p_lesson_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.lessons
  SET
    views = COALESCE(views, 0) + 1,
    data = jsonb_set(
      data,
      '{views}',
      to_jsonb(COALESCE((data->>'views')::INTEGER, views, 0) + 1),
      true
    ),
    updated_at = NOW()
  WHERE id = p_lesson_id;
END;
$$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_lesson_view(TEXT) TO anon, authenticated;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_users" ON public.users;
CREATE POLICY "allow_all_users" ON public.users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_questions" ON public.questions;
CREATE POLICY "allow_all_questions" ON public.questions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_exams" ON public.exams;
CREATE POLICY "allow_all_exams" ON public.exams FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_attempts" ON public.attempts;
CREATE POLICY "allow_all_attempts" ON public.attempts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_news" ON public.news;
CREATE POLICY "allow_all_news" ON public.news FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_materials" ON public.materials;
CREATE POLICY "allow_all_materials" ON public.materials FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_notifications" ON public.notifications;
CREATE POLICY "allow_all_notifications" ON public.notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_lessons" ON public.lessons;
CREATE POLICY "allow_all_lessons" ON public.lessons FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);`;

let cachedClientKey = '';
let cachedClient: SupabaseClient | null = null;

function stripUndefined<T>(value: T): any {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    return value.filter((item) => item !== undefined).map(stripUndefined);
  }
  if (typeof value === 'object') {
    if (value instanceof Date) return value.toISOString();
    // Handle serialized Firestore Timestamp gracefully
    if (
      'seconds' in (value as Record<string, any>) &&
      typeof (value as Record<string, any>).seconds === 'number'
    ) {
      return new Date((value as Record<string, any>).seconds * 1000).toISOString();
    }
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out;
  }
  return value;
}

function normalizeTextTimestamp(val: any, fallback: string): string {
  if (!val) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000).toISOString();
  }
  if (typeof val?.toDate === 'function') {
    return val.toDate().toISOString();
  }
  return String(val);
}

export function isServiceRoleKey(key: string): boolean {
  const trimmed = key.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('sb_secret_')) return true;
  const parts = trimmed.split('.');
  if (parts.length === 3) {
    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payloadJson =
        typeof atob === 'function'
          ? atob(base64)
          : Buffer.from(base64, 'base64').toString('utf-8');
      const payload = JSON.parse(payloadJson);
      if (payload?.role === 'service_role') return true;
    } catch {
      // ignore non-JWT key formats
    }
  }
  return false;
}

export function buildDbRow(table: SupabaseTableName, item: Record<string, any>): Record<string, any> {
  const now = new Date().toISOString();
  const cleanData = stripUndefined(item);
  const id = String(cleanData.id);

  switch (table) {
    case 'users':
      return {
        id,
        code: cleanData.code || '',
        email: cleanData.email || '',
        role: cleanData.role || 'student',
        class_name: cleanData.className || '',
        data: cleanData,
        updated_at: now,
      };
    case 'questions':
      return {
        id,
        code: cleanData.code || '',
        grade: Number(cleanData.grade) || 9,
        subject: cleanData.subject || 'Tin học',
        difficulty: cleanData.difficulty || 'recognition',
        data: cleanData,
        updated_at: now,
      };
    case 'exams':
      return {
        id,
        code: cleanData.code || '',
        grade: Number(cleanData.grade) || 9,
        status: cleanData.status || 'active',
        is_published: cleanData.isPublished !== false,
        data: cleanData,
        updated_at: now,
      };
    case 'attempts':
      return {
        id,
        exam_id: cleanData.examId || '',
        student_id: cleanData.studentId || '',
        student_code: cleanData.studentCode || '',
        score: Number(cleanData.score) || 0,
        submitted_at: normalizeTextTimestamp(cleanData.submittedAt, now),
        data: cleanData,
        updated_at: now,
      };
    case 'news':
      return {
        id,
        category: cleanData.category || 'Thông báo chung',
        is_pinned: Boolean(cleanData.isPinned),
        published_at: normalizeTextTimestamp(cleanData.publishedAt, now),
        data: cleanData,
        updated_at: now,
      };
    case 'materials':
      return {
        id,
        grade: Number(cleanData.grade) || 9,
        type: cleanData.type || 'lecture',
        data: cleanData,
        updated_at: now,
      };
    case 'notifications':
      return {
        id,
        type: cleanData.type || 'system',
        timestamp: normalizeTextTimestamp(cleanData.timestamp, now),
        data: cleanData,
        updated_at: now,
      };
    case 'lessons':
      return {
        id,
        grade: String(cleanData.grade || '9'),
        subject: cleanData.subject || 'tin-hoc',
        semester: cleanData.semester || 'HK1',
        visibility: cleanData.visibility || 'public',
        views: Number(cleanData.views) || 0,
        created_at: normalizeTextTimestamp(cleanData.createdAt, now),
        data: cleanData,
        updated_at: now,
      };
  }
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export const SupabaseService = {
  cleanUrl(url?: string): string {
    if (!url) return '';
    let cleaned = url.trim();
    if (!cleaned) return '';
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = 'https://' + cleaned;
    }
    // Strip trailing slashes and accidental /rest/v1 suffix
    cleaned = cleaned.replace(/\/+$/, '').replace(/\/rest\/v1$/i, '');
    return cleaned;
  },

  isValidProjectUrl(url: string): boolean {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && Boolean(parsed.hostname);
    } catch {
      return false;
    }
  },

  getClient(overrideUrl?: string, overrideKey?: string): SupabaseClient | null {
    const cfg = this.getConfig();
    const url = this.cleanUrl(overrideUrl ?? cfg.projectUrl);
    const key = (overrideKey ?? cfg.anonKey ?? '').trim();

    if (!this.isValidProjectUrl(url) || !key) return null;

    const cacheKey = `${url}::${key}`;
    if (cachedClient && cachedClientKey === cacheKey) {
      return cachedClient;
    }

    cachedClientKey = cacheKey;
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    return cachedClient;
  },

  getConfig(): SupabaseConfig {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const sbUrl = params.get('sb_url');
        const sbKey = params.get('sb_key');
        if (sbUrl && sbKey) {
          const cleaned = this.cleanUrl(sbUrl);
          const trimmedKey = sbKey.trim();
          if (this.isValidProjectUrl(cleaned) && trimmedKey && !isServiceRoleKey(trimmedKey)) {
            const nextCfg: SupabaseConfig = {
              ...DEFAULT_CONFIG,
              projectUrl: cleaned,
              anonKey: trimmedKey,
              enabled: true,
              status: 'connected',
            };
            localStorage.setItem(SB_CONFIG_KEY, JSON.stringify(nextCfg));
            // Strip credentials from address bar for cleaner sharing UX
            params.delete('sb_url');
            params.delete('sb_key');
            const cleanQuery = params.toString();
            const newRelativeUrl =
              window.location.pathname + (cleanQuery ? `?${cleanQuery}` : '') + window.location.hash;
            window.history.replaceState({}, '', newRelativeUrl);
            return nextCfg;
          }
        }
      } catch {
        // ignore query parse errors
      }
    }

    if (typeof localStorage !== 'undefined') {
      try {
        LEGACY_CF_KEYS.forEach((k) => {
          if (localStorage.getItem(k)) localStorage.removeItem(k);
        });
        const stored = localStorage.getItem(SB_CONFIG_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return { ...DEFAULT_CONFIG, ...parsed };
        }
      } catch (e) {
        console.error('Error reading Supabase config:', e);
      }
    }
    return DEFAULT_CONFIG;
  },

  saveConfig(updates: Partial<SupabaseConfig>): SupabaseConfig {
    const current = this.getConfig();
    const updated: SupabaseConfig = { ...current, ...updates };
    if (updated.projectUrl) {
      updated.projectUrl = this.cleanUrl(updated.projectUrl);
    }
    if (updated.anonKey) {
      updated.anonKey = updated.anonKey.trim();
    }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(SB_CONFIG_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving Supabase config:', e);
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('thcs_supabase_config_updated', { detail: updated }));
    }
    return updated;
  },

  isConfigured(): boolean {
    const cfg = this.getConfig();
    const url = this.cleanUrl(cfg.projectUrl);
    const key = (cfg.anonKey || '').trim();
    return Boolean(cfg.enabled && this.isValidProjectUrl(url) && key && !isServiceRoleKey(key));
  },

  async testConnection(
    projectUrl?: string,
    anonKey?: string
  ): Promise<{ success: boolean; message: string; tableCounts?: Record<string, number> }> {
    const cfg = this.getConfig();
    const url = this.cleanUrl(projectUrl ?? cfg.projectUrl);
    const key = (anonKey ?? cfg.anonKey ?? '').trim();

    if (!this.isValidProjectUrl(url)) {
      return {
        success: false,
        message: 'URL Supabase không hợp lệ. Ví dụ đúng: https://abcxyz.supabase.co',
      };
    }

    if (!key) {
      return {
        success: false,
        message: 'Vui lòng nhập Project Anon Key (Publishable key) của Supabase.',
      };
    }

    if (isServiceRoleKey(key)) {
      return {
        success: false,
        message:
          'CẢNH BÁO BẢO MẬT: Đây là khóa Service Role (Secret Key), tuyệt đối không dùng trên trình duyệt! Hãy dùng khóa "anon / public" (hoặc "sb_publishable_...").',
      };
    }

    const client = this.getClient(url, key);
    if (!client) {
      return {
        success: false,
        message: 'Không thể khởi tạo kết nối Supabase client.',
      };
    }

    try {
      const checks = await Promise.all(
        SUPABASE_TABLES.map(async (table) => {
          const { count, error } = await client
            .from(table)
            .select('id', { count: 'exact', head: true });
          return { table, count: count || 0, error };
        })
      );

      const firstErr = checks.find((c) => c.error)?.error;
      if (firstErr) {
        const msg = `${firstErr.message || ''} ${firstErr.details || ''} ${firstErr.hint || ''}`.toLowerCase();
        const code = firstErr.code || '';

        if (code === 'PGRST205' || code === '42P01' || msg.includes('does not exist') || msg.includes('could not find the table')) {
          return {
            success: false,
            message:
              'Đã kết nối tới Supabase nhưng chưa có đủ 8 bảng dữ liệu! Hãy mở tab "Mã SQL Khởi Tạo", sao chép toàn bộ SQL và chạy trong Supabase Dashboard → SQL Editor → Run rồi bấm Kiểm tra lại.',
          };
        }

        if (code === '42501' || msg.includes('permission denied') || msg.includes('row-level security')) {
          return {
            success: false,
            message:
              'Bảng đã tồn tại nhưng bị chặn quyền RLS. Vui lòng chạy đầy đủ đoạn SQL (bao gồm phần GRANT & POLICY) ở tab "Mã SQL Khởi Tạo".',
          };
        }

        if (msg.includes('invalid api key') || msg.includes('jwt') || msg.includes('unauthorized') || code === 'PGRST301') {
          return {
            success: false,
            message: 'Supabase Anon Key không chính xác hoặc không khớp với Project URL.',
          };
        }

        return {
          success: false,
          message: `Lỗi kết nối Supabase: ${firstErr.message} (${code || 'unknown'})`,
        };
      }

      const tableCounts: Record<string, number> = {};
      let totalRows = 0;
      for (const c of checks) {
        tableCounts[c.table] = c.count;
        totalRows += c.count;
      }

      return {
        success: true,
        message: `Kết nối Supabase PostgreSQL thành công! Đã xác minh đủ 8/8 bảng (${totalRows} bản ghi đang lưu trữ).`,
        tableCounts,
      };
    } catch (e: any) {
      return {
        success: false,
        message: `Không thể kết nối tới máy chủ Supabase (${e?.message || 'Lỗi mạng'}). Hãy kiểm tra lại Project URL.`,
      };
    }
  },

  async getCollection<T>(table: SupabaseTableName): Promise<T[]> {
    const client = this.getClient();
    if (!client) {
      throw new Error('Supabase chưa được cấu hình.');
    }

    let query = client.from(table).select('data');
    if (table === 'attempts') query = query.order('submitted_at', { ascending: false });
    else if (table === 'news') query = query.order('published_at', { ascending: false });
    else if (table === 'notifications') query = query.order('timestamp', { ascending: false });
    else if (table === 'lessons') query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      throw new Error(`Supabase GET ${table} failed: ${error.message}`);
    }

    return (data || []).map((row: any) => row.data as T).filter(Boolean);
  },

  async upsertItem<T extends { id: string }>(table: SupabaseTableName, item: T): Promise<void> {
    const client = this.getClient();
    if (!client) return;

    const row = buildDbRow(table, item);
    const { error } = await client.from(table).upsert(row, { onConflict: 'id' });
    if (error) {
      throw new Error(`Supabase UPSERT ${table}/${item.id} failed: ${error.message}`);
    }
  },

  async deleteItem(table: SupabaseTableName, id: string): Promise<void> {
    const client = this.getClient();
    if (!client) return;

    const { error } = await client.from(table).delete().eq('id', id);
    if (error) {
      throw new Error(`Supabase DELETE ${table}/${id} failed: ${error.message}`);
    }
  },

  async incrementLessonView(lessonId: string): Promise<void> {
    const client = this.getClient();
    if (!client) return;

    const { error } = await client.rpc('increment_lesson_view', { p_lesson_id: lessonId });
    if (error) {
      // Fallback if RPC function was not installed: read and update
      const { data } = await client.from('lessons').select('data').eq('id', lessonId).maybeSingle();
      if (data?.data) {
        const updated = { ...data.data, views: (Number(data.data.views) || 0) + 1 };
        await this.upsertItem('lessons', updated);
      }
    }
  },

  async fetchDatabase(): Promise<Record<SupabaseTableName, any[]> | null> {
    const client = this.getClient();
    if (!client) return null;

    const [users, questions, exams, attempts, news, materials, notifications, lessons] = await Promise.all([
      this.getCollection('users'),
      this.getCollection('questions'),
      this.getCollection('exams'),
      this.getCollection('attempts'),
      this.getCollection('news'),
      this.getCollection('materials'),
      this.getCollection('notifications'),
      this.getCollection('lessons'),
    ]);

    return { users, questions, exams, attempts, news, materials, notifications, lessons };
  },

  async pushDatabase(
    payload: Partial<Record<SupabaseTableName, any[]>>,
    overrideUrl?: string,
    overrideKey?: string
  ): Promise<{ success: boolean; upsertedCount: number; message: string; savedAt: string }> {
    const client = this.getClient(overrideUrl, overrideKey);
    if (!client) {
      throw new Error('Chưa cấu hình đầy đủ Supabase Project URL và Anon Key.');
    }

    let upsertedCount = 0;

    for (const table of SUPABASE_TABLES) {
      const items = payload[table];
      if (!Array.isArray(items) || items.length === 0) continue;

      const validRows = items
        .filter((item) => item && item.id)
        .map((item) => buildDbRow(table, item));

      if (validRows.length === 0) continue;

      for (const batch of chunkArray(validRows, 200)) {
        const { error } = await client.from(table).upsert(batch, { onConflict: 'id' });
        if (error) {
          throw new Error(`Lỗi ghi bảng ${table}: ${error.message}`);
        }
        upsertedCount += batch.length;
      }
    }

    const savedAt = new Date().toISOString();
    return {
      success: true,
      upsertedCount,
      message: `Đã lưu thành công ${upsertedCount} bản ghi lên Supabase PostgreSQL!`,
      savedAt,
    };
  },

  async pushDataToCloud(
    customConfig?: SupabaseConfig
  ): Promise<{ success: boolean; message: string; savedAt?: string }> {
    const config = customConfig ? this.saveConfig(customConfig) : this.getConfig();
    if (!this.isValidProjectUrl(this.cleanUrl(config.projectUrl)) || !config.anonKey?.trim()) {
      return { success: false, message: 'Vui lòng nhập đầy đủ Supabase URL và Anon Key!' };
    }

    try {
      const test = await this.testConnection(config.projectUrl, config.anonKey);
      if (!test.success) {
        this.saveConfig({ status: 'error', lastError: test.message });
        return { success: false, message: test.message };
      }

      const { StorageService } = await import('./storageService');
      const payload = StorageService.getDatabasePayload();
      const result = await this.pushDatabase(payload, config.projectUrl, config.anonKey);

      this.saveConfig({
        enabled: true,
        status: 'connected',
        lastSyncedAt: result.savedAt,
        lastError: undefined,
        syncCount: (config.syncCount || 0) + 1,
      });

      return {
        success: true,
        message: result.message,
        savedAt: result.savedAt,
      };
    } catch (e: any) {
      const msg = e?.message || 'Lỗi đẩy dữ liệu lên Supabase PostgreSQL.';
      this.saveConfig({ status: 'error', lastError: msg });
      return { success: false, message: msg };
    }
  },

  async pullDataFromCloud(
    customConfig?: SupabaseConfig
  ): Promise<{ success: boolean; message: string; data?: any }> {
    const config = customConfig ? this.saveConfig(customConfig) : this.getConfig();
    if (!this.isValidProjectUrl(this.cleanUrl(config.projectUrl)) || !config.anonKey?.trim()) {
      return { success: false, message: 'Vui lòng nhập đầy đủ Supabase URL và Anon Key!' };
    }

    try {
      const test = await this.testConnection(config.projectUrl, config.anonKey);
      if (!test.success) {
        this.saveConfig({ status: 'error', lastError: test.message });
        return { success: false, message: test.message };
      }

      this.saveConfig({ enabled: true, status: 'connected' });
      const remoteData = await this.fetchDatabase();
      if (!remoteData) {
        return { success: false, message: 'Không thể đọc dữ liệu từ Supabase.' };
      }

      const { StorageService } = await import('./storageService');
      await StorageService.importBackup(JSON.stringify(remoteData), false);

      this.saveConfig({
        enabled: true,
        status: 'connected',
        lastSyncedAt: new Date().toISOString(),
        lastError: undefined,
        syncCount: (config.syncCount || 0) + 1,
      });

      return {
        success: true,
        message: 'Đã tải toàn bộ dữ liệu mới nhất từ Supabase PostgreSQL về máy!',
        data: remoteData,
      };
    } catch (e: any) {
      const msg = e?.message || 'Lỗi tải dữ liệu từ Supabase.';
      this.saveConfig({ status: 'error', lastError: msg });
      return { success: false, message: msg };
    }
  },

  forceClearLocalStorage(): void {
    if (typeof localStorage === 'undefined') return;
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('thcs_') && key !== SB_CONFIG_KEY) {
        localStorage.removeItem(key);
      }
    });
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    window.location.reload();
  },
};
