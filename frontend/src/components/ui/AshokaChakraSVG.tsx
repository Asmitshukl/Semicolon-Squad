import React from 'react';

interface AshokaChakraSVGProps {
  className?: string;
  stroke?: string;
}

export const AshokaChakraSVG: React.FC<AshokaChakraSVGProps> = ({
  className = '',
  stroke = 'currentColor',
}) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    aria-hidden="true"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="gold-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor="#FFE373" />
        <stop offset="40%"  stopColor="#F2A33A" />
        <stop offset="100%" stopColor="#D6711C" />
      </linearGradient>
    </defs>

    {/* Outer ring */}
    <circle cx="50" cy="50" r="46" stroke={stroke} strokeWidth="4" />

    {/* 24 spokes */}
    {Array.from({ length: 24 }, (_, i) => {
      const angle = (i * 15 - 90) * (Math.PI / 180);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return (
        <line
          key={i}
          x1={50 + 8 * cos}
          y1={50 + 8 * sin}
          x2={50 + 42 * cos}
          y2={50 + 42 * sin}
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      );
    })}

    {/* Hub circle */}
    <circle cx="50" cy="50" r="8" stroke={stroke} strokeWidth="3.5" />
  </svg>
);

export default AshokaChakraSVG;
