import React, { useState } from 'react';
import { validateRupeeInput } from '../utils/currency.js';

export default function PerMemberPricingForm({ currentPrice, onUpdate, loading }) {
  const [value, setValue] = useState(currentPrice ?? '');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const v = e.target.value.trim();
    if (!validateRupeeInput(v)) {
      setError('Invalid amount (max 2 decimals)');
    } else {
      setError('');
    }
    setValue(v);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (error) return;
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      setError('Price must be a non-negative number');
      return;
    }
    onUpdate(num, { resetTo: num });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Per-Member Price (INR)</label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        disabled={loading}
        className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-sm outline-none focus:ring-2 focus:ring-[#0364bd] disabled:opacity-50"
        placeholder="e.g. 49.00"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
            disabled={loading || !!error}
          className="px-4 py-2 bg-[#0364bd] text-white rounded text-sm hover:bg-[#003a70] disabled:opacity-50"
        >
          Update Price
        </button>
      </div>
    </form>
  );
}
