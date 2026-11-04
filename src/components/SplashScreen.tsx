import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

// Abertura do app: a logo se desenha com calma, o nome e a linha de apoio sobem logo depois
// e tudo some num fade. Fica por cima do carregamento local e não depende de rede.

interface SplashScreenProps {
  // Tempo mínimo na tela antes de começar a sumir
  minDuration?: number;
  onFinish?: () => void;
}

const FADE_MS = 500;

// Logo MAMAND (vetor do arquivo da marca), só o contorno, como no ícone do app. Os anéis
// se desenham pelo contorno e depois ganham cor.
const RING_PATHS = [
  'M228.773,169.609c6.705,13.94,5.295,29.494-0.685,43.65 c-11.361,26.892-35.982,41.221-62.841,49.124c-2.495,0.734-5.034,1.443-7.635,1.489c-2.549,0.046-5.063-0.547-7.527-1.203 c-33.39-8.888-64.272-31.073-68.189-67.832c-2.543-23.87,12.978-48.096,38.559-48.826c14.337-0.409,28.509,7.063,36.828,18.746 c7.511-10.253,19.425-17.305,32.088-18.387c15.659-1.338,30.109,6.807,37.869,20.329 C227.792,167.661,228.303,168.631,228.773,169.609z M202.178,214.775c13.627-4.876,22.038-18.424,19.904-32.699 c-2.094-14.011-14.089-24.86-28.237-25.458c-18.605-0.786-33.522,15.58-31.024,33.972 C165.22,208.249,183.918,221.309,202.178,214.775z M109.36,228.904c5.424,5.526,11.413,9.968,18.34,13.242l11.803,5.579 c4.18,1.976,8.51,3.461,13.1,4.1c3.182,0.443,6.342,0.076,9.561-0.422c18.065-2.799,33.32-13.303,46.152-26.412 c-2.496,2.55-15.719,4.116-19.305,3.805c-6.381-0.553-13.999-2.151-19.608-5.328c-13.97-7.913-15.884-25.644-18.165-40.407 c-0.356-2.304-0.434-4.871-1.87-6.482c-5.015-5.626-10.214-16.753-17.493-18.407c-9.42-2.141-21.713-0.934-29.115,5.603 c-10.438,9.219-12.527,23.258-9.277,36.604C96.118,211.205,101.575,220.972,109.36,228.904z',
  'M172.782,63.633c20.292,8.19,32.724,33.385,23.86,54.009 c-5.237,12.185-13.325,21.792-26.486,25.447c-10.255,2.848-21.422,2.482-31.255-1.768c-2.764-1.195-5.176-3.303-7.561-4.834 c-6.063-3.893-10.501-9.992-13.317-16.81c-6.711-16.246-3.244-36.138,10.048-48.061C140.423,60.536,157.554,57.487,172.782,63.633 z M133.457,81.887c-4.401,4.763-7.627,10.78-7.763,17.347l-0.07,3.368c-0.07,3.386,0.53,6.704,1.904,9.74l1.114,3.624 c0.204,0.664,0.448,1.318,0.763,1.938c4.263,8.412,12.436,14.713,21.969,16.576c9.558,1.868,20.877-0.822,27.58-8.166 c7.937-8.696,11.306-23.013,8.046-34.346c-2.816-9.789-13.012-17.323-22.542-19.795C152.899,69.175,141.27,73.43,133.457,81.887z'
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ minDuration = 2000, onFinish }) => {
  const { t } = useLanguage();
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsFadingOut(true), minDuration);
    const doneTimer = setTimeout(() => {
      setIsMounted(false);
      onFinish?.();
    }, minDuration + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [minDuration, onFinish]);

  if (!isMounted) return null;

  return (
    <div className={`splash-screen ${isFadingOut ? 'is-fading' : ''}`} data-testid="splash-screen" aria-hidden="true">
      <div className="splash-content">
        <div className="splash-logo">
          <svg viewBox="74 52 162 220" width="64" height="87">
            {RING_PATHS.map((d, i) => (
              <path key={d} className={`splash-ring splash-ring-${i}`} d={d} pathLength={1} />
            ))}
          </svg>
        </div>
        <div className="splash-brand">
          <span className="splash-title">{t.app.name}</span>
          <span className="splash-line">{t.app.brandLine}</span>
        </div>
        <div className="splash-dots">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
};
