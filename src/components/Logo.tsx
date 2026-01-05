import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  href?: string;
}

export default function Logo({
  size = 'md',
  showText = true,
  className = '',
  href = '/',
}: LogoProps) {
  const sizeConfig = {
    sm: { icon: 24, text: 'text-lg' },
    md: { icon: 32, text: 'text-xl' },
    lg: { icon: 48, text: 'text-2xl' },
  };

  const { icon, text } = sizeConfig[size];

  return (
    <Link href={href} className={`flex items-center gap-3 group ${className}`}>
      {/* Logo 图标 - 现代简洁设计 */}
      <svg
        className="transition-all duration-300"
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 渐变色定义 */}
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#10A37F', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#0D8F6F', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* 外圆 - 保护和包容 */}
        <circle
          cx="24"
          cy="24"
          r="22"
          fill="url(#logoGradient)"
          opacity="0.1"
          className="group-hover:opacity-0.15 transition-opacity duration-300"
        />

        {/* 简化的文档图标 */}
        <rect
          x="14"
          y="8"
          width="20"
          height="32"
          rx="2"
          stroke="url(#logoGradient)"
          strokeWidth="2"
          fill="none"
          className="group-hover:stroke-[#10A37F] transition-colors duration-300"
        />

        {/* 对勾 - 评审通过，简洁有力 */}
        <path
          d="M20 24L23 27L30 18"
          stroke="url(#logoGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="group-hover:stroke-[#10A37F] transition-colors duration-300"
        />

        {/* 简化的装饰线 - 表示文档内容 */}
        <line
          x1="18"
          y1="15"
          x2="30"
          y2="15"
          stroke="url(#logoGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="group-hover:stroke-[#10A37F] transition-colors duration-300"
        />
        <line
          x1="18"
          y1="19"
          x2="26"
          y2="19"
          stroke="url(#logoGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="group-hover:stroke-[#10A37F] transition-colors duration-300"
        />
      </svg>

      {/* Logo 文字 */}
      {showText && (
        <span
          className={`font-semibold tracking-tight text-[var(--color-text-primary)] ${text} group-hover:text-[var(--color-brand-primary)] transition-colors duration-300`}
          style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
        >
          评审通
        </span>
      )}
    </Link>
  );
}
