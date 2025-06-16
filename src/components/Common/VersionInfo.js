import React, { useState, useEffect } from 'react';
import { VERSION_INFO } from '../../version';

const VersionInfo = ({ detailed = false, className = '' }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [changelog, setChangelog] = useState(null);

  useEffect(() => {
    // Load changelog if detailed view is requested
    if (detailed && !changelog) {
      fetch('/changelog.json')
        .then(response => response.json())
        .then(data => setChangelog(data))
        .catch(error => console.warn('Could not load changelog:', error));
    }
  }, [detailed, changelog]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!detailed) {
    // Simple version display
    return (
      <div className={`version-info-simple ${className}`}>
        <span className="version-badge">
          v{VERSION_INFO.version}
        </span>
      </div>
    );
  }

  // Detailed version information
  return (
    <div className={`version-info-detailed ${className}`}>
      <div className="version-header">
        <h3>🚀 Sephia v{VERSION_INFO.version}</h3>
        <p className="build-date">Built: {formatDate(VERSION_INFO.buildDate)}</p>
      </div>

      <div className="version-details">
        <button 
          className="toggle-details-btn"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '🔼 Hide Details' : '🔽 Show Details'}
        </button>

        {showDetails && (
          <div className="details-panel">
            <div className="system-info">
              <h4>📊 System Information</h4>
              <ul>
                <li><strong>Platform:</strong> {VERSION_INFO.platform}</li>
                <li><strong>Node Version:</strong> {VERSION_INFO.nodeVersion}</li>
                <li><strong>Git Branch:</strong> {VERSION_INFO.gitBranch}</li>
                <li><strong>Git Commit:</strong> {VERSION_INFO.gitCommit}</li>
              </ul>
            </div>

            <div className="features-info">
              <h4>🎯 Features</h4>
              <ul className="features-list">
                {VERSION_INFO.features.map((feature, index) => (
                  <li key={index}>✅ {feature}</li>
                ))}
              </ul>
            </div>

            {VERSION_INFO.changelog && VERSION_INFO.changelog[VERSION_INFO.version] && (
              <div className="changelog-info">
                <h4>📝 Changelog v{VERSION_INFO.version}</h4>
                <ul className="changelog-list">
                  {VERSION_INFO.changelog[VERSION_INFO.version].map((change, index) => (
                    <li key={index}>• {change}</li>
                  ))}
                </ul>
              </div>
            )}

            {changelog && changelog.roadmap && (
              <div className="roadmap-info">
                <h4>🗺️ Upcoming Features</h4>
                {Object.entries(changelog.roadmap).map(([version, features]) => (
                  <div key={version} className="roadmap-version">
                    <h5>v{version}</h5>
                    <ul>
                      {features.map((feature, index) => (
                        <li key={index}>🔮 {feature}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .version-info-simple {
          display: inline-block;
        }

        .version-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .version-info-detailed {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          margin: 10px 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .version-header h3 {
          margin: 0 0 5px 0;
          color: #2c3e50;
          font-size: 1.5rem;
        }

        .build-date {
          color: #6c757d;
          font-size: 0.9rem;
          margin: 0;
        }

        .toggle-details-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin: 15px 0 10px 0;
          font-size: 0.9rem;
        }

        .toggle-details-btn:hover {
          background: #0056b3;
        }

        .details-panel {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 15px;
          margin-top: 10px;
        }

        .details-panel h4 {
          margin: 0 0 10px 0;
          color: #495057;
          font-size: 1.1rem;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 5px;
        }

        .details-panel h5 {
          margin: 10px 0 5px 0;
          color: #6c757d;
          font-size: 1rem;
        }

        .details-panel ul {
          margin: 0 0 20px 0;
          padding-left: 20px;
        }

        .details-panel li {
          margin: 5px 0;
          line-height: 1.4;
        }

        .features-list li,
        .changelog-list li {
          color: #495057;
          font-size: 0.9rem;
        }

        .roadmap-version {
          background: #f8f9fa;
          border-left: 3px solid #007bff;
          padding: 10px;
          margin: 10px 0;
          border-radius: 0 4px 4px 0;
        }

        .system-info strong {
          color: #343a40;
        }

        @media (max-width: 768px) {
          .version-info-detailed {
            padding: 15px;
            margin: 5px 0;
          }
          
          .details-panel {
            padding: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default VersionInfo;