import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Bot,
  User as UserIcon,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart3,
  PieChart,
  LineChart,
  Table as TableIcon,
  HelpCircle,
  Copy,
  Check,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { aiApi } from '../services/api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  type?: 'analytics' | 'action_proposal' | 'security_violation' | 'unknown';
  visualization?: any;
  actionProposal?: any;
  timestamp: string;
}


const DEMO_VOICE_QUERIES = [
  { text: 'How much did I earn today?', translation_hi: 'Aaj maine kitna kamaya?', translation_pa: 'Ajj meri kinni sale hoi?' },
  { text: 'What were my total sales this month?', translation_hi: 'Is mahine meri kitni sale hui?', translation_pa: 'Is mahine kinni sale hoyi?' },
  { text: 'Which products sold the most?', translation_hi: 'Sabse zyada kaunsa product bika?', translation_pa: 'Kehda product sab ton zyada vikeya?' },
  { text: 'Who are my top five customers?', translation_hi: 'Mere top 5 customers kaun hain?', translation_pa: 'Mere top 5 customer kehde ne?' },
  { text: 'How much payment is pending?', translation_hi: 'Kin customers ka payment pending hai?', translation_pa: 'Kinne paise lene baaki ne?' },
  { text: 'Show my expenses this month.', translation_hi: 'Is mahine ke kharche dikhao.', translation_pa: 'Is mahine de kharche dikhao.' },
  { text: 'Change Basmati rice price to 480', translation_hi: 'Basmati chawal ka daam 480 karo', translation_pa: 'Basmati chawal da rate 480 karo' },
];

