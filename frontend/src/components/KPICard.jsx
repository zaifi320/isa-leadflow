import React, { useState } from 'react';

const NEON_THEMES = {
  // Blue / Cyan - Total Leads
  '#2563eb': {
    border: 'border-2 border-cyan-400',
    shadow: '0 0 25px -2px rgba(34, 211, 238, 0.55), 0 16px 30px -6px rgba(15, 23, 42, 0.8), inset 0 0 15px rgba(34, 211, 238, 0.15)',
    bg: 'from-[#0b1329] via-[#091022] to-[#060b17]',
    waveColor: '#22d3ee',
    iconBg: 'rgba(34, 211, 238, 0.15)',
    iconBorder: 'border-cyan-400/40',
    iconColor: '#38bdf8',
    pillBg: 'bg-cyan-950/80 border border-cyan-400/50 text-cyan-300',
  },
  // Emerald - Seller Leads
  '#10b981': {
    border: 'border-2 border-emerald-400',
    shadow: '0 0 25px -2px rgba(52, 211, 153, 0.55), 0 16px 30px -6px rgba(15, 23, 42, 0.8), inset 0 0 15px rgba(52, 211, 153, 0.15)',
    bg: 'from-[#061e18] via-[#051713] to-[#030e0b]',
    waveColor: '#34d399',
    iconBg: 'rgba(52, 211, 153, 0.15)',
    iconBorder: 'border-emerald-400/40',
    iconColor: '#34d399',
    pillBg: 'bg-emerald-950/80 border border-emerald-400/50 text-emerald-300',
  },
  // Purple - Buyer Leads
  '#8b5cf6': {
    border: 'border-2 border-purple-400',
    shadow: '0 0 25px -2px rgba(192, 132, 252, 0.55), 0 16px 30px -6px rgba(15, 23, 42, 0.8), inset 0 0 15px rgba(192, 132, 252, 0.15)',
    bg: 'from-[#190d2e] via-[#130a24] to-[#0c0617]',
    waveColor: '#c084fc',
    iconBg: 'rgba(192, 132, 252, 0.15)',
    iconBorder: 'border-purple-400/40',
    iconColor: '#c084fc',
    pillBg: 'bg-purple-950/80 border border-purple-400/50 text-purple-300',
  },
  // Amber - Today's Leads
  '#f59e0b': {
    border: 'border-2 border-amber-400',
    shadow: '0 0 25px -2px rgba(251, 191, 36, 0.55), 0 16px 30px -6px rgba(15, 23, 42, 0.8), inset 0 0 15px rgba(251, 191, 36, 0.15)',
    bg: 'from-[#241606] via-[#1a1004] to-[#100a02]',
    waveColor: '#fbbf24',
    iconBg: 'rgba(251, 191, 36, 0.15)',
    iconBorder: 'border-amber-400/40',
    iconColor: '#fbbf24',
    pillBg: 'bg-amber-950/80 border border-amber-400/50 text-amber-300',
  },
  // Cyan - Leads With Phone
  '#06b6d4': {
    border: 'border-2 border-cyan-400',
    shadow: '0 0 25px -2px rgba(34, 211, 238, 0.55), 0 16px 30px -6px rgba(15, 23, 42, 0.8), inset 0 0 15px rgba(34, 211, 238, 0.15)',
    bg: 'from-[#061c24] via-[#04151b] to-[#020d12]',
    waveColor: '#22d3ee',
    iconBg: 'rgba(34, 211, 238, 0.15)',
    iconBorder: 'border-cyan-400/40',
    iconColor: '#22d3ee',
    pillBg: 'bg-cyan-950/80 border border-cyan-400/50 text-cyan-300',
  },
  // Rose - Missing Contact
  '#ef4444': {
    border: 'border-2 border-rose-400',
    shadow: '0 0 25px -2px rgba(251, 113, 133, 0.55), 0 16px 30px -6px rgba(15, 23, 42, 0.8), inset 0 0 15px rgba(251, 113, 133, 0.15)',
    bg: 'from-[#24080e] via-[#1a0509] to-[#100305]',
    waveColor: '#fb7185',
    iconBg: 'rgba(251, 113, 133, 0.15)',
    iconBorder: 'border-rose-400/40',
    iconColor: '#fb7185',
    pillBg: 'bg-rose-950/80 border border-rose-400/50 text-rose-300',
  },
};

