import React, { useState, useEffect } from 'react';
import { Database, Copy, Check, ShieldCheck, Code, FileCode, CheckCircle2 } from 'lucide-react';
import { useToast } from '../shared/toast';

export const DatabaseSchemaView: React.FC = () => {
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<'sql' | 'prisma'>('sql');
  const [schemaData, setSchemaData] = useState<{
    engine: string;
    database: string;
    sqlSchema: string;
    prismaSchema: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/database/schema')
      .then((res) => res.json())
      .then((data) => setSchemaData(data))
      .catch((err) => console.error('Failed to load schema', err));
  }, []);

  const handleCopy = () => {
    const text = activeTab === 'sql' ? schemaData?.sqlSchema : schemaData?.prismaSchema;
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      success('Copied Schema', `${activeTab.toUpperCase()} schema definition copied to clipboard.`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#17231F]">
              MySQL Database & Prisma Schema
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E7F3EA] text-[#287A46] border border-[#C6E5CD]">
              <Database className="w-3 h-3" />
              MySQL 8.0+ / InnoDB
            </span>
          </div>
          <p className="mt-1 text-sm text-[#718078]">
            Relational database models, decimal currency constraints, index strategies, and foreign-key integrity.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-[#E5E7EB] rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-[#287A46]" />
              <span className="text-[#287A46]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-500" />
              <span>Copy Schema</span>
            </>
          )}
        </button>
      </div>

      {/* Relational Architecture Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-[#17231F] mb-1">
            <ShieldCheck className="w-4 h-4 text-[#287A46]" />
            <span>Monetary Precision</span>
          </div>
          <p className="text-xs text-[#718078]">
            Enforces strict <code className="text-[#287A46] font-mono font-semibold">DECIMAL(12,2)</code> data types on loans and repayments to prevent floating-point discrepancies.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-[#17231F] mb-1">
            <Database className="w-4 h-4 text-[#287A46]" />
            <span>Referential Integrity</span>
          </div>
          <p className="text-xs text-[#718078]">
            Foreign keys on <code className="text-[#287A46] font-mono">loans.client_id</code> and <code className="text-[#287A46] font-mono">repayments.loan_id</code> with <code className="text-slate-800 font-mono">ON DELETE RESTRICT</code> to protect audit trails.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-[#17231F] mb-1">
            <CheckCircle2 className="w-4 h-4 text-[#287A46]" />
            <span>Index Optimization</span>
          </div>
          <p className="text-xs text-[#718078]">
            Unique B-tree indexes on <code className="font-mono">client_number</code>, <code className="font-mono">loan_reference</code>, and <code className="font-mono">payment_reference</code>.
          </p>
        </div>
      </div>

      {/* Schema Code Tabs */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] bg-[#F5F7F6]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('sql')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'sql'
                  ? 'bg-white text-[#287A46] shadow-xs border border-[#E5E7EB]'
                  : 'text-[#718078] hover:text-[#17231F]'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>MySQL DDL (schema.sql)</span>
            </button>
            <button
              onClick={() => setActiveTab('prisma')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'prisma'
                  ? 'bg-white text-[#287A46] shadow-xs border border-[#E5E7EB]'
                  : 'text-[#718078] hover:text-[#17231F]'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Prisma Schema (schema.prisma)</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            {activeTab === 'sql' ? 'Engine: InnoDB · Charset: utf8mb4' : 'Provider: mysql · Client: prisma-client-js'}
          </span>
        </div>

        <div className="p-4 bg-[#111827] text-slate-200 font-mono text-xs overflow-x-auto max-h-[500px]">
          <pre className="leading-relaxed">
            {activeTab === 'sql' ? schemaData?.sqlSchema : schemaData?.prismaSchema}
          </pre>
        </div>
      </div>
    </div>
  );
};
