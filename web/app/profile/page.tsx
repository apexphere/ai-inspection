'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { AuthGuard } from '@/components/auth-guard';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function ProfilePage(): React.ReactElement {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

function ProfileContent(): React.ReactElement {
  const { data: session } = useSession();
  
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  
  // WhatsApp linking state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [linkingPhone, setLinkingPhone] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const token = (session as { apiToken?: string } | null)?.apiToken;

  // Fetch profile on mount
  useEffect(() => {
    if (!token) return;
    
    async function fetchProfile(): Promise<void> {
      try {
        const res = await fetch(`${API_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const data = await res.json();
        setProfile(data.user);
        setName(data.user.name || '');
        setEmail(data.user.email);
        setCompany(data.user.company || '');
        setPhoneNumber(data.user.phoneNumber || '');
      } catch (err) {
        setError('Failed to load profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProfile();
  }, [token]);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name || undefined,
          email,
          company: company || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      const data = await res.json();
      setProfile(data.user);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkWhatsApp = async (): Promise<void> => {
    setError(null);
    setLinkingPhone(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/link-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send verification code');
      }

      setShowVerification(true);
      setSuccess('Verification code sent to your WhatsApp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link WhatsApp');
    } finally {
      setLinkingPhone(false);
    }
  };

  const handleVerifyWhatsApp = async (): Promise<void> => {
    setError(null);
    setVerifyingCode(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phoneNumber, code: verificationCode }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Invalid verification code');
      }

      // Refresh profile
      const profileRes = await fetch(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await profileRes.json();
      setProfile(data.user);
      setShowVerification(false);
      setVerificationCode('');
      setSuccess('WhatsApp number verified successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleUnlinkWhatsApp = async (): Promise<void> => {
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/auth/unlink-whatsapp`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to unlink WhatsApp');
      }

      // Refresh profile
      const profileRes = await fetch(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await profileRes.json();
      setProfile(data.user);
      setPhoneNumber('');
      setSuccess('WhatsApp number unlinked');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink WhatsApp');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account details and preferences
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg">
          {success}
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-xl p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Account Details</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              className="block w-full h-11 px-3 border border-gray-200 rounded-lg text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={saving}
              required
              className="block w-full h-11 px-3 border border-gray-200 rounded-lg text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
              Company
            </label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={saving}
              className="block w-full h-11 px-3 border border-gray-200 rounded-lg text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
              placeholder="Your company (optional)"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !email}
          className="mt-6 w-full h-11 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* WhatsApp Integration */}
      <div className="bg-white shadow-sm rounded-xl p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">WhatsApp Integration</h2>
        <p className="text-sm text-gray-600 mb-4">
          Link your phone number to enable WhatsApp-based inspections
        </p>

        {profile?.phoneVerified ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">
                Connected: {profile.phoneNumber}
              </span>
            </div>
            <button
              type="button"
              onClick={handleUnlinkWhatsApp}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Unlink WhatsApp
            </button>
          </div>
        ) : showVerification ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter the 6-digit code sent to {phoneNumber}
            </p>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={verifyingCode}
              maxLength={6}
              className="block w-full h-11 px-3 border border-gray-200 rounded-lg text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 text-center tracking-widest"
              placeholder="000000"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleVerifyWhatsApp}
                disabled={verifyingCode || verificationCode.length !== 6}
                className="flex-1 h-11 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifyingCode ? 'Verifying...' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowVerification(false);
                  setVerificationCode('');
                }}
                className="h-11 px-4 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={linkingPhone}
              className="block w-full h-11 px-3 border border-gray-200 rounded-lg text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
              placeholder="+64 21 123 4567"
            />
            <p className="text-xs text-gray-500">
              Include country code (e.g., +64 for NZ, +1 for US)
            </p>
            <button
              type="button"
              onClick={handleLinkWhatsApp}
              disabled={linkingPhone || !phoneNumber || phoneNumber.length < 10}
              className="w-full h-11 px-4 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {linkingPhone ? 'Sending code...' : 'Link WhatsApp'}
            </button>
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="mt-6 text-sm text-gray-500">
        <p>Account created: {profile ? new Date(profile.createdAt).toLocaleDateString() : '-'}</p>
      </div>
    </div>
  );
}
