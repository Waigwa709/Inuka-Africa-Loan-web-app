import React, { useState } from 'react';
import {
  Building2,
  DollarSign,
  RotateCcw,
  Shield,
  Save,
  CheckCircle2,
  AlertTriangle,
  Database,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { useToast } from '../shared/toast';
import { useNavigation } from '../../lib/navigation';

export const SettingsView: React.FC = () => {
  const { resetToSeedData } = useStore();
  const { success, info } = useToast();
  const { navigateTo } = useNavigation();

  const [institutionName, setInstitutionName] = useState('Inuka Africa Limited');
  const [tagline, setTagline] = useState('Making Growth Possible.');
  const [currencyCode, setCurrencyCode] = useState('KES');
  const [defaultInterestRate, setDefaultInterestRate] = useState('14');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    success('Configuration Updated', 'Microfinance parameters and institutional details saved.');
  };

  const handleConfirmReset = () => {
    resetToSeedData();
    setIsResetConfirmOpen(false);
    success('Demo Data Restored', 'All clients, loans, and repayment records have been reset to default state.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-6 border-b border-[#E5E7EB]">
        <h1 className="text-2xl font-bold tracking-tight text-[#17231F]">System Settings</h1>
        <p className="mt-1 text-sm text-[#718078]">
          Institutional parameters, branch configuration and demonstration data controls.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* INSTITUTION DETAILS */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-[#287A46]" />
            <h2 className="text-sm font-bold text-[#17231F]">Institution Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#17231F] mb-1">Entity Name</label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#17231F] mb-1">Brand Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46] focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* FINANCIAL CONFIGURATION */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <DollarSign className="w-4 h-4 text-[#287A46]" />
            <h2 className="text-sm font-bold text-[#17231F]">Financial Currency & Interest Standards</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#17231F] mb-1">Standard Currency</label>
              <select
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                disabled
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-slate-50 text-slate-700 cursor-not-allowed"
              >
                <option value="KES">Kenyan Shilling (KES) — Intl.NumberFormat</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Standard currency locked to Kenyan Shillings (KES).
              </span>
            </div>

            <div>
              <label className="block font-semibold text-[#17231F] mb-1">
                Default Loan Financing Margin (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={defaultInterestRate}
                  onChange={(e) => setDefaultInterestRate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46] focus:outline-hidden"
                />
                <span className="absolute right-3 top-2 text-slate-400 font-semibold">%</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Suggested markup applied when generating new loan proposals.
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#287A46] hover:bg-[#1E6337] rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>

      {/* MYSQL DATABASE & PRISMA ORM ARCHITECTURE */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#287A46]" />
            <div>
              <h2 className="text-sm font-bold text-[#17231F]">MySQL Database & Prisma ORM</h2>
              <p className="text-xs text-[#718078]">Enterprise relational data models and decimal monetary precision</p>
            </div>
          </div>

          <button
            onClick={() => navigateTo('database-schema')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#287A46] bg-[#E7F3EA] hover:bg-[#C6E5CD] rounded-lg transition-colors cursor-pointer"
          >
            <span>View Full Schema DDL</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[#718078] block text-[10px]">Database Engine</span>
            <strong className="text-[#17231F]">MySQL 8.0+ (InnoDB)</strong>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[#718078] block text-[10px]">ORM Architecture</span>
            <strong className="text-[#17231F]">Prisma Client (Type-Safe)</strong>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[#718078] block text-[10px]">AI Integration Core</span>
            <strong className="text-[#287A46]">Google Gemini 3.8 Flash</strong>
          </div>
        </div>
      </div>

      {/* DEMO DATA RESTORE / RESET CARD */}
      <div className="bg-white rounded-xl border border-red-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-[#E92F2B]">
          <RotateCcw className="w-4 h-4" />
          <h2 className="text-sm font-bold text-[#17231F]">Assessment Data Management</h2>
        </div>
        <p className="text-xs text-[#718078]">
          Reset all in-memory and local storage records back to the original Inuka Africa demonstration dataset (12 clients, 12 loans, and 19 repayments).
        </p>

        {!isResetConfirmOpen ? (
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-[#E92F2B] hover:text-white bg-red-50 hover:bg-[#E92F2B] border border-red-200 rounded-lg transition-colors cursor-pointer"
          >
            Reset All Records to Default Demo State
          </button>
        ) : (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Are you sure? Any loans or repayments you added in this session will be reverted.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-2.5 py-1 text-xs text-slate-700 bg-white rounded border border-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-[#E92F2B] hover:bg-red-700 rounded cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
