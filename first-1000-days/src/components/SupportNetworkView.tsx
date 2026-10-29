import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SupportRequest } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getSupportCategories } from '../data/supportCatalog';
import { supportNetworkStorage } from '../services/supportNetworkStorage';
import { renderSupportLetter } from '../utils/supportLetter';
import { PageHeader } from './PageHeader';
import {
  ShieldCheck,
  Check,
  Plus,
  Calendar,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Share2,
  Copy,
  MessageCircle,
  HandHeart,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

interface SupportNetworkViewProps {
  onBack: () => void;
  motherName?: string;
}

type Step = 'choose' | 'list';

interface EditDraft {
  title: string;
  date: string;
  time: string;
  notes: string;
}

const createId = () => `support-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const SupportNetworkView: React.FC<SupportNetworkViewProps> = ({ onBack, motherName }) => {
  const { language, t } = useLanguage();
  const s = t.supportNetwork;
  const categories = useMemo(() => getSupportCategories(language), [language]);

  const [requests, setRequests] = useState<SupportRequest[]>(() => supportNetworkStorage.getRequests());
  const [step, setStep] = useState<Step>(() => (requests.length > 0 ? 'list' : 'choose'));
  const [customDraft, setCustomDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>({ title: '', date: '', time: '', notes: '' });
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [letterBlob, setLetterBlob] = useState<Blob | null>(null);
  const [letterUrl, setLetterUrl] = useState<string | null>(null);
  const [letterNotice, setLetterNotice] = useState<string | null>(null);
  const sharePanelRef = useRef<HTMLDivElement>(null);

  // Persistência local a cada alteração
  useEffect(() => {
    supportNetworkStorage.saveRequests(requests);
  }, [requests]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const pending = requests.filter((r) => r.status === 'pending');
  const done = requests.filter((r) => r.status === 'done');
  const customRequests = requests.filter((r) => !r.catalogId);

  // ---- Seleção (checkbox adiciona/remove direto da lista) ----
  const isCatalogSelected = (catalogId: string) => requests.some((r) => r.catalogId === catalogId);

  const toggleCatalogItem = (catalogId: string, label: string) => {
    setRequests((prev) =>
      prev.some((r) => r.catalogId === catalogId)
        ? prev.filter((r) => r.catalogId !== catalogId)
        : [
            ...prev,
            { id: createId(), catalogId, title: label, status: 'pending', createdAt: new Date().toISOString() }
          ]
    );
  };

  const addCustomRequest = () => {
    const title = customDraft.trim();
    if (!title) return;
    setRequests((prev) => [
      ...prev,
      { id: createId(), title, status: 'pending', createdAt: new Date().toISOString() }
    ]);
    setCustomDraft('');
  };

  // ---- Lista ----
  const removeRequest = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const toggleStatus = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: r.status === 'pending' ? 'done' : 'pending' } : r))
    );
  };

  // Troca de posição com o pedido pendente vizinho
  const movePending = (id: string, direction: -1 | 1) => {
    setRequests((prev) => {
      const pendingIndexes = prev.map((r, i) => (r.status === 'pending' ? i : -1)).filter((i) => i >= 0);
      const pos = pendingIndexes.findIndex((i) => prev[i].id === id);
      const target = pendingIndexes[pos + direction];
      if (pos < 0 || target === undefined) return prev;
      const next = [...prev];
      [next[pendingIndexes[pos]], next[target]] = [next[target], next[pendingIndexes[pos]]];
      return next;
    });
  };

  const startEditing = (req: SupportRequest) => {
    setEditingId(req.id);
    setEditDraft({ title: req.title, date: req.date || '', time: req.time || '', notes: req.notes || '' });
  };

  const saveEditing = () => {
    if (!editingId) return;
    setRequests((prev) =>
      prev.map((r) =>
        r.id === editingId
          ? {
              ...r,
              title: editDraft.title.trim() || r.title,
              date: editDraft.date || undefined,
              time: editDraft.time || undefined,
              notes: editDraft.notes.trim() || undefined
            }
          : r
      )
    );
    setEditingId(null);
  };

  // ---- Formatação e compartilhamento ----
  const formatWhen = (req: SupportRequest) => {
    const parts: string[] = [];
    if (req.date) {
      const [y, m, d] = req.date.split('-').map(Number);
      try {
        parts.push(
          new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'pt-BR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
          })
            .format(new Date(y, m - 1, d))
            .replace(/\./g, '')
        );
      } catch {
        parts.push(req.date);
      }
    }
    if (req.time) parts.push(`${s.atTime} ${req.time}`);
    return parts.join(' ');
  };

  const shareMessage = useMemo(() => {
    const lines = pending.map((r) => {
      const when = formatWhen(r);
      let line = `• ${r.title}${when ? ` — ${when}` : ''}`;
      if (r.notes) line += `\n   ${s.notesPrefix} ${r.notes}`;
      return line;
    });
    return `${s.shareIntro}\n\n${lines.join('\n')}\n\n${s.shareOutro}`;
  }, [pending, language]);

  // Gera a cartinha (imagem) sempre que o painel abre ou a lista muda
  useEffect(() => {
    if (!isShareOpen || pending.length === 0) return;
    let cancelled = false;
    let url: string | null = null;
    setLetterUrl(null);
    renderSupportLetter({
      overline: s.letterOverline,
      dateLabel: new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'pt-BR', { dateStyle: 'long' }).format(new Date()),
      greeting: s.letterGreeting,
      body: s.letterBody,
      listTitle: s.letterListTitle,
      items: pending.map((r) => ({ title: r.title, when: formatWhen(r) || undefined, notes: r.notes })),
      outro: s.shareOutro,
      signoff: s.letterSignoff,
      signature: motherName?.trim() || undefined,
      footer: s.letterFooter
    }).then((blob) => {
      if (cancelled || !blob) return;
      url = URL.createObjectURL(blob);
      setLetterBlob(blob);
      setLetterUrl(url);
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [isShareOpen, shareMessage, motherName]);

  useEffect(() => {
    if (isShareOpen) sharePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [isShareOpen]);

  const letterFileName = `rede_de_apoio_${new Date().toISOString().split('T')[0]}.png`;

  const saveLetter = () => {
    if (!letterUrl) return;
    const a = document.createElement('a');
    a.href = letterUrl;
    a.download = letterFileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Compartilhar nativamente (Web Share API) ou fallback para download
  const shareLetter = async () => {
    if (!letterBlob) return;
    setLetterNotice(null);
    const file = new File([letterBlob], letterFileName, { type: 'image/png' });
    try {
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: s.viewTitle, files: [file] });
      } else {
        saveLetter();
        setLetterNotice(s.letterSavedNotice);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        saveLetter();
        setLetterNotice(s.letterSavedNotice);
      }
    }
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
    } catch {
      // Fallback para navegadores sem Clipboard API
      const area = document.createElement('textarea');
      area.value = shareMessage;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const renderRequest = (req: SupportRequest, index: number, total: number) => {
    const isDone = req.status === 'done';
    const when = formatWhen(req);

    if (editingId === req.id) {
      return (
        <li key={req.id} className="support-item editing">
          <div className="birth-field-group">
            <label className="birth-field-label" htmlFor={`title-${req.id}`}>{s.fieldTitle}</label>
            <input
              id={`title-${req.id}`}
              className="birth-input"
              value={editDraft.title}
              onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
            />
          </div>
          <div className="support-edit-row">
            <div className="birth-field-group">
              <label className="birth-field-label" htmlFor={`date-${req.id}`}>
                {s.fieldDate} <span className="support-optional">({s.optionalHint})</span>
              </label>
              <input
                id={`date-${req.id}`}
                type="date"
                className="birth-input"
                value={editDraft.date}
                onChange={(e) => setEditDraft({ ...editDraft, date: e.target.value })}
              />
            </div>
            <div className="birth-field-group">
              <label className="birth-field-label" htmlFor={`time-${req.id}`}>
                {s.fieldTime} <span className="support-optional">({s.optionalHint})</span>
              </label>
              <input
                id={`time-${req.id}`}
                type="time"
                className="birth-input"
                value={editDraft.time}
                onChange={(e) => setEditDraft({ ...editDraft, time: e.target.value })}
              />
            </div>
          </div>
          <div className="birth-field-group">
            <label className="birth-field-label" htmlFor={`notes-${req.id}`}>
              {s.fieldNotes} <span className="support-optional">({s.optionalHint})</span>
            </label>
            <textarea
              id={`notes-${req.id}`}
              className="birth-textarea"
              rows={2}
              placeholder={s.notesPlaceholder}
              value={editDraft.notes}
              onChange={(e) => setEditDraft({ ...editDraft, notes: e.target.value })}
            />
          </div>
          <div className="support-edit-actions">
            <button type="button" className="support-text-btn danger" onClick={() => removeRequest(req.id)}>
              <Trash2 size={14} />
              <span>{s.removeBtn}</span>
            </button>
            <div className="support-edit-actions-right">
              <button type="button" className="support-pill-btn" onClick={() => setEditingId(null)}>
                {s.cancelBtn}
              </button>
              <button type="button" className="support-pill-btn primary" onClick={saveEditing}>
                {s.saveBtn}
              </button>
            </div>
          </div>
        </li>
      );
    }

    return (
      <li key={req.id} className={`support-item ${isDone ? 'done' : ''}`}>
        <div className="support-item-main">
          <button
            type="button"
            className="support-check"
            onClick={() => toggleStatus(req.id)}
            aria-label={isDone ? s.reopen : s.markDone}
            aria-pressed={isDone}
          >
            {isDone && <Check size={14} strokeWidth={3} />}
          </button>
          <div className="support-item-text">
            <span className="support-item-title">{req.title}</span>
            {when && (
              <span className="support-item-meta">
                <Calendar size={12} />
                {when}
              </span>
            )}
            {req.notes && <span className="support-item-notes">{req.notes}</span>}
          </div>
          <span className={`support-status ${isDone ? 'done' : ''}`}>
            {isDone ? s.statusDone : s.statusPending}
          </span>
        </div>
        <div className="support-item-actions">
          {isDone ? (
            <button type="button" className="support-text-btn" onClick={() => toggleStatus(req.id)}>
              {s.reopen}
            </button>
          ) : (
            <div className="support-item-actions-left">
              <button type="button" className="support-text-btn" onClick={() => startEditing(req)}>
                <Pencil size={13} />
                <span>{s.editBtn}</span>
              </button>
              {!req.date && !req.time && (
                <button type="button" className="support-text-btn accent" onClick={() => startEditing(req)}>
                  <Calendar size={13} />
                  <span>{s.addDateBtn}</span>
                </button>
              )}
            </div>
          )}
          <div className="support-item-actions-right">
            {!isDone && (
              <>
                <button
                  type="button"
                  className="support-icon-btn"
                  onClick={() => movePending(req.id, -1)}
                  disabled={index === 0}
                  aria-label={s.moveUp}
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  className="support-icon-btn"
                  onClick={() => movePending(req.id, 1)}
                  disabled={index === total - 1}
                  aria-label={s.moveDown}
                >
                  <ChevronDown size={16} />
                </button>
              </>
            )}
            <button
              type="button"
              className="support-icon-btn"
              onClick={() => removeRequest(req.id)}
              aria-label={s.removeBtn}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="content-area support-page">
      {/* 1. Topo padrão com retorno */}
      <PageHeader
        onBack={step === 'choose' && requests.length > 0 ? () => setStep('list') : onBack}
        backLabel={s.backBtn}
        kicker={s.letterListTitle}
        icon={<HandHeart size={13} />}
        title={s.viewTitle}
        subtitle={s.viewSubtitle}
      />

      <div className="birth-privacy-banner">
        <ShieldCheck size={18} />
        <p className="support-privacy-text">{s.privacyBanner}</p>
      </div>

      {step === 'choose' ? (
        <>
          {/* 2. Seleção de ajudas por categoria */}
          <div className="support-section-header">
            <h2 className="support-section-title">{s.chooseTitle}</h2>
            <p className="support-section-subtitle">{s.chooseSubtitle}</p>
          </div>

          {categories.map((category) => (
            <fieldset key={category.id} className="support-category">
              <legend className="support-category-title">{category.title}</legend>
              {category.items.map((item) => {
                const checked = isCatalogSelected(item.id);
                return (
                  <label key={item.id} className={`support-option ${checked ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCatalogItem(item.id, item.label)}
                    />
                    <span className="support-option-box" aria-hidden="true">
                      {checked && <Check size={13} strokeWidth={3} />}
                    </span>
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </fieldset>
          ))}

          {/* Pedido personalizado */}
          <fieldset className="support-category">
            <legend className="support-category-title">{s.customLabel}</legend>
            {customRequests.map((req) => (
              <label key={req.id} className="support-option checked">
                <input type="checkbox" checked onChange={() => removeRequest(req.id)} />
                <span className="support-option-box" aria-hidden="true">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span>{req.title}</span>
              </label>
            ))}
            <form
              className="support-custom-row"
              onSubmit={(e) => {
                e.preventDefault();
                addCustomRequest();
              }}
            >
              <input
                className="birth-input"
                placeholder={s.customPlaceholder}
                value={customDraft}
                onChange={(e) => setCustomDraft(e.target.value)}
                aria-label={s.customLabel}
              />
              <button type="submit" className="support-pill-btn" disabled={!customDraft.trim()}>
                <Plus size={14} />
                <span>{s.customAddBtn}</span>
              </button>
            </form>
          </fieldset>

          <div className="support-sticky-cta">
            <button
              type="button"
              className="btn btn-primary"
              disabled={requests.length === 0}
              onClick={() => setStep('list')}
            >
              {s.continueBtn}
              {requests.length > 0 && (
                <span className="support-count">{s.selectedCount.replace('{count}', String(requests.length))}</span>
              )}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* 3. Lista de ajuda */}
          <div className="support-section-header">
            <h2 className="support-section-title">{s.listTitle}</h2>
            <p className="support-section-subtitle">{s.listSubtitle}</p>
          </div>

          {requests.length === 0 ? (
            <div className="support-empty">
              <strong>{s.emptyTitle}</strong>
              <p>{s.emptyText}</p>
            </div>
          ) : (
            <>
              {pending.length > 0 && (
                <>
                  <h3 className="support-group-title">
                    {s.pendingSection} <span>{pending.length}</span>
                  </h3>
                  <ul className="support-list">
                    {pending.map((req, i) => renderRequest(req, i, pending.length))}
                  </ul>
                </>
              )}
              {done.length > 0 && (
                <>
                  <h3 className="support-group-title">
                    {s.doneSection} <span>{done.length}</span>
                  </h3>
                  <ul className="support-list">
                    {done.map((req, i) => renderRequest(req, i, done.length))}
                  </ul>
                </>
              )}
            </>
          )}

          <button type="button" className="btn btn-secondary support-add-more" onClick={() => setStep('choose')}>
            <Plus size={16} />
            <span>{s.addMoreBtn}</span>
          </button>

          {/* 4. Compartilhamento */}
          <div className="support-share">
            <button
              type="button"
              className={`btn ${isShareOpen ? 'btn-secondary' : 'btn-primary'}`}
              disabled={pending.length === 0}
              onClick={() => setIsShareOpen((open) => !open)}
            >
              {isShareOpen ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{isShareOpen ? s.hideLetterBtn : s.shareBtn}</span>
            </button>
            {pending.length === 0 && requests.length > 0 && (
              <p className="support-share-hint">{s.shareNothing}</p>
            )}

            {isShareOpen && pending.length > 0 && (
              <div className="support-share-panel" ref={sharePanelRef}>
                <span className="support-share-title">{s.letterSectionTitle}</span>
                <div className="support-letter-frame">
                  {letterUrl ? (
                    <img src={letterUrl} alt={s.letterSectionTitle} className="support-letter-img" />
                  ) : (
                    <p className="support-letter-loading">{s.letterGenerating}</p>
                  )}
                </div>
                <p className="support-share-hint">{s.letterHint}</p>
                <div className="support-share-actions">
                  <button type="button" className="btn btn-primary" onClick={shareLetter} disabled={!letterUrl}>
                    <Share2 size={16} />
                    <span>{s.letterShareBtn}</span>
                  </button>
                  <button type="button" className="support-share-btn" onClick={saveLetter} disabled={!letterUrl}>
                    <Download size={16} />
                    <span>{s.letterSaveBtn}</span>
                  </button>
                </div>
                {letterNotice && <p className="support-share-hint">{letterNotice}</p>}

                <div className="support-text-options">
                  <span className="support-text-options-title">{s.textOptionsTitle}</span>
                  <div className="support-text-options-row">
                    <a
                      className="support-text-btn"
                      href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle size={14} />
                      <span>{s.shareWhatsApp}</span>
                    </a>
                    <button type="button" className="support-text-btn" onClick={copyMessage}>
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copied ? s.shareCopied : s.shareCopy}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SupportNetworkView;
