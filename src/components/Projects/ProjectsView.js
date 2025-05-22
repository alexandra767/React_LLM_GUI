import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';

const ProjectsContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 900px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: ${props => props.theme.spacing.large};
`;

const Title = styled.h1`
  font-size: ${props => props.theme.typography.header.size};
  font-weight: ${props => props.theme.typography.header.weight};
  color: ${props => props.theme.colors.primaryText};
  margin-bottom: ${props => props.theme.spacing.small};
`;

const Description = styled.p`
  font-size: ${props => props.theme.typography.regularText.size};
  color: ${props => props.theme.colors.tertiaryText};
`;

const ProjectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: ${props => props.theme.spacing.large};
`;

const ProjectCard = styled.div`
  background-color: ${props => props.theme.colors.secondaryBg};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.large};
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
`;

const ProjectTitle = styled.h3`
  font-size: ${props => props.theme.typography.sectionTitle.size};
  font-weight: ${props => props.theme.typography.sectionTitle.weight};
  color: ${props => props.theme.colors.primaryText};
  margin-bottom: ${props => props.theme.spacing.small};
`;

const ProjectInfo = styled.div`
  font-size: ${props => props.theme.typography.secondaryInfo.size};
  color: ${props => props.theme.colors.tertiaryText};
  margin-bottom: ${props => props.theme.spacing.medium};
`;

const ProjectDescription = styled.p`
  font-size: ${props => props.theme.typography.regularText.size};
  color: ${props => props.theme.colors.secondaryText};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: ${props => props.theme.spacing.xlarge};
  background-color: ${props => props.theme.colors.secondaryBg};
  border-radius: ${props => props.theme.borderRadius.medium};
`;

const EmptyStateTitle = styled.h2`
  font-size: ${props => props.theme.typography.sectionTitle.size};
  font-weight: ${props => props.theme.typography.sectionTitle.weight};
  color: ${props => props.theme.colors.primaryText};
  margin-bottom: ${props => props.theme.spacing.medium};
`;

const EmptyStateMessage = styled.p`
  font-size: ${props => props.theme.typography.regularText.size};
  color: ${props => props.theme.colors.tertiaryText};
  max-width: 500px;
  margin-bottom: ${props => props.theme.spacing.large};
`;

const Button = styled.button`
  background-color: ${props => props.theme.colors.accent};
  color: ${props => props.theme.colors.primaryText};
  border: none;
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.small} ${props => props.theme.spacing.large};
  font-size: ${props => props.theme.typography.regularText.size};
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.colors.accent}dd;
  }
`;

const ProjectsView = () => {
  const { theme } = useTheme();
  const { projects, createNewProject } = useApp();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  
  const handleCreateProject = () => {
    if (newProject.title.trim()) {
      createNewProject(newProject);
      setNewProject({ title: '', description: '' });
      setShowCreateForm(false);
    }
  };
  
  return (
    <ProjectsContainer>
      <Header theme={theme}>
        <Title theme={theme}>Projects</Title>
        <Description theme={theme}>
          Create and manage projects to organize your conversations and knowledge files.
        </Description>
      </Header>
      
      {projects.length > 0 ? (
        <ProjectGrid theme={theme}>
          {projects.map(project => (
            <ProjectCard key={project.id} theme={theme}>
              <ProjectTitle theme={theme}>{project.title}</ProjectTitle>
              <ProjectInfo theme={theme}>
                Created {new Date(project.createdAt).toLocaleDateString()}
              </ProjectInfo>
              <ProjectDescription theme={theme}>
                {project.description}
              </ProjectDescription>
            </ProjectCard>
          ))}
        </ProjectGrid>
      ) : (
        <EmptyState theme={theme}>
          <EmptyStateTitle theme={theme}>No Projects Yet</EmptyStateTitle>
          <EmptyStateMessage theme={theme}>
            Projects help you organize related conversations and files together.
            Create your first project to get started.
          </EmptyStateMessage>
          
          {showCreateForm ? (
            <div style={{ width: '100%', maxWidth: '400px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Project title"
                value={newProject.title}
                onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '10px',
                  borderRadius: '4px',
                  border: `1px solid ${theme.colors.border}`,
                  background: theme.colors.primaryBg,
                  color: theme.colors.primaryText,
                }}
              />
              <textarea
                placeholder="Project description (optional)"
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '10px',
                  borderRadius: '4px',
                  border: `1px solid ${theme.colors.border}`,
                  background: theme.colors.primaryBg,
                  color: theme.colors.primaryText,
                  height: '80px',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button theme={theme} onClick={handleCreateProject}>Create</Button>
                <Button 
                  theme={theme} 
                  onClick={() => setShowCreateForm(false)}
                  style={{ background: 'transparent', border: `1px solid ${theme.colors.border}` }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button theme={theme} onClick={() => setShowCreateForm(true)}>Create New Project</Button>
          )}
        </EmptyState>
      )}
    </ProjectsContainer>
  );
};

export default ProjectsView;