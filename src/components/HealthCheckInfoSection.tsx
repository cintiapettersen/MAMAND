import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { CareCountryField } from './ProfileFields';
import { careCountryPrompt } from '../services/careCountryPrompt';
import { countryName } from '../domain/countryNames';
import {
  catalogEntriesFor,
  type CatalogEntryView,
  type HealthCheckCatalog,
  type HealthCheckCatalogEntry,
  type HealthCheckRecord,
  type HealthCheckSubject
} from '../domain/healthChecks';

// "Informações sobre exames": explica para que serve o país de acompanhamento e mostra
// a lista educativa do país só se houver catálogo aprovado clinicamente, com direitos
// confirmados (catalogEntriesFor). Sem lista, a ausência é explicada sem tom de erro.

interface HealthCheckInfoSectionProps {
  careCountry?: string;
  subject: HealthCheckSubject;
  records: HealthCheckRecord[];
  catalogs: HealthCheckCatalog[];
  onSaveCountry: (code: string) => void;
  onRegister: (view: CatalogEntryView) => void;
}

const formatIsoDate = (iso: string | undefined, lang: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y) return iso;
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString(lang === 'en' ? 'en-GB' : 'pt-BR', d ? { day: 'numeric', month: 'short', year: 'numeric' } : { year: 'numeric' });
};

