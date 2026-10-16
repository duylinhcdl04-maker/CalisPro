import { useState, useEffect } from 'react';
import {
  Key,
  Bot,
  Volume2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Radio,
  Play,
  Trash2,
  Database,
  Cpu,
  Save,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { aiMotionApi } from '../api/aiMotionApi';
import type { AiVoiceConfigurationDto, AiVoiceCacheStatsDto } from '../types/aiMotion.types';
import { Button } from '../../../components/ui/Button';

export function VoiceConfigPanel() {
  const [config, setConfig] = useState<AiVoiceConfigurationDto | null>(null);
  const [viettelTokenInput, setViettelTokenInput] = useState('');
  const [showViettelToken, setShowViettelToken] = useState(false);
  const [showAdvancedGemini, setShowAdvancedGemini] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testPrompt, setTestPrompt] = useState('Khép bớt khuỷu tay lại, giữ thẳng lưng!');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; audioBase64?: string } | null>(null);
  const [cacheStats, setCacheStats] = useState<AiVoiceCacheStatsDto | null>(null);
  const [isClearingCache, setIsClearingCache] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [cfg, stats] = await Promise.all([
        aiMotionApi.getVoiceConfig(),
        aiMotionApi.getVoiceCacheStats(),
      ]);
      setConfig(cfg);
      setCacheStats(stats);
      if (cfg.viettelToken) {
        setViettelTokenInput(cfg.viettelToken);
      } else {
        const local = localStorage.getItem('calis_viettel_token');
        if (local) setViettelTokenInput(local);
        else setViettelTokenInput('');
      }
    } catch {
      toast.error('Không thể tải cấu hình AI Voice');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;
    setIsSaving(true);
    try {
      const payload: Partial<AiVoiceConfigurationDto> = {
        ...config,
        viettelToken: viettelTokenInput.trim(),
        // Gemini: server dùng GEMINI_API_KEY, không gửi key từ trình duyệt
        apiKey: config.provider === 'GEMINI' ? undefined : viettelTokenInput.trim(),
      };

      const updated = await aiMotionApi.saveVoiceConfig(payload);
      setConfig(updated);
      toast.success('Đã lưu cấu hình AI Voice & Token thành công!');
    } catch {
      toast.error('Lỗi khi lưu cấu hình');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTestVoice() {
    if (!testPrompt.trim()) {
      toast.warning('Vui lòng nhập văn bản thử nghiệm');
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const activeKey = config?.provider === 'VIETTEL_AI' ? viettelTokenInput.trim() : undefined;
      const res = await aiMotionApi.testVoiceConnection({
        apiKey: activeKey || undefined,
        provider: config?.provider,
        modelName: config?.modelName,
        voiceName: config?.voiceName,
        speakingRate: config?.speakingRate,
        promptText: testPrompt,
      });
      setTestResult(res);
      if (res.success) {
        toast.success(res.message);
        // If server returns real MP3 base64 or audio URL, play directly
        if (res.audioBase64) {
          const src = res.audioBase64.startsWith('data:') ? res.audioBase64 : `data:audio/mp3;base64,${res.audioBase64}`;
          const audio = new Audio(src);
          audio.play().catch(e => console.error('Audio play error:', e));
        } else if (res.audioUrl) {
          const audio = new Audio(res.audioUrl);
          audio.play().catch(e => console.error('Audio play error:', e));
        } else if (config?.provider === 'VIETTEL_AI') {
          toast.warning('Chưa nhận được luồng MP3 từ Viettel AI');
        } else if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(testPrompt);
          utterance.lang = config?.languageCode || 'vi-VN';
          utterance.rate = config?.speakingRate || 1.0;
          utterance.pitch = config?.pitch ? 1.0 + (config.pitch * 0.1) : 1.0;

          // Find best matching Vietnamese voice in browser
          const voices = window.speechSynthesis.getVoices();
          const viVoice = voices.find(v => 
            (config?.voiceName && v.name.includes(config.voiceName)) ||
            v.lang.startsWith('vi') ||
            v.name.includes('Vietnamese') ||
            v.name.includes('Tiếng Việt')
          );
          if (viVoice) {
            utterance.voice = viVoice;
          }

          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        }
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Lỗi kiểm tra kết nối');
    } finally {
      setIsTesting(false);
    }
  }

  async function handleClearCache() {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ bộ nhớ đệm âm thanh đã lưu?')) return;
    setIsClearingCache(true);
    try {
      await aiMotionApi.clearVoiceCache();
      toast.success('Đã dọn sạch Voice Warning Cache');
      const stats = await aiMotionApi.getVoiceCacheStats();
      setCacheStats(stats);
    } catch {
      toast.error('Lỗi khi xóa cache');
    } finally {
      setIsClearingCache(false);
    }
  }

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center p-12 text-text-secondary">
        <RefreshCw className="h-6 w-6 animate-spin text-accent" />
        <span className="ml-2 font-medium">Đang tải cấu hình AI Voice & Gemini Agent...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* GEMINI AGENT API KEY HIGHLIGHT BANNER */}
      <div className="rounded-3xl border-2 border-accent/40 bg-gradient-to-r from-accent/10 via-surface to-background p-6 shadow-elevated">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-white shadow-md shadow-accent/30">
              <Bot size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-text-primary">
                  Cổng kết nối AI Agent (Google Gemini Live & TTS)
                </h3>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Sẵn sàng hoạt động
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1 max-w-2xl">
                Cung cấp API Key từ Google AI Studio (Gemini) để kích hoạt hệ thống Huấn luyện viên giọng nói thời gian thực.
                Âm thanh cảnh báo sai form được sinh tự động và lưu đệm (SHA-256 Cache) giúp giảm thiểu độ trễ xuống dưới 20ms.
              </p>
            </div>
          </div>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs font-bold text-accent hover:underline flex items-center gap-1 bg-surface border border-border/80 px-3 py-2 rounded-xl"
          >
            <Key size={14} />
            Lấy Google Gemini API Key
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: API KEY & MODEL SETTINGS */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveConfig} className="rounded-3xl border border-border/80 bg-surface p-6 shadow-elevated space-y-5">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h4 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
                <Key size={18} className="text-accent" />
                Thiết lập API Key & Nhà cung cấp AI
              </h4>
              <span className="text-[11px] font-semibold text-text-secondary">
                Mã hóa an toàn tại Backend
              </span>
            </div>

            {/* Provider Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Nhà cung cấp Mô hình AI & Giọng nói (Provider)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'VIETTEL_AI', name: '🇻🇳 Viettel AI', desc: 'Khuyên dùng (Chuẩn Việt Nam 100%)' },
                  { id: 'GEMINI', name: 'Google Gemini', desc: 'Agent phân tích & HLV' },
                  { id: 'GOOGLE_CLOUD_TTS', name: 'Google Cloud TTS', desc: 'Giọng Neural2' },
                  { id: 'BROWSER_NATIVE', name: 'Web Speech API', desc: 'Trình duyệt (Offline)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const isViettel = item.id === 'VIETTEL_AI';
                      setConfig({
                        ...config,
                        provider: item.id as any,
                        voiceName: isViettel ? 'hn-quynhanh' : config.voiceName,
                        speakingRate: isViettel ? 1.0 : config.speakingRate,
                      });
                    }}
                    className={`rounded-2xl border p-3 text-left transition-all ${
                      config.provider === item.id
                        ? 'border-accent bg-accent/10 shadow-sm ring-1 ring-accent'
                        : 'border-border/70 bg-background/50 hover:border-accent/40'
                    }`}
                  >
                    <div className="text-xs font-bold text-text-primary flex items-center justify-between">
                      {item.name}
                      {config.provider === item.id && (
                        <span className="h-2 w-2 rounded-full bg-accent" />
                      )}
                    </div>
                    <div className="text-[10px] text-text-secondary mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* CREDENTIALS SECTION: INDEPENDENT INPUTS FOR VIETTEL AI & GEMINI */}
            <div className="space-y-4 rounded-2xl border border-border/60 bg-background/40 p-4">
              {/* 1. VIETTEL AI TOKEN */}
              <div className={`space-y-2 rounded-xl p-3 transition-all ${
                config.provider === 'VIETTEL_AI'
                  ? 'border border-accent/40 bg-accent/5 ring-1 ring-accent/20'
                  : 'border border-border/40 bg-background/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Key size={14} className="text-emerald-500" />
                      🇻🇳 Viettel AI Voice Token
                    </label>
                    {config.provider === 'VIETTEL_AI' && (
                      <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                        Đang làm giọng HLV
                      </span>
                    )}
                  </div>
                  {config.viettelTokenMasked && (
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                      Đã lưu: {config.viettelTokenMasked}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showViettelToken ? 'text' : 'password'}
                    placeholder="Nhập Viettel AI Token (5f113f15...)"
                    value={viettelTokenInput}
                    onChange={(e) => setViettelTokenInput(e.target.value)}
                    className="w-full rounded-xl border border-border/80 bg-background px-3 py-2.5 text-xs font-mono text-text-primary pr-10 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowViettelToken(!showViettelToken)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1 rounded-lg"
                    title={showViettelToken ? 'Ẩn token' : 'Hiện token'}
                  >
                    {showViettelToken ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-secondary">
                  <span>Dùng tổng hợp giọng nói tiếng Việt chuẩn 100% (Viettel AI TTS Open Platform).</span>
                  <a
                    href="https://viettelai.vn/dashboard/token"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline font-semibold shrink-0 ml-2"
                  >
                    Lấy Viettel Token
                  </a>
                </div>
              </div>

              {/* 2. GOOGLE GEMINI AGENT API KEY */}
              <div className={`space-y-2 rounded-xl p-3 transition-all ${
                config.provider === 'GEMINI'
                  ? 'border border-accent/40 bg-accent/5 ring-1 ring-accent/20'
                  : 'border border-border/40 bg-background/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Key size={14} className="text-accent" />
                      🤖 Google Gemini Agent API Key
                    </label>
                    {config.provider === 'GEMINI' && (
                      <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                        Đang làm AI Vision & Agent
                      </span>
                    )}
                  </div>
                </div>
                {/* Gemini key KHÔNG nhập/hiển thị ở trình duyệt: chỉ cấu hình qua biến môi trường trên server */}
                <div
                  className={`rounded-xl border px-3 py-2.5 text-xs font-mono ${
                    config.geminiApiKeyMasked?.includes('Chưa cấu hình')
                      ? 'border-amber-500/40 bg-amber-500/5 text-amber-600'
                      : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {config.geminiApiKeyMasked || 'Cấu hình qua GEMINI_API_KEY trên server'}
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-secondary">
                  <span>
                    Vì lý do bảo mật, key được đặt trong biến môi trường <code className="font-mono">GEMINI_API_KEY</code> (file{' '}
                    <code className="font-mono">backend/.env</code>) và không bao giờ gửi về trình duyệt.
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline font-semibold shrink-0 ml-2"
                  >
                    Lấy Gemini Key
                  </a>
                </div>
              </div>
            </div>

            {/* Model & Voice Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Mô hình AI / Phiên bản Engine
                </label>
                <select
                  value={config.modelName}
                  onChange={(e) => setConfig({ ...config, modelName: e.target.value })}
                  className="w-full rounded-2xl border border-border/80 bg-background px-3 py-2.5 text-xs font-medium text-text-primary focus:border-accent focus:outline-none"
                >
                  {config.provider === 'VIETTEL_AI' ? (
                    <>
                      <option value="viettel-tts-v2">Viettel AI TTS v2 (Chất lượng cao, MP3 128kbps)</option>
                      <option value="viettel-tts-ultra">Viettel AI TTS Ultra Low Latency (Thể thao & Calisthenics)</option>
                    </>
                  ) : (
                    <>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (Siêu nhanh, Latency 15ms)</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Đa ngôn ngữ, Phân tích sâu)</option>
                      <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Exp (Thế hệ mới nhất)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Giọng đọc Huấn luyện viên Tiếng Việt
                </label>
                <select
                  value={config.voiceName}
                  onChange={(e) => setConfig({ ...config, voiceName: e.target.value })}
                  className="w-full rounded-2xl border border-border/80 bg-background px-3 py-2.5 text-xs font-medium text-text-primary focus:border-accent focus:outline-none"
                >
                  {config.provider === 'VIETTEL_AI' ? (
                    <>
                      <optgroup label="🇻🇳 Giọng Chuẩn Miền Bắc (Hà Nội)">
                        <option value="hn-quynhanh">Quỳnh Anh (Nữ) - Chuẩn phát thanh, rõ ràng, truyền cảm ⭐</option>
                        <option value="hn-thaochi">Thảo Chi (Nữ) - Ấm áp, nhẹ nhàng, dễ chịu</option>
                        <option value="hn-phuongtrang">Phương Trang (Nữ) - Rõ từng góc độ, chuẩn ngữ điệu</option>
                        <option value="hn-thanhha">Thanh Hà (Nữ) - Dễ nghe, tròn vành rõ chữ</option>
                        <option value="hn-thanhtung">Thanh Tùng (Nam) - Trầm ấm, chững chạc, chỉn chu</option>
                        <option value="hn-namkhanh">Nam Khánh (Nam) - Trẻ trung, dứt khoát, thể thao</option>
                        <option value="hn-tienquan">Tiến Quân (Nam) - Đanh thép, kỷ luật thể hình</option>
                      </optgroup>
                      <optgroup label="🇻🇳 Giọng Chuẩn Miền Nam (Sài Gòn)">
                        <option value="hcm-minhquan">Minh Quân (Nam HLV) - Khỏe khoắn, phong cách HLV thể thao ⭐</option>
                        <option value="hcm-diemmy">Diễm My (Nữ) - Tươi vui, năng động, truyền động lực</option>
                        <option value="hcm-thuydung">Thùy Dung (Nữ) - Ngọt ngào, tự nhiên, gần gũi</option>
                        <option value="hcm-phuongly">Phương Ly (Nữ) - Hiện đại, nhịp nhàng</option>
                        <option value="hcm-thuyduyen">Thùy Duyên (Nữ) - Nhẹ nhàng, lưu loát</option>
                      </optgroup>
                      <optgroup label="🇻🇳 Giọng Chuẩn Miền Trung (Huế / Đà Nẵng)">
                        <option value="hue-baoquoc">Bảo Quốc (Nam) - Trầm ấm, nội lực, dứt khoát</option>
                        <option value="hue-maingoc">Mai Ngọc (Nữ) - Dịu dàng, truyền cảm</option>
                      </optgroup>
                    </>
                  ) : (
                    <>
                      <optgroup label="🇻🇳 Giọng Chuẩn Tiếng Việt (Neural2 & WaveNet)">
                        <option value="vi-VN-Neural2-A">🇻🇳 Nữ miền Bắc (Neural2-A) - Chuẩn mực, rõ ràng, truyền cảm</option>
                        <option value="vi-VN-Neural2-D">🇻🇳 Nam miền Bắc (Neural2-D) - Trầm ấm, dứt khoát, phong thái HLV</option>
                        <option value="vi-VN-Wavenet-B">🇻🇳 Nam miền Bắc (Wavenet-B) - Mạnh mẽ, động lực tập cao</option>
                        <option value="vi-VN-Wavenet-C">🇻🇳 Nữ miền Nam (Wavenet-C) - Năng động, tự nhiên, gần gũi</option>
                        <option value="vi-VN-Wavenet-D">🇻🇳 Nam miền Nam (Wavenet-D) - Hào sảng, dứt khoát, thể thao</option>
                      </optgroup>
                      <optgroup label="🤖 Gemini Multilingual HLV (Phát âm tiếng Việt chuẩn)">
                        <option value="Puck">Puck (Nam HLV) - Thể thao dứt khoát, tốc độ phản xạ cao</option>
                        <option value="Charon">Charon (Nam HLV) - Trầm ấm, điềm tĩnh, chuyên nghiệp</option>
                        <option value="Kore">Kore (Nữ HLV) - Năng lượng bùng nổ, truyền cảm hứng</option>
                        <option value="Fenrir">Fenrir (Nam HLV) - Đanh thép, kỷ luật, thúc đẩy vượt giới hạn</option>
                        <option value="Aoede">Aoede (Nữ HLV) - Nhẹ nhàng, chuẩn xác từng góc độ</option>
                      </optgroup>
                      <optgroup label="💻 Giọng Trình duyệt Nội địa (Web Speech Native)">
                        <option value="Google Tiếng Việt">Google Tiếng Việt (Tự nhiên, không phụ thuộc mạng)</option>
                        <option value="Microsoft HoaiMy Online (Natural) - Vietnamese">Microsoft Hoài My (Nữ miền Bắc tự nhiên)</option>
                        <option value="Microsoft NamMinh Online (Natural) - Vietnamese">Microsoft Nam Minh (Nam miền Bắc tự nhiên)</option>
                      </optgroup>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Speaking Rate & Pitch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-text-secondary uppercase tracking-wider">
                    {config.provider === 'VIETTEL_AI' ? 'Tốc độ giọng đọc Viettel (0.8x - 1.2x)' : 'Tốc độ nói (Rate)'}
                  </span>
                  <span className="font-bold text-accent">{config.speakingRate}x</span>
                </div>
                <input
                  type="range"
                  min={config.provider === 'VIETTEL_AI' ? "0.8" : "0.75"}
                  max={config.provider === 'VIETTEL_AI' ? "1.2" : "1.5"}
                  step={config.provider === 'VIETTEL_AI' ? "0.1" : "0.05"}
                  value={config.speakingRate}
                  onChange={(e) => setConfig({ ...config, speakingRate: parseFloat(e.target.value) })}
                  className="w-full accent-accent cursor-pointer"
                />
                {config.provider === 'VIETTEL_AI' && (
                  <div className="flex justify-between text-[10px] text-text-secondary">
                    <span>0.8x (Chậm)</span>
                    <span>1.0x (Chuẩn)</span>
                    <span>1.2x (Nhanh)</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-text-secondary uppercase tracking-wider">Định dạng file Audio</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">MP3 128kbps (Chuẩn 3)</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2.5 py-1 rounded-xl bg-background border border-border/80 text-[11px] font-mono font-bold text-text-primary">
                    TTS Return Option: 3 (MP3)
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    Độ trễ: &lt; 20ms Cache
                  </span>
                </div>
              </div>
            </div>

            {/* System Persona Instruction */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Chỉ dẫn nhân cách Huấn luyện viên (AI System Prompt)
              </label>
              <textarea
                rows={2}
                value={config.systemInstruction || ''}
                onChange={(e) => setConfig({ ...config, systemInstruction: e.target.value })}
                className="w-full rounded-2xl border border-border/80 bg-background p-3 text-xs text-text-primary focus:border-accent focus:outline-none"
                placeholder="Bạn là Huấn luyện viên thể hình Calisthenics chuyên nghiệp..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-accent hover:bg-accent-strong text-white font-bold text-xs gap-1.5 px-6"
              >
                <Save size={14} />
                {isSaving ? 'Đang lưu cấu hình...' : 'Lưu Cấu hình AI Voice'}
              </Button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE TEST LAB & CACHE STATS */}
        <div className="lg:col-span-5 space-y-6">
          {/* Test Voice Connection Card */}
          <div className="rounded-3xl border border-border/80 bg-surface p-6 shadow-elevated space-y-4">
            <div className="border-b border-border/70 pb-3">
              <h4 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
                <Volume2 size={18} className="text-emerald-500" />
                Kiểm tra Kết nối & Phát thử Giọng nói
              </h4>
              <p className="text-xs text-text-secondary mt-0.5">
                Thử nghiệm tốc độ phản hồi và âm lượng của Gemini Agent Voice.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Câu lệnh thử nghiệm (Test Prompt)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  className="flex-1 rounded-2xl border border-border/80 bg-background px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
                  placeholder="Nhập câu lệnh..."
                />
                <Button
                  size="sm"
                  onClick={handleTestVoice}
                  disabled={isTesting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shrink-0"
                >
                  <Play size={14} className={isTesting ? 'animate-spin' : ''} />
                  {isTesting ? 'Đang thử...' : 'Phát thử'}
                </Button>
              </div>
            </div>

            {testResult && (
              <div
                className={`rounded-2xl border p-4 text-xs space-y-1.5 ${
                  testResult.success
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {testResult.success ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <AlertTriangle size={16} className="text-amber-500" />
                  )}
                  <span>{testResult.success ? 'Kết nối thành công!' : 'Thông báo kiểm tra:'}</span>
                </div>
                <p className="text-[11px] leading-relaxed">{testResult.message}</p>
              </div>
            )}
          </div>

          {/* Voice Cache Statistics & Purge */}
          <div className="rounded-3xl border border-border/80 bg-surface p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h4 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
                <Database size={18} className="text-accent" />
                Bộ nhớ đệm Âm thanh (SHA-256 Cache)
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearCache}
                disabled={isClearingCache}
                className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1"
              >
                <Trash2 size={12} />
                Dọn Cache
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-border/60 bg-background/50 p-3">
                <div className="text-[10px] uppercase font-bold text-text-secondary">File Cache</div>
                <div className="text-xl font-black text-text-primary mt-1">
                  {cacheStats?.totalCachedAudios || 0}
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/50 p-3">
                <div className="text-[10px] uppercase font-bold text-text-secondary">Lượt Trúng (Hits)</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {cacheStats?.totalCacheHits || 0}
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/50 p-3">
                <div className="text-[10px] uppercase font-bold text-text-secondary">Dung lượng</div>
                <div className="text-xl font-black text-accent mt-1">
                  {Math.round(((cacheStats?.totalStorageBytes || 0) / 1024 / 1024) * 10) / 10} MB
                </div>
              </div>
            </div>

            {cacheStats?.mostFrequentPrompts && cacheStats.mostFrequentPrompts.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Cảnh báo được phát nhiều nhất
                </div>
                <div className="space-y-1.5">
                  {cacheStats.mostFrequentPrompts.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl bg-background/40 px-3 py-1.5 text-xs"
                    >
                      <span className="text-text-primary truncate pr-2 font-medium">"{item.promptText}"</span>
                      <span className="shrink-0 font-bold text-accent">{item.hitCount} hits</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
