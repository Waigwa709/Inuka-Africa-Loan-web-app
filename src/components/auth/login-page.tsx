import React, { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { useToast } from '../shared/toast';
import { InukaLogo } from '../layout/inuka-logo';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onSwitchToSignup: () => void;
  onSwitchToForgotPassword: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToSignup, onSwitchToForgotPassword }) => {
  const { login } = useAuth();
  const { error: toastError } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!password) {
      errs.password = 'Password is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (!result.success) {
      toastError('Login Failed', result.error || 'Invalid credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F7F6] via-white to-[#E7F3EA] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <InukaLogo collapsed={false} theme="light" />
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-[#E5E7EB] p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#17231F] mb-2">Welcome Back</h1>
            <p className="text-sm text-[#718078]">Sign in to your Inuka Africa account</p>
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#17231F] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#718078]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  className={`w-full pl-10 pr-12 py-3 rounded-lg border ${
                    errors.password ? 'border-[#E4332C]' : 'border-[#E5E7EB]'
                  } focus:border-[#2E7542] focus:ring-2 focus:ring-[#2E7542]/20 focus:outline-none transition-all`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718078] hover:text-[#17231F] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-[#E4332C]">{errors.password}</p>
              )}
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onSwitchToForgotPassword}
                className="text-sm text-[#2E7542] hover:text-[#1E6337] font-medium transition-colors"
              >
                Forgot password?
              </button>
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
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-[#E7F3EA] rounded-lg border border-[#C6E5CD]">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2E7542] mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-[#17231F] mb-1">Demo Credentials</p>
                <p className="text-[#718078]">Email: admin@inuka.co.ke</p>
                <p className="text-[#718078]">Password: admin123</p>
              </div>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#718078]">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignup}
                className="text-[#2E7542] hover:text-[#1E6337] font-semibold transition-colors"
              >
                Sign up
              </button>
            </p>
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
