import React from 'react';
import { BANK_PRESETS, BankPreset } from '../data/bankPresets';

interface BankPresetSelectorProps {
  selectedPresetId: string;
  onSelectPreset: (preset: BankPreset) => void;
}

export const BankPresetSelector: React.FC<BankPresetSelectorProps> = ({
  selectedPresetId,
  onSelectPreset,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetId = e.target.value;
    const found = BANK_PRESETS.find(p => p.id === presetId);
    if (found) {
      onSelectPreset(found);
    }
  };

  return (
    <div className="space-y-1">
      <label htmlFor="bank-preset" className="text-xs text-[#708499] font-semibold uppercase tracking-wider block">
        Gói lãi suất ngân hàng
      </label>
      <select
        id="bank-preset"
        value={selectedPresetId}
        onChange={handleChange}
        className="w-full bg-[#17212b] border border-[#2c3847] focus:border-[#5288c1] rounded-xl px-4 py-3 text-[#f5f5f5] focus:outline-none transition appearance-none cursor-pointer text-sm"
      >
        {BANK_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.name} {preset.id !== 'custom' ? `(${preset.promoRate}% / ${preset.promoMonths}t)` : ''}
          </option>
        ))}
      </select>
    </div>
  );
};
