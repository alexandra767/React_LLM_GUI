import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import ChatView from '../Chat/ChatView';
import ProjectKnowledge from './ProjectKnowledge';
import { Add as AddIcon, Folder as FolderIcon, Lock as LockIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useStreamingProtection } from '../../hooks/useStreamingProtection';

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
    
    .delete-button {
      opacity: 1;
    }
  }
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 16px;
  right: 56px; /* Position it next to the privacy badge */
  background: #333333;
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #AAAAAA;
  opacity: 0;
  z-index: 10;
  
  &:hover {
    background: #FF4444;
    color: #FFFFFF;
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
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

const ProjectContentWrapper = styled.div`
  display: flex;
  height: 100%;
  overflow: hidden;
`;

const ProjectSidebar = styled.div`
  width: 320px;
  background-color: #1E1E1E;
  border-right: 1px solid #333333;
  padding: 20px;
  overflow-y: auto;
  flex-shrink: 0;
`;

const ProjectChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

// Custom comparison function to prevent re-renders during streaming
const areEqual = (prevProps, nextProps) => {
  // If streaming is active, prevent any re-renders
  if (window.__isStreaming) {
    console.log('[ProjectsView] Preventing re-render during streaming');
    return true; // Prevent re-render
  }
  // Otherwise, use default comparison
  return false; // Allow re-render
};

const ProjectsView = React.memo(() => {
  console.log('[ProjectsView] Component render triggered', { 
    timestamp: Date.now(),
    isStreaming: window.__isStreaming
  });
  
  // Use streaming protection hook
  const { renderCount } = useStreamingProtection('ProjectsView');
  
  const theme = useTheme();
  const appContext = useApp();
  const { projects = [], createNewProject, deleteProject, updateProject, appState, setAppState, currentModel } = appContext;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  // Initialize selectedProject from sessionStorage if available
  const [selectedProject, setSelectedProject] = useState(() => {
    const savedProjectId = sessionStorage.getItem('sephia_selected_project');
    if (savedProjectId && projects.length > 0) {
      const project = projects.find(p => p.id === savedProjectId);
      if (project) {
        console.log('ProjectsView - Initializing with saved project:', project);
        return project;
      }
    }
    return null;
  });
  const [projectType, setProjectType] = useState('all');
  const [newProject, setNewProject] = useState({ 
    title: '', 
    description: '',
    isPrivate: true 
  });
  
  // Debug logging
  console.log('ProjectsView render - projects:', projects);
  console.log('ProjectsView render - appContext:', appContext);
  console.log('ProjectsView render - selectedProject:', selectedProject);
  
  // Debug: Log when projects change
  React.useEffect(() => {
    console.log('[ProjectsView] Projects array changed:', {
      projectsLength: projects.length,
      projectIds: projects.map(p => p.id),
      selectedProjectId: selectedProject?.id,
      isStreaming: window.__isStreaming
    });
    
    // If streaming is active, log a warning
    if (window.__isStreaming) {
      console.warn('[ProjectsView] Projects updated while streaming is active! This may cause re-renders.');
    }
  }, [projects]);
  
  // Add mount/unmount logging
  React.useEffect(() => {
    console.log('[ProjectsView] MOUNTED');
    return () => {
      console.log('[ProjectsView] UNMOUNTING', {
        isStreaming: window.__isStreaming,
        selectedProjectId: selectedProject?.id
      });
    };
  }, []);
  
  // Add a loading state to prevent premature resets
  const [isInitialized, setIsInitialized] = useState(false);
  
  React.useEffect(() => {
    // Mark as initialized after a short delay to ensure projects are loaded
    const timer = setTimeout(() => {
      setIsInitialized(true);
      console.log('ProjectsView initialized');
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  
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
    console.log('ProjectsView useEffect - savedProjectId:', savedProjectId);
    console.log('ProjectsView useEffect - projects.length:', projects.length);
    
    if (savedProjectId && projects.length > 0) {
      const project = projects.find(p => p.id === savedProjectId);
      console.log('ProjectsView useEffect - found project:', project);
      if (project) {
        setSelectedProject(project);
      } else {
        console.warn('ProjectsView useEffect - project not found in projects array');
        sessionStorage.removeItem('sephia_selected_project');
      }
    }
  }, [projects]);

  const handleCreateProject = () => {
    if (newProject.title.trim()) {
      console.log('handleCreateProject: Creating new project with currentModel:', currentModel);
      const project = createNewProject({
        ...newProject,
        messages: [],
        fileCount: 0,
        lastUpdated: new Date().toISOString(),
        model: currentModel || 'deepseek-r1:8b-m4' // Ensure the project uses the current model or default
      });
      console.log('handleCreateProject: Created project:', project);
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
  
  const handleDeleteClick = (e, project) => {
    e.stopPropagation(); // Prevent card click
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = () => {
    if (projectToDelete && deleteProject) {
      deleteProject(projectToDelete.id);
      // If we're deleting the currently selected project, go back to projects list
      if (selectedProject && selectedProject.id === projectToDelete.id) {
        setSelectedProject(null);
        sessionStorage.removeItem('sephia_selected_project');
      }
    }
    setShowDeleteConfirm(false);
    setProjectToDelete(null);
  };

  // If a project is selected, show the chat view for that project
  if (selectedProject) {
    console.log('ProjectsView: selectedProject:', selectedProject);
    console.log('ProjectsView: projects array:', projects);
    console.log('ProjectsView: projects.length:', projects.length);
    console.log('ProjectsView: looking for project with id:', selectedProject.id);
    
    // Only verify if we have projects loaded and component is initialized
    if (isInitialized && projects.length > 0) {
      // Verify the project still exists in the projects list
      const currentProject = projects.find(p => p.id === selectedProject.id);
      console.log('ProjectsView: currentProject found:', currentProject);
      
      if (!currentProject) {
        console.warn('Selected project no longer exists, returning to projects list');
        console.warn('Selected project was:', selectedProject);
        console.warn('Available projects:', projects);
        setSelectedProject(null);
        sessionStorage.removeItem('sephia_selected_project');
        return null; // This will cause a re-render and show the projects list
      }
    } else {
      // Projects haven't loaded yet or component not initialized, keep the selected project
      console.log('ProjectsView: Not yet initialized or projects not loaded, keeping selectedProject');
      console.log('isInitialized:', isInitialized, 'projects.length:', projects.length);
    }
    
    // Use currentProject if found, otherwise use selectedProject
    const projectToDisplay = projects.length > 0 ? 
      projects.find(p => p.id === selectedProject.id) || selectedProject : 
      selectedProject;
    
    return (
      <ProjectsContainer>
        <ProjectsHeader>
          <BackButton onClick={handleBackToProjects}>
            ← Back to Projects
          </BackButton>
          <HeaderTop>
            <div>
              <Title>{projectToDisplay.title}</Title>
              <Description>{projectToDisplay.description}</Description>
            </div>
          </HeaderTop>
        </ProjectsHeader>
        <ProjectContentWrapper>
          <ProjectSidebar>
            <ProjectKnowledge 
              project={projectToDisplay} 
              onUpdateProject={updateProject}
            />
          </ProjectSidebar>
          
          <ProjectChatArea>
            {/* Keep all project ChatViews mounted to prevent streaming interruption */}
            {projects.map(project => (
              <div 
                key={project.id}
                style={{ 
                  display: project.id === projectToDisplay.id ? 'flex' : 'none',
                  flexDirection: 'column',
                  width: '100%',
                  height: '100%'
                }}
              >
                <ChatView projectId={project.id} />
              </div>
            ))}
          </ProjectChatArea>
        </ProjectContentWrapper>
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
              <DeleteButton 
                className="delete-button"
                onClick={(e) => handleDeleteClick(e, project)}
                title="Delete project"
              >
                <DeleteIcon style={{ fontSize: 20 }} />
              </DeleteButton>
              
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
      
      {showDeleteConfirm && (
        <CreateProjectModal onClick={() => setShowDeleteConfirm(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Delete Project</ModalTitle>
            
            <Description style={{ marginBottom: 24, lineHeight: 1.6 }}>
              Are you sure you want to delete "{projectToDelete?.title}"? 
              This action cannot be undone and will permanently delete all messages and data associated with this project.
            </Description>
            
            <ButtonGroup>
              <Button className="secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button 
                className="primary" 
                onClick={confirmDelete}
                style={{ backgroundColor: '#FF4444' }}
              >
                Delete Project
              </Button>
            </ButtonGroup>
          </ModalContent>
        </CreateProjectModal>
      )}
    </ProjectsContainer>
  );
}, areEqual);

export default ProjectsView;