import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudLightning, 
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
  Database, 
  ShieldCheck, 
  HelpCircle, 
  Code,
  X,
  Server
} from 'lucide-react';
import { CloudflareConfig } from '../../types';
import { CloudflareService, CLOUDFLARE_WORKER_SCRIPT } from '../../services/cloudflareService';

interface CloudflareSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged?: () => void;
}

export const CloudflareSyncModal: React.FC<CloudflareSyncModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [config, setConfig] = useState<CloudflareConfig>(CloudflareService.getConfig());
  const [activeTab, setActiveTab] = useState<'config' | 'guide' | 'code'>('config');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(CloudflareService.getConfig());
      setTestResult(null);
      setActionMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = (updates: Partial<CloudflareConfig>) => {
    const updated = CloudflareService.saveConfig(updates);
    setConfig(updated);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setActionMessage(null);
    try {
      const res = await CloudflareService.testConnection(config.workerUrl);
      setTestResult(res);
      if (res.success) {
        handleSaveConfig({ status: 'connected', lastError: undefined });
      } else {
        handleSaveConfig({ status: 'error', lastError: res.message });
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handlePushData = async () => {
    if (!config.workerUrl) {
      setActionMessage({ type: 'error', text: 'Vui lòng nhập Worker URL trước khi đồng bộ!' });
      return;
    }
    setIsSyncing(true);
    setActionMessage({ type: 'info', text: 'Đang tải toàn bộ dữ liệu lên Cloudflare KV...' });
    try {
      const res = await CloudflareService.pushDataToCloud(config);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        setConfig(CloudflareService.getConfig());
      } else {
        setActionMessage({ type: 'error', text: res.message });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullData = async () => {
    if (!config.workerUrl) {
      setActionMessage({ type: 'error', text: 'Vui lòng nhập Worker URL trước khi lấy dữ liệu!' });
      return;
    }
    if (!confirm('Tải dữ liệu từ Cloudflare sẽ cập nhật lại bài thi, tài liệu và điểm số trên máy này. Bạn có muốn tiếp tục?')) {
      return;
    }
    setIsSyncing(true);
    setActionMessage({ type: 'info', text: 'Đang kéo dữ liệu mới nhất từ Cloudflare KV...' });
    try {
      const res = await CloudflareService.pullDataFromCloud(config);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        setConfig(CloudflareService.getConfig());
        if (onDataChanged) onDataChanged();
      } else {
        setActionMessage({ type: 'error', text: res.message });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyWorkerCode = () => {
    navigator.clipboard.writeText(CLOUDFLARE_WORKER_SCRIPT);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header with Cloudflare Branding */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shadow-inner">
              <CloudLightning className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Lưu Trữ Đám Mây Cloudflare KV</h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-semibold uppercase tracking-wider">
                  Miễn Phí 100%
                </span>
              </div>
              <p className="text-xs text-orange-100 mt-0.5">
                Đồng bộ bài giảng, đề thi, câu hỏi và điểm số học sinh tức thì
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 rounded-t-lg border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'border-orange-500 bg-white text-orange-600 shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Cấu Hình Kết Nối</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2.5 rounded-t-lg border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'border-orange-500 bg-white text-orange-600 shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Hướng Dẫn 4 Bước (2 Phút)</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2.5 rounded-t-lg border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'border-orange-500 bg-white text-orange-600 shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Mã Nguồn Worker</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* TAB 1: CẤU HÌNH KẾT NỐI */}
          {activeTab === 'config' && (
            <div className="space-y-5">
              {/* Cloudflare Connection Info Card */}
              <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/80 flex items-start gap-3">
                <Database className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div className="text-xs text-orange-900 space-y-1">
                  <p className="font-bold">Ưu điểm khi kết nối Cloudflare KV (Tài khoản Free):</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-orange-800">
                    <li>Dữ liệu được lưu trữ vĩnh viễn trên mạng lưới máy chủ toàn cầu của Cloudflare.</li>
                    <li>Học sinh làm bài từ bất kỳ đâu (nhà, điện thoại, phòng máy), điểm số đều đổ về ngay.</li>
                    <li>Gói miễn phí cho phép <strong>100.000 lượt đọc/ngày</strong> và <strong>1.000 lượt ghi/ngày</strong> (hoàn toàn dư dả cho toàn trường).</li>
                  </ul>
                </div>
              </div>

              {/* Form Input URL */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-orange-600" />
                      Đường dẫn Cloudflare Worker URL
                    </span>
                    <a
                      href="https://dash.cloudflare.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-600 hover:underline flex items-center gap-1 text-[11px] font-normal"
                    >
                      Mở Cloudflare Dashboard <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://thcs-tin-hoc.yourname.workers.dev"
                      value={config.workerUrl}
                      onChange={(e) => handleSaveConfig({ workerUrl: e.target.value })}
                      className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                    />
                    <button
                      onClick={handleTestConnection}
                      disabled={isTesting || !config.workerUrl}
                      className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
                      <span>Kiểm tra</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Nhập URL của Worker sau khi bạn tạo và deploy trên Cloudflare (xem tab Hướng dẫn nếu chưa có).
                  </p>
                </div>

                {/* Optional API Secret Token */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-slate-500" />
                    Mã khóa bảo mật Worker (Tùy chọn)
                  </label>
                  <input
                    type="password"
                    placeholder="Mã bí mật xác thực (nếu Worker của bạn có cài đặt mật khẩu)"
                    value={config.apiSecret || ''}
                    onChange={(e) => handleSaveConfig({ apiSecret: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>

                {/* Toggles */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">Kích hoạt Lưu trữ Đám mây Cloudflare</div>
                      <div className="text-[11px] text-slate-500">Cho phép hệ thống sử dụng Worker để đồng bộ dữ liệu</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={(e) => handleSaveConfig({ enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                    <div>
                      <div className="text-xs font-bold text-slate-800">Tự động đồng bộ nền (Auto-Sync)</div>
                      <div className="text-[11px] text-slate-500">Tự động đẩy lên Cloudflare mỗi khi có bài làm, đề thi hoặc tài liệu mới</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.autoSync}
                        onChange={(e) => handleSaveConfig({ autoSync: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>

                {/* Test Result Message */}
                {testResult && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    testResult.success 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {testResult.success ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                    <span>{testResult.message}</span>
                  </div>
                )}

                {/* Action feedback message */}
                {actionMessage && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                    actionMessage.type === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                    'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    {actionMessage.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
                    {actionMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                    {actionMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />}
                    <span>{actionMessage.text}</span>
                  </div>
                )}

                {/* Manual Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handlePushData}
                    disabled={isSyncing || !config.workerUrl}
                    className="p-3 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Đẩy dữ liệu máy này lên Cloudflare</span>
                  </button>

                  <button
                    onClick={handlePullData}
                    disabled={isSyncing || !config.workerUrl}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    <span>Kéo dữ liệu từ Cloudflare về máy này</span>
                  </button>
                </div>

                {/* Last Sync Info */}
                {config.lastSyncedAt && (
                  <p className="text-[11px] text-slate-500 text-center">
                    Lần đồng bộ gần nhất: <span className="font-semibold text-slate-700">{new Date(config.lastSyncedAt).toLocaleString('vi-VN')}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: HƯỚNG DẪN 4 BƯỚC */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Bạn đã có tài khoản Cloudflare miễn phí?</p>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    Chỉ cần 4 bước đơn giản (khoảng 2 phút) là website đã có một máy chủ lưu trữ đám mây tốc độ cao hoàn toàn miễn phí.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                    <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Tạo một Cloudflare KV Namespace</span>
                  </div>
                  <p className="text-slate-600 ml-7 leading-relaxed">
                    1. Đăng nhập vào <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-orange-600 underline font-semibold">dash.cloudflare.com</a>.<br />
                    2. Tại menu bên trái, chọn <strong>Workers & Pages</strong> ➔ chọn <strong>KV</strong>.<br />
                    3. Bấm <strong>Create a namespace</strong> và đặt tên là: <code className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-orange-700 font-bold">THCS_DB</code>.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                    <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Tạo một Worker mới</span>
                  </div>
                  <p className="text-slate-600 ml-7 leading-relaxed">
                    1. Vào mục <strong>Workers & Pages</strong> ➔ Bấm <strong>Create Application</strong> ➔ Chọn <strong>Create Worker</strong>.<br />
                    2. Đặt tên cho Worker (ví dụ: <code className="px-1.5 py-0.5 rounded bg-slate-200 font-mono">thcs-tin-hoc-api</code>) ➔ Bấm <strong>Deploy</strong>.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                    <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px]">3</span>
                    <span>Dán mã code & Liên kết (Bind) KV</span>
                  </div>
                  <p className="text-slate-600 ml-7 leading-relaxed">
                    1. Trong trang quản lý Worker vừa tạo, bấm <strong>Edit code</strong>.<br />
                    2. Xóa hết code cũ, chuyển sang tab <strong>"Mã Nguồn Worker"</strong> trên website này, bấm sao chép và dán toàn bộ vào rồi bấm <strong>Deploy</strong>.<br />
                    3. Quay lại trang Worker ➔ Chọn tab <strong>Settings</strong> ➔ <strong>Variables</strong> ➔ tại mục <strong>KV Namespace Bindings</strong> bấm <strong>Add binding</strong>:<br />
                    &nbsp;&nbsp;• <em>Variable name</em>: <code className="font-bold text-orange-700">THCS_DB</code><br />
                    &nbsp;&nbsp;• <em>KV namespace</em>: Chọn namespace <code className="font-bold text-orange-700">THCS_DB</code> đã tạo ở Bước 1 ➔ Bấm <strong>Save and deploy</strong>.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                    <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px]">4</span>
                    <span>Copy URL Worker và kết nối</span>
                  </div>
                  <p className="text-slate-600 ml-7 leading-relaxed">
                    Copy đường dẫn Worker (dạng <code className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-blue-700">https://thcs-tin-hoc-api.yourname.workers.dev</code>), quay lại tab <strong>Cấu hình kết nối</strong> dán vào và bấm <strong>Kiểm tra</strong> ➔ <strong>Đẩy dữ liệu lên Cloudflare</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MÃ NGUỒN WORKER (COPY 1-CLICK) */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Đoạn mã JavaScript chuẩn xử lý đầy đủ CORS, API GET/POST và lưu trữ vào Cloudflare KV:
                </p>
                <button
                  onClick={handleCopyWorkerCode}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Đã sao chép!' : 'Sao chép toàn bộ mã'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-80 leading-relaxed border border-slate-800 select-all">
                  {CLOUDFLARE_WORKER_SCRIPT}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className={`w-2 h-2 rounded-full ${
              config.status === 'connected' ? 'bg-emerald-500 animate-pulse' :
              config.status === 'error' ? 'bg-rose-500' : 'bg-slate-400'
            }`} />
            <span>
              Trạng thái: {
                config.status === 'connected' ? 'Đã kết nối Cloudflare' :
                config.status === 'error' ? 'Lỗi kết nối' : 'Chưa kích hoạt'
              }
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
