import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { get, post } from '../../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = 'performance' | 'recommendations' | 'generator';
type Platform = 'WhatsApp' | 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube';
type PostGoal = 'Drive Donations' | 'Raise Awareness' | 'Express Gratitude' | 'Announce Event';

interface PerformanceData {
  totalPostsThisMonth: number;
  totalReferralsThisMonth: number;
  avgReferralsThisMonth: number;
  bestPlatformThisMonth: string;
  byPlatform: { platform: string; avgReferrals: number }[];
  byPostType: { postType: string; avgReferrals: number }[];
  topPosts: {
    date: string;
    platform: string;
    postType: string;
    contentTopic: string;
    donationReferrals: number;
    estimatedValuePhp: number;
  }[];
}

interface Highlight {
  category: string;
  icon: string;
  highlightText: string;
  metricValue: number;
  recommendedPlatform: string;
  recommendedPostType: string;
  pctAboveAverage: number;
}

interface MlGuideline {
  feature: string;
  coefficient: number;
}

interface MlGuidelinesResponse {
  whatToDo: MlGuideline[];
  whatToAvoid: MlGuideline[];
}

interface AchievementsResponse {
  educationCount: number;
  healthDelta: number;
  nearReadyCount: number;
}

interface GeneratePostResponse {
  postCopy: string;
  platform: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  WhatsApp:  '#84CFA6',
  Facebook:  '#8EB7E8',
  Instagram: '#D6A2C7',
  TikTok:    '#9AA5B1',
  YouTube:   '#E8A1A1',
};

const CHART_COLORS = ['#9FB0D1', '#E3C98E', '#8EB7E8', '#C7B2E0', '#9CCFAF', '#E3A8A8'];

const STORY_ARCS = [
  'Light Emerging from Darkness',
  'Unexpected Joy',
  'Arrived in Fear / Leaving with Purpose',
  'Community Coming Together',
  'Justice Served',
  'New Beginning',
];

const STATIC_RECS = [
  { rank: 1, text: 'Always feature a resident story', detail: '7× more referrals' },
  { rank: 2, text: 'Use ImpactStory format', detail: 'highest converting post type' },
  { rank: 3, text: 'Post on WhatsApp or YouTube', detail: 'top platforms by avg referrals' },
  { rank: 4, text: 'Post Tuesday at 10am', detail: 'peak engagement window' },
  { rank: 5, text: 'Use Emotional or Urgent tone', detail: 'strongest sentiment signals' },
  { rank: 6, text: 'Include a call to action', detail: 'positive coefficient in OLS model' },
  { rank: 7, text: 'Avoid LinkedIn for donation-focused posts', detail: 'lowest mean referrals' },
];

// ── Tab 1: Performance Overview ───────────────────────────────────────────────

