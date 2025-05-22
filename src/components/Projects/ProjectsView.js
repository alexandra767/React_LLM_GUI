import React, { useState } from 'react';
import styled from '@emotion/styled';
// Theme is now handled by ThemeContext
import { useApp } from '../../context/AppContext';

const ProjectsContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #F0F0F0;
  margin-bottom: 8px;
`;

const Description = styled.p`
  font-size: 14px;
  color: #AAAAAA;
  margin: 0;
`;

const ProjectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
`;

const ProjectCard = styled.div`
  background-color: #252525;
  border-radius: 8px;
  padding: 24px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid #333333;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
`;

const ProjectTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #F0F0F0;
  margin: 0 0 8px 0;
`;

const ProjectInfo = styled.div`
  font-size: 14px;
  color: #CCCCCC;
  margin-bottom: 16px;
`;

const ProjectDescription = styled.p`
  font-size: 14px;
  color: #CCCCCC;
  margin-bottom: 16px;
  line-height: 1.5;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 32px;
  background-color: #252525;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #333333;
`;

const EmptyStateTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #F0F0F0;
  margin-bottom: 16px;
`;

const EmptyStateText = styled.p`
  font-size: 14px;
  color: #AAAAAA;
  max-width: 500px;
  margin-bottom: 24px;
  line-height: 1.5;
`;

const CreateProjectButton = styled.button`
  background-color: #FF643D;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 8px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #FF8C6B;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const Button = styled.button`
  background-color: #FF643D;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 8px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #FF8C6B;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ProjectsView = () => {
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
      <Header>
        <Title>Projects</Title>
        <Description>
          Create and manage projects to organize your conversations and knowledge files.
        </Description>
      </Header>
      
      {projects.length > 0 ? (
        <ProjectGrid>
          {projects.map(project => (
            <ProjectCard key={project.id}>
              <ProjectTitle>{project.title}</ProjectTitle>
              <ProjectInfo>
                Created {new Date(project.createdAt).toLocaleDateString()}
              </ProjectInfo>
              <ProjectDescription>
                {project.description}
              </ProjectDescription>
            </ProjectCard>
          ))}
        </ProjectGrid>
      ) : (
        <EmptyState>
          <EmptyStateTitle>No Projects Yet</EmptyStateTitle>
          <EmptyStateText>
            Projects help you organize related conversations and files together.
            Create your first project to get started.
          </EmptyStateText>
          
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
                  border: '1px solid #333333',
                  background: '#252525',
                  color: '#F0F0F0',
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
                  border: '1px solid #333333',
                  background: '#252525',
                  color: '#F0F0F0',
                  height: '80px',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button onClick={handleCreateProject}>Create</Button>
                <Button 
                  onClick={() => setShowCreateForm(false)}
                  style={{ background: 'transparent', border: '1px solid #333333' }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowCreateForm(true)}>Create New Project</Button>
          )}
        </EmptyState>
      )}
    </ProjectsContainer>
  );
};

export default ProjectsView;