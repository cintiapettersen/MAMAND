import React, { useState, useRef, useMemo } from 'react';
import { UserProfile, BirthRecord, BirthCardSettings, BloodType, DeliveryType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { birthRecordStorage } from '../services/birthRecordStorage';
import { PageHeader } from './PageHeader';
import { validateBirthDate, birthDateBounds } from '../utils/dateUtils';
import {
  Baby,
  ClipboardList,
  Clock,
  MapPin,
  Scale,
  Ruler,
  ShieldCheck,
  AlertTriangle,
  Download,
  Share2,
  Check,
  Sparkles,
  Info,
  Camera,
  RotateCcw
} from 'lucide-react';

interface BirthRecordViewProps {
  profile: UserProfile;
  onBack: () => void;
  onProfileUpdated?: (updatedProfile: UserProfile) => void;
}

export const BirthRecordView: React.FC<BirthRecordViewProps> = ({
  profile,
  onBack,
  onProfileUpdated
}) => {
  const { language, t } = useLanguage();

  // Carrega ou inicializa a ficha de nascimento
  const [record, setRecord] = useState<BirthRecord>(() =>
    birthRecordStorage.getBirthRecord(profile)
  );

  const [activeTab, setActiveTab] = useState<'details' | 'card'>('details');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Configurações de exibição no cartão comemorativo
  const [cardSettings, setCardSettings] = useState<BirthCardSettings>({
    showTime: true,
    showWeight: true,
    showLength: true,
    showLocation: true,
    showHospital: true
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [babyPhotoUrl, setBabyPhotoUrl] = useState<string | null>(null);

  // Carrega a foto localmente e recorta em quadrado central leve (sem envio a servidor)
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null;
      if (!dataUrl) return;
      const img = new Image();
      img.onload = () => {
        const size = 600;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setBabyPhotoUrl(dataUrl);
          return;
        }
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        setBabyPhotoUrl(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const birthLimits = birthDateBounds();
  const birthError = record.birthDate ? validateBirthDate(record.birthDate) : null;
  const de = t.onboarding?.dateErrors;
  const birthErrorText = birthError === 'future'
    ? (de?.birthFuture || (language === 'en' ? 'Date of birth cannot be in the future.' : 'A data de nascimento não pode ser no futuro.'))
    : birthError === 'tooOld'
    ? (de?.birthTooOld || (language === 'en' ? 'Child age exceeds 5 years.' : 'A idade informada ultrapassa 5 anos.'))
    : birthError
    ? (de?.birthInvalid || (language === 'en' ? 'Invalid date.' : 'Data inválida.'))
    : null;

  // Manipulação de campos do formulário
  const handleChange = (field: keyof BirthRecord, value: any) => {
    setRecord((prev) => ({
      ...prev,
      [field]: value
    }));
    setSaveSuccess(false);
  };

  // Salvar ficha
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (birthError) return;
    birthRecordStorage.saveBirthRecord(record, true);
    setSaveSuccess(true);

    if (onProfileUpdated && (record.babyName || (record.birthDate && !birthError))) {
      onProfileUpdated({
        ...profile,
        babyName: record.babyName || profile.babyName,
        birthDate: (!birthError && record.birthDate) ? record.birthDate : profile.birthDate,
        updatedAt: new Date().toISOString()
      });
    }

    setTimeout(() => {
      setSaveSuccess(false);
    }, 4000);
  };

  // Formatação de data amigável por extenso
  const formattedDate = useMemo(() => {
    if (!record.birthDate) return '';
    try {
      const [y, m, d] = record.birthDate.split('-').map(Number);
      if (!y || !m || !d) return record.birthDate;
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString(language === 'en' ? 'en-US' : 'pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return record.birthDate;
    }
  }, [record.birthDate, language]);

  // Formatação de peso inteligente (suporta 3300, 3.3, 3,3, 3.45 kg, etc.)
  const formattedWeight = useMemo(() => {
    if (!record.weightGrams) return '';
    const raw = String(record.weightGrams).trim();
    if (!raw) return '';

    const normalized = raw.replace(',', '.');
    const decimalMatch = normalized.match(/^(\d+)\.(\d+)/);
    let grams: number | null = null;

    if (decimalMatch) {
      const intPart = parseInt(decimalMatch[1], 10);
      const decStr = decimalMatch[2];
      if (decStr.length === 3) {
        grams = intPart * 1000 + parseInt(decStr, 10);
      } else if (decStr.length <= 2 && intPart < 15) {
        const decPadded = (decStr + '00').slice(0, 3);
        grams = intPart * 1000 + parseInt(decPadded, 10);
      } else {
        grams = intPart * 1000 + parseInt((decStr + '000').slice(0, 3), 10);
      }
    } else {
      const digitsOnly = raw.replace(/[^\d]/g, '');
      const num = Number(digitsOnly);
      if (num) {
        if (num >= 1 && num <= 10) {
          grams = num * 1000;
        } else if (num > 10 && num <= 99) {
          grams = num * 100;
        } else {
          grams = num;
        }
      }
    }

    if (grams && grams >= 400 && grams <= 9000) {
      const formatted = grams.toLocaleString(language === 'en' ? 'en-US' : 'pt-BR');
      return `${formatted} g`;
    }

    return raw;
  }, [record.weightGrams, language]);

  // Localização formatada
  const formattedLocation = useMemo(() => {
    const parts = [record.city, record.country].filter(Boolean);
    return parts.join(', ');
  }, [record.city, record.country]);

  // Geração de imagem PNG em alta resolução via Canvas nativo
  const generatePngBlob = async (): Promise<Blob | null> => {
    const width = 1080;
    const height = 1480;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fundo acolhedor quente
    ctx.fillStyle = '#FDFBF7';
    ctx.fillRect(0, 0, width, height);

    // Moldura decorativa delicada
    ctx.strokeStyle = '#EAD8C7';
    ctx.lineWidth = 4;
    ctx.strokeRect(36, 36, width - 72, height - 72);

    // Borda interna pontilhada suave
    ctx.strokeStyle = '#F0E4D8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(48, 48, width - 96, height - 96);

    // Cabeçalho editorial
    ctx.textAlign = 'center';

    // Overline
    ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#9B5E46';
    ctx.letterSpacing = '3px';
    ctx.fillText(t.birthRecord.cardOverline.toUpperCase(), width / 2, 120);

    // Título
    ctx.font = 'bold 58px Georgia, "Playfair Display", -apple-system, serif';
    ctx.fillStyle = '#2C3E30';
    ctx.fillText(t.birthRecord.cardTitle, width / 2, 195);

    // Subtítulo
    ctx.font = 'italic 26px Georgia, serif';
    ctx.fillStyle = '#7A6F68';
    ctx.fillText(t.birthRecord.cardSubtitle, width / 2, 245);

    // Ilustração central: foto circular do bebê (se enviada) ou ilustração botânica com berço
    const centerX = width / 2;
    const centerY = 410;
    let photoRendered = false;

    if (babyPhotoUrl) {
      try {
        const photoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = babyPhotoUrl;
        });
        const radius = 128;
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        const side = Math.min(photoImg.width, photoImg.height);
        const sx = (photoImg.width - side) / 2;
        const sy = (photoImg.height - side) / 2;
        ctx.drawImage(
          photoImg,
          sx,
          sy,
          side,
          side,
          centerX - radius,
          centerY - radius,
          radius * 2,
          radius * 2
        );
        ctx.restore();

        ctx.strokeStyle = '#EAD8C7';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        photoRendered = true;
      } catch {
        photoRendered = false;
      }
    }

    if (!photoRendered) {
      // Fundo suave da ilustração
      ctx.fillStyle = '#F4ECE4';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 280, 140, 0, 0, Math.PI * 2);
      ctx.fill();

      // Raminhos botânicos laterais (verde sálvia e folhas suaves)
      ctx.strokeStyle = '#5E8068';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      // Ramo esquerdo
      ctx.beginPath();
      ctx.moveTo(centerX - 120, centerY + 30);
      ctx.quadraticCurveTo(centerX - 240, centerY - 20, centerX - 300, centerY - 80);
      ctx.stroke();

      // Folhinhas esquerdas
      ctx.fillStyle = '#7E9F88';
      for (let i = 0; i < 5; i++) {
        const lx = centerX - 150 - i * 30;
        const ly = centerY + 10 - i * 18;
        ctx.beginPath();
        ctx.ellipse(lx, ly, 16, 9, -0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ramo direito
      ctx.beginPath();
      ctx.moveTo(centerX + 120, centerY + 30);
      ctx.quadraticCurveTo(centerX + 240, centerY - 20, centerX + 300, centerY - 80);
      ctx.stroke();

      // Folhinhas direitas
      for (let i = 0; i < 5; i++) {
        const rx = centerX + 150 + i * 30;
        const ry = centerY + 10 - i * 18;
        ctx.beginPath();
        ctx.ellipse(rx, ry, 16, 9, 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Berço acolhedor central estilizado
      ctx.strokeStyle = '#9B5E46';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(centerX - 90, centerY - 45, 180, 90, 16);
      ctx.stroke();
      ctx.fillStyle = '#FFFDF9';
      ctx.fill();

      // Cabeceira do berço
      ctx.beginPath();
      ctx.moveTo(centerX - 90, centerY - 65);
      ctx.lineTo(centerX - 90, centerY + 45);
      ctx.moveTo(centerX + 90, centerY - 65);
      ctx.lineTo(centerX + 90, centerY + 45);
      ctx.stroke();

      // Coração coral de acolhimento
      ctx.fillStyle = '#C76B50';
      ctx.beginPath();
      const hx = centerX;
      const hy = centerY - 5;
      ctx.moveTo(hx, hy);
      ctx.bezierCurveTo(hx - 14, hy - 14, hx - 24, hy + 4, hx, hy + 24);
      ctx.bezierCurveTo(hx + 24, hy + 4, hx + 14, hy - 14, hx, hy);
      ctx.fill();
    }

    // Nome do bebê
    const babyNameText = record.babyName?.trim() || (language === 'en' ? 'Our Baby' : 'Nosso Bebê');
    ctx.font = 'bold 54px Georgia, serif';
    ctx.fillStyle = '#2C3E30';
    ctx.fillText(babyNameText, width / 2, 620);

    // Data por extenso
    if (formattedDate) {
      ctx.font = '500 28px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#9B5E46';
      ctx.fillText(formattedDate, width / 2, 675);
    }

    // Grid 2x2 de cartões de medidas e dados
    const activeCards: { label: string; value: string }[] = [];
    if (cardSettings.showTime && record.birthTime) {
      activeCards.push({ label: t.birthRecord.labelTime, value: record.birthTime });
    }
    if (cardSettings.showWeight && formattedWeight) {
      activeCards.push({ label: t.birthRecord.labelWeight, value: formattedWeight });
    }
    if (cardSettings.showLength && record.lengthCm) {
      const len = String(record.lengthCm).includes('cm') ? String(record.lengthCm) : `${record.lengthCm} cm`;
      activeCards.push({ label: t.birthRecord.labelLength, value: len });
    }
    if (cardSettings.showLocation && formattedLocation) {
      activeCards.push({ label: t.birthRecord.labelCity, value: formattedLocation });
    }

    const gridStartY = 730;
    const boxW = 440;
    const boxH = 150;
    const gapX = 40;
    const gapY = 24;

    activeCards.slice(0, 4).forEach((c, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const bx = width / 2 - boxW - gapX / 2 + col * (boxW + gapX);
      const by = gridStartY + row * (boxH + gapY);

      // Fundo branco do card
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#EDE3D8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, 18);
      ctx.fill();
      ctx.stroke();

      // Rótulo
      ctx.font = '500 20px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#8C7D73';
      ctx.textAlign = 'center';
      ctx.fillText(c.label.toUpperCase(), bx + boxW / 2, by + 50);

      // Valor
      ctx.font = 'bold 36px Georgia, serif';
      ctx.fillStyle = '#2C3E30';
      ctx.fillText(c.value, bx + boxW / 2, by + 105);
    });

    // Rodapé de Hospital
    let footerY = 1110;
    if (cardSettings.showHospital && record.hospitalName) {
      ctx.textAlign = 'center';
      ctx.font = '500 20px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#9B5E46';
      ctx.fillText(t.birthRecord.labelHospital.toUpperCase(), width / 2, footerY);

      ctx.font = '600 30px Georgia, serif';
      ctx.fillStyle = '#2C3E30';
      ctx.fillText(record.hospitalName, width / 2, footerY + 44);
      footerY += 100;
    }

    // Assinatura discreta de governança
    ctx.textAlign = 'center';
    ctx.font = '500 18px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#A89B91';
    ctx.letterSpacing = '1.5px';
    ctx.fillText(t.birthRecord.cardFooter, width / 2, 1420);

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  };

  // Exportar como arquivo PNG
  const handleExportPng = async () => {
    setIsExporting(true);
    setExportNotice(null);
    try {
      const blob = await generatePngBlob();
      if (!blob) throw new Error(t.birthRecord.imageError);

      const url = URL.createObjectURL(blob);
      const safeName = (record.babyName || t.birthRecord.fileBabyFallback)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .slice(0, 20);
      const filename = `${t.birthRecord.filePrefix}_${safeName}.png`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportNotice(err?.message || t.birthRecord.exportError);
    } finally {
      setIsExporting(false);
    }
  };

  // Compartilhar nativamente (Web Share API) ou fallback para download
  const handleShare = async () => {
    setIsExporting(true);
    setExportNotice(null);
    try {
      const blob = await generatePngBlob();
      if (!blob) throw new Error(t.birthRecord.imageError);

      const safeName = (record.babyName || t.birthRecord.fileBabyFallback)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .slice(0, 20);
      const file = new File([blob], `${t.birthRecord.filePrefix}_${safeName}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: t.birthRecord.cardTitle,
          text: `${record.babyName || t.birthRecord.homeCardTitle} • ${formattedDate}`,
          files: [file]
        });
      } else {
        // Fallback para download direto
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${t.birthRecord.filePrefix}_${safeName}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setExportNotice(t.birthRecord.shareUnavailableNotice);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setExportNotice(err?.message || t.birthRecord.shareError);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="birth-record-page">
      {/* 1. Topo padrão com Navegação de Retorno */}
      <PageHeader
        onBack={onBack}
        backLabel={t.birthRecord.backBtn}
        kicker={t.birthRecord.homeCardBadge}
        icon={<Baby size={13} />}
        title={t.birthRecord.viewTitle}
        subtitle={t.birthRecord.viewSubtitle}
      />

      {/* 2. Banner de Privacidade Local-First */}
      <div className="birth-privacy-banner">
        <ShieldCheck size={18} className="birth-privacy-icon" />
        <p className="birth-privacy-text">{t.birthRecord.privacyBanner}</p>
      </div>

      {/* 3. Seletor de Abas (Ficha | Cartão) */}
      <div className="birth-tabs-container">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`birth-tab-btn tab-details ${activeTab === 'details' ? 'active' : ''}`}
          aria-pressed={activeTab === 'details'}
        >
          <ClipboardList size={16} />
          <span>{t.birthRecord.tabDetails}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('card')}
          className={`birth-tab-btn tab-card ${activeTab === 'card' ? 'active' : ''}`}
          aria-pressed={activeTab === 'card'}
        >
          <Sparkles size={16} />
          <span>{t.birthRecord.tabCard}</span>
        </button>
      </div>

      {/* Notificação de sucesso ao salvar */}
      {saveSuccess && (
        <div className="birth-toast-success">
          <Check size={18} />
          <span>{t.birthRecord.savedSuccess}</span>
        </div>
      )}

      {/* 4. CONTEÚDO DA ABA 1: FICHA DE NASCIMENTO */}
      {activeTab === 'details' && (
        <form onSubmit={handleSave} className="birth-form-container">
          {/* Seção 1: Dados Principais */}
          <div className="birth-form-section">
            <h2 className="birth-section-title">{t.birthRecord.sectionGeneral}</h2>

            <div className="birth-field-group">
              <label className="birth-field-label" htmlFor="birthBabyName">
                {t.birthRecord.babyNameLabel}
              </label>
              <input
                id="birthBabyName"
                type="text"
                value={record.babyName || ''}
                onChange={(e) => handleChange('babyName', e.target.value)}
                placeholder={t.birthRecord.babyNamePlaceholder}
                className="birth-input"
              />
            </div>

            <div className="birth-grid-2">
              <div className="birth-field-group">
                <label className="birth-field-label" htmlFor="birthDate">
                  {t.birthRecord.birthDateLabel}
                </label>
                <input
                  id="birthDate"
                  type="date"
                  value={record.birthDate || ''}
                  onChange={(e) => handleChange('birthDate', e.target.value)}
                  min={birthLimits.min}
                  max={birthLimits.max}
                  aria-invalid={!!birthErrorText}
                  aria-describedby={birthErrorText ? 'birthDateError' : undefined}
                  className="birth-input"
                />
                {birthErrorText && (
                  <span id="birthDateError" style={{ color: '#D9534F', fontSize: '0.8rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={14} />
                    {birthErrorText}
                  </span>
                )}
              </div>

              <div className="birth-field-group">
                <label className="birth-field-label" htmlFor="birthTime">
                  {t.birthRecord.birthTimeLabel}
                </label>
                <input
                  id="birthTime"
                  type="time"
                  value={record.birthTime || ''}
                  onChange={(e) => handleChange('birthTime', e.target.value)}
                  placeholder={t.birthRecord.birthTimePlaceholder}
                  className="birth-input"
                />
              </div>
            </div>

            <div className="birth-field-group">
              <label className="birth-field-label" htmlFor="birthHospital">
                {t.birthRecord.hospitalLabel}
              </label>
              <input
                id="birthHospital"
                type="text"
                value={record.hospitalName || ''}
                onChange={(e) => handleChange('hospitalName', e.target.value)}
                placeholder={t.birthRecord.hospitalPlaceholder}
                className="birth-input"
              />
            </div>

            <div className="birth-grid-2">
              <div className="birth-field-group">
                <label className="birth-field-label" htmlFor="birthCity">
                  {t.birthRecord.cityLabel}
                </label>
                <input
                  id="birthCity"
                  type="text"
                  value={record.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder={t.birthRecord.cityPlaceholder}
                  className="birth-input"
                />
              </div>

              <div className="birth-field-group">
                <label className="birth-field-label" htmlFor="birthCountry">
                  {t.birthRecord.countryLabel}
                </label>
                <input
                  id="birthCountry"
                  type="text"
                  value={record.country || ''}
                  onChange={(e) => handleChange('country', e.target.value)}
                  placeholder={t.birthRecord.countryPlaceholder}
                  className="birth-input"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Medidas ao Nascer */}
          <div className="birth-form-section">
            <h2 className="birth-section-title">{t.birthRecord.sectionMeasurements}</h2>

            <div className="birth-grid-3">
              <div className="birth-field-group">
                <label className="birth-field-label" htmlFor="birthWeight">
                  {t.birthRecord.weightLabel}
                </label>
                <input
                  id="birthWeight"
                  type="text"
                  value={record.weightGrams || ''}
                  onChange={(e) => handleChange('weightGrams', e.target.value)}
                  placeholder={t.birthRecord.weightPlaceholder}
                  className="birth-input"
                />
              </div>

              <div className="birth-field-group">
                <label className="birth-field-label" htmlFor="birthLength">
                  {t.birthRecord.lengthLabel}
                </label>
                <input
                  id="birthLength"
                  type="text"
                  value={record.lengthCm || ''}
                  onChange={(e) => handleChange('lengthCm', e.target.value)}
                  placeholder={t.birthRecord.lengthPlaceholder}
                  className="birth-input"
                />
              </div>

              <div className="birth-field-group">
                <label className="birth-field-label" htmlFor="birthHead">
                  {t.birthRecord.headCircumferenceLabel}
                </label>
                <input
                  id="birthHead"
                  type="text"
                  value={record.headCircumferenceCm || ''}
                  onChange={(e) => handleChange('headCircumferenceCm', e.target.value)}
                  placeholder={t.birthRecord.headCircumferencePlaceholder}
                  className="birth-input"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Informações de Saúde e Parto (Privadas) */}
          <div className="birth-form-section clinical-section">
            <div className="clinical-header">
              <h2 className="birth-section-title">{t.birthRecord.sectionClinical}</h2>
              <div className="clinical-badge">
                <ShieldCheck size={14} />
                <span>{t.birthRecord.privateBadge}</span>
              </div>
            </div>

            <p className="clinical-privacy-hint">
              {t.birthRecord.clinicalPrivacyNotice}
            </p>

            <div className="birth-grid-2">
              <div className="birth-field-group">
                <label className="birth-field-label" htmlFor="birthDeliveryType">
                  {t.birthRecord.deliveryTypeLabel}
                </label>
                <select
                  id="birthDeliveryType"
                  value={record.deliveryType || ''}
                  onChange={(e) => handleChange('deliveryType', e.target.value as DeliveryType)}
                  className="birth-select"
                >
                  <option value="">{t.birthRecord.deliveryOptions.none}</option>
                  <option value="vaginal">{t.birthRecord.deliveryOptions.vaginal}</option>
                  <option value="cesarean">{t.birthRecord.deliveryOptions.cesarean}</option>
                  <option value="forceps">{t.birthRecord.deliveryOptions.forceps}</option>
                  <option value="other">{t.birthRecord.deliveryOptions.other}</option>
                </select>
              </div>

              <div className="birth-field-group">
                <label className="birth-field-label" htmlFor="birthBloodType">
                  {t.birthRecord.bloodTypeLabel}
                </label>
                <select
                  id="birthBloodType"
                  value={record.bloodType || ''}
                  onChange={(e) => handleChange('bloodType', e.target.value as BloodType)}
                  className="birth-select"
                >
                  <option value="">{t.birthRecord.bloodTypeOptions.none}</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="unknown">{t.birthRecord.bloodTypeOptions.unknown}</option>
                </select>
              </div>
            </div>

            <div className="birth-field-group">
              <label className="birth-field-label" htmlFor="birthAllergies">
                {t.birthRecord.allergiesLabel}
              </label>
              <input
                id="birthAllergies"
                type="text"
                value={record.allergies || ''}
                onChange={(e) => handleChange('allergies', e.target.value)}
                placeholder={t.birthRecord.allergiesPlaceholder}
                className="birth-input"
              />
              <div className="allergies-disclaimer-box">
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{t.birthRecord.allergiesDisclaimer}</span>
              </div>
            </div>

            <div className="birth-field-group">
              <label className="birth-field-label" htmlFor="birthHealthConditions">
                {t.birthRecord.healthConditionsLabel}
              </label>
              <textarea
                id="birthHealthConditions"
                value={record.healthConditions || ''}
                onChange={(e) => handleChange('healthConditions', e.target.value)}
                placeholder={t.birthRecord.healthConditionsPlaceholder}
                rows={2}
                className="birth-textarea"
              />
            </div>
          </div>

          {/* Botão de Salvar */}
          <div className="birth-form-actions">
            <button type="submit" disabled={!!birthError} className="birth-save-btn">
              <Check size={18} />
              <span>{t.birthRecord.saveBtn}</span>
            </button>
          </div>
        </form>
      )}

      {/* 5. CONTEÚDO DA ABA 2: CARTÃO COMEMORATIVO COMPARTILHÁVEL */}
      {activeTab === 'card' && (
        <div className="birth-card-tab-content">
          {/* Caixa de Customização */}
          <div className="birth-customize-panel">
            <h3 className="customize-panel-title">{t.birthRecord.customizeTitle}</h3>
            <p className="customize-panel-desc">{t.birthRecord.customizeDesc}</p>

            <div className="customize-toggles-grid">
              <label className="customize-toggle-item">
                <input
                  type="checkbox"
                  checked={cardSettings.showTime}
                  onChange={(e) =>
                    setCardSettings((prev) => ({ ...prev, showTime: e.target.checked }))
                  }
                />
                <span>{t.birthRecord.toggleTime}</span>
              </label>

              <label className="customize-toggle-item">
                <input
                  type="checkbox"
                  checked={cardSettings.showWeight}
                  onChange={(e) =>
                    setCardSettings((prev) => ({ ...prev, showWeight: e.target.checked }))
                  }
                />
                <span>{t.birthRecord.toggleWeight}</span>
              </label>

              <label className="customize-toggle-item">
                <input
                  type="checkbox"
                  checked={cardSettings.showLength}
                  onChange={(e) =>
                    setCardSettings((prev) => ({ ...prev, showLength: e.target.checked }))
                  }
                />
                <span>{t.birthRecord.toggleLength}</span>
              </label>

              <label className="customize-toggle-item">
                <input
                  type="checkbox"
                  checked={cardSettings.showLocation}
                  onChange={(e) =>
                    setCardSettings((prev) => ({ ...prev, showLocation: e.target.checked }))
                  }
                />
                <span>{t.birthRecord.toggleLocation}</span>
              </label>

              <label className="customize-toggle-item">
                <input
                  type="checkbox"
                  checked={cardSettings.showHospital}
                  onChange={(e) =>
                    setCardSettings((prev) => ({ ...prev, showHospital: e.target.checked }))
                  }
                />
                <span>{t.birthRecord.toggleHospital}</span>
              </label>
            </div>

            {/* Opção de foto circular do bebê */}
            <div className="customize-photo-row">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="btn btn-secondary customize-photo-btn"
              >
                <Camera size={15} />
                <span>{babyPhotoUrl ? t.birthRecord.changePhotoBtn : t.birthRecord.addPhotoBtn}</span>
              </button>
              {babyPhotoUrl && (
                <button
                  type="button"
                  onClick={() => setBabyPhotoUrl(null)}
                  className="btn btn-secondary customize-photo-reset"
                >
                  <RotateCcw size={14} />
                  <span>{t.birthRecord.removePhotoBtn}</span>
                </button>
              )}
              <span className="customize-photo-hint">{t.birthRecord.photoHint}</span>
            </div>
          </div>

          {/* O Cartão Visual Inspirado na Referência */}
          <div className="commemorative-card-wrapper">
            <div ref={cardRef} className="commemorative-card-preview">
              <div className="card-header-editorial">
                <span className="card-overline">{t.birthRecord.cardOverline}</span>
                <h2 className="card-title">{t.birthRecord.cardTitle}</h2>
                <p className="card-subtitle">{t.birthRecord.cardSubtitle}</p>
              </div>

              {/* Vinheta Artística: Foto circular do bebê (se enviada) ou ilustração botânica */}
              <div className="card-artwork-frame">
                {babyPhotoUrl ? (
                  <div className="card-baby-photo-circle">
                    <img
                      src={babyPhotoUrl}
                      alt={record.babyName?.trim() || (language === 'en' ? 'Baby photo' : 'Foto do bebê')}
                      className="card-baby-photo-img"
                    />
                  </div>
                ) : (
                  <div className="card-botanical-bg">
                    <svg
                      viewBox="0 0 280 140"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="card-botanical-svg"
                      aria-hidden="true"
                    >
                      {/* Folhagens suaves e elementos aconchegantes */}
                      <ellipse cx="140" cy="70" rx="130" ry="60" fill="#F4ECE4" />
                      {/* Ramo verde sálvia esquerdo */}
                      <path
                        d="M80 85 C40 70 20 40 10 20"
                        stroke="#5E8068"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <ellipse cx="45" cy="62" rx="10" ry="5.5" transform="rotate(-30 45 62)" fill="#7E9F88" />
                      <ellipse cx="25" cy="40" rx="9" ry="5" transform="rotate(-40 25 40)" fill="#7E9F88" />
                      {/* Ramo verde sálvia direito */}
                      <path
                        d="M200 85 C240 70 260 40 270 20"
                        stroke="#5E8068"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <ellipse cx="235" cy="62" rx="10" ry="5.5" transform="rotate(30 235 62)" fill="#7E9F88" />
                      <ellipse cx="255" cy="40" rx="9" ry="5" transform="rotate(40 255 40)" fill="#7E9F88" />
                      {/* Berço em madeira delicada */}
                      <rect x="95" y="45" width="90" height="48" rx="8" stroke="#9B5E46" strokeWidth="2.5" fill="#FFFDF9" />
                      <line x1="95" y1="35" x2="95" y2="93" stroke="#9B5E46" strokeWidth="2.5" />
                      <line x1="185" y1="35" x2="185" y2="93" stroke="#9B5E46" strokeWidth="2.5" />
                      {/* Pequeno coração coral central */}
                      <path
                        d="M140 62 C135 55 127 61 140 73 C153 61 145 55 140 62 Z"
                        fill="#C76B50"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Nome e Data */}
              <div className="card-identity-block">
                <h3 className="card-baby-name">
                  {record.babyName?.trim() || (language === 'en' ? 'Our Baby' : 'Nosso Bebê')}
                </h3>
                {formattedDate && <p className="card-birth-date">{formattedDate}</p>}
              </div>

              {/* Grid 2x2 com cards de detalhes */}
              <div className="card-metrics-grid">
                {cardSettings.showTime && record.birthTime && (
                  <div className="card-metric-box">
                    <div className="metric-box-icon">
                      <Clock size={16} />
                    </div>
                    <span className="metric-box-label">{t.birthRecord.labelTime}</span>
                    <strong className="metric-box-value">{record.birthTime}</strong>
                  </div>
                )}

                {cardSettings.showWeight && formattedWeight && (
                  <div className="card-metric-box">
                    <div className="metric-box-icon">
                      <Scale size={16} />
                    </div>
                    <span className="metric-box-label">{t.birthRecord.labelWeight}</span>
                    <strong className="metric-box-value">{formattedWeight}</strong>
                  </div>
                )}

                {cardSettings.showLength && record.lengthCm && (
                  <div className="card-metric-box">
                    <div className="metric-box-icon">
                      <Ruler size={16} />
                    </div>
                    <span className="metric-box-label">{t.birthRecord.labelLength}</span>
                    <strong className="metric-box-value">
                      {String(record.lengthCm).includes('cm')
                        ? String(record.lengthCm)
                        : `${record.lengthCm} cm`}
                    </strong>
                  </div>
                )}

                {cardSettings.showLocation && formattedLocation && (
                  <div className="card-metric-box">
                    <div className="metric-box-icon">
                      <MapPin size={16} />
                    </div>
                    <span className="metric-box-label">{t.birthRecord.labelCity}</span>
                    <strong className="metric-box-value">{formattedLocation}</strong>
                  </div>
                )}
              </div>

              {/* Hospital de Nascimento */}
              {cardSettings.showHospital && record.hospitalName && (
                <div className="card-hospital-footer">
                  <span className="hospital-footer-label">{t.birthRecord.labelHospital}</span>
                  <p className="hospital-footer-name">{record.hospitalName}</p>
                </div>
              )}

              {/* Rodapé discreto */}
              <div className="card-watermark">
                <span>{t.birthRecord.cardFooter}</span>
              </div>
            </div>
          </div>

          {/* Aviso sobre compartilhamento */}
          {exportNotice && (
            <div className="birth-toast-notice">
              <Info size={16} style={{ flexShrink: 0 }} />
              <span>{exportNotice}</span>
            </div>
          )}

          {/* Botões de Ação de Compartilhamento */}
          <div className="card-export-actions">
            <button
              type="button"
              onClick={handleExportPng}
              disabled={isExporting}
              className="card-action-btn btn-secondary"
            >
              <Download size={18} />
              <span>{isExporting ? t.birthRecord.generatingImage : t.birthRecord.exportPngBtn}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              disabled={isExporting}
              className="card-action-btn btn-primary"
            >
              <Share2 size={18} />
              <span>{t.birthRecord.shareBtn}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
