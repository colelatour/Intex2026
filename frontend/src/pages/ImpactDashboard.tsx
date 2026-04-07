import '../styles/ImpactDashboard.css';
import { useImpactSummary } from '../hooks/useImpactSummary';
import { useImpactTrends } from '../hooks/useImpactTrends';
import { useEducationJourney } from '../hooks/useEducationJourney';

import HeroBanner              from '../components/impact/HeroBanner';
import HeroMetricCards         from '../components/impact/HeroMetricCards';
import OutcomeHighlights       from '../components/impact/OutcomeHighlights';
import TrendCharts             from '../components/impact/TrendCharts';
import EducationJourneyChart   from '../components/impact/EducationJourneyChart';
import CareIntensityRow        from '../components/impact/CareIntensityRow';
import DonationsSection        from '../components/impact/DonationsSection';
import IncidentResolution      from '../components/impact/IncidentResolution';
import CallToActionBanner      from '../components/impact/CallToActionBanner';

export default function ImpactDashboard() {
  const summary  = useImpactSummary();
  const trends   = useImpactTrends();
  const journey  = useEducationJourney();

  const summaryError = summary.error
    ? 'Unable to load impact data right now. Please try again later.'
    : null;

  return (
    <main className="impact-page" aria-label="Donor Impact Dashboard">
      <HeroBanner />

      {summaryError ? (
        <div className="impact-error" role="alert">
          <p>{summaryError}</p>
        </div>
      ) : (
        <>
          <HeroMetricCards data={summary.data} loading={summary.loading} />
          <OutcomeHighlights data={summary.data} loading={summary.loading} />
        </>
      )}

      <TrendCharts data={trends.data} loading={trends.loading} />

      <EducationJourneyChart
        data={journey.data}
        loading={journey.loading}
        error={journey.error}
      />

      {!summaryError && (
        <>
          <CareIntensityRow  data={summary.data} loading={summary.loading} />
          <DonationsSection  data={summary.data} loading={summary.loading} />
          <IncidentResolution data={summary.data} loading={summary.loading} />
        </>
      )}

      <CallToActionBanner data={summary.data} />
    </main>
  );
}
