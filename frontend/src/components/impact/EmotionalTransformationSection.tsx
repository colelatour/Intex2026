import { EmotionalTransformationData } from '../../hooks/useEmotionalTransformation';

interface Props {
  data: EmotionalTransformationData | null;
  loading: boolean;
  error: string | null;
}

// One shared palette so each emotion always has the same color.
const STATE_COLORS: Record<string, string> = {
  Sad:        '#022846',
  Anxious:    '#113754',
  Angry:      '#1e4660',
  Withdrawn:  '#295368',
  Distressed: '#315f70',
  Neutral:    '#4b7a86',
  Calm:       '#5a8f9c',
  Hopeful:    '#6794a0',
  Happy:      '#729fac',
  Engaged:    '#82afba',
  Positive:   '#d4a018',
};

function StateBar({
  label,
  count,
  maxCount,
  color,
}: {
  label: string;
  count: number;
  maxCount: number;
  color: string;
}) {
  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  return (
    <div className="emo-bar-row" aria-label={`${label}: ${count} sessions`}>
      <div className="emo-bar-label">{label}</div>
      <div className="emo-bar-track" role="presentation">
        <div
          className="emo-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="emo-bar-count">{count.toLocaleString()}</div>
    </div>
  );
}

export default function EmotionalTransformationSection({ data, loading, error }: Props) {
  const pct = data?.improvedPercent ?? 0;

  const startEntries = data
    ? Object.entries(data.startStateBreakdown).sort((a, b) => b[1] - a[1])
    : [];
  const endEntries = data
    ? Object.entries(data.endStateBreakdown).sort((a, b) => b[1] - a[1])
    : [];

  const maxStart = startEntries[0]?.[1] ?? 1;
  const maxEnd   = endEntries[0]?.[1] ?? 1;

  return (
    <section className="emo-section" aria-labelledby="emo-heading">

      {/* Headline stat */}
      <div className="emo-headline">
        {loading ? (
          <div className="skeleton" style={{ height: 88, width: 160, margin: '0 auto 16px' }} aria-hidden="true" />
        ) : (
          <div className="emo-pct" aria-label={`${pct} percent`}>{pct}%</div>
        )}
        <p className="emo-sublabel">
          of social work sessions end with a girl in a better emotional state than when she arrived
        </p>
      </div>

      {/* Before / After columns */}
      <div className="emo-columns" aria-label="Emotional state comparison">
        {/* Arrive */}
        <div className="emo-col">
          <div className="emo-col-header">How girls arrive</div>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 28, marginBottom: 10, borderRadius: 6 }} aria-hidden="true" />
            ))
          ) : error ? null : (
            startEntries.map(([label, count]) => (
              <StateBar
                key={label}
                label={label}
                count={count}
                maxCount={maxStart}
                color={STATE_COLORS[label] ?? '#356272'}
              />
            ))
          )}
        </div>

        {/* Leave */}
        <div className="emo-col">
          <div className="emo-col-header emo-col-header--teal">How girls leave</div>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 28, marginBottom: 10, borderRadius: 6 }} aria-hidden="true" />
            ))
          ) : error ? null : (
            endEntries.map(([label, count]) => (
              <StateBar
                key={label}
                label={label}
                count={count}
                maxCount={maxEnd}
                color={STATE_COLORS[label] ?? '#356272'}
              />
            ))
          )}
        </div>
      </div>

      {/* Footnote */}
      {!loading && !error && (
        <p className="emo-footnote">
          Based on {data?.totalSessions.toLocaleString() ?? '2,819'} recorded social work sessions
          across 60 girls and 9 safehouses.
          <br />
          Emotional state assessed by the assigned social worker at the start and close of each session.
        </p>
      )}
    </section>
  );
}