export default function KPICard({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'up',
  color = '#2563eb',
  bgColor = '#dbeafe',
  cardBg = 'from-white to-blue-50/40',
  borderColor = 'border-blue-100/70',
  strokePath = 'M 0 24 C 25 32, 45 10, 70 18 C 95 26, 115 8, 140 18 C 160 26, 175 14, 190 20',
}) {
  const [isHovered, setIsHovered] = useState(false);
  const isUp = changeType === 'up';

  const theme = NEON_THEMES[color] || {
    border: 'border-2 border-cyan-400',
    shadow: '0 0 25px -2px rgba(34, 211, 238, 0.55), 0 16px 30px -6px rgba(15, 23, 42, 0.8)',
    bg: 'from-[#0b1329] via-[#091022] to-[#060b17]',
    waveColor: color,
    iconBg: 'rgba(255, 255, 255, 0.1)',
    iconBorder: 'border-white/20',
    iconColor: '#ffffff',
    pillBg: 'bg-slate-900/80 border border-slate-700 text-slate-300',
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        boxShadow: isHovered ? theme.shadow : undefined,
      }}
      className={`relative rounded-2xl transition-all duration-300 ease-out p-4 flex flex-col justify-between overflow-hidden min-h-[148px] cursor-pointer select-none ${
        isHovered
          ? `bg-gradient-to-b ${theme.bg} ${theme.border} -translate-y-2`
          : `bg-gradient-to-b ${cardBg} bg-white border ${borderColor} shadow-xs hover:shadow-md`
      }`}
    >
      <div>
        {/* Top: Icon Badge */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 shadow-xs ${
            isHovered ? `border ${theme.iconBorder}` : ''
          }`}
          style={{
            backgroundColor: isHovered ? theme.iconBg : bgColor,
          }}
        >
          <Icon
            size={19}
            style={{ color: isHovered ? theme.iconColor : color }}
            strokeWidth={2.2}
            className="transition-colors duration-300"
          />
        </div>

        {/* Large Value */}
        <div
          className={`text-[28px] font-extrabold leading-none tracking-tight transition-colors duration-300 ${
            isHovered ? 'text-white drop-shadow-sm' : 'text-slate-900'
          }`}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>

        {/* Title */}
        <div
          className={`text-[12px] font-medium mt-1 mb-2 leading-tight transition-colors duration-300 ${
            isHovered ? 'text-slate-300' : 'text-slate-500'
          }`}
        >
          {title}
        </div>

        {/* Trend Indicator (Style 1 Neon Pill Badge on hover) */}
        <div className="flex items-center gap-1 transition-all duration-300">
          {isHovered ? (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide backdrop-blur-md shadow-xs ${theme.pillBg}`}
            >
              <span>{isUp ? '↑' : '↓'}</span> {change} vs last period
            </span>
          ) : (
            <span
              className={`text-[11px] font-semibold flex items-center gap-0.5 ${
                isUp ? 'text-emerald-600' : 'text-rose-500'
              }`}
            >
              <span>{isUp ? '↑' : '↓'}</span> {change}
            </span>
          )}
        </div>
      </div>

      {/* Decorative smooth wavy spline at bottom (Luminous Neon in Dark Mode) */}
      <div
        className={`absolute -bottom-1 -left-1 -right-1 h-9 pointer-events-none transition-all duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-85'
        }`}
      >
        <svg viewBox="0 0 180 32" preserveAspectRatio="none" className="w-full h-full">
          <path
            d={strokePath}
            fill="none"
            stroke={isHovered ? theme.waveColor : color}
            strokeWidth={isHovered ? '2.8' : '2'}
            strokeLinecap="round"
            style={{
              filter: isHovered ? `drop-shadow(0 0 7px ${theme.waveColor})` : 'none',
              transition: 'all 0.3s ease',
            }}
          />
        </svg>
      </div>
    </div>
  );
}
