import React, { useState } from 'react';
import {
  Building2,
  DollarSign,
  Save,
} from 'lucide-react';
import { useToast } from '../shared/toast';

export const SettingsView: React.FC = () => {
  const { success } = useToast();

  const [institutionName, setInstitutionName] = useState('Inuka Africa Limited');
  const [tagline, setTagline] = useState('Making Growth Possible.');
  const [currencyCode, setCurrencyCode] = useState('KES');
  const [defaultInterestRate, setDefaultInterestRate] = useState('14');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    success('Configuration Updated', 'Microfinance parameters and institutional details saved.');
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
            <Building2 className="w-4 h-4 text-[#2E7542]" />
            <h2 className="text-sm font-bold text-[#17231F]">Institution Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#17231F] mb-1">Entity Name</label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] focus:border-[#2E7542] focus:ring-1 focus:ring-[#2E7542] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#17231F] mb-1">Brand Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] focus:border-[#2E7542] focus:ring-1 focus:ring-[#2E7542] focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* FINANCIAL CONFIGURATION */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <DollarSign className="w-4 h-4 text-[#2E7542]" />
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
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] focus:border-[#2E7542] focus:ring-1 focus:ring-[#2E7542] focus:outline-hidden"
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
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2E7542] hover:bg-[#1E6337] rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
