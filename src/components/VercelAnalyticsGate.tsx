import React, { useEffect, useMemo } from 'react';
import { Analytics } from '@vercel/analytics/react';
import {
  AnalyticsConsentState,
  createAnalyticsBeforeSend,
  disableAnalyticsRuntime,
  shouldEnableVercelAnalytics
} from '../services/analyticsConsent';

interface VercelAnalyticsGateProps {
  consent: AnalyticsConsentState;
}

export const VercelAnalyticsGate: React.FC<VercelAnalyticsGateProps> = ({ consent }) => {
  const enabled = shouldEnableVercelAnalytics(consent);
  const beforeSend = useMemo(() => createAnalyticsBeforeSend(), []);

  useEffect(() => {
    if (!enabled) {
      disableAnalyticsRuntime();
    }
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return <Analytics mode="production" beforeSend={beforeSend} />;
};
