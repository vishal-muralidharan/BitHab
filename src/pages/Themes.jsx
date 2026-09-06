import { Link } from 'react-router-dom';

export default function Themes() {
  return (
    <>

      <div className="page-content">
        <div className="page-header">
          <h1>Themes</h1>
          <p>Customize your BitHab experience with various themes</p>
        </div>
        
        
        <div className="current-theme-section">
          <h2>Current Theme</h2>
          <div id="current-theme-display">
              
            </div>
        </div>
        
        <div className="themes-grid">
          
          <div className="theme-card" data-theme="oceanic-depths">
            <div className="theme-preview-container">
              <div className="theme-preview oceanic-depths-preview dark-preview">
                <div className="preview-label">Dark</div>
                <div className="preview-surface">
                  <div className="preview-bar primary"></div>
                  <div className="preview-bar secondary"></div>
                  <div className="preview-bar surface"></div>
                </div>
              </div>
              <div className="theme-preview oceanic-depths-preview light-preview">
                <div className="preview-label">Light</div>
                <div className="preview-surface">
                  <div className="preview-bar primary"></div>
                  <div className="preview-bar secondary"></div>
                  <div className="preview-bar surface"></div>
                </div>
              </div>
            </div>
            <div className="theme-info">
              <h3>Oceanic Depths</h3>
              <button className="theme-select-btn" data-theme="oceanic-depths">Select Theme</button>
            </div>
          </div>

          
          <div className="theme-card" data-theme="evergreen-forest">
            <div className="theme-preview-container">
              <div className="theme-preview evergreen-forest-preview dark-preview">
                <div className="preview-label">Dark</div>
                <div className="preview-surface">
                  <div className="preview-bar primary"></div>
                  <div className="preview-bar secondary"></div>
                  <div className="preview-bar surface"></div>
                </div>
              </div>
              <div className="theme-preview evergreen-forest-preview light-preview">
                <div className="preview-label">Light</div>
                <div className="preview-surface">
                  <div className="preview-bar primary"></div>
                  <div className="preview-bar secondary"></div>
                  <div className="preview-bar surface"></div>
                </div>
              </div>
            </div>
            <div className="theme-info">
              <h3>Evergreen Forest</h3>
              <button className="theme-select-btn" data-theme="evergreen-forest">Select Theme</button>
            </div>
          </div>

          
          <div className="theme-card" data-theme="cyberpunk-neon">
            <div className="theme-preview-container">
              <div className="theme-preview cyberpunk-neon-preview dark-preview">
                <div className="preview-label">Dark</div>
                <div className="preview-surface">
                  <div className="preview-bar primary"></div>
                  <div className="preview-bar secondary"></div>
                  <div className="preview-bar surface"></div>
                </div>
              </div>
              <div className="theme-preview cyberpunk-neon-preview light-preview">
                <div className="preview-label">Light</div>
                <div className="preview-surface">
                  <div className="preview-bar primary"></div>
                  <div className="preview-bar secondary"></div>
                  <div className="preview-bar surface"></div>
                </div>
              </div>
            </div>
            <div className="theme-info">
              <h3>Cyberpunk Neon</h3>
              <button className="theme-select-btn" data-theme="cyberpunk-neon">Select Theme</button>
            </div>
          </div>

          
          <div className="theme-card" data-theme="monochrome-minimalist">
            <div className="theme-preview-container">
              <div className="theme-preview monochrome-minimalist-preview dark-preview">
                <div className="preview-label">Dark</div>
                <div className="preview-surface">
                  <div className="preview-bar primary"></div>
                  <div className="preview-bar secondary"></div>
                  <div className="preview-bar surface"></div>
                </div>
              </div>
              <div className="theme-preview monochrome-minimalist-preview light-preview">
                <div className="preview-label">Light</div>
                <div className="preview-surface">
                  <div className="preview-bar primary"></div>
                  <div className="preview-bar secondary"></div>
                  <div className="preview-bar surface"></div>
                </div>
              </div>
            </div>
            <div className="theme-info">
              <h3>Monochrome</h3>
              <button className="theme-select-btn" data-theme="monochrome-minimalist">Select Theme</button>
            </div>
          </div>

          
          <div className="theme-card" data-theme="sunrise-coral">
            <div className="theme-preview-container">
              <div className="theme-preview sunrise-coral-preview dark-preview">
                <div className="preview-label">Dark</div>
                <div className="preview-surface">
                  <div className="preview-bar primary"></div>
                  <div className="preview-bar secondary"></div>
                  <div className="preview-bar surface"></div>
                </div>
              </div>
              <div className="theme-preview sunrise-coral-preview light-preview">
                <div className="preview-label">Light</div>
                <div className="preview-surface">
                  <div className="preview-bar primary"></div>
                  <div className="preview-bar secondary"></div>
                  <div className="preview-bar surface"></div>
                </div>
              </div>
            </div>
            <div className="theme-info">
              <h3>Sunrise Coral</h3>
              <button className="theme-select-btn" data-theme="sunrise-coral">Select Theme</button>
            </div>
          </div>

          
          <div className="theme-card" data-theme="cherry-blossom">
            <div className="theme-preview-container">
              <div className="theme-preview cherry-blossom-preview dark-preview">
                <div className="preview-label">Dark</div>
                <div className="preview-surface">
                  <div className="preview-bar primary"></div>
                  <div className="preview-bar secondary"></div>
                  <div className="preview-bar surface"></div>
                </div>
              </div>
              <div className="theme-preview cherry-blossom-preview light-preview">
                <div className="preview-label">Light</div>
                <div className="preview-surface">
                  <div className="preview-bar primary"></div>
                  <div className="preview-bar secondary"></div>
                  <div className="preview-bar surface"></div>
                </div>
              </div>
            </div>
            <div className="theme-info">
              <h3>Cherry Blossom</h3>
              <button className="theme-select-btn" data-theme="cherry-blossom">Select Theme</button>
            </div>
          </div>
        </div>
      </div>
    
    </>
  );
}
