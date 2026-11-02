import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ClipboardList, Plus, Pencil, Trash2, Info, ChevronDown, ChevronUp } from 'lucide-react';
import type { UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { PageHeader } from './PageHeader';
import { HealthCheckSheet, MILESTONE_ORDER, type SheetMode } from './HealthCheckSheet';
import { HealthCheckInfoSection } from './HealthCheckInfoSection';
import { indexedDbService } from '../services/indexedDbService';
import { getProfileCountries } from '../domain/profileCountries';
import { countryName } from '../domain/countryNames';
import { HEALTH_CHECK_CATALOGS } from '../data/healthCheckCatalogs';
import type { HealthCheckCatalog, HealthCheckRecord, HealthCheckSubject } from '../domain/healthChecks';

// "Exames e triagens": primeiro os registros da família (gestação e bebê separados),
// depois as informações sobre exames do país de acompanhamento. O formulário abre numa
// folha, só quando a família quiser. Sem interpretação de resultados, sem cores de
// normal/alterado e sem lista de exames obrigatórios.

const formatDate = (iso: string, lang: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(lang === 'en' ? 'en-GB' : 'pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Data mais recente entre as etapas; sem datas, a data de criação
const sortKey = (r: HealthCheckRecord) => {
  const dates = MILESTONE_ORDER.map((k) => r.milestones[k]?.on).filter((d): d is string => !!d).sort();
  return dates.length ? dates[dates.length - 1] : r.createdAt.slice(0, 10);
};

// Última etapa: a mais adiante na sequência entre as marcadas, com a data dela se houver
const lastStepOf = (r: HealthCheckRecord) => {
  const marked = MILESTONE_ORDER.filter((k) => r.milestones[k]);
  if (marked.length === 0) return null;
  const key = marked[marked.length - 1];
  return { key, on: r.milestones[key]?.on };
};

interface HealthChecksViewProps {
  profile: UserProfile;
  onBack: () => void;
  onProfileUpdated: (profile: UserProfile) => void;
  // Só para testes; a interface usa o registro oficial, que está vazio até haver lista aprovada
  catalogs?: HealthCheckCatalog[];
}

export const HealthChecksView: React.FC<HealthChecksViewProps> = ({ profile, onBack, onProfileUpdated, catalogs = HEALTH_CHECK_CATALOGS }) => {
  const { language, t } = useLanguage();
  const h = t.healthChecks;
  const [records, setRecords] = useState<HealthCheckRecord[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [subject, setSubject] = useState<HealthCheckSubject>(profile.phase === 'pregnancy' ? 'pregnant_person' : 'baby');
  const [sheet, setSheet] = useState<SheetMode | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<HealthCheckRecord | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const highlightTimer = useRef<number | undefined>(undefined);

  const careCountry = getProfileCountries(profile).care;

  useEffect(() => {
    indexedDbService
      .getHealthChecks()
      .then(setRecords)
      .catch((err) => {
        console.error('Erro ao ler exames e triagens:', err);
        setLoadError(true);
      });
    return () => window.clearTimeout(highlightTimer.current);
  }, []);

  const visible = useMemo(
    () => records.filter((r) => r.subject === subject).sort((a, b) => sortKey(b).localeCompare(sortKey(a)) || b.createdAt.localeCompare(a.createdAt)),
    [records, subject]
  );

  const handleSave = async (record: HealthCheckRecord) => {
    const updated = await indexedDbService.saveHealthCheck(record);
    setRecords(updated);
    setSheet(null);
    setSubject(record.subject);
    setHighlight(record.id);
    window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => setHighlight(null), 2500);
    window.setTimeout(() => document.getElementById(`hc-${record.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      setRecords(await indexedDbService.deleteHealthCheck(confirmDelete.id));
    } catch (err) {
      console.error('Erro ao excluir exame:', err);
      setLoadError(true);
    }
    setConfirmDelete(null);
  };

  const saveCountry = (code: string) =>
    onProfileUpdated({ ...profile, careCountry: code, updatedAt: new Date().toISOString() });

  return (
    <div className="content-area health-checks">
      <PageHeader kicker={h.badge} icon={<ClipboardList size={13} />} title={h.title} subtitle={h.subtitle} onBack={onBack} backLabel={h.backBtn} />

      <div className="hc-notice" role="note">
        <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>{h.notice}</span>
      </div>

      <div className="hc-subject-toggle" role="group" aria-label={h.subjectGroupLabel}>
        {(['pregnant_person', 'baby'] as HealthCheckSubject[]).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={subject === s}
            className={`subject-btn ${subject === s ? 'active' : ''}`}
            onClick={() => {
              setSubject(s);
              setExpanded(null);
            }}
          >
            {s === 'pregnant_person' ? h.subjectPregnancy : h.subjectBaby}
          </button>
        ))}
      </div>

      <section className="hc-section" aria-labelledby="hcRecordsTitle">
        <div className="hc-section-head">
          <h2 id="hcRecordsTitle" className="hc-section-title">
            {h.recordsTitle} <span className="hc-count">· {h.countLabel(visible.length)}</span>
          </h2>
          <button type="button" className="hc-add-btn" onClick={() => setSheet({ kind: 'new', subject })}>
            <Plus size={16} aria-hidden="true" />
            {h.addBtn}
          </button>
        </div>

        {loadError && <p className="hc-status" role="alert">{h.loadError}</p>}

        {visible.length === 0 ? (
          <p className="hc-empty">{subject === 'pregnant_person' ? h.emptyPregnancy : h.emptyBaby}</p>
        ) : (
          <ul className="hc-list">
            {visible.map((r) => {
              const open = expanded === r.id;
              const last = lastStepOf(r);
              const marked = MILESTONE_ORDER.filter((k) => r.milestones[k]);
              const country = countryName(r.careCountry, language);
              const originCountry = r.origin.kind === 'catalog' ? countryName(r.origin.country, language) : undefined;
              return (
                <li key={r.id} id={`hc-${r.id}`} className={`card hc-card ${highlight === r.id ? 'hc-card-highlight' : ''}`}>
                  <button type="button" className="hc-card-head" aria-expanded={open} aria-controls={`hc-details-${r.id}`} onClick={() => setExpanded(open ? null : r.id)}>
                    <span className="hc-card-text">
                      <span className="hc-card-name">{r.name}</span>
                      <span className="hc-card-meta">
                        {h.kinds[r.kind]} · {h.phases[r.phase]}
                        {r.gestationalWeek !== undefined && ` · ${h.weekShort(r.gestationalWeek)}`}
                      </span>
                      <span className="hc-card-last">
                        {last ? (
                          <>
                            {h.lastStep}: {h.milestones[last.key]}
                            {last.on && <span className="hc-step-date"> · {formatDate(last.on, language)}</span>}
                          </>
                        ) : (
                          h.noMilestones
                        )}
                      </span>
                    </span>
                    <span className="hc-card-toggle">
                      <span className="hc-visually-hidden">{open ? h.hideDetails : h.showDetails}</span>
                      {open ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
                    </span>
                  </button>
                  {open && (
                    <div id={`hc-details-${r.id}`} className="hc-card-details">
                      {marked.length > 0 && (
                        <ul className="hc-card-steps">
                          {marked.map((k) => (
                            <li key={k}>
                              {h.milestones[k]}
                              {r.milestones[k]?.on && <span className="hc-step-date"> · {formatDate(r.milestones[k]!.on!, language)}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                      {r.personalNote && <p className="hc-card-note">{r.personalNote}</p>}
                      {r.origin.kind === 'catalog' && originCountry && (
                        <p className="hc-card-country">{h.fromCatalog(originCountry, r.origin.catalogVersion)}</p>
                      )}
                      {country && <p className="hc-card-country">{h.careCountryOnRecord(country)}</p>}
                      <div className="hc-row-actions">
                        <button type="button" className="hc-quiet-btn" onClick={() => setSheet({ kind: 'edit', record: r })} aria-label={`${h.editBtn}: ${r.name}`}>
                          <Pencil size={13} aria-hidden="true" /> {h.editBtn}
                        </button>
                        <button type="button" className="hc-quiet-btn" onClick={() => setConfirmDelete(r)} aria-label={`${h.deleteBtn}: ${r.name}`}>
                          <Trash2 size={13} aria-hidden="true" /> {h.deleteBtn}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <HealthCheckInfoSection
        key={careCountry ?? 'none'}
        careCountry={careCountry}
        subject={subject}
        records={records}
        catalogs={catalogs}
        onSaveCountry={saveCountry}
        onRegister={(view) => setSheet({ kind: 'catalog', view })}
      />

      {sheet && (
        <HealthCheckSheet
          key={sheet.kind === 'edit' ? sheet.record.id : sheet.kind === 'catalog' ? sheet.view.entry.id : `new-${sheet.subject}`}
          mode={sheet}
          profile={profile}
          careCountry={careCountry}
          onClose={() => setSheet(null)}
          onSave={handleSave}
        />
      )}

      {confirmDelete && (
        <div className="hc-overlay" role="alertdialog" aria-modal="true" aria-labelledby="hcDeleteTitle">
          <div className="card hc-confirm">
            <h3 id="hcDeleteTitle" className="hc-confirm-title">{h.confirmDeleteTitle}</h3>
            <p className="hc-confirm-text" style={{ fontWeight: 600, color: 'var(--text-main)' }}>{confirmDelete.name}</p>
            <p className="hc-confirm-text">{h.confirmDeleteText}</p>
            <div className="hc-row-actions">
              <button type="button" className="btn btn-primary hc-small-btn" onClick={handleDelete}>{h.confirmDeleteBtn}</button>
              <button type="button" className="hc-quiet-btn" autoFocus onClick={() => setConfirmDelete(null)}>{h.cancelBtn}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthChecksView;
