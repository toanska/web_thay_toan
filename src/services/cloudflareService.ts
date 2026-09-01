import { CloudflareConfig } from '../types';
import { StorageService } from './storageService';

const CF_CONFIG_KEY = 'thcs_cloudflare_config_v1';

const DEFAULT_CONFIG: CloudflareConfig = {
  workerUrl: '',
  apiSecret: '',
  enabled: false,
  autoSync: false,
  status: 'idle',
};

// Full ready-to-use Cloudflare Worker JavaScript code
export const CLOUDFLARE_WORKER_SCRIPT = `/**
 * Cloudflare Worker Backend cho Website Môn Tin học - Thầy Toàn
 * Hỗ trợ lưu trữ vĩnh viễn trên Cloudflare KV hoàn toàn MIỄN PHÍ
 * 
 * Hướng dẫn Bind KV Namespace:
 * 1. Vào Cloudflare Dashboard -> Workers & Pages -> KV
 * 2. Tạo KV Namespace tên: "THCS_DB"
 * 3. Vào Worker Settings -> Variables -> KV Namespace Bindings
 *    - Variable name: THCS_DB
 *    - KV namespace: Chọn THCS_DB vừa tạo
 */

export default {
  async fetch(request, env, ctx) {
    // Cấu hình CORS cho phép website kết nối
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Api-Key",
      "Content-Type": "application/json;charset=UTF-8",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 1. Health check / Ping
      if (path === "/" || path === "/api/health" || path === "/ping") {
        return new Response(
          JSON.stringify({
            status: "ok",
            message: "Cloudflare Worker Database Môn Tin học đang hoạt động!",
            timestamp: new Date().toISOString(),
            kvBound: !!env.THCS_DB,
          }),
          { headers: corsHeaders, status: 200 }
        );
      }

      // 2. Lấy toàn bộ cơ sở dữ liệu (GET /api/database)
      if (request.method === "GET" && (path === "/api/database" || path === "/api/sync")) {
        if (!env.THCS_DB) {
          return new Response(
            JSON.stringify({ error: "Chưa cấu hình Binding KV Namespace THCS_DB trên Cloudflare" }),
            { headers: corsHeaders, status: 500 }
          );
        }

        const rawData = await env.THCS_DB.get("GLOBAL_DATABASE");
        if (!rawData) {
          return new Response(
            JSON.stringify({ empty: true, message: "Chưa có dữ liệu nào được lưu trên Cloud" }),
            { headers: corsHeaders, status: 200 }
          );
        }

        return new Response(rawData, { headers: corsHeaders, status: 200 });
      }

      // 3. Đẩy / Cập nhật toàn bộ cơ sở dữ liệu lên Cloudflare KV (POST /api/database)
      if (request.method === "POST" && (path === "/api/database" || path === "/api/sync")) {
        if (!env.THCS_DB) {
          return new Response(
            JSON.stringify({ error: "Chưa cấu hình Binding KV Namespace THCS_DB trên Cloudflare" }),
            { headers: corsHeaders, status: 500 }
          );
        }

        const body = await request.json();
        const payloadToSave = {
          ...body,
          updatedAt: new Date().toISOString(),
          source: "THCS Tin Học App",
        };

        // Lưu vào KV (Dung lượng KV hỗ trợ đến 25MB mỗi record)
        await env.THCS_DB.put("GLOBAL_DATABASE", JSON.stringify(payloadToSave));

        // Lưu bản ghi lịch sử nộp bài mới nhất
        if (body.attempts) {
          await env.THCS_DB.put("LATEST_ATTEMPTS", JSON.stringify(body.attempts));
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "Đã đồng bộ thành công lên Cloudflare KV!",
            savedAt: payloadToSave.updatedAt,
          }),
          { headers: corsHeaders, status: 200 }
        );
      }

      // 4. API Lấy kết quả thi riêng lẻ (GET /api/attempts)
      if (request.method === "GET" && path === "/api/attempts") {
        if (!env.THCS_DB) return new Response(JSON.stringify([]), { headers: corsHeaders });
        const attempts = await env.THCS_DB.get("LATEST_ATTEMPTS");
        return new Response(attempts || "[]", { headers: corsHeaders });
      }

      return new Response(
        JSON.stringify({ error: "Không tìm thấy endpoint API: " + path }),
        { headers: corsHeaders, status: 404 }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Lỗi xử lý Worker: " + err.message }),
        { headers: corsHeaders, status: 500 }
      );
    }
  },
};
`;

