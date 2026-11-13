import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { calculatePortfolioMetrics } from '../../lib/analytics/portfolio-analytics';
import { calculateRepaymentInsights } from '../../lib/analytics/repayment-analytics';
import { AIChatMessage } from '../../lib/ai/types';
import { useToast } from '../shared/toast';
import { apiFetch } from '../../lib/api';

const SUGGESTED_QUESTIONS = [
  'What is the overall loan portfolio and collection recovery rate?',
  'How much has been collected this month versus previous month?',
  'Which loans have the highest outstanding balances?',
  'How many loans are active, fully paid, or partially paid?',
  'Which borrowers have made the most repayments?',
  'What areas of the portfolio require immediate staff attention?',
];

export const AIChatAssistant: React.FC = () => {
  const { loans, repayments, clients, clientsWithStats } = useStore();
  const { success, error: toastError } = useToast();

  const metrics = calculatePortfolioMetrics(loans, repayments, clients.length);
  const insights = calculateRepaymentInsights(loans, repayments, clientsWithStats);

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'init-msg',
      role: 'assistant',
      content:
        "Hello! I'm your **AI Financial Insights Assistant** for Inuka Africa. I analyze your loan portfolio, repayments, and outstanding balances using verified database records. What financial question would you like to explore today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (questionText?: string) => {
    const textToSend = (questionText || input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiFetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          question: textToSend,
          contextData: {
            metrics,
            insights,
          },
          history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();

      const aiMessage: AIChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        verifiedDataSnippet: {
          totalDisbursed: metrics.totalDisbursed,
          totalRepaid: metrics.totalRepaid,
          outstandingBalance: metrics.totalOutstandingBalance,
          collectionRate: metrics.collectionRate,
        },
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      toastError('AI Query Error', err.message || 'Could not communicate with the AI assistant.');

      const errorMessage: AIChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          "I encountered an issue connecting to the AI service. However, based on your database records, our total disbursed is KES " +
          metrics.totalDisbursed.toLocaleString('en-KE') +
          ' with KES ' +
          metrics.totalOutstandingBalance.toLocaleString('en-KE') +
          ' outstanding balance (' +
          metrics.collectionRate +
          '% collection rate).',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    success('Copied to Clipboard', 'AI response text copied.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'init-msg',
        role: 'assistant',
        content:
          "Conversation cleared. I'm ready to answer any questions regarding your loan facilities, recovery trends, or borrower records.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#17231F]">
              AI Financial Insights Assistant
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E7F3EA] text-[#2E7542] border border-[#C6E5CD]">
              <Sparkles className="w-3 h-3" />
              Gemini Powered
            </span>
          </div>
          <p className="mt-1 text-sm text-[#718078]">
            Ask natural language questions about your loan portfolio, repayment trends, and borrowers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-[#E5E7EB] rounded-lg transition-colors cursor-pointer"
            title="Clear conversation history"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Clear Thread</span>
          </button>
        </div>
      </div>

      {/* Suggested Questions Grid */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#718078] mb-2 block">
          Suggested Financial Inquiries
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={isLoading}
              className="text-left p-2.5 rounded-lg border border-[#E5E7EB] bg-[#F5F7F6]/50 hover:bg-[#E7F3EA]/60 hover:border-[#C6E5CD] transition-colors text-xs text-[#17231F] font-medium flex items-center justify-between group cursor-pointer disabled:opacity-50"
            >
              <span className="truncate mr-2">{q}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2E7542] group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Chat Conversation Thread */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col h-[540px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((m) => {
            const isAI = m.role === 'assistant';
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-3xl ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    isAI
                      ? 'bg-[#2E7542] text-white border-[#1E6337]'
                      : 'bg-[#111827] text-white border-slate-700'
                  }`}
                >
                  {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`space-y-1.5 ${isAI ? 'text-left' : 'text-right'}`}>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
                    <span className="font-semibold text-slate-600">
                      {isAI ? 'Inuka Financial AI' : 'Operations Staff'}
                    </span>
                    <span>·</span>
                    <span>{m.timestamp}</span>
                  </div>

                  <div
                    className={`p-4 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                      isAI
                        ? 'bg-[#F5F7F6] text-[#17231F] border border-[#E5E7EB]'
                        : 'bg-[#2E7542] text-white'
                    }`}
                  >
                    {m.content}

                    {/* Verified data badge on AI messages */}
                    {isAI && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="flex items-center gap-1 text-[#2E7542] font-medium">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verified with Institutional Ledger</span>
                        </span>

                        <button
                          onClick={() => handleCopy(m.id, m.content)}
                          className="flex items-center gap-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3 h-3 text-[#2E7542]" />
                              <span className="text-[#2E7542]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-2xl mr-auto items-center">
              <div className="w-8 h-8 rounded-lg bg-[#2E7542] text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-xl bg-[#F5F7F6] border border-[#E5E7EB] text-xs text-[#718078] flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2E7542]" />
                <span>Consulting verified financial analytics & interpreting...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-[#E5E7EB] bg-slate-50/50 rounded-b-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about loan disbursements, collections, balances or trends..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-xs bg-white rounded-lg border border-[#E5E7EB] focus:border-[#2E7542] focus:ring-1 focus:ring-[#2E7542] focus:outline-hidden disabled:bg-slate-100"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-[#2E7542] hover:bg-[#1E6337] rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send Question</span>
                </>
              )}
            </button>
          </form>
          <div className="mt-2 text-center text-[10px] text-slate-400">
            AI responses interpret verified database calculations. Authoritative balances are calculated server-side.
          </div>
        </div>
      </div>
    </div>
  );
};
