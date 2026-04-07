import { useState, useEffect } from 'react';
import '../styles/CookieConsent.css';

interface CookiePreferences {
  essential: boolean; // always true
  functional: boolean;
  analytics: boolean;
}

const STORAGE_KEY = 'cookie-consent';

function getStoredPreferences(): CookiePreferences | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function savePreferences(prefs: CookiePreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

// Remove non-essential cookies that may have been set
function clearNonEssentialCookies(prefs: CookiePreferences) {
  if (!prefs.analytics) {
    // Clear any analytics cookies (e.g., _ga, _gid, _gat)
    const analyticsCookies = ['_ga', '_gid', '_gat'];
    analyticsCookies.forEach(name => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  }
}

export function getCookiePreferences(): CookiePreferences {
  return getStoredPreferences() ?? { essential: true, functional: false, analytics: false };
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    functional: false,
    analytics: false,
  });

  useEffect(() => {
    const stored = getStoredPreferences();
    if (!stored) {
      setVisible(true);
    } else {
      setPreferences(stored);
      clearNonEssentialCookies(stored);
    }
  }, []);

  function handleAcceptAll() {
    const prefs: CookiePreferences = { essential: true, functional: true, analytics: true };
    savePreferences(prefs);
    setPreferences(prefs);
    setVisible(false);
  }

  function handleRejectNonEssential() {
    const prefs: CookiePreferences = { essential: true, functional: false, analytics: false };
    savePreferences(prefs);
    setPreferences(prefs);
    clearNonEssentialCookies(prefs);
    setVisible(false);
  }

  function handleSavePreferences() {
    savePreferences(preferences);
    clearNonEssentialCookies(preferences);
    setVisible(false);
  }

  // Allow reopening from footer link
  useEffect(() => {
    function handleOpenConsent() {
      setVisible(true);
      setShowDetails(true);
    }
    window.addEventListener('open-cookie-settings', handleOpenConsent);
    return () => window.removeEventListener('open-cookie-settings', handleOpenConsent);
  }, []);

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <div className="cookie-banner__content">
        <h3>We value your privacy</h3>
        <p>
          We use cookies to ensure essential site functionality and, with your consent, for analytics
          to improve your experience. You can choose which cookies to allow below.
        </p>

        {showDetails && (
          <div className="cookie-banner__details">
            <label className="cookie-banner__option cookie-banner__option--disabled">
              <input type="checkbox" checked disabled />
              <div>
                <strong>Essential</strong>
                <span>Required for authentication and core functionality. Cannot be disabled.</span>
              </div>
            </label>
            <label className="cookie-banner__option">
              <input
                type="checkbox"
                checked={preferences.functional}
                onChange={e => setPreferences(p => ({ ...p, functional: e.target.checked }))}
              />
              <div>
                <strong>Functional</strong>
                <span>Remembers your preferences and settings for a better experience.</span>
              </div>
            </label>
            <label className="cookie-banner__option">
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={e => setPreferences(p => ({ ...p, analytics: e.target.checked }))}
              />
              <div>
                <strong>Analytics</strong>
                <span>Helps us understand site usage to improve our services.</span>
              </div>
            </label>
          </div>
        )}

        <div className="cookie-banner__actions">
          {showDetails ? (
            <button className="cookie-btn cookie-btn--primary" onClick={handleSavePreferences}>
              Save Preferences
            </button>
          ) : (
            <>
              <button className="cookie-btn cookie-btn--primary" onClick={handleAcceptAll}>
                Accept All
              </button>
              <button className="cookie-btn cookie-btn--secondary" onClick={handleRejectNonEssential}>
                Reject Non-Essential
              </button>
              <button className="cookie-btn cookie-btn--link" onClick={() => setShowDetails(true)}>
                Manage Preferences
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
