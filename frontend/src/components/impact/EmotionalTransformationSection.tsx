import { EmotionalTransformationData } from '../../hooks/useEmotionalTransformation';

interface Props {
  data: EmotionalTransformationData | null;
  loading: boolean;
  error: string | null;
}

// Warm muted palette for "arrive" states
const ARRIVE_COLORS: Record<string, string> = {
  Sad:        '#b08060',
  Anxious:    '#b89070',
  Angry:      '#c07858',
  Withdrawn:  '#a09080',
  Distressed: '#a06850',
  Neutral:    '#9a9080',
  Calm:       '#8aaa98',
  Hopeful:    '#6aaa88',
  Happy:      '#5a9a78',
  Engaged:    '#7aaa90',
  Positive:   '#5aaa80',
};

// Teal/green palette for "leave" states
const LEAVE_COLORS: Record<string, string> = {
  Hopeful:    '#1D9E75',
  Calm:       '#2aaa88',
  Happy:      '#38b890',
  Engaged:    '#2a9a80',
  Positive:   '#22a878',
  Neutral:    '#6ab0a0',
  Sad:        '#b08878',
  Anxious:    '#b09080',
  Withdrawn:  '#a09898',
  Angry:      '#b07868',
  Distressed: '#a07868',
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
                color={ARRIVE_COLORS[label] ?? '#a09080'}
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
                color={LEAVE_COLORS[label] ?? '#1D9E75'}
              />
            ))
          )}
        </div>
      </div>

      {/* Interpretation callout */}
      {!loading && !error && (
        <div className="chart-interpretation emo-interpretation">
          <p>
            <strong>What this means in real life:</strong>{' '}
            Many girls arrive to their sessions carrying the weight of the day — feeling sad,
            anxious, or shut down. In 66% of all recorded sessions, a girl left that room in a
            measurably better emotional state than when she walked in. That shift — from withdrawn
            to calm, from anxious to hopeful — is the daily work of healing. It doesn't happen by
            accident. It happens because of skilled, consistent, caring support funded by people
            like you.
          </p>
        </div>
      )}

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
