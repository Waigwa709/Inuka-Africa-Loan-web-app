import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { useStore } from '../../lib/store';
import { useToast } from '../shared/toast';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (clientId: string) => void;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addClient, getNextClientNumber } = useStore();
  const { success, error: toastError } = useToast();

  const [clientNumber, setClientNumber] = useState(() => getNextClientNumber());
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+254 ');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('Nairobi Central');
  const [notes, setNotes] = useState('');

  // Field errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!clientNumber.trim()) {
      errs.clientNumber = 'Client Number is required.';
    } else if (!/^INK-C-\d+$/i.test(clientNumber.trim())) {
      errs.clientNumber = 'Client Number format should be INK-C-XXXX (e.g. INK-C-1013).';
    }

    if (!fullName.trim()) {
      errs.fullName = 'Full Name is required.';
    } else if (fullName.trim().length < 3) {
      errs.fullName = 'Full Name must be at least 3 characters.';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please provide a valid email address.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const res = addClient({
      clientNumber,
      fullName,
      phone: phone.trim() !== '+254' ? phone.trim() : undefined,
      email: email.trim() || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setIsSubmitting(false);

    if (res.success && res.client) {
      success('Client Registered Successfully', `${res.client.fullName} (${res.client.clientNumber}) has been added.`);
      onClose();
      if (onSuccess) onSuccess(res.client.id);
    } else {
      toastError('Registration Failed', res.error || 'Could not register client.');
      if (res.error) {
        setErrors((prev) => ({ ...prev, clientNumber: res.error || '' }));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-[#F5F7F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E7F3EA] text-[#287A46] flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#17231F]">Register New Client</h2>
              <p className="text-xs text-[#718078]">Add a new microfinance borrower to the institution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Client Number & Full Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17231F] mb-1">
                Client Number <span className="text-[#E92F2B]">*</span>
              </label>
              <input
                type="text"
                value={clientNumber}
                onChange={(e) => {
                  setClientNumber(e.target.value);
                  if (errors.clientNumber) setErrors((prev) => ({ ...prev, clientNumber: '' }));
                }}
                className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${
                  errors.clientNumber ? 'border-[#E92F2B] focus:ring-1 focus:ring-[#E92F2B]' : 'border-[#E5E7EB] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46]'
                } focus:outline-hidden`}
                placeholder="INK-C-1013"
              />
              {errors.clientNumber && (
                <p className="mt-1 text-xs text-[#E92F2B] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.clientNumber}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17231F] mb-1">
                Full Name <span className="text-[#E92F2B]">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  errors.fullName ? 'border-[#E92F2B] focus:ring-1 focus:ring-[#E92F2B]' : 'border-[#E5E7EB] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46]'
                } focus:outline-hidden`}
                placeholder="e.g. Grace Wanjiru Kamau"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-[#E92F2B] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.fullName}
                </p>
              )}
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17231F] mb-1">
                Phone Number (M-Pesa)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E7EB] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46] focus:outline-hidden font-mono"
                placeholder="+254 7XX XXX XXX"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17231F] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  errors.email ? 'border-[#E92F2B]' : 'border-[#E5E7EB] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46]'
                } focus:outline-hidden`}
                placeholder="client@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-[#E92F2B]">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Location / Branch */}
          <div>
            <label className="block text-xs font-semibold text-[#17231F] mb-1">
              Business Location / Market Branch
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E7EB] bg-white focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46] focus:outline-hidden"
            >
              <option value="Nairobi - Gikomba Market">Nairobi - Gikomba Market</option>
              <option value="Nairobi - Eastleigh 1st Ave">Nairobi - Eastleigh 1st Ave</option>
              <option value="Nairobi - Kirinyaga Road">Nairobi - Kirinyaga Road</option>
              <option value="Nakuru - Biashara Street">Nakuru - Biashara Street</option>
              <option value="Kisumu - Kibuye Market">Kisumu - Kibuye Market</option>
              <option value="Eldoret - Uganda Road">Eldoret - Uganda Road</option>
              <option value="Thika - Makongeni Plaza">Thika - Makongeni Plaza</option>
              <option value="Machakos - Syokimau Way">Machakos - Syokimau Way</option>
              <option value="Mombasa - Old Town Digo Rd">Mombasa - Old Town Digo Rd</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#17231F] mb-1">
              Operational Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E7EB] focus:border-[#287A46] focus:ring-1 focus:ring-[#287A46] focus:outline-hidden resize-none"
              placeholder="e.g. Retail shop owner, operates grocery wholesaler, verified by group leader..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#287A46] hover:bg-[#1E6337] rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Register Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
