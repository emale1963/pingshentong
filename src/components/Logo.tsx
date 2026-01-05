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
      {/* Logo 图标 - 初始黑白，悬停变彩色 */}
      <svg
        className="logo-icon transition-all duration-300"
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 简洁的文档图标 */}
        <path
          d="M14 8C14 6.89543 14.8954 6 16 6H32C33.1046 6 34 6.89543 34 8V40C34 41.1046 33.1046 42 32 42H16C14.8954 42 14 41.1046 14 40V8Z"
          className="stroke-current"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 对勾图标 - 表示审核通过 */}
        <path
          d="M22 26L27 31L36 20"
          className="stroke-current"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 装饰性线条 - 表示评审过程 */}
        <path
          d="M19 16H29"
          className="stroke-current"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19 21H25"
          className="stroke-current"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
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