export const CloudflareService = {
  getConfig(): CloudflareConfig {
    try {
      const stored = localStorage.getItem(CF_CONFIG_KEY);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Error reading Cloudflare config', e);
    }
    return DEFAULT_CONFIG;
  },

  saveConfig(config: Partial<CloudflareConfig>): CloudflareConfig {
    const current = this.getConfig();
    const updated: CloudflareConfig = { ...current, ...config };
    try {
      localStorage.setItem(CF_CONFIG_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving Cloudflare config', e);
    }
    return updated;
  },

  // Format and sanitize worker URL
  cleanUrl(url: string): string {
    let cleaned = url.trim();
    if (!cleaned) return '';
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = 'https://' + cleaned;
    }
    // Remove trailing slash
    return cleaned.replace(/\/+$/, '');
  },

  // Test connection to Cloudflare Worker
  async testConnection(workerUrl?: string): Promise<{ success: boolean; message: string; data?: any }> {
    const url = this.cleanUrl(workerUrl || this.getConfig().workerUrl);
    if (!url) {
      return { success: false, message: 'Vui lòng nhập đường dẫn Cloudflare Worker URL' };
    }

    try {
      const pingUrl = `${url}/ping`;
      const res = await fetch(pingUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Mã phản hồi từ máy chủ Cloudflare: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      return {
        success: true,
        message: 'Kết nối thành công tới Cloudflare Worker!',
        data: json,
      };
    } catch (e: any) {
      console.error('Cloudflare ping failed', e);
      return {
        success: false,
        message: e?.message || 'Không thể kết nối đến Worker. Vui lòng kiểm tra lại URL hoặc cấu hình CORS.',
      };
    }
  },

  // Push local database to Cloudflare KV
  async pushDataToCloud(customConfig?: CloudflareConfig): Promise<{ success: boolean; message: string; savedAt?: string }> {
    const config = customConfig || this.getConfig();
    const url = this.cleanUrl(config.workerUrl);

    if (!url) {
      return { success: false, message: 'Chưa có cấu hình Cloudflare Worker URL' };
    }

    try {
      // Gather current local database payload
      const payload = {
        users: StorageService.getUsers(),
        questions: StorageService.getQuestions(),
        exams: StorageService.getExams(),
        attempts: StorageService.getAttempts(),
        news: StorageService.getNews(),
        materials: StorageService.getMaterials(),
        exportedAt: new Date().toISOString(),
      };

      const syncUrl = `${url}/api/database`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (config.apiSecret) {
        headers['Authorization'] = `Bearer ${config.apiSecret}`;
      }

      const res = await fetch(syncUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Lỗi từ Cloudflare (${res.status}): ${errText}`);
      }

      const result = await res.json();
      
      // Update sync state
      this.saveConfig({
        status: 'connected',
        lastSyncedAt: new Date().toISOString(),
        lastError: undefined,
      });

      return {
        success: true,
        message: 'Đã lưu và đồng bộ toàn bộ dữ liệu lên Cloudflare KV thành công!',
        savedAt: result.savedAt || new Date().toISOString(),
      };
    } catch (e: any) {
      console.error('Cloudflare push failed', e);
      this.saveConfig({
        status: 'error',
        lastError: e.message,
      });
      return {
        success: false,
        message: e.message || 'Lỗi khi gửi dữ liệu lên Cloudflare',
      };
    }
  },

  // Pull database from Cloudflare KV and apply to local storage
  async pullDataFromCloud(customConfig?: CloudflareConfig): Promise<{ success: boolean; message: string; data?: any }> {
    const config = customConfig || this.getConfig();
    const url = this.cleanUrl(config.workerUrl);

    if (!url) {
      return { success: false, message: 'Chưa có cấu hình Cloudflare Worker URL' };
    }

    try {
      const syncUrl = `${url}/api/database`;
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (config.apiSecret) {
        headers['Authorization'] = `Bearer ${config.apiSecret}`;
      }

      const res = await fetch(syncUrl, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        throw new Error(`Lỗi từ Cloudflare (${res.status}): ${res.statusText}`);
      }

      const remoteData = await res.json();

      if (remoteData.empty) {
        return {
          success: true,
          message: 'Trên Cloudflare hiện chưa có dữ liệu nào. Hãy dùng chức năng "Đẩy dữ liệu lên Cloud" trước.',
        };
      }

      // Apply imported data into localStorage
      const success = StorageService.importBackup(JSON.stringify(remoteData));
      if (!success) {
        throw new Error('Dữ liệu từ Cloudflare không đúng định dạng JSON hợp lệ');
      }

      this.saveConfig({
        status: 'connected',
        lastSyncedAt: new Date().toISOString(),
        lastError: undefined,
      });

      return {
        success: true,
        message: 'Đã tải và cập nhật toàn bộ dữ liệu mới nhất từ Cloudflare về máy!',
        data: remoteData,
      };
    } catch (e: any) {
      console.error('Cloudflare pull failed', e);
      this.saveConfig({
        status: 'error',
        lastError: e.message,
      });
      return {
        success: false,
        message: e.message || 'Lỗi khi tải dữ liệu từ Cloudflare',
      };
    }
  },

  // Automatic trigger if enabled
  triggerAutoSync(): void {
    const config = this.getConfig();
    if (config.enabled && config.autoSync && config.workerUrl) {
      // Debounced or non-blocking push
      setTimeout(() => {
        this.pushDataToCloud(config).catch(err => console.warn('AutoSync warning:', err));
      }, 1000);
    }
  }
};
