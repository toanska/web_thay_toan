import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  ExternalLink,
  Key,
  Globe,
  ShieldCheck,
  HelpCircle,
  Code,
  X,
  Server,
  Link2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { SupabaseConfig } from '../../types';
import { SupabaseService, SUPABASE_SCHEMA_SQL } from '../../services/supabaseService';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged?: () => void;
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [config, setConfig] = useState<SupabaseConfig>(SupabaseService.getConfig());
  const [activeTab, setActiveTab] = useState<'config' | 'guide' | 'sql'>('config');
  const [showKey, setShowKey] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [copiedEnvVars, setCopiedEnvVars] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [confirmPull, setConfirmPull] = useState(false);
  const [confirmClearLocal, setConfirmClearLocal] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    tableCounts?: Record<string, number>;
  } | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(SupabaseService.getConfig());
      setTestResult(null);
      setActionMessage(null);
      setConfirmPull(false);
      setConfirmClearLocal(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanedUrl = SupabaseService.cleanUrl(config.projectUrl);
  const trimmedKey = (config.anonKey || '').trim();
  const hasCredentials = SupabaseService.isValidProjectUrl(cleanedUrl) && Boolean(trimmedKey);
  const isSupabaseActive = Boolean(
    config.enabled && hasCredentials && config.status === 'connected'
  );

  const studentShareUrl =
    typeof window !== 'undefined' && hasCredentials
      ? `${window.location.origin}/?sb_url=${encodeURIComponent(cleanedUrl)}&sb_key=${encodeURIComponent(trimmedKey)}`
      : '';

  const envSnippet = hasCredentials
    ? `VITE_SUPABASE_URL=${cleanedUrl}\nVITE_SUPABASE_ANON_KEY=${trimmedKey}`
    : '';

  const handleSaveConfig = (updates: Partial<SupabaseConfig>) => {
    const updated = SupabaseService.saveConfig(updates);
    setConfig(updated);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setActionMessage(null);
    try {
      const res = await SupabaseService.testConnection(config.projectUrl, config.anonKey);
      setTestResult(res);
      if (res.success) {
        handleSaveConfig({ status: 'connected', enabled: true, lastError: undefined });
      } else {
        handleSaveConfig({ status: 'error', lastError: res.message });
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handlePushData = async () => {
    if (!hasCredentials) {
      setActionMessage({
        type: 'error',
        text: 'Vui lòng nhập đầy đủ Supabase Project URL và Anon Key trước!',
      });
      return;
    }
    setIsSyncing(true);
    setActionMessage({
      type: 'info',
      text: 'Đang kiểm tra 8 bảng và đẩy toàn bộ tài khoản, câu hỏi, đề thi, bài nộp, bài giảng lên Supabase...',
    });
    try {
      const res = await SupabaseService.pushDataToCloud({ ...config, enabled: true });
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        setConfig(SupabaseService.getConfig());
      } else {
        setActionMessage({ type: 'error', text: res.message });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullData = async () => {
    if (!hasCredentials) {
      setActionMessage({
        type: 'error',
        text: 'Vui lòng nhập đầy đủ Supabase Project URL và Anon Key trước!',
      });
      return;
    }
    setConfirmPull(false);
    setIsSyncing(true);
    setActionMessage({
      type: 'info',
      text: 'Đang tải toàn bộ dữ liệu mới nhất từ Supabase PostgreSQL...',
    });
    try {
      const res = await SupabaseService.pullDataFromCloud({ ...config, enabled: true });
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        setConfig(SupabaseService.getConfig());
        if (onDataChanged) onDataChanged();
      } else {
        setActionMessage({ type: 'error', text: res.message });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCopyShareLink = () => {
    if (!studentShareUrl) return;
    navigator.clipboard.writeText(studentShareUrl);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  const handleCopyEnvVars = () => {
    if (!envSnippet) return;
    navigator.clipboard.writeText(envSnippet);
    setCopiedEnvVars(true);
    setTimeout(() => setCopiedEnvVars(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shadow-inner">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold">Cơ Sở Dữ Liệu Supabase (PostgreSQL)</h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-white text-[10px] font-bold uppercase tracking-wider shadow-xs flex items-center gap-1 ${
                    isSupabaseActive ? 'bg-emerald-500' : 'bg-slate-800/70'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full bg-white ${isSupabaseActive ? 'animate-pulse' : ''}`}
                  />
                  {isSupabaseActive ? 'Đã Kết Nối' : 'Chưa Kết Nối'}
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                Không giới hạn lượt đọc & lượt ghi API — PostgreSQL 500 MB miễn phí cho toàn trường
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 rounded-t-lg border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'config'
                ? 'border-emerald-600 bg-white text-emerald-700 shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Cấu Hình Supabase</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2.5 rounded-t-lg border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-emerald-600 bg-white text-emerald-700 shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Hướng Dẫn 4 Bước</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2.5 rounded-t-lg border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sql'
                ? 'border-emerald-600 bg-white text-emerald-700 shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Mã SQL Khởi Tạo (8 Bảng)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: CONFIG */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              {/* Status Banner */}
              {isSupabaseActive ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 space-y-1 flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="font-bold text-sm text-emerald-800">
                        Supabase PostgreSQL đang hoạt động làm CSDL chính
                      </p>
                      {config.syncCount !== undefined && config.syncCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                          Đã đồng bộ {config.syncCount} lần
                        </span>
                      )}
                    </div>
                    <p className="text-emerald-800 leading-relaxed">
                      Toàn bộ dữ liệu đăng nhập, ngân hàng câu hỏi, đề thi, bài nộp, tin tức, tài liệu và bài giảng đều đọc/ghi trực tiếp vào PostgreSQL trên Supabase không bị giới hạn lượt mỗi ngày.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 space-y-1 flex-1">
                    <p className="font-bold text-sm text-amber-800">
                      Chưa kết nối Supabase (đang chạy bộ nhớ đệm cục bộ / Firebase dự phòng)
                    </p>
                    <p className="text-amber-800 leading-relaxed">
                      Xem tab <strong>Hướng Dẫn 4 Bước</strong> để tạo dự án Supabase miễn phí và chạy đoạn mã SQL khởi tạo 8 bảng, sau đó điền Project URL + Anon Key bên dưới.
                    </p>
                  </div>
                </div>
              )}

              {/* Benefits Card */}
              <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 flex items-start gap-3">
                <Database className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div className="text-xs text-teal-900 space-y-1">
                  <p className="font-bold">Ưu điểm của Supabase (PostgreSQL Free):</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-teal-800">
                    <li>
                      <strong>Không giới hạn số lượt đọc & lượt ghi API mỗi ngày</strong> — không bao giờ gặp lỗi hết quota khi cả trường thi cùng lúc.
                    </li>
                    <li>
                      <strong>500 MB PostgreSQL</strong> chính thống, xem và sửa từng dòng dữ liệu trực tiếp trong Table Editor.
                    </li>
                    <li>
                      Chạy toàn bộ 8 bảng song song, hỗ trợ Row Level Security (RLS) và hàm đếm lượt xem atomic.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Project URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    Supabase Project URL
                  </span>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 hover:underline flex items-center gap-1 text-[11px] font-normal"
                  >
                    Mở Supabase Dashboard <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <input
                  type="url"
                  placeholder="https://xxxxxxxxxxxx.supabase.co"
                  value={config.projectUrl}
                  onChange={(e) => handleSaveConfig({ projectUrl: e.target.value, status: 'idle' })}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              {/* Anon Public Key */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-emerald-600" />
                  Supabase Anon / Public Key (Tuyệt đối không dán Service Role Secret)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showKey ? 'text' : 'password'}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... hoặc sb_publishable_..."
                      value={config.anonKey}
                      onChange={(e) => handleSaveConfig({ anonKey: e.target.value, status: 'idle' })}
                      className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title={showKey ? 'Ẩn key' : 'Hiện key'}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting || !config.projectUrl || !config.anonKey}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    {isTesting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>Kiểm tra</span>
                  </button>
                </div>
              </div>

              {/* Toggle Enabled */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Sử dụng Supabase (PostgreSQL) làm CSDL chính thức
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Mọi thao tác đọc/ghi của giáo viên & học sinh đi trực tiếp qua Supabase thay cho Firebase
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => handleSaveConfig({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                </label>
              </div>

              {/* Test Result & Table Counts */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs space-y-2 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {testResult.success ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{testResult.message}</span>
                  </div>
                  {testResult.success && testResult.tableCounts && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                      {Object.entries(testResult.tableCounts).map(([tbl, cnt]) => (
                        <div
                          key={tbl}
                          className="px-2 py-1 rounded-lg bg-white border border-emerald-200 flex items-center justify-between text-[11px]"
                        >
                          <span className="font-mono text-slate-600">{tbl}</span>
                          <span className="font-bold text-emerald-700">{cnt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Message */}
              {actionMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    actionMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : actionMessage.type === 'error'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}
                >
                  {actionMessage.type === 'success' && (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  {actionMessage.type === 'error' && (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  {actionMessage.type === 'info' && (
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                  )}
                  <span>{actionMessage.text}</span>
                </div>
              )}

              {/* Push / Pull Actions */}
              <div className="pt-1 space-y-2.5">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Di chuyển & đồng bộ toàn bộ dữ liệu sang Supabase
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handlePushData}
                    disabled={isSyncing || !hasCredentials}
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Đẩy toàn bộ dữ liệu lên Supabase</span>
                  </button>

                  {!confirmPull ? (
                    <button
                      onClick={() => setConfirmPull(true)}
                      disabled={isSyncing || !hasCredentials}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <DownloadCloud className="w-4 h-4" />
                      <span>Tải dữ liệu từ Supabase về máy</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePullData}
                        disabled={isSyncing}
                        className="flex-1 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                      >
                        Xác nhận tải về
                      </button>
                      <button
                        onClick={() => setConfirmPull(false)}
                        className="px-3 p-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Student Auto-Connect & Vercel Env Section */}
              {hasCredentials && (
                <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <Link2 className="w-4 h-4 text-blue-600" />
                    <span>Cấu hình tự kết nối cho toàn bộ Học sinh & Vercel</span>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    1. <strong>Cách chuẩn nhất (Cố định cho mọi học sinh):</strong> Copy 2 dòng dưới đây dán vào{' '}
                    <strong>Vercel → Settings → Environment Variables</strong> rồi Redeploy:
                  </p>
                  <div className="flex gap-2 items-start">
                    <pre className="flex-1 px-2.5 py-1.5 text-[11px] rounded-lg bg-slate-900 text-emerald-300 font-mono overflow-x-auto">
                      {envSnippet}
                    </pre>
                    <button
                      onClick={handleCopyEnvVars}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedEnvVars ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedEnvVars ? 'Đã chép' : 'Chép Env'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    2. <strong>Hoặc gửi link tự kết nối nhanh</strong> (học sinh bấm vào link 1 lần là trình duyệt tự lưu kết nối Supabase):
                  </p>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      readOnly
                      value={studentShareUrl}
                      className="flex-1 px-2.5 py-1.5 text-[11px] rounded-lg bg-white border border-blue-200 font-mono text-slate-700"
                    />
                    <button
                      onClick={handleCopyShareLink}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedShareLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedShareLink ? 'Đã chép' : 'Chép link'}</span>
                    </button>
                  </div>
                </div>
              )}

              {config.lastSyncedAt && (
                <p className="text-[11px] text-slate-500 text-center">
                  Lần đồng bộ gần nhất:{' '}
                  <span className="font-semibold text-slate-700">
                    {new Date(config.lastSyncedAt).toLocaleString('vi-VN')}
                  </span>
                </p>
              )}

              {/* Clear Local Cache */}
              <div className="pt-3 border-t border-slate-200">
                {!confirmClearLocal ? (
                  <button
                    onClick={() => setConfirmClearLocal(true)}
                    className="w-full p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-rose-200"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Xóa bộ nhớ đệm cục bộ & Tải lại trang</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                    <p className="text-xs font-semibold text-rose-800">
                      Xác nhận xóa bộ nhớ tạm trình duyệt và tải lại từ Supabase? (Dữ liệu trên Supabase được giữ nguyên)
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => SupabaseService.forceClearLocalStorage()}
                        className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                      >
                        Đồng ý xóa & Tải lại
                      </button>
                      <button
                        onClick={() => setConfirmClearLocal(false)}
                        className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: 4-STEP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Hướng dẫn tạo CSDL Supabase (PostgreSQL) miễn phí trong 3 phút</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Không cần thẻ tín dụng, không giới hạn số lượt đọc/ghi API hằng ngày.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>Tạo Project mới trên Supabase</span>
                  </div>
                  <p className="text-slate-600 ml-7 leading-relaxed">
                    1. Truy cập{' '}
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 underline font-semibold"
                    >
                      supabase.com/dashboard
                    </a>{' '}
                    và đăng nhập bằng tài khoản GitHub/Google.<br />
                    2. Bấm <strong>New Project</strong> → đặt tên (VD: <code className="px-1 bg-slate-200 rounded">thcs-ngoquyen-tinhoc</code>).<br />
                    3. Chọn Region là <strong>Southeast Asia (Singapore)</strong> để truy cập tại Việt Nam nhanh nhất → bấm <strong>Create new project</strong> (chờ ~1 phút khởi tạo).
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>Chạy mã SQL khởi tạo 8 bảng PostgreSQL</span>
                  </div>
                  <p className="text-slate-600 ml-7 leading-relaxed">
                    1. Chuyển sang tab <strong>"Mã SQL Khởi Tạo (8 Bảng)"</strong> ngay trên hộp thoại này và bấm <strong>Sao chép SQL</strong>.<br />
                    2. Trên Supabase Dashboard, chọn mục <strong>SQL Editor</strong> ở menu trái → bấm <strong>New query</strong> → dán toàn bộ SQL vào → bấm nút <strong>Run</strong> (góc dưới phải) đến khi báo <em>Success</em>.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      3
                    </span>
                    <span>Lấy Project URL và Anon Key</span>
                  </div>
                  <p className="text-slate-600 ml-7 leading-relaxed">
                    1. Vào <strong>Project Settings</strong> (biểu tượng bánh răng) → chọn <strong>Data API</strong> / <strong>API Keys</strong>.<br />
                    2. Copy <strong>Project URL</strong> (dạng <code className="px-1 bg-slate-200 rounded font-mono">https://xxxx.supabase.co</code>).<br />
                    3. Copy khóa <strong>anon / public</strong> (hoặc <strong>Publishable key</strong>). <em>Lưu ý: không dùng khóa secret / service_role.</em>
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      4
                    </span>
                    <span>Kiểm tra kết nối & Đẩy dữ liệu</span>
                  </div>
                  <p className="text-slate-600 ml-7 leading-relaxed">
                    Quay lại tab <strong>Cấu Hình Supabase</strong>, dán 2 thông tin vừa copy → bấm <strong>Kiểm tra</strong> (xác nhận đủ 8/8 bảng) → bấm <strong>Đẩy toàn bộ dữ liệu lên Supabase</strong>. Sau đó gắn 2 biến môi trường lên Vercel hoặc gửi link cho học sinh.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SQL SCHEMA */}
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-slate-600">
                  Sao chép toàn bộ đoạn SQL này và chạy 1 lần duy nhất trong <strong>Supabase → SQL Editor</strong>:
                </p>
                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Đã sao chép SQL!' : 'Sao chép SQL'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-96 leading-relaxed border border-slate-800 select-all">
                {SUPABASE_SCHEMA_SQL}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span
              className={`w-2 h-2 rounded-full ${
                isSupabaseActive
                  ? 'bg-emerald-500 animate-pulse'
                  : config.status === 'error'
                  ? 'bg-rose-500'
                  : 'bg-slate-400'
              }`}
            />
            <span>
              Trạng thái:{' '}
              {isSupabaseActive
                ? 'Đã kết nối Supabase PostgreSQL'
                : config.status === 'error'
                ? 'Lỗi kết nối Supabase'
                : 'Chưa kích hoạt Supabase'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
