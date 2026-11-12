import React, { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { useToast } from '../shared/toast';
import { X, User, Mail, Phone, Camera, Save } from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const { success, error: toastError } = useToast();
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen || !user) return null;

  const validate = () => {
    const errs: { [key: string]: string } = {};
    
    if (!formData.fullName.trim()) {
      errs.fullName = 'Full name is required.';
    } else if (formData.fullName.trim().length < 3) {
      errs.fullName = 'Full name must be at least 3 characters.';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email address.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    updateProfile({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone || undefined,
    });
    
    setIsLoading(false);
    success('Profile Updated', 'Your profile has been updated successfully.');
    onClose();
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-[#F5F7F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E7F3EA] text-[#287A46] flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#17231F]">Edit Profile</h2>
              <p className="text-xs text-[#718078]">Update your account information</p>
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
          {/* Avatar Preview */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-[#287A46] flex items-center justify-center text-white text-2xl font-bold">
                {getInitials(formData.fullName)}
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full border-2 border-[#E5E7EB] flex items-center justify-center text-[#718078] hover:text-[#287A46] hover:border-[#287A46] transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-[#718078]">Click to change avatar</p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-[#17231F] mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#718078]" />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  errors.fullName ? 'border-[#E92F2B]' : 'border-[#E5E7EB]'
                } focus:border-[#287A46] focus:ring-2 focus:ring-[#287A46]/20 focus:outline-none transition-all`}
                placeholder="John Doe"
              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-xs text-[#E92F2B]">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#17231F] mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#718078]" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  errors.email ? 'border-[#E92F2B]' : 'border-[#E5E7EB]'
                } focus:border-[#287A46] focus:ring-2 focus:ring-[#287A46]/20 focus:outline-none transition-all`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-[#E92F2B]">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-[#17231F] mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#718078]" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#E5E7EB] focus:border-[#287A46] focus:ring-2 focus:ring-[#287A46]/20 focus:outline-none transition-all"
                placeholder="+254 700 000 000"
              />
            </div>
          </div>

          {/* Role (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-[#17231F] mb-2">
              Role
            </label>
            <div className="px-4 py-3 bg-[#F5F7F6] rounded-lg border border-[#E5E7EB] text-sm text-[#718078]">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </div>
          </div>

          {/* Member Since */}
          <div>
            <label className="block text-sm font-medium text-[#17231F] mb-2">
              Member Since
            </label>
            <div className="px-4 py-3 bg-[#F5F7F6] rounded-lg border border-[#E5E7EB] text-sm text-[#718078]">
              {new Date(user.createdAt).toLocaleDateString('en-KE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#287A46] hover:bg-[#1E6337] rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
