'use client';

import { useState, useEffect } from 'react';
import {
  Ticket,
  Plus,
  Percent,
  Calendar,
  Users,
  TrendingUp,
  Check,
  X,
  Clock,
  Edit,
  ExternalLink,
  RefreshCw,
  Copy,
} from 'lucide-react';
import type { PromoCode } from '@/types/database';

type FilterStatus = 'all' | 'active' | 'expired';

interface PromoCodeStats {
  total: number;
  active: number;
  totalRedemptions: number;
  campaigns: string[];
}

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [stats, setStats] = useState<PromoCodeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);

      const res = await fetch(`/api/system-admin/promo-codes?${params}`);
      const data = await res.json();

      if (data.success) {
        setPromoCodes(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch promo codes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, [filter]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/system-admin/promo-codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (res.ok) {
        fetchPromoCodes();
      }
    } catch (error) {
      console.error('Failed to toggle promo code:', error);
    }
  };

  const getStatus = (code: PromoCode): { label: string; color: string } => {
    if (!code.is_active) {
      return { label: 'Inactive', color: 'bg-gray-100 text-gray-600' };
    }
    if (code.valid_until && new Date(code.valid_until) < new Date()) {
      return { label: 'Expired', color: 'bg-red-100 text-red-600' };
    }
    if (code.max_redemptions && code.times_redeemed >= code.max_redemptions) {
      return { label: 'Exhausted', color: 'bg-orange-100 text-orange-600' };
    }
    return { label: 'Active', color: 'bg-green-100 text-green-600' };
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Ticket className="h-8 w-8 text-purple-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Promo Codes</h1>
            <p className="text-gray-500">Manage marketing discount codes</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchPromoCodes}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Code
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Ticket className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Codes</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Redemptions</p>
                <p className="text-2xl font-bold">{stats.totalRedemptions}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Campaigns</p>
                <p className="text-2xl font-bold">{stats.campaigns.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'expired'] as FilterStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg capitalize transition-colors ${
              filter === status
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Promo Codes Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            Loading promo codes...
          </div>
        ) : promoCodes.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No promo codes found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {promoCodes.map((code) => {
                const status = getStatus(code);
                return (
                  <tr key={code.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="px-3 py-1 bg-gray-100 rounded font-mono text-sm font-bold">
                          {code.code}
                        </code>
                        <button
                          onClick={() => copyCode(code.code)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Copy code"
                        >
                          {copiedCode === code.code ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {code.description && (
                        <p className="text-xs text-gray-500 mt-1">{code.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {code.discount_type === 'percent' ? (
                          <>
                            <Percent className="h-4 w-4 text-green-500" />
                            <span className="font-semibold text-green-600">
                              {code.discount_value}% off
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold text-green-600">
                            ${code.discount_value} off
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>
                          {code.times_redeemed}
                          {code.max_redemptions ? ` / ${code.max_redemptions}` : ' / ∞'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(code.valid_until)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {code.campaign_name ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {code.campaign_name}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(code.id, code.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            code.is_active
                              ? 'bg-red-100 hover:bg-red-200 text-red-600'
                              : 'bg-green-100 hover:bg-green-200 text-green-600'
                          }`}
                          title={code.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {code.is_active ? (
                            <X className="h-4 w-4" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                        <a
                          href="https://payhip.com/marketing?tab=coupon-section"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600"
                          title="Edit in Payhip"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Payhip Link */}
      <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ExternalLink className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">Manage in Payhip</p>
              <p className="text-sm text-blue-700">
                Create and edit promo codes directly in Payhip dashboard
              </p>
            </div>
          </div>
          <a
            href="https://payhip.com/marketing?tab=coupon-section"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            Open Payhip
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Create Modal (Simple for now - can be expanded) */}
      {showCreateModal && (
        <CreatePromoCodeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchPromoCodes();
          }}
        />
      )}
    </div>
  );
}

// Simple Create Modal
function CreatePromoCodeModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percent' as 'percent' | 'amount',
    discount_value: 20,
    max_redemptions: '',
    valid_until: '',
    campaign_name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/system-admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          max_redemptions: formData.max_redemptions
            ? parseInt(formData.max_redemptions)
            : null,
          valid_until: formData.valid_until || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        alert(data.error || 'Failed to create promo code');
      }
    } catch (error) {
      console.error('Error creating promo code:', error);
      alert('Failed to create promo code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Ticket className="h-5 w-5 text-purple-500" />
          Create Promo Code
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Code *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              className="w-full px-3 py-2 border rounded-lg uppercase"
              placeholder="SUMMER20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Summer sale discount"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={formData.discount_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount_type: e.target.value as 'percent' | 'amount',
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="percent">Percentage</option>
                <option value="amount">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Value *</label>
              <input
                type="number"
                value={formData.discount_value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount_value: parseFloat(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
                min="1"
                max={formData.discount_type === 'percent' ? 100 : 1000}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Max Uses</label>
              <input
                type="number"
                value={formData.max_redemptions}
                onChange={(e) =>
                  setFormData({ ...formData, max_redemptions: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Unlimited"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expires</label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) =>
                  setFormData({ ...formData, valid_until: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Campaign</label>
            <input
              type="text"
              value={formData.campaign_name}
              onChange={(e) =>
                setFormData({ ...formData, campaign_name: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="SUMMER-SALE-2026"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Code'}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
          <strong>Note:</strong> This only adds the code to Supabase for tracking.
          Remember to also create the code in{' '}
          <a
            href="https://payhip.com/marketing?tab=coupon-section"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Payhip Dashboard
          </a>{' '}
          for it to work at checkout.
        </div>
      </div>
    </div>
  );
}
