import React, { useState, useEffect } from 'react';
import { UserProfile, ActiveTab, JourneyRecord } from './types';
import { profileStorage } from './services/profileStorage';
import { indexedDbService } from './services/indexedDbService';
import { wipeAllMamandLocalData } from './services/localDataWipeService';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { ProfileEditModal } from './components/ProfileEditModal';
import { Onboarding } from './views/Onboarding';
import { TodayView } from './views/TodayView';
import { AskView } from './views/AskView';
import { JourneyView } from './views/JourneyView';
import { CareView } from './views/CareView';
import { BirthRecordView } from './components/BirthRecordView';
import { SupportNetworkView } from './components/SupportNetworkView';
import { SelfCareView } from './components/SelfCareView';
import { MaternityChecklistView } from './components/MaternityChecklistView';
import { PrivacyPolicyView } from './views/PrivacyPolicyView';

const MainApp: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [loading, setLoading] = useState<boolean>(true);
  const [records, setRecords] = useState<JourneyRecord[]>([]);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isBirthRecordOpen, setIsBirthRecordOpen] = useState<boolean>(false);
  const [isSupportNetworkOpen, setIsSupportNetworkOpen] = useState<boolean>(false);
  const [isSelfCareOpen, setIsSelfCareOpen] = useState<boolean>(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [resetCounter, setResetCounter] = useState<number>(0);

  const isPrivacyUrl = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return (
      path === '/privacy' ||
      path === '/privacidade' ||
      path === '/privacy.html' ||
      hash === '#/privacy' ||
      hash === '#/privacidade' ||
      hash === '#privacy' ||
      hash === '#privacidade'
    );
  };

  useEffect(() => {
    if (isPrivacyUrl()) {
      setIsPrivacyOpen(true);
    }

    const handlePopState = () => {
      setIsPrivacyOpen(isPrivacyUrl());
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const handleOpenPrivacy = () => {
    try {
      window.history.pushState({ privacy: true }, '', '/privacy');
    } catch {
      window.location.hash = '/privacy';
    }
    setIsPrivacyOpen(true);
  };

  const handleClosePrivacy = () => {
    setIsPrivacyOpen(false);
    try {
      if (window.history.state && window.history.state.privacy) {
        window.history.back();
      } else {
        window.history.pushState({}, '', '/');
      }
    } catch {
      window.location.hash = '';
    }
  };

  useEffect(() => {
    // 1. Carrega preferências demonstrativas do onboarding (localStorage)
    const saved = profileStorage.getProfile();
    if (saved) {
      setProfile(saved);
      if (saved.preferredLanguage && saved.preferredLanguage !== language) {
        setLanguage(saved.preferredLanguage);
      }
    }

    // 2. Carrega registros de saúde e memórias estruturados do IndexedDB nativo
    const initDbAndLoad = async () => {
      try {
        const loaded = await indexedDbService.getRecords();
        setRecords(loaded);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'IndexedDB indisponível neste navegador';
        console.error('Erro ao acessar IndexedDB:', err);
        setStorageError(message);
      } finally {
        setLoading(false);
      }
    };

    initDbAndLoad();
  }, []);

  const handleCompleteOnboarding = (newProfile: UserProfile) => {
    newProfile.preferredLanguage = language;
    profileStorage.saveProfile(newProfile);
    setProfile(newProfile);
    setActiveTab('today');
  };

  const handleResetProfile = () => {
    if (window.confirm(t.common.confirmPhaseReset)) {
      profileStorage.clearProfile();
      setProfile(null);
    }
  };

  const handleAddRecord = async (newRecord: JourneyRecord) => {
    try {
      const updated = await indexedDbService.saveRecord(newRecord);
      setRecords(updated);
    } catch (err) {
      console.error('Falha ao salvar registro no IndexedDB:', err);
      alert(t.common.saveError);
    }
  };

  const handleClearRecords = async () => {
    try {
      await indexedDbService.clearAllRecords();
      setRecords([]);
    } catch (err) {
      console.error('Erro ao limpar IndexedDB:', err);
      alert(t.common.clearError);
    }
  };

  const handleWipeAllLocalData = async () => {
    const result = await wipeAllMamandLocalData();
    if (result.errors.length > 0) {
      console.warn('Avisos ao apagar dados locais:', result.errors);
    }
    setProfile(null);
    setRecords([]);
    setStorageError(null);
    setActiveTab('today');
    setCareCategory('all');
    setIsEditModalOpen(false);
    setIsBirthRecordOpen(false);
    setIsSupportNetworkOpen(false);
    setIsSelfCareOpen(false);
    setIsChecklistOpen(false);
    setResetCounter((prev) => prev + 1);
  };

  const [careCategory, setCareCategory] = useState<string>('all');

  // Cada página nova começa do topo
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeTab, isBirthRecordOpen, isSupportNetworkOpen, isSelfCareOpen, isChecklistOpen]);

  const handleNavigate = (tab: ActiveTab, category?: string) => {
    setActiveTab(tab);
    if (category) {
      setCareCategory(category);
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t.common.loading}</div>
      </div>
    );
  }

  if (isPrivacyOpen) {
    return (
      <div className="app-container">
        <PrivacyPolicyView onBack={handleClosePrivacy} initialLang={language} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header
        profile={profile}
        onResetProfile={handleResetProfile}
        onEditProfile={() => setIsEditModalOpen(true)}
      />

      {profile && (
        <ProfileEditModal
          profile={profile}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={(updated) => {
            profileStorage.saveProfile(updated);
            setProfile(updated);
          }}
          onReset={handleResetProfile}
          onWipeAllData={handleWipeAllLocalData}
          onOpenPrivacy={handleOpenPrivacy}
        />
      )}

      {!profile ? (
        <Onboarding key={resetCounter} onComplete={handleCompleteOnboarding} onOpenPrivacy={handleOpenPrivacy} />
      ) : isBirthRecordOpen ? (
        <BirthRecordView
          profile={profile}
          onBack={() => setIsBirthRecordOpen(false)}
          onProfileUpdated={(updated) => {
            profileStorage.saveProfile(updated);
            setProfile(updated);
          }}
        />
      ) : isChecklistOpen ? (
        <MaternityChecklistView onBack={() => setIsChecklistOpen(false)} />
      ) : isSelfCareOpen ? (
        <SelfCareView phase={profile.phase} onBack={() => setIsSelfCareOpen(false)} />
      ) : isSupportNetworkOpen ? (
        <SupportNetworkView
          onBack={() => setIsSupportNetworkOpen(false)}
          motherName={profile.displayName}
        />
      ) : (
        <>
          {activeTab === 'today' && (
            <TodayView
              profile={profile}
              records={records}
              onNavigate={handleNavigate}
              onAddRecord={handleAddRecord}
              onOpenBirthRecord={() => setIsBirthRecordOpen(true)}
              onOpenSupportNetwork={() => setIsSupportNetworkOpen(true)}
              onOpenSelfCare={() => setIsSelfCareOpen(true)}
              onOpenChecklist={() => setIsChecklistOpen(true)}
            />
          )}
          {activeTab === 'ask' && <AskView profile={profile} />}
          {activeTab === 'journey' && (
            <JourneyView
              profile={profile}
              records={records}
              onAddRecord={handleAddRecord}
              onClearRecords={handleClearRecords}
              onRestoreRecords={(updated) => setRecords(updated)}
              storageError={storageError}
              onOpenPrivacy={handleOpenPrivacy}
            />
          )}
          {activeTab === 'care' && (
            <CareView
              profile={profile}
              onAddRecord={handleAddRecord}
              onNavigate={handleNavigate}
              initialCategory={careCategory}
            />
          )}

          <Navigation
            activeTab={activeTab}
            onTabChange={(tab) => {
              setIsBirthRecordOpen(false);
              setIsSupportNetworkOpen(false);
              setIsSelfCareOpen(false);
              setIsChecklistOpen(false);
              setCareCategory('all');
              setActiveTab(tab);
            }}
          />
        </>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
};

export default App;
