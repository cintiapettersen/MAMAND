import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getCountryOptions } from '../data/emergencyContacts';
import { getAllCountryOptions } from '../domain/countryNames';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.82rem',
  fontWeight: 600,
  color: 'var(--text-main)',
  marginBottom: '4px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: '0.88rem',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'var(--bg-main)',
  fontFamily: 'inherit',
  color: 'var(--text-main)'
};

interface NameFieldProps {
  value: string;
  onChange: (value: string) => void;
}

// Nome opcional da mãe: aparece na saudação da Home e na assinatura da cartinha
export const NameField: React.FC<NameFieldProps> = ({ value, onChange }) => {
  const { t } = useLanguage();
  return (
    <div>
      <label htmlFor="displayNameInput" style={labelStyle}>
        {t.region.nameLabel}
      </label>
      <input
        id="displayNameInput"
        type="text"
        value={value}
        maxLength={40}
        autoComplete="given-name"
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.region.namePlaceholder}
        className="input-field"
        style={inputStyle}
      />
    </div>
  );
};

interface CountryFieldProps {
  value: string;
  onChange: (value: string) => void;
}

// País para os números de emergência ('' = outro país / não informado)
export const CountryField: React.FC<CountryFieldProps> = ({ value, onChange }) => {
  const { language, t } = useLanguage();
  return (
    <div>
      <label htmlFor="countrySelect" style={labelStyle}>
        {t.region.countryLabel}
      </label>
      <select
        id="countrySelect"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
        style={inputStyle}
      >
        <option value="">{t.region.countryOther}</option>
        {getCountryOptions(language).map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
        {t.region.countryHelp}
      </p>
    </div>
  );
};

interface CareCountryFieldProps {
  value: string;
  onChange: (value: string) => void;
}

// País do acompanhamento de saúde ('' = prefiro não informar). Independente do país
// dos números de emergência e do idioma.
export const CareCountryField: React.FC<CareCountryFieldProps> = ({ value, onChange }) => {
  const { language, t } = useLanguage();
  const options = React.useMemo(() => getAllCountryOptions(language), [language]);
  return (
    <div>
      <label htmlFor="careCountrySelect" style={labelStyle}>
        {t.region.careCountryLabel}
      </label>
      <select
        id="careCountrySelect"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
        style={inputStyle}
      >
        <option value="">{t.region.careCountryNone}</option>
        {options.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
        {t.region.careCountryHelp}
      </p>
    </div>
  );
};
