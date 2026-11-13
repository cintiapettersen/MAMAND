import React, { useState, useEffect, useMemo } from 'react';
import { MaternityChecklistCategoryId, MaternityChecklistState } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getMaternityChecklist } from '../data/maternityChecklist';
import { maternityChecklistStorage } from '../services/maternityChecklistStorage';
import { PageHeader } from './PageHeader';
import { Briefcase, Check, ChevronDown, Plus, X, Info } from 'lucide-react';

interface MaternityChecklistViewProps {
  onBack: () => void;
}

// Contagem de itens prontos (catálogo + itens próprios), usada também na Home
export const countChecklistProgress = (state: MaternityChecklistState) => {
  const catalogIds = getMaternityChecklist().flatMap((c) => c.items.map((i) => i.id));
  const allIds = [...catalogIds, ...state.custom.map((c) => c.id)];
  return { done: allIds.filter((id) => state.checked.includes(id)).length, total: allIds.length };
};

export const MaternityChecklistView: React.FC<MaternityChecklistViewProps> = ({ onBack }) => {
  const { language, t } = useLanguage();
  const s = t.maternityChecklist;
  const categories = useMemo(() => getMaternityChecklist(language), [language]);

  const [state, setState] = useState<MaternityChecklistState>(() => maternityChecklistStorage.getState());
  const [openCategory, setOpenCategory] = useState<MaternityChecklistCategoryId | null>('baby');
  const [drafts, setDrafts] = useState<Partial<Record<MaternityChecklistCategoryId, string>>>({});

  useEffect(() => {
    maternityChecklistStorage.saveState(state);
  }, [state]);

  const { done, total } = countChecklistProgress(state);

  const toggleItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      checked: prev.checked.includes(id) ? prev.checked.filter((c) => c !== id) : [...prev.checked, id]
    }));
  };

  const addCustomItem = (category: MaternityChecklistCategoryId) => {
    const label = drafts[category]?.trim();
    if (!label) return;
    setState((prev) => ({
      ...prev,
      custom: [...prev.custom, { id: `custom-${Date.now()}`, category, label }]
    }));
    setDrafts((prev) => ({ ...prev, [category]: '' }));
  };

  const removeCustomItem = (id: string) => {
    setState((prev) => ({
      checked: prev.checked.filter((c) => c !== id),
      custom: prev.custom.filter((c) => c.id !== id)
    }));
  };

  const renderCheck = (id: string, label: string, onRemove?: () => void) => {
    const checked = state.checked.includes(id);
    return (
      <div key={id} className={`checklist-row ${checked ? 'checked' : ''}`}>
        <label className="checklist-item">
          <input type="checkbox" checked={checked} onChange={() => toggleItem(id)} />
          <span className="checklist-box" aria-hidden="true">
            {checked && <Check size={13} strokeWidth={3} />}
          </span>
          <span className="checklist-label">{label}</span>
        </label>
        {onRemove && (
          <button type="button" className="checklist-remove" onClick={onRemove} aria-label={s.removeItem}>
            <X size={14} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="content-area checklist-page">
      <PageHeader
        onBack={onBack}
        backLabel={s.backBtn}
        kicker={s.viewKicker}
        icon={<Briefcase size={13} />}
        title={s.viewTitle}
        subtitle={s.viewSubtitle}
      />

      {/* Progresso geral */}
      <div className="checklist-progress" role="status">
        <div className="checklist-progress-text">
          <strong>
            {done === total && total > 0
              ? s.progressDone
              : s.progressLabel.replace('{done}', String(done)).replace('{total}', String(total))}
          </strong>
        </div>
        <div
          className="checklist-progress-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
        >
          <span style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
      </div>

      {/* Grupos em sanfona, cada um com sua cor */}
      {categories.map((category) => {
        const customItems = state.custom.filter((c) => c.category === category.id);
        const ids = [...category.items.map((i) => i.id), ...customItems.map((c) => c.id)];
        const categoryDone = ids.filter((id) => state.checked.includes(id)).length;
        const isOpen = openCategory === category.id;
        const panelId = `checklist-panel-${category.id}`;

        return (
          <section key={category.id} className={`checklist-category cat-${category.id} ${isOpen ? 'open' : ''}`}>
            <button
              type="button"
              className="checklist-category-header"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenCategory(isOpen ? null : category.id)}
            >
              <span className="checklist-category-title">{category.title}</span>
              <span className={`checklist-category-count ${categoryDone === ids.length ? 'complete' : ''}`}>
                {categoryDone}/{ids.length}
              </span>
              <ChevronDown size={18} className="checklist-chevron" aria-hidden="true" />
            </button>

            {isOpen && (
              <div id={panelId} className="checklist-category-body">
                {category.items.map((item) => renderCheck(item.id, item.label))}
                {customItems.map((item) => renderCheck(item.id, item.label, () => removeCustomItem(item.id)))}

                <form
                  className="checklist-add-row"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addCustomItem(category.id);
                  }}
                >
                  <input
                    className="birth-input"
                    placeholder={s.customPlaceholder}
                    aria-label={`${s.customPlaceholder}: ${category.title}`}
                    value={drafts[category.id] || ''}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [category.id]: e.target.value }))}
                  />
                  <button type="submit" className="support-pill-btn" disabled={!drafts[category.id]?.trim()}>
                    <Plus size={14} />
                    <span>{s.customAddBtn}</span>
                  </button>
                </form>
              </div>
            )}
          </section>
        );
      })}

      <div className="checklist-tips">
        <Info size={15} aria-hidden="true" />
        <div>
          <p>{s.tipTiming}</p>
          <p>{s.tipHospital}</p>
        </div>
      </div>
    </div>
  );
};

export default MaternityChecklistView;