export default function AskYourBusiness() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Namaste! I am your **BahiVerse AI Voice & Business Assistant**.\n\nYou can query shop performance, check today’s earnings, pending payments, or update your product catalog using English, Hindi, or Punjabi.\n\n*Try asking: "Aaj maine kitna kamaya?" or "Change Basmati rice price to 480"*',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi' | 'pa'>('en');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>(DEMO_VOICE_QUERIES);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Load query suggestions with demo fallback
  useEffect(() => {
    aiApi
      .suggestions(language)
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setSuggestions(res.data);
        } else {
          setSuggestions(DEMO_VOICE_QUERIES);
        }
      })
      .catch(() => {
        setSuggestions(DEMO_VOICE_QUERIES);
      });
  }, [language]);

  // Handle Speech Recognition
  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'pa' ? 'pa-IN' : 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiApi.query({ question: textToSend, language });

      let assistantText = response.answer;
      if (language === 'hi' && response.answer_hi) assistantText = response.answer_hi;
      if (language === 'pa' && response.answer_pa) assistantText = response.answer_pa;

      const aiMsg: Message = {
        id: 'msg-ai-' + Date.now(),
        sender: 'assistant',
        text: assistantText,
        type: response.type,
        visualization: response.visualization,
        actionProposal: response.actionProposal,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg-err-' + Date.now(),
          sender: 'assistant',
          text: `I encountered an issue processing your query: ${err.message || 'Please retry.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Confirm Controlled Write Action
  const handleConfirmAction = async (msgId: string, actionProposal: any) => {
    setLoading(true);
    try {
      const res = await aiApi.confirmAction({
        action: actionProposal.action,
        productId: actionProposal.productId,
        newPrice: Number(actionProposal.proposedValue),
      });

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === msgId) {
            return {
              ...m,
              actionProposal: {
                ...m.actionProposal,
                confirmed: true,
                confirmationMessage: res.message,
                auditNotice: res.historicalAuditNotice,
              },
            };
          }
          return m;
        })
      );
    } catch (err: any) {
      alert(`Action could not be completed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAction = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          return {
            ...m,
            actionProposal: {
              ...m.actionProposal,
              cancelled: true,
            },
          };
        }
        return m;
      })
    );
  };

  const copyTableData = (tableData: any[], idx: number) => {
    if (!tableData || tableData.length === 0) return;
    const headers = Object.keys(tableData[0]).join(',');
    const rows = tableData.map((row) => Object.values(row).join(',')).join('\n');
    navigator.clipboard.writeText(`${headers}\n${rows}`);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100">Ask Your Business</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Natural Language BI
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Query shop revenues, top products, customers, or update product catalog prices using plain speech
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-white/10 self-start md:self-auto">
          {(['en', 'hi', 'pa'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                language === lang
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'ਪੰਜਾਬੀ'}
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-medium text-slate-400 shrink-0 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" /> Suggested:
        </span>
        {suggestions.map((s, idx) => {
          const chipLabel =
            language === 'hi' && s.translation_hi
              ? s.translation_hi
              : language === 'pa' && s.translation_pa
              ? s.translation_pa
              : s.text;
          return (
            <button
              key={idx}
              onClick={() => handleSend(chipLabel)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 text-xs text-slate-300 hover:text-white transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <span>{chipLabel}</span>
              <ArrowRight className="w-3 h-3 text-cyan-400 opacity-60" />
            </button>
          );
        })}
      </div>

      {/* Main Conversational Feed */}
      <div className="bg-slate-950/80 rounded-2xl border border-white/10 shadow-2xl flex flex-col h-[600px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 space-y-3.5 shadow-lg ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white rounded-tr-none'
                    : msg.type === 'security_violation'
                    ? 'bg-red-950/40 border border-red-500/30 text-red-200 rounded-tl-none'
                    : 'bg-slate-900/90 border border-white/10 text-slate-200 rounded-tl-none'
                }`}
              >
                {/* Text Content */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </div>

                {/* Security Warning Badge */}
                {msg.type === 'security_violation' && (
                  <div className="p-3 rounded-xl bg-red-900/30 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-300">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Read-only analytics mode active. Tenant protection enforced.</span>
                  </div>
                )}

                {/* Controlled Write Action Proposal Card */}
                {msg.actionProposal && (
                  <div className="p-4 rounded-xl bg-black/40 border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                        <TrendingUp className="w-4 h-4" /> Action Proposal: Catalog Price Update
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Confirmation Required
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                        <div className="text-slate-400 text-[11px]">Product</div>
                        <div className="font-semibold text-slate-100">{msg.actionProposal.productName}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                        <div className="text-slate-400 text-[11px]">Category & Unit</div>
                        <div className="font-semibold text-slate-100">
                          {msg.actionProposal.category} • per {msg.actionProposal.unit}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                        <div className="text-slate-400 text-[11px]">Current Selling Price</div>
                        <div className="font-mono font-bold text-slate-300">
                          ₹{msg.actionProposal.currentValue}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="text-emerald-400 text-[11px]">Proposed Selling Price</div>
                        <div className="font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                          ₹{msg.actionProposal.proposedValue}
                          <span className="text-[10px] px-1 rounded bg-emerald-500/20 text-emerald-400">
                            {msg.actionProposal.percentChange}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 italic">
                      {msg.actionProposal.impactSummary}
                    </p>

                    {/* Action Execution Buttons or Confirmation State */}
                    {msg.actionProposal.confirmed ? (
                      <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-semibold">{msg.actionProposal.confirmationMessage}</div>
                          <div className="text-[10px] text-emerald-400/80">{msg.actionProposal.auditNotice}</div>
                        </div>
                      </div>
                    ) : msg.actionProposal.cancelled ? (
                      <div className="p-2.5 rounded-lg bg-white/5 text-slate-400 text-xs flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Price update cancelled. No changes were made.</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleConfirmAction(msg.id, msg.actionProposal)}
                          disabled={loading}
                          className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold text-xs transition-all shadow-glow-emerald flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Update Price
                        </button>
                        <button
                          onClick={() => handleCancelAction(msg.id)}
                          disabled={loading}
                          className="py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 font-semibold text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Dynamic Visualizations */}
                {msg.visualization && (
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                        {msg.visualization.type === 'bar' && <BarChart3 className="w-4 h-4" />}
                        {msg.visualization.type === 'line' && <LineChart className="w-4 h-4" />}
                        {msg.visualization.type === 'donut' && <PieChart className="w-4 h-4" />}
                        {msg.visualization.type === 'comparison' && <TrendingUp className="w-4 h-4" />}
                        {msg.visualization.type === 'table' && <TableIcon className="w-4 h-4" />}
                        <span>{msg.visualization.title}</span>
                      </div>

                      {msg.visualization.tableData && (
                        <button
                          onClick={() => copyTableData(msg.visualization.tableData, idx)}
                          title="Copy table data as CSV"
                          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                        >
                          {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedIndex === idx ? 'Copied' : 'Export CSV'}
                        </button>
                      )}
                    </div>

                    {/* Chart Type: Bar */}
                    {msg.visualization.type === 'bar' && (
                      <div className="space-y-2 pt-1">
                        {msg.visualization.labels.map((label: string, i: number) => {
                          const val = msg.visualization.datasets[0]?.data[i] || 0;
                          const maxVal = Math.max(...(msg.visualization.datasets[0]?.data || [1]));
                          const percent = Math.min(100, Math.round((val / (maxVal || 1)) * 100));
                          return (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-300 font-medium truncate max-w-[200px]">{label}</span>
                                <span className="font-mono font-bold text-cyan-400">
                                  ₹{val.toLocaleString('en-IN')}
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Chart Type: Line (Trend trajectory) */}
                    {msg.visualization.type === 'line' && (
                      <div className="pt-2">
                        <div className="h-32 flex items-end gap-2 border-b border-white/10 pb-2">
                          {msg.visualization.datasets[0]?.data.map((val: number, i: number) => {
                            const maxVal = Math.max(...msg.visualization.datasets[0].data);
                            const heightPercent = Math.max(15, Math.round((val / (maxVal || 1)) * 100));
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                                <div className="text-[10px] font-mono text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                  ₹{val}
                                </div>
                                <div
                                  className="w-full rounded-t-md bg-gradient-to-t from-cyan-600/30 to-cyan-400 group-hover:to-emerald-400 transition-all"
                                  style={{ height: `${heightPercent}%` }}
                                />
                                <div className="text-[10px] text-slate-400 truncate w-full text-center">
                                  {msg.visualization.labels[i]}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Chart Type: Comparison (Profit vs Procurement) */}
                    {msg.visualization.type === 'comparison' && (
                      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                        {msg.visualization.labels.map((lbl: string, i: number) => {
                          const val = msg.visualization.datasets[0]?.data[i] || 0;
                          return (
                            <div key={i} className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                              <div className="text-[11px] text-slate-400 truncate">{lbl}</div>
                              <div className="text-sm font-mono font-bold text-slate-100 mt-1">
                                ₹{val.toLocaleString('en-IN')}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Table View */}
                    {msg.visualization.tableData && msg.visualization.columns && (
                      <div className="overflow-x-auto pt-1">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-white/5 text-slate-400">
                            <tr>
                              {msg.visualization.columns.map((col: any) => (
                                <th key={col.key} className="p-2 font-semibold">
                                  {col.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {msg.visualization.tableData.map((row: any, rIdx: number) => (
                              <tr key={rIdx} className="hover:bg-white/[0.02]">
                                {msg.visualization.columns.map((col: any) => (
                                  <td key={col.key} className="p-2 font-mono text-slate-200">
                                    {row[col.key]}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 pt-1 border-t border-white/5">
                      {msg.visualization.summary}
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-slate-500 text-right">{msg.timestamp}</div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0 mt-1">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-cyan-400 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <span>Analyzing ledger records and computing business answer...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-900/90 border-t border-white/10 flex items-center gap-3">
          <button
            onClick={toggleListening}
            title={isListening ? 'Stop Listening' : 'Speak your question'}
            className={`p-2.5 rounded-xl border transition-all ${
              isListening
                ? 'bg-rose-500 text-white border-rose-400 animate-pulse shadow-glow-rose'
                : 'bg-white/5 text-slate-300 hover:text-white border-white/10 hover:bg-white/10'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              language === 'hi'
                ? 'व्यापार से संबंधित प्रश्न पूछें या भाव बदलें...'
                : language === 'pa'
                ? 'ਕਮਾਈ ਬਾਰੇ ਪੁੱਛੋ ਜਾਂ ਰੇਟ ਬਦਲੋ...'
                : 'Ask about revenue, products, top customers, or change a price...'
            }
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-glow-cyan transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
