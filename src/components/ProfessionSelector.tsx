'use client';

import { useState } from 'react';

interface ProfessionSelectorProps {
  selectedProfessions: string[];
  onChange: (professions: string[]) => void;
  label?: string;
  disabled?: boolean;
}

const PROFESSIONS = [
  { id: 'architecture', name: '建筑', icon: '🏛️' },
  { id: 'structure', name: '结构', icon: '🏗️' },
  { id: 'plumbing', name: '给排水', icon: '💧' },
  { id: 'electrical', name: '电气', icon: '⚡' },
  { id: 'hvac', name: '暖通', icon: '🌡️' },
  { id: 'fire', name: '消防', icon: '🔥' },
  { id: 'road', name: '道路', icon: '🛣️' },
  { id: 'landscape', name: '景观', icon: '🌳' },
  { id: 'interior', name: '室内', icon: '🏠' },
  { id: 'cost', name: '造价', icon: '💰' },
];

export default function ProfessionSelector({
  selectedProfessions,
  onChange,
  label = '选择专业',
  disabled = false,
}: ProfessionSelectorProps) {
  const handleToggle = (professionId: string) => {
    if (disabled) return;

    const isSelected = selectedProfessions.includes(professionId);

    if (isSelected) {
      const newSelection = selectedProfessions.filter((id) => id !== professionId);
      onChange(newSelection);
    } else {
      const newSelection = [...selectedProfessions, professionId];
      onChange(newSelection);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
          {label}
        </label>
      )}

      {/* 专业选择按钮 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {PROFESSIONS.map((profession) => {
          const isSelected = selectedProfessions.includes(profession.id);
          return (
            <button
              key={profession.id}
              type="button"
              onClick={() => handleToggle(profession.id)}
              disabled={disabled}
              className={`
                relative flex flex-col items-center justify-center p-3 rounded-[var(--radius-md)] border-2 transition-all duration-[var(--transition-fast)]
                ${isSelected
                  ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)]'
                  : 'border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-primary)] hover:bg-[var(--color-bg-hover)]'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className="text-xl mb-1">{profession.icon}</span>
              <span className="text-xs font-medium">{profession.name}</span>

              {isSelected && (
                <div className="absolute top-2 right-2">
                  <svg className="w-4 h-4 text-[var(--color-brand-primary)]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 已选择提示 */}
      {selectedProfessions.length > 0 && (
        <div className="mt-4 p-3 bg-[var(--color-brand-primary-light)] border border-[var(--color-brand-primary)] rounded-[var(--radius-md)]">
          <p className="text-sm text-[var(--color-text-secondary)]">
            <span className="font-medium text-[var(--color-brand-primary)]">已选择 {selectedProfessions.length} 个专业：</span>
            {selectedProfessions.map(id => PROFESSIONS.find(p => p.id === id)?.name).join('、')}
          </p>
        </div>
      )}
    </div>
  );
}
