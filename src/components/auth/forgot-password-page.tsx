import React, { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { useToast } from '../shared/toast';
import { InukaLogo } from '../layout/inuka-logo';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, MailCheck } from 'lucide-react';

interface ForgotPasswordPageProps {
  onSwitchToLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onSwitchToLogin }) => {
  const { forgotPassword } = useAuth();
  const { error: toastError, success } = useToast();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email address.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    const result = await forgotPassword(email);
    setIsLoading(false);

    if (result.success) {
      setIsSent(true);
      success('Reset Link Sent', 'Check your email for password reset instructions.');
    } else {
      toastError('Request Failed', result.error || 'Could not send reset link.');
    }
  };

  if (isSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F7F6] via-white to-[#E7F3EA] p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <InukaLogo collapsed={false} theme="light" />
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-[#E5E7EB] p-8 text-center">
            <div className="w-16 h-16 bg-[#E7F3EA] rounded-full flex items-center justify-center mx-auto mb-6">
              <MailCheck className="w-8 h-8 text-[#2E7542]" />
            </div>

            <h1 className="text-2xl font-bold text-[#17231F] mb-2">Check Your Email</h1>
            <p className="text-sm text-[#718078] mb-6">
              We've sent a password reset link to <strong className="text-[#17231F]">{email}</strong>
            </p>

            <div className="p-4 bg-[#E7F3EA] rounded-lg border border-[#C6E5CD] mb-6">
              <p className="text-xs text-[#718078]">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </div>

            <button
              onClick={onSwitchToLogin}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-[#2E7542] hover:bg-[#1E6337] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </button>
          </div>

          <p className="text-center text-xs text-[#718078] mt-6">
            © 2024 Inuka Africa Limited. All rights reserved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F7F6] via-white to-[#E7F3EA] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <InukaLogo collapsed={false} theme="light" />
        </div>

        {/* Forgot Password Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-[#E5E7EB] p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#17231F] mb-2">Forgot Password?</h1>
            <p className="text-sm text-[#718078]">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#17231F] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#718078]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    errors.email ? 'border-[#E4332C]' : 'border-[#E5E7EB]'
                  } focus:border-[#2E7542] focus:ring-2 focus:ring-[#2E7542]/20 focus:outline-none transition-all`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-[#E4332C]">{errors.email}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-[#2E7542] hover:bg-[#1E6337] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="inline-flex items-center gap-2 text-sm text-[#2E7542] hover:text-[#1E6337] font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#718078] mt-6">
          © 2024 Inuka Africa Limited. All rights reserved.
        </p>
      </div>
    </div>
  );
};
