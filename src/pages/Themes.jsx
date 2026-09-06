import { useTheme } from '../context/ThemeContext';

export default function Themes() {
  const { currentTheme, setTheme, themes } = useTheme();

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Themes</h1>
        <p>Customize your BitHab experience with various themes</p>
      </div>
      
      <div className="current-theme-section">
        <h2>Current Theme</h2>
        <div id="current-theme-display">
          <div className="current-theme-name">{themes[currentTheme]?.name}</div>
        </div>
      </div>
      
      <div className="themes-grid">
        {Object.entries(themes).map(([themeKey, themeData]) => (
          <div 
            key={themeKey} 
            className={`theme-card ${currentTheme === themeKey ? 'active' : ''}`} 
            data-theme={themeKey}
          >
            <div className="theme-preview-container">
              <div className={`theme-preview ${themeKey}-preview dark-preview`}>
                <div className="preview-label">Dark</div>
                <div className="preview-surface">
                  <div className="preview-bar primary"></div>
                  <div className="preview-bar secondary"></div>
                  <div className="preview-bar surface"></div>
                </div>
              </div>
              <div className={`theme-preview ${themeKey}-preview light-preview`}>
                <div className="preview-label">Light</div>
                <div className="preview-surface">
                  <div className="preview-bar primary"></div>
                  <div className="preview-bar secondary"></div>
                  <div className="preview-bar surface"></div>
                </div>
              </div>
            </div>
            <div className="theme-info">
              <h3>{themeData.name}</h3>
              <button 
                className="theme-select-btn" 
                data-theme={themeKey}
                onClick={() => setTheme(themeKey)}
              >
                Select Theme
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
