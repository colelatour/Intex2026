import { useEffect, useState, useRef } from 'react';
import { get, post } from '../../lib/api';

type Platform = 'WhatsApp' | 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube';
type PostGoal = 'Drive Donations' | 'Raise Awareness' | 'Express Gratitude' | 'Announce Event';
type AchievementType = 'education' | 'health' | 'readiness';

interface AchievementsResponse {
  educationCount: number;
  healthDelta: number;
  nearReadyCount: number;
}

interface GeneratePostResponse {
  postCopy: string;
  dataInsight: string | null;
  platform: string;
}

const PLATFORM_COLORS: Record<Platform, string> = {
  WhatsApp:  '#25D366',
  Facebook:  '#1877F2',
  Instagram: '#C13584',
  TikTok:    '#000000',
  YouTube:   '#FF0000',
};

const STORY_ARCS = [
  'Light Emerging from Darkness',
  'Unexpected Joy',
  'Arrived in Fear / Leaving with Purpose',
  'Community Coming Together',
  'Justice Served',
  'New Beginning',
];

export default function SocialMediaPostGenerator() {
  const [platform, setPlatform]       = useState<Platform>('Facebook');
  const [postGoal, setPostGoal]       = useState<PostGoal>('Drive Donations');
  const [storyArc, setStoryArc]       = useState('');
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementType | null>(null);
  const [achievements, setAchievements] = useState<AchievementsResponse | null>(null);
  const [generatedPost, setGeneratedPost] = useState('');
  const [dataInsight, setDataInsight] = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [validationError, setValidationError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    get<AchievementsResponse>('/api/ml/achievements')
      .then(setAchievements)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [generatedPost]);

  const getAchievementSummary = (): string => {
    if (!achievements) return '';
    if (selectedAchievement === 'education')
      return `${achievements.educationCount} residents completed programs this month`;
    if (selectedAchievement === 'health')
      return `Average health score improved ${achievements.healthDelta > 0 ? '+' : ''}${achievements.healthDelta} points this month`;
    if (selectedAchievement === 'readiness')
      return `${achievements.nearReadyCount} residents are approaching reintegration readiness`;
    return '';
  };

  const handleGenerate = async () => {
    if (!selectedAchievement) {
      setValidationError('Select an achievement to highlight');
      return;
    }
    setValidationError('');
    setLoading(true);
    try {
      const result = await post<GeneratePostResponse>('/api/ml/generate-post', {
        platform,
        postGoal,
        storyArc: storyArc || undefined,
        achievement: { type: selectedAchievement, summary: getAchievementSummary() },
      });
      setGeneratedPost(result.postCopy);
      setDataInsight(result.dataInsight);
    } catch {
      setGeneratedPost('');
      setDataInsight(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPost);
  };

  const handleClear = () => {
    setPlatform('Facebook');
    setPostGoal('Drive Donations');
    setStoryArc('');
    setSelectedAchievement(null);
    setGeneratedPost('');
    setDataInsight(null);
    setValidationError('');
  };

  return (
    <div className="smg-container">
      <div className="smg-section">
        <h3 className="smg-section-title">Post Configuration</h3>
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
          <div className="smg-field">
            <label className="smg-label">Story Arc <span className="smg-optional">(optional)</span></label>
            <select className="smg-select" value={storyArc} onChange={e => setStoryArc(e.target.value)}>
              <option value="">None</option>
              {STORY_ARCS.map(arc => (
                <option key={arc} value={arc}>{arc}</option>
              ))}
            </select>
          </div>
          <div className="smg-field smg-field--button">
            <button className="smg-generate-btn" onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <><span className="smg-spinner" /> Crafting your post...</>
              ) : 'Generate Post'}
            </button>
          </div>
        </div>
        {validationError && <p className="smg-validation">{validationError}</p>}
      </div>

      <div className="smg-section">
        <h3 className="smg-section-title">This Month's Achievements</h3>
        <p className="smg-section-sub">Select one to highlight in your post</p>
        <div className="smg-achievement-cards">
          <div
            className={`smg-achievement-card${selectedAchievement === 'education' ? ' smg-achievement-card--selected' : ''}`}
            onClick={() => setSelectedAchievement('education')}
          >
            <span className="smg-achievement-label">Education</span>
            <span className="smg-achievement-value">
              {achievements ? `${achievements.educationCount} residents completed programs this month` : '—'}
            </span>
          </div>
          <div
            className={`smg-achievement-card${selectedAchievement === 'health' ? ' smg-achievement-card--selected' : ''}`}
            onClick={() => setSelectedAchievement('health')}
          >
            <span className="smg-achievement-label">Health</span>
            <span className="smg-achievement-value">
              {achievements
                ? `Average health score ${achievements.healthDelta >= 0 ? 'improved' : 'changed'} ${achievements.healthDelta > 0 ? '+' : ''}${achievements.healthDelta} points`
                : '—'}
            </span>
          </div>
          <div
            className={`smg-achievement-card${selectedAchievement === 'readiness' ? ' smg-achievement-card--selected' : ''}`}
            onClick={() => setSelectedAchievement('readiness')}
          >
            <span className="smg-achievement-label">Readiness</span>
            <span className="smg-achievement-value">
              {achievements ? `${achievements.nearReadyCount} residents approaching reintegration readiness` : '—'}
            </span>
          </div>
        </div>
      </div>

      {generatedPost && (
        <div className="smg-section">
          <div className="smg-output-header">
            <span
              className="smg-platform-badge"
              style={{ backgroundColor: PLATFORM_COLORS[platform] }}
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
          {dataInsight && (
            <p className="smg-data-insight">{dataInsight}</p>
          )}
          <div className="smg-output-actions">
            <button className="smg-btn smg-btn--primary" onClick={handleCopy}>Copy to Clipboard</button>
            <button className="smg-btn smg-btn--secondary" onClick={handleGenerate} disabled={loading}>
              {loading ? 'Regenerating...' : 'Regenerate'}
            </button>
            <button className="smg-btn smg-btn--ghost" onClick={handleClear}>Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}