function PerformanceTab() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<PerformanceData>('/api/social-media/performance')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="sms-loading">Loading performance data…</div>;
  if (!data)   return <div className="sms-loading">Failed to load performance data.</div>;

  const statCards = [
    { label: 'Posts this month',       value: data.totalPostsThisMonth },
    { label: 'Referrals this month',   value: data.totalReferralsThisMonth },
    { label: 'Avg referrals / post',   value: data.avgReferralsThisMonth },
    { label: 'Best platform (this month)', value: data.bestPlatformThisMonth },
  ];

  return (
    <div className="sms-tab-content">
      {/* Stat cards */}
      <div className="sms-stat-row">
        {statCards.map(card => (
          <div key={card.label} className="sms-stat-card">
            <span className="sms-stat-value">{card.value}</span>
            <span className="sms-stat-label">{card.label}</span>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="sms-charts-row">
        <div className="sms-chart-card">
          <h4 className="sms-chart-title">Avg Referrals by Platform</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.byPlatform} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
              <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [typeof v === 'number' ? v.toFixed(1) : v, 'Avg referrals']} />
              <Bar dataKey="avgReferrals" radius={[4,4,0,0]}>
                {data.byPlatform.map((entry, i) => (
                  <Cell key={entry.platform} fill={PLATFORM_COLORS[entry.platform] ?? CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="sms-chart-card">
          <h4 className="sms-chart-title">Avg Referrals by Post Type</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.byPostType} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
              <XAxis dataKey="postType" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [typeof v === 'number' ? v.toFixed(1) : v, 'Avg referrals']} />
              <Bar dataKey="avgReferrals" radius={[4,4,0,0]}>
                {data.byPostType.map((entry, i) => (
                  <Cell key={entry.postType} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top posts table */}
      <div className="sms-section">
        <h4 className="sms-section-title">Top 10 Posts by Donation Referrals</h4>
        <div className="sms-table-wrap">
          <table className="sms-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Platform</th>
                <th>Post Type</th>
                <th>Content Topic</th>
                <th>Referrals</th>
                <th>Est. Value (PHP)</th>
              </tr>
            </thead>
            <tbody>
              {data.topPosts.map((p, i) => (
                <tr key={i}>
                  <td>{p.date}</td>
                  <td>
                    <span
                      className="sms-badge"
                      style={{ background: PLATFORM_COLORS[p.platform] ?? '#888' }}
                    >
                      {p.platform}
                    </span>
                  </td>
                  <td>{p.postType}</td>
                  <td>{p.contentTopic}</td>
                  <td className="sms-num">{p.donationReferrals}</td>
                  <td className="sms-num">{p.estimatedValuePhp.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tab 2: Recommendations ────────────────────────────────────────────────────

interface RecommendationsTabProps {
  onGenerateFromHighlight: (platform: string, postType: string, summary: string) => void;
}

function RecommendationsTab({ onGenerateFromHighlight }: RecommendationsTabProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<Highlight[]>('/api/social-media/highlights')
      .then(setHighlights)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="sms-tab-content">
      {/* Section A — ML insights */}
      <div className="sms-section">
        <h4 className="sms-section-title">What the data says</h4>
        <p className="sms-section-sub">ML insights from this month's program data. Use one to prefill the generator.</p>

        {loading && <div className="sms-loading">Loading highlights…</div>}

        {!loading && highlights.length === 0 && (
          <div className="sms-empty">
            No standout achievements to highlight this month yet — check back soon.
          </div>
        )}

        {!loading && highlights.length > 0 && (
          <div className="sms-highlights-grid">
            {highlights.map((h, i) => (
              <div key={i} className="sms-highlight-card">
                <div className="sms-highlight-top">
                  <span className="sms-highlight-category">{h.category}</span>
                </div>
                <p className="sms-highlight-text">{h.highlightText}</p>
                <div className="sms-highlight-footer">
                  <span className="sms-highlight-pct">+{h.pctAboveAverage}% above avg</span>
                  <button
                    className="sms-btn sms-btn--sm"
                    onClick={() => onGenerateFromHighlight(h.recommendedPlatform, h.recommendedPostType, h.highlightText)}
                  >
                    Use in Generator
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section B — Static recommendations */}
      <div className="sms-section">
        <h4 className="sms-section-title">Top content recommendations</h4>
        <p className="sms-section-sub">Derived from analysis of all historical posts</p>
        <div className="sms-recs-list">
          {STATIC_RECS.map(r => (
            <div key={r.rank} className="sms-rec-row">
              <span className="sms-rec-rank">{r.rank}</span>
              <span className="sms-rec-text">{r.text}</span>
              <span className="sms-rec-detail">{r.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: Post Generator ─────────────────────────────────────────────────────

interface GeneratorTabProps {
  initialPlatform?: string;
  initialPostType?: string;
  initialSummary?: string;
}

function GeneratorTab({ initialPlatform, initialPostType, initialSummary }: GeneratorTabProps) {
  const [platform, setPlatform]     = useState<Platform>((initialPlatform as Platform) || 'Facebook');
  const [postGoal, setPostGoal]     = useState<PostGoal>('Drive Donations');
  const [storyArc, setStoryArc]     = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [highlightsLoading, setHighlightsLoading] = useState(true);
  const [generatedPost, setGeneratedPost] = useState('');
  const [loading, setLoading]       = useState(false);
  const [validationError, setValidationError] = useState('');
  const [generateError, setGenerateError] = useState('');
  const [guidelines, setGuidelines] = useState<MlGuidelinesResponse | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const inFlightRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialPlatform) setPlatform(initialPlatform as Platform);
  }, [initialPlatform]);

  useEffect(() => {
    get<Highlight[]>('/api/social-media/highlights')
      .then(h => {
        setHighlights(h);
        // Pre-select the card matching the summary navigated from recommendations tab
        if (initialSummary) {
          const idx = h.findIndex(x => x.highlightText === initialSummary);
          setSelectedIndex(idx >= 0 ? idx : null);
        }
      })
      .catch(() => {})
      .finally(() => setHighlightsLoading(false));
    get<MlGuidelinesResponse>('/api/social-media/ml-guidelines')
      .then(setGuidelines)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [generatedPost]);

  const handleGenerate = useCallback(async () => {
    if (selectedIndex === null) {
      setValidationError('Select an achievement to highlight');
      return;
    }
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const selected = highlights[selectedIndex];
    setValidationError('');
    setGenerateError('');
    setLoading(true);
    try {
      const result = await post<GeneratePostResponse>('/api/social-media/generate-post', {
        platform,
        postGoal,
        storyArc: storyArc || undefined,
        achievement: { type: selected.category, summary: selected.highlightText },
      });
      setGeneratedPost(result.postCopy);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Failed to generate post — please try again.');
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, [platform, postGoal, storyArc, selectedIndex, highlights]);

  const handleCopy = () => navigator.clipboard.writeText(generatedPost);

  const handleClear = () => {
    setPlatform('Facebook');
    setPostGoal('Drive Donations');
    setStoryArc('');
    setShowAdvanced(false);
    setSelectedIndex(null);
    setGeneratedPost('');
    setValidationError('');
    setGenerateError('');
  };

  const selectedHighlight =
    selectedIndex !== null && highlights[selectedIndex]
      ? highlights[selectedIndex]
      : null;

  const simplifyHighlightText = (text?: string) =>
    (text ?? '').replace(' — your donors want to hear this story.', '').trim();

  return (
    <div className="sms-tab-content">
      {/* Step 1: Select Highlight */}
      <div className="sms-section">
        <h4 className="sms-section-title">Step 1: Choose Prompt Input (Required)</h4>
        <p className="sms-section-sub">Select exactly one highlight to inject into your generated post prompt.</p>

        {highlightsLoading && <div className="sms-loading">Loading achievements…</div>}

        {!highlightsLoading && highlights.length === 0 && (
          <div className="sms-empty">No standout achievements this month yet — check back soon.</div>
        )}

        {!highlightsLoading && highlights.length > 0 && (
          <div className="smg-achievement-cards">
            {highlights.map((h, i) => (
              <div
                key={i}
                className={`smg-achievement-card smg-achievement-card--input${selectedIndex === i ? ' smg-achievement-card--selected' : ''}`}
                onClick={() => {
                  setSelectedIndex(i);
                  setValidationError('');
                }}
              >
                <div className="smg-achievement-head">
                  <span className="smg-achievement-label">{h.category}</span>
                </div>
                <span className="smg-achievement-value">{simplifyHighlightText(h.highlightText)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Post Configuration */}
      <div className="sms-section">
        <h4 className="sms-section-title">Step 2: Configure and Generate</h4>
        <p className="smg-step-helper">
          {selectedHighlight
            ? `Selected highlight: ${selectedHighlight.category} — ${simplifyHighlightText(selectedHighlight.highlightText)}`
            : 'No highlight selected yet. Complete Step 1 to enable generation.'}
        </p>
        <div className="smg-form-row">
          <div className="smg-field">
            <label className="smg-label">Platform</label>
            <select className="smg-select" value={platform} onChange={e => setPlatform(e.target.value as Platform)}>
              {(['WhatsApp','Facebook','Instagram','TikTok','YouTube'] as Platform[]).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="smg-field">
            <label className="smg-label">Post Goal</label>
            <select className="smg-select" value={postGoal} onChange={e => setPostGoal(e.target.value as PostGoal)}>
              {(['Drive Donations','Raise Awareness','Express Gratitude','Announce Event'] as PostGoal[]).map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="smg-field smg-field--button">
            <button
              className="smg-generate-btn"
              onClick={handleGenerate}
              disabled={loading || selectedIndex === null}
            >
              {loading
                ? <><span className="smg-spinner" /> Crafting your post…</>
                : selectedIndex === null
                  ? 'Select Highlight to Generate'
                  : 'Generate Post'}
            </button>
          </div>
        </div>

        {guidelines && (guidelines.whatToDo.length > 0 || guidelines.whatToAvoid.length > 0) && (
          <div className="sms-guidelines-wrap">
            <button
              className="sms-advanced-toggle"
              onClick={() => setShowGuidelines(v => !v)}
            >
              ML writing guidelines active {showGuidelines ? '▴' : '▾'}
            </button>
            {showGuidelines && (
              <div className="sms-guidelines-panel">
                <p className="sms-guidelines-note">
                  These signals from the OLS model are injected into the prompt to guide Gemini's output.
                </p>
                {guidelines.whatToDo.length > 0 && (
                  <div className="sms-guidelines-group">
                    <p className="sms-guidelines-group-label sms-guidelines-group-label--do">What to do</p>
                    {guidelines.whatToDo.map((g, i) => (
                      <div key={i} className="sms-guideline-row">
                        <span className="sms-guideline-direction sms-guideline-direction--increases">▲</span>
                        <span className="sms-guideline-feature">{g.feature}</span>
                        <span className="sms-guideline-coef">
                          increases referrals&ensp;
                          <span className="sms-guideline-num">(+{g.coefficient.toFixed(3)})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {guidelines.whatToAvoid.length > 0 && (
                  <div className="sms-guidelines-group">
                    <p className="sms-guidelines-group-label sms-guidelines-group-label--avoid">What to avoid</p>
                    {guidelines.whatToAvoid.map((g, i) => (
                      <div key={i} className="sms-guideline-row">
                        <span className="sms-guideline-direction sms-guideline-direction--decreases">▼</span>
                        <span className="sms-guideline-feature">{g.feature}</span>
                        <span className="sms-guideline-coef">
                          decreases referrals&ensp;
                          <span className="sms-guideline-num">({g.coefficient.toFixed(3)})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <button
          className="sms-advanced-toggle"
          onClick={() => setShowAdvanced(v => !v)}
        >
          Advanced options {showAdvanced ? '▴' : '▾'}
        </button>

        {showAdvanced && (
          <div className="smg-form-row" style={{ marginTop: '0.75rem' }}>
            <div className="smg-field">
              <label className="smg-label">Story Arc <span className="smg-optional">(optional)</span></label>
              <select className="smg-select" value={storyArc} onChange={e => setStoryArc(e.target.value)}>
                <option value="">None</option>
                {STORY_ARCS.map(arc => (
                  <option key={arc} value={arc}>{arc}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {validationError && <p className="smg-validation">{validationError}</p>}
        {generateError && <p className="smg-validation">{generateError}</p>}
      </div>

      {/* Step 3: Generated Output */}
      <div className="sms-section smg-output-section">
        <h4 className="sms-section-title">Step 3: Generated Post</h4>
        {!generatedPost ? (
          <div className="smg-output-empty">
            Your generated post will appear here after you complete Steps 1 and 2.
          </div>
        ) : (
          <>
          <div className="smg-output-header">
            <span
              className="smg-platform-badge"
              style={{ backgroundColor: PLATFORM_COLORS[platform] ?? '#888' }}
            >
              {platform}
            </span>
          </div>
          <p className="smg-privacy-note">
            <em>Review before posting — ensure no identifying details about residents are included.</em>
          </p>
          <textarea
            ref={textareaRef}
            className="smg-post-textarea"
            value={generatedPost}
            onChange={e => setGeneratedPost(e.target.value)}
          />
          <div className="smg-output-actions">
            <button className="smg-btn smg-btn--primary" onClick={handleCopy}>Copy to Clipboard</button>
            <button className="smg-btn smg-btn--secondary" onClick={handleGenerate} disabled={loading}>
              {loading ? 'Regenerating…' : 'Regenerate'}
            </button>
            <button className="smg-btn smg-btn--ghost" onClick={handleClear}>Clear</button>
          </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Root Component ────────────────────────────────────────────────────────────

export default function SocialMediaStrategy() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: TabId = (rawTab === 'recommendations' || rawTab === 'generator') ? rawTab : 'performance';

  // State passed from Recommendations → Generator
  const [generatorPrefill, setGeneratorPrefill] = useState<{
    platform?: string;
    postType?: string;
    summary?: string;
  }>({});

  const setTab = (tab: TabId) => setSearchParams({ tab });

  const handleGenerateFromHighlight = (platform: string, postType: string, summary: string) => {
    setGeneratorPrefill({ platform, postType, summary });
    setTab('generator');
  };

  const TABS: { id: TabId; label: string }[] = [
    { id: 'performance',     label: 'Performance Overview' },
    { id: 'recommendations', label: 'Recommendations' },
    { id: 'generator',       label: 'Post Generator' },
  ];

  return (
    <div className="sms-root">
      <div className="sms-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`sms-tab${activeTab === t.id ? ' sms-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'performance'     && <PerformanceTab />}
      {activeTab === 'recommendations' && (
        <RecommendationsTab onGenerateFromHighlight={handleGenerateFromHighlight} />
      )}
      {activeTab === 'generator'       && (
        <GeneratorTab
          initialPlatform={generatorPrefill.platform}
          initialPostType={generatorPrefill.postType}
          initialSummary={generatorPrefill.summary}
        />
      )}
    </div>
  );
}