export const HealthCheckInfoSection: React.FC<HealthCheckInfoSectionProps> = ({
  careCountry,
  subject,
  records,
  catalogs,
  onSaveCountry,
  onRegister
}) => {
  const { language, t } = useLanguage();
  const h = t.healthChecks;
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState(careCountry ?? '');
  const [saved, setSaved] = useState(false);
  const [showFullInvite, setShowFullInvite] = useState(() => careCountryPrompt.shouldShow(!!careCountry));
  const [expanded, setExpanded] = useState<string | null>(null);
  const [indicationOpen, setIndicationOpen] = useState(false);

  const name = countryName(careCountry, language);
  const entries = careCountry ? catalogEntriesFor(catalogs, { careCountry, lang: language }, subject, records) : { routine: [], byIndication: [] };
  const hasCatalog = entries.routine.length + entries.byIndication.length > 0;
  const usedCatalogs = [...new Map([...entries.routine, ...entries.byIndication].map((v) => [v.catalog.id, v.catalog])).values()];

  const period = (entry: HealthCheckCatalogEntry) => {
    const w = entry.window;
    if (!w) return '';
    if (w.fromWeek !== undefined || w.toWeek !== undefined) return h.periodWeeks(w.fromWeek, w.toWeek);
    if (w.fromDay !== undefined || w.toDay !== undefined) return h.periodDays(w.fromDay, w.toDay);
    return '';
  };

  const save = () => {
    if (!selected) return;
    onSaveCountry(selected);
    setPicking(false);
    setSaved(true);
  };

  const renderEntry = (v: CatalogEntryView) => {
    const key = `${v.catalog.id}::${v.entry.id}`;
    const open = expanded === key;
    const description = v.entry.description?.[language];
    return (
      <li key={key} className="hc-catalog-item">
        <button
          type="button"
          className="hc-catalog-head"
          aria-expanded={open}
          onClick={() => setExpanded(open ? null : key)}
        >
          <span className="hc-catalog-text">
            <span className="hc-catalog-name">{v.entry.label[language]}</span>
            {period(v.entry) && <span className="hc-catalog-period">{period(v.entry)}</span>}
          </span>
          {open ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
        </button>
        {open && (
          <div className="hc-catalog-body">
            {description && <p className="hc-catalog-desc">{description}</p>}
            <p className="hc-catalog-ref-title">{h.catalogSources}</p>
            <ul className="hc-catalog-refs">
              {v.catalog.meta.sources.map((s, i) => (
                <li key={i}>
                  {s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title} · {s.publisher}
                  {s.pages ? `, ${s.pages}` : ''}
                  {s.sourceUpdatedOn || s.publishedOn ? ` (${formatIsoDate(s.sourceUpdatedOn ?? s.publishedOn, language)})` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="hc-catalog-actions">
          {v.alreadyRecorded ? (
            <span className="hc-catalog-recorded">{h.alreadyRecorded}</span>
          ) : (
            <button type="button" className="hc-quiet-btn" onClick={() => onRegister(v)}>{h.registerFromCatalog}</button>
          )}
        </div>
      </li>
    );
  };

  return (
    <section className="hc-section" aria-labelledby="hcInfoTitle">
      <h2 id="hcInfoTitle" className="hc-section-title">{h.infoTitle}</h2>
      <div className="hc-info-card">
        {picking ? (
          <div className="hc-info-picking">
            <CareCountryField value={selected} onChange={setSelected} />
            <div className="hc-row-actions">
              <button type="button" className="btn btn-primary hc-small-btn" disabled={!selected} onClick={save}>{h.infoSaveBtn}</button>
              <button type="button" className="hc-quiet-btn" onClick={() => setPicking(false)}>{h.cancelBtn}</button>
            </div>
          </div>
        ) : !careCountry ? (
          showFullInvite ? (
            <>
              <p className="hc-info-text">{h.infoNoCountry}</p>
              <div className="hc-row-actions">
                <button type="button" className="btn btn-secondary hc-small-btn" onClick={() => setPicking(true)}>{h.infoChooseBtn}</button>
                <button
                  type="button"
                  className="hc-quiet-btn"
                  onClick={() => {
                    careCountryPrompt.snooze();
                    setShowFullInvite(false);
                  }}
                >
                  {h.infoLaterBtn}
                </button>
              </div>
            </>
          ) : (
            <div className="hc-info-row">
              <span className="hc-info-text">{h.infoNoCountryCompact}</span>
              <button type="button" className="hc-link-btn" onClick={() => setPicking(true)}>{h.infoChooseBtn}</button>
            </div>
          )
        ) : (
          <>
            <div className="hc-info-row">
              <span className="hc-info-country">
                <MapPin size={15} aria-hidden="true" /> {name}
              </span>
              <button type="button" className="hc-link-btn" onClick={() => { setSelected(careCountry); setPicking(true); }}>
                {h.infoChangeBtn}
              </button>
            </div>
            {saved && <p className="hc-info-saved" role="status">{h.infoCountrySaved}</p>}
            {!hasCatalog ? (
              <>
                <p className="hc-info-text">{h.infoNoCatalog}</p>
                <p className="hc-info-text">{h.infoManualHint}</p>
              </>
            ) : (
              <>
                {usedCatalogs.map((c) => (
                  <p key={c.id} className="hc-info-text">
                    {h.catalogIntro(c.meta.sources[0]?.publisher ?? '', formatIsoDate(c.meta.sources[0]?.sourceUpdatedOn ?? c.meta.sources[0]?.publishedOn, language))}
                  </p>
                ))}
                {entries.routine.length > 0 && (
                  <>
                    <h3 className="hc-catalog-group">{h.catalogRoutineTitle}</h3>
                    <ul className="hc-catalog-list">{entries.routine.map(renderEntry)}</ul>
                  </>
                )}
                {entries.byIndication.length > 0 && (
                  <div className="hc-disclosure">
                    <button type="button" className="hc-disclosure-btn" aria-expanded={indicationOpen} onClick={() => setIndicationOpen(!indicationOpen)}>
                      <span>{h.catalogIndicationTitle(entries.byIndication.length)}</span>
                      {indicationOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    {indicationOpen && (
                      <div className="hc-disclosure-panel">
                        <p className="hc-help">{h.catalogIndicationHelp}</p>
                        <ul className="hc-catalog-list">{entries.byIndication.map(renderEntry)}</ul>
                      </div>
                    )}
                  </div>
                )}
                <p className="hc-help">{h.catalogDisclaimer}</p>
                {usedCatalogs.map((c) => (
                  <p key={c.id} className="hc-help">{h.catalogVersion(c.version, formatIsoDate(c.meta.review.reviewedOn, language) || undefined)}</p>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default HealthCheckInfoSection;
