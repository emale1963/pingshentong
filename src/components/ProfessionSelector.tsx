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
      // 取消选择
      const newSelection = selectedProfessions.filter((id) => id !== professionId);
      onChange(newSelection);
    } else {
      // 添加选择
      const newSelection = [...selectedProfessions, professionId];
      onChange(newSelection);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-3">
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
                relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className="text-2xl mb-2">{profession.icon}</span>
              <span className="text-sm font-medium">{profession.name}</span>

              {isSelected && (
                <div className="absolute top-2 right-2">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
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
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">已选择 {selectedProfessions.length} 个专业：</span>
            {selectedProfessions.map(id => PROFESSIONS.find(p => p.id === id)?.name).join('、')}
          </p>
        </div>
      )}
    </div>
  );
}
