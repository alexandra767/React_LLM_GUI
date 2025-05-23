import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import ChatView from '../Chat/ChatView';
import { Add as AddIcon, Folder as FolderIcon, Lock as LockIcon } from '@mui/icons-material';

const ProjectsContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #1E1E1E;
  overflow-y: auto;
`;

const ProjectsHeader = styled.div`
  padding: 24px 32px;
  border-bottom: 1px solid #333333;
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #AAAAAA;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #252525;
    color: #F0F0F0;
  }
`;

const ProjectTypeToggle = styled.div`
  display: flex;
  gap: 8px;
  background-color: #252525;
  border-radius: 8px;
  padding: 4px;
`;

const ToggleButton = styled.button`
  background: ${props => props.active ? '#333333' : 'transparent'};
  border: none;
  color: ${props => props.active ? '#F0F0F0' : '#AAAAAA'};
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: #F0F0F0;
  }
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 600;
  color: #F0F0F0;
  margin: 0 0 8px 0;
`;

const Description = styled.p`
  font-size: 16px;
  color: #AAAAAA;
  margin: 0;
`;

const ProjectsContent = styled.div`
  padding: 32px;
  flex: 1;
`;

const ProjectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const NewProjectCard = styled.div`
  background-color: transparent;
  border: 2px dashed #333333;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  
  &:hover {
    border-color: #FF643D;
    background-color: rgba(255, 100, 61, 0.05);
  }
`;

const ProjectCard = styled.div`
  background-color: #252525;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #333333;
  position: relative;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    border-color: #404040;
  }
`;

const ProjectIcon = styled.div`
  width: 40px;
  height: 40px;
  background-color: #333333;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: #FF643D;
`;

const ProjectTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #F0F0F0;
  margin: 0 0 8px 0;
`;

const ProjectMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #888888;
  margin-top: auto;
  padding-top: 16px;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ProjectDescription = styled.p`
  font-size: 14px;
  color: #AAAAAA;
  margin: 0 0 16px 0;
  line-height: 1.5;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const PrivacyBadge = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  background-color: ${props => props.private ? '#333333' : 'transparent'};
  color: ${props => props.private ? '#AAAAAA' : '#4CAF50'};
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const CreateProjectModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #252525;
  border-radius: 12px;
  padding: 32px;
  width: 500px;
  max-width: 90%;
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #F0F0F0;
  margin: 0 0 24px 0;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  background-color: #1E1E1E;
  border: 1px solid #333333;
  border-radius: 8px;
  color: #F0F0F0;
  font-size: 16px;
  margin-bottom: 16px;
  
  &:focus {
    outline: none;
    border-color: #FF643D;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  background-color: #1E1E1E;
  border: 1px solid #333333;
  border-radius: 8px;
  color: #F0F0F0;
  font-size: 16px;
  margin-bottom: 24px;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #FF643D;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const Button = styled.button`
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  
  &.primary {
    background-color: #FF643D;
    color: #FFFFFF;
    
    &:hover {
      background-color: #FF8C6B;
    }
  }
  
  &.secondary {
    background-color: transparent;
    color: #F0F0F0;
    border: 1px solid #333333;
    
    &:hover {
      background-color: #333333;
    }
  }
