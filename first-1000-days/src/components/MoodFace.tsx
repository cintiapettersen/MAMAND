import React from 'react';

export type MoodFaceVariant =
  | 'serene'
  | 'autopilot'
  | 'tired'
  | 'sensitive'
  | 'calm'
  | 'curious'
  | 'sleepy'
  | 'fussy';

interface MoodFaceProps {
  variant: MoodFaceVariant;
  size?: number;
  className?: string;
}

// Rostos em traço (line art) desenhados num grid 24x24, cor herdada via currentColor
const FEATURES: Record<MoodFaceVariant, React.ReactNode> = {
  // Olhos fechados sorrindo + sorriso largo
  serene: (
    <>
      <path d="M7.6 10.4c.8-1.2 2.2-1.2 3 0M13.4 10.4c.8-1.2 2.2-1.2 3 0" />
      <path d="M8.2 14.2c2 2.6 5.6 2.6 7.6 0" />
    </>
  ),
  // Olhar parado e boca reta
  autopilot: (
    <>
      <path d="M7.8 9.4h2.6M13.6 9.4h2.6" />
      <circle cx="9.1" cy="10.8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14.9" cy="10.8" r="0.9" fill="currentColor" stroke="none" />
      <path d="M8.8 15.4h6.4" />
    </>
  ),
  // Olhos fechados + bocejo
  tired: (
    <>
      <path d="M7.6 10c.8 1 2.2 1 3 0M13.4 10c.8 1 2.2 1 3 0" />
      <ellipse cx="12" cy="15.4" rx="1.8" ry="2.2" />
    </>
  ),
  // Sobrancelhas preocupadas, boca triste e lágrima
  sensitive: (
    <>
      <path d="M7.6 8.6l2.6-1M16.4 8.6l-2.6-1" />
      <circle cx="9.1" cy="10.6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14.9" cy="10.6" r="0.9" fill="currentColor" stroke="none" />
      <path d="M8.8 16.4c1.8-1.8 4.6-1.8 6.4 0" />
      <path d="M16.2 12.4c.6.9 1 1.5 1 2a1 1 0 0 1-2 0c0-.5.4-1.1 1-2z" />
    </>
  ),
  // Olhos tranquilos e sorriso suave
  calm: (
    <>
      <circle cx="9.1" cy="10.2" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14.9" cy="10.2" r="0.9" fill="currentColor" stroke="none" />
      <path d="M9 14.4c1.6 1.6 4.4 1.6 6 0" />
    </>
  ),
  // Olhos grandes e boca em "o"
  curious: (
    <>
      <circle cx="9" cy="10.2" r="1.8" />
      <circle cx="15" cy="10.2" r="1.8" />
      <circle cx="9.3" cy="10.4" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="15.3" cy="10.4" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="12" cy="15.6" r="1.1" />
    </>
  ),
  // Olhos fechados, boca relaxada e "z"
  sleepy: (
    <>
      <path d="M7.6 10.6c.8 1 2.2 1 3 0M13.4 10.6c.8 1 2.2 1 3 0" />
      <path d="M10.4 15.4h3.2" />
      <path d="M18.6 1.4h3l-3 3h3" />
    </>
  ),
  // Olhar pidão, beicinho e lágrima
  fussy: (
    <>
      <path d="M7.4 8.8l2.4-1M16.6 8.8l-2.4-1" />
      <circle cx="9.1" cy="10.8" r="1.3" />
      <circle cx="14.9" cy="10.8" r="1.3" />
      <path d="M9.4 16.2c1.6-1.2 3.6-1.2 5.2 0" />
      <path d="M7.2 13.2c.6.9 1 1.5 1 2a1 1 0 0 1-2 0c0-.5.4-1.1 1-2z" />
    </>
  )
};

export const MoodFace: React.FC<MoodFaceProps> = ({ variant, size = 22, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r={variant === 'sleepy' ? 9 : 10} />
    {FEATURES[variant]}
  </svg>
);

export default MoodFace;
