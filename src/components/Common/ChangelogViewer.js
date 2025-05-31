import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';

const ChangelogContainer = styled('div')({
  maxWidth: '800px',
  margin: '0 auto',
  padding: '20px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
});

const ChangelogHeader = styled('div')({
  marginBottom: '30px',
  textAlign: 'center'
});

const Title = styled('h1')({
  color: '#2c3e50',
  marginBottom: '10px'
});

const Subtitle = styled('p')({
  color: '#6c757d',
  fontSize: '1.1rem'
});

const VersionSection = styled('div')({
  backgroundColor: 'white',
  border: '1px solid #dee2e6',
  borderRadius: '6px',
  marginBottom: '20px',
  overflow: 'hidden'
});

const VersionHeader = styled('div')({
  backgroundColor: '#007bff',
  color: 'white',
  padding: '15px 20px',
  borderBottom: '1px solid #dee2e6'
});

const VersionTitle = styled('h2')({
  margin: '0 0 5px 0',
  fontSize: '1.3rem'
});

const VersionDate = styled('span')({
  fontSize: '0.9rem',
  opacity: 0.9
});

const VersionContent = styled('div')({
  padding: '20px'
});

const ChangeCategory = styled('div')({
  marginBottom: '20px'
});

const CategoryTitle = styled('h3')({
  margin: '0 0 10px 0',
  fontSize: '1.1rem',
  color: '#495057',
  borderBottom: '2px solid #e9ecef',
  paddingBottom: '5px'
});

const ChangeList = styled('ul')({
  margin: '0',
  paddingLeft: '20px'
});

const ChangeItem = styled('li')({
  margin: '5px 0',
  lineHeight: '1.4',
  color: '#495057'
});

const LoadingMessage = styled('div')({
  textAlign: 'center',
  padding: '40px',
  color: '#6c757d'
});

const ErrorMessage = styled('div')({
  textAlign: 'center',
  padding: '40px',
  color: '#dc3545',
  backgroundColor: '#f8d7da',
  border: '1px solid #f5c6cb',
  borderRadius: '4px'
});

const RoadmapSection = styled('div')({
  marginTop: '40px',
  backgroundColor: 'white',
  border: '1px solid #dee2e6',
  borderRadius: '6px',
  padding: '20px'
});

const RoadmapTitle = styled('h2')({
  color: '#2c3e50',
  marginBottom: '20px',
  fontSize: '1.4rem'
});

const RoadmapVersion = styled('div')({
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '4px',
  padding: '15px',
  marginBottom: '15px'
});

const RoadmapVersionTitle = styled('h3')({
  margin: '0 0 10px 0',
  color: '#495057',
  fontSize: '1.1rem'
});

const ChangelogViewer = () => {
  const [changelog, setChangelog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadChangelog = async () => {
      try {
        const response = await fetch('/changelog.json');
        if (!response.ok) {
          throw new Error('Failed to load changelog');
        }
        const data = await response.json();
        setChangelog(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadChangelog();
  }, []);

  if (loading) {
    return <LoadingMessage>📄 Loading changelog...</LoadingMessage>;
  }

  if (error) {
    return <ErrorMessage>❌ Error loading changelog: {error}</ErrorMessage>;
  }

  if (!changelog) {
    return <ErrorMessage>📄 No changelog available</ErrorMessage>;
  }

  const { projectInfo, versions, roadmap } = changelog;

  return (
    <ChangelogContainer>
      <ChangelogHeader>
        <Title>📋 {projectInfo.name} Changelog</Title>
        <Subtitle>{projectInfo.description}</Subtitle>
        <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
          Current Version: v{projectInfo.currentVersion} • 
          Last Updated: {new Date(projectInfo.lastUpdated).toLocaleDateString()}
        </p>
      </ChangelogHeader>

      {Object.entries(versions).map(([version, info]) => (
        <VersionSection key={version}>
          <VersionHeader>
            <VersionTitle>v{version} - {info.title}</VersionTitle>
            <VersionDate>{info.date}</VersionDate>
          </VersionHeader>
          
          <VersionContent>
            <p style={{ marginBottom: '20px', fontStyle: 'italic' }}>{info.description}</p>
            
            {info.features && info.features.length > 0 && (
              <ChangeCategory>
                <CategoryTitle>✨ New Features</CategoryTitle>
                <ChangeList>
                  {info.features.map((feature, index) => (
                    <ChangeItem key={index}>{feature}</ChangeItem>
                  ))}
                </ChangeList>
              </ChangeCategory>
            )}

            {info.bugFixes && info.bugFixes.length > 0 && (
              <ChangeCategory>
                <CategoryTitle>🐛 Bug Fixes</CategoryTitle>
                <ChangeList>
                  {info.bugFixes.map((fix, index) => (
                    <ChangeItem key={index}>{fix}</ChangeItem>
                  ))}
                </ChangeList>
              </ChangeCategory>
            )}

            {info.technicalImprovements && info.technicalImprovements.length > 0 && (
              <ChangeCategory>
                <CategoryTitle>🔧 Technical Improvements</CategoryTitle>
                <ChangeList>
                  {info.technicalImprovements.map((improvement, index) => (
                    <ChangeItem key={index}>{improvement}</ChangeItem>
                  ))}
                </ChangeList>
              </ChangeCategory>
            )}

            {info.breaking && info.breaking.length > 0 && (
              <ChangeCategory>
                <CategoryTitle>⚠️ Breaking Changes</CategoryTitle>
                <ChangeList>
                  {info.breaking.map((breaking, index) => (
                    <ChangeItem key={index}>{breaking}</ChangeItem>
                  ))}
                </ChangeList>
              </ChangeCategory>
            )}
          </VersionContent>
        </VersionSection>
      ))}

      {roadmap && Object.keys(roadmap).length > 0 && (
        <RoadmapSection>
          <RoadmapTitle>🗺️ Roadmap - Upcoming Features</RoadmapTitle>
          {Object.entries(roadmap).map(([version, features]) => (
            <RoadmapVersion key={version}>
              <RoadmapVersionTitle>v{version}</RoadmapVersionTitle>
              <ChangeList>
                {features.map((feature, index) => (
                  <ChangeItem key={index}>🔮 {feature}</ChangeItem>
                ))}
              </ChangeList>
            </RoadmapVersion>
          ))}
        </RoadmapSection>
      )}
    </ChangelogContainer>
  );
};

export default ChangelogViewer;