`;

const ProjectsView = () => {
  const theme = useTheme();
  const { projects = [], createNewProject, appState, setAppState, currentModel } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectType, setProjectType] = useState('all');
  const [newProject, setNewProject] = useState({ 
    title: '', 
    description: '',
    isPrivate: true 
  });
  
  // Persist selected project ID in session storage to survive component re-renders
  React.useEffect(() => {
    if (selectedProject) {
      sessionStorage.setItem('sephia_selected_project', selectedProject.id);
    } else {
      sessionStorage.removeItem('sephia_selected_project');
    }
  }, [selectedProject]);
  
  // Restore selected project on mount
  React.useEffect(() => {
    const savedProjectId = sessionStorage.getItem('sephia_selected_project');
    if (savedProjectId && projects.length > 0) {
      const project = projects.find(p => p.id === savedProjectId);
      if (project) {
        setSelectedProject(project);
      }
    }
  }, [projects]);

  const handleCreateProject = () => {
    if (newProject.title.trim()) {
      const project = createNewProject({
        ...newProject,
        messages: [],
        fileCount: 0,
        lastUpdated: new Date().toISOString(),
        model: currentModel // Ensure the project uses the current model
      });
      setNewProject({ title: '', description: '', isPrivate: true });
      setShowCreateModal(false);
      // Open the new project
      setSelectedProject(project);
    }
  };

  const handleProjectClick = (project) => {
    console.log('Project clicked:', project);
    setSelectedProject(project);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
  };

  // If a project is selected, show the chat view for that project
  if (selectedProject) {
    // Verify the project still exists in the projects list
    const currentProject = projects.find(p => p.id === selectedProject.id);
    if (!currentProject) {
      console.warn('Selected project no longer exists, returning to projects list');
      setSelectedProject(null);
      return null; // This will cause a re-render and show the projects list
    }
    
    return (
      <ProjectsContainer>
        <ProjectsHeader>
          <BackButton onClick={handleBackToProjects}>
            ← Back to Projects
          </BackButton>
          <HeaderTop>
            <div>
              <Title>{currentProject.title}</Title>
              <Description>{currentProject.description}</Description>
            </div>
          </HeaderTop>
        </ProjectsHeader>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ChatView projectId={currentProject.id} />
        </div>
      </ProjectsContainer>
    );
  }

  // Filter projects based on type
  const filteredProjects = projectType === 'private' 
    ? projects.filter(p => p.isPrivate)
    : projects;

  return (
    <ProjectsContainer>
      <ProjectsHeader>
        <HeaderTop>
          <Title>Projects</Title>
          <ProjectTypeToggle>
            <ToggleButton 
              active={projectType === 'all'} 
              onClick={() => setProjectType('all')}
            >
              All projects
            </ToggleButton>
            <ToggleButton 
              active={projectType === 'private'} 
              onClick={() => setProjectType('private')}
            >
              Private
            </ToggleButton>
          </ProjectTypeToggle>
        </HeaderTop>
        <Description>
          Organize your work with AI-powered project spaces
        </Description>
      </ProjectsHeader>
      
      <ProjectsContent>
        <ProjectGrid>
          <NewProjectCard onClick={() => setShowCreateModal(true)}>
            <AddIcon style={{ fontSize: 48, color: '#666666', marginBottom: 16 }} />
            <ProjectTitle style={{ color: '#AAAAAA' }}>New Project</ProjectTitle>
            <Description>Create a new project space</Description>
          </NewProjectCard>
          
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} onClick={() => handleProjectClick(project)}>
              <PrivacyBadge private={project.isPrivate}>
                {project.isPrivate && <LockIcon style={{ fontSize: 12 }} />}
                {project.isPrivate ? 'Private' : 'Public'}
              </PrivacyBadge>
              
              <ProjectIcon>
                <FolderIcon />
              </ProjectIcon>
              
              <ProjectTitle>{project.title}</ProjectTitle>
              <ProjectDescription>
                {project.description || 'No description provided'}
              </ProjectDescription>
              
              <ProjectMeta>
                <MetaItem>
                  {project.fileCount || 0} files
                </MetaItem>
                <MetaItem>
                  {project.messages?.length || 0} messages
                </MetaItem>
                <MetaItem>
                  {new Date(project.lastUpdated || project.createdAt).toLocaleDateString()}
                </MetaItem>
              </ProjectMeta>
            </ProjectCard>
          ))}
        </ProjectGrid>
      </ProjectsContent>

      {showCreateModal && (
        <CreateProjectModal onClick={() => setShowCreateModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Create New Project</ModalTitle>
            
            <Input
              type="text"
              placeholder="Project name"
              value={newProject.title}
              onChange={(e) => setNewProject({...newProject, title: e.target.value})}
              autoFocus
            />
            
            <TextArea
              placeholder="Project description (optional)"
              value={newProject.description}
              onChange={(e) => setNewProject({...newProject, description: e.target.value})}
            />
            
            <ButtonGroup>
              <Button className="secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button className="primary" onClick={handleCreateProject}>
                Create Project
              </Button>
            </ButtonGroup>
          </ModalContent>
        </CreateProjectModal>
      )}
    </ProjectsContainer>
  );
};

export default ProjectsView;