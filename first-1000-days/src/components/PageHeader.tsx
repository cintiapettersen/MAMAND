import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  kicker: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  // Páginas internas (Cartão de Nascimento, Rede de Apoio) mostram o "Voltar"
  onBack?: () => void;
  backLabel?: string;
  // Ação opcional à direita (ex.: Exportar na Jornada)
  action?: React.ReactNode;
}

// Topo padrão de todas as páginas: etiqueta + título Nunito + subtítulo
export const PageHeader: React.FC<PageHeaderProps> = ({
  kicker,
  icon,
  title,
  subtitle,
  onBack,
  backLabel,
  action
}) => (
  <header className="page-header">
    {onBack && (
      <button type="button" onClick={onBack} className="page-back-btn">
        <ArrowLeft size={16} />
        <span>{backLabel}</span>
      </button>
    )}
    <div className="page-header-row">
      <div className="page-header-text">
        <div className="page-kicker">
          <span className="page-kicker-icon" aria-hidden="true">
            {icon}
          </span>
          <span>{kicker}</span>
        </div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  </header>
);

export default PageHeader;
