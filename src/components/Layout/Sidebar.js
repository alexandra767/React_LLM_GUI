import React from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import BrainIcon from '../Chat/BrainIcon';
import { 
  Add as AddIcon,
  Chat as ChatIcon,
  FolderOpen as ProjectsIcon,
  Settings as SettingsIcon,
  BookmarkBorder as StarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  AccountCircle as AccountIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Photo as PhotoIcon,
  SmartToy as OllamaIcon
} from '@mui/icons-material';

const SidebarContainer = styled.div`
  width: ${props => props.collapsed ? '64px' : '220px'};
  height: 100vh;
  background-color: ${props => props.theme.colors.secondaryBg};
  border-right: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow-x: hidden;
`;

const SidebarSection = styled.div`
  padding: ${props => props.theme.spacing.medium};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.small};
`;

const SidebarButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.small};
  background-color: ${props => props.active ? props.theme.colors.primaryBg : 'transparent'};
  color: ${props => props.active ? props.theme.colors.primaryText : props.theme.colors.tertiaryText};
  border: none;
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.small} ${props => props.theme.spacing.medium};
  font-size: ${props => props.theme.typography.regularText.size};
  font-weight: ${props => props.theme.typography.regularText.weight};
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s ease;
  white-space: nowrap;
  position: relative;
  width: 100%;
  
  &:hover {
    background-color: ${props => props.theme.colors.primaryBg};
  }
  
  &:hover .chat-actions {
    opacity: 1;
  }
  
  svg {
    font-size: 20px;
  }
`;

const ChatActions = styled.div`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  opacity: 0;
  transition: opacity 0.2s ease;
`;

const ActionButton = styled.button`
  background-color: transparent;
  color: ${props => props.theme.colors.tertiaryText};
  border: none;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  
  &:hover {
    color: ${props => props.theme.colors.accent};
  }
  
  svg {
    font-size: 16px;
  }
`;

const SectionTitle = styled.h3`
  font-size: ${props => props.theme.typography.sectionTitle.size};
  font-weight: ${props => props.theme.typography.sectionTitle.weight};
  color: ${props => props.theme.colors.tertiaryText};
  margin: ${props => props.theme.spacing.medium} 0 ${props => props.theme.spacing.small};
  padding: 0 ${props => props.theme.spacing.medium};
  white-space: nowrap;
`;

const Divider = styled.div`
  height: 1px;
  background-color: ${props => props.theme.colors.border};
  margin: ${props => props.theme.spacing.small} 0;
`;

const ProfileSection = styled.div`
  margin-top: auto;
  padding: ${props => props.theme.spacing.medium};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.small};
  border-top: 1px solid ${props => props.theme.colors.border};
  position: relative;
  
  &:hover .profile-actions {
    opacity: 1;
  }
`;

const ProfileImage = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.accent};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  &:hover::after {
    content: 'Edit';
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
  }
`;

const ProfileInfo = styled.div`
  display: ${props => props.collapsed ? 'none' : 'flex'};
  flex-direction: column;
`;

const ProfileName = styled.span`
  font-size: ${props => props.theme.typography.regularText.size};
  font-weight: ${props => props.theme.typography.regularText.weight};
  color: ${props => props.theme.colors.primaryText};
`;

const ConnectionStatus = styled.span`
  font-size: ${props => props.theme.typography.secondaryInfo.size};
  color: ${props => {
    switch(props.status) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FFC107';
      case 'disconnected': return '#F44336';
      default: return props.theme.colors.tertiaryText;
    }
  }};
`;

const ProfileActions = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  gap: 4px;
`;

const ProfileActionButton = styled.button`
  background-color: ${props => props.theme.colors.secondaryBg};
  color: ${props => props.theme.colors.tertiaryText};
  border: none;
  border-radius: ${props => props.theme.borderRadius.small};
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme.colors.primaryBg};
    color: ${props => props.theme.colors.primaryText};
  }
`;

const FileInput = styled.input`
  display: none;
`;

const ToggleButton = styled.button`
  position: absolute;
  top: ${props => props.theme.spacing.medium};
  right: -12px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.accent};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  z-index: 10;
`;

const SidebarWrapper = styled.div`
  position: relative;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing.medium};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const LogoText = styled.h1`
  font-size: ${props => props.collapsed ? '0' : props.theme.typography.header.size};
  font-weight: ${props => props.theme.typography.header.weight};
  margin-left: ${props => props.theme.spacing.small};
  color: ${props => props.theme.colors.primaryText};
  transition: font-size 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
`;

const Sidebar = () => {
  const { theme } = useTheme();
  const { 
    appState, 
    toggleSidebar, 
    setActiveSection,
    createNewChat,
    chats,
    deleteChat,
    profile,
    updateProfile
  } = useApp();
  
  const { sidebarCollapsed, activeSection, connectionStatus } = appState;
  
  const fileInputRef = React.useRef(null);
  
  const handleNewChat = () => {
    createNewChat();
  };
  
  const handleProfileClick = () => {
    fileInputRef.current.click();
  };
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target.result;
        updateProfile({ picture: imageDataUrl });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleEditProfile = () => {
    const name = prompt('Enter your name:', profile.name);
    if (name) {
      updateProfile({ name });
    }
  };
  
  const handleRemoveProfilePicture = () => {
    updateProfile({ picture: null });
  };
  
  // Get recent chats for the sidebar
  const recentChats = chats.slice(0, 3);
  
  // Get starred chats (just mimicking this with the first chat if available)
  const starredChats = chats.length > 0 ? [chats[0]] : [];
  
  return (
    <SidebarWrapper>
      <SidebarContainer theme={theme} collapsed={sidebarCollapsed}>
        <LogoSection theme={theme}>
          <BrainIcon size={36} color="#FF643D" />
          <LogoText theme={theme} collapsed={sidebarCollapsed}>Sephia</LogoText>
        </LogoSection>
        
        <SidebarSection theme={theme}>
          <SidebarButton 
            theme={theme} 
            onClick={handleNewChat}
          >
            <AddIcon />
            {!sidebarCollapsed && 'New Chat'}
          </SidebarButton>
          
          <Divider theme={theme} />
          
          <SidebarButton 
            theme={theme} 
            active={activeSection === 'chat'} 
            onClick={() => setActiveSection('chat')}
          >
            <ChatIcon />
            {!sidebarCollapsed && 'Chats'}
          </SidebarButton>
          
          <SidebarButton 
            theme={theme} 
            active={activeSection === 'projects'} 
            onClick={() => setActiveSection('projects')}
          >
            <ProjectsIcon />
            {!sidebarCollapsed && 'Projects'}
          </SidebarButton>
          
          <SidebarButton 
            theme={theme} 
            active={activeSection === 'ollama'} 
            onClick={() => setActiveSection('ollama')}
          >
            <OllamaIcon />
            {!sidebarCollapsed && 'Chat'}
          </SidebarButton>
          
          <SidebarButton 
            theme={theme} 
            active={activeSection === 'settings'} 
            onClick={() => setActiveSection('settings')}
          >
            <SettingsIcon />
            {!sidebarCollapsed && 'Settings'}
          </SidebarButton>
        </SidebarSection>
        
        {!sidebarCollapsed && (
          <>
            <SectionTitle theme={theme}>
              Starred
            </SectionTitle>
            <SidebarSection theme={theme}>
              {starredChats.length > 0 ? (
                starredChats.map(chat => (
                  <div 
                    key={chat.id} 
                    style={{
                      position: 'relative',
                      width: '100%',
                      '&:hover .chat-actions': {
                        opacity: 1
                      }
                    }}
                  >
                    <SidebarButton 
                      theme={theme}
                      onClick={() => {
                        setActiveSection('chat');
                        // In real implementation, would set current chat here
                      }}
                      style={{ width: '100%' }}
                    >
                      <StarIcon />
                      <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis'}}>
                        {chat.title}
                      </span>
                    </SidebarButton>
                    <ChatActions className="chat-actions">
                      <ActionButton 
                        theme={theme} 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this chat?')) {
                            deleteChat(chat.id);
                          }
                        }}
                        title="Delete chat"
                      >
                        <DeleteIcon fontSize="small" />
                      </ActionButton>
                    </ChatActions>
                  </div>
                ))
              ) : (
                <div style={{ padding: '0 16px', color: theme.colors.tertiaryText, fontSize: '13px' }}>
                  No starred items
                </div>
              )}
            </SidebarSection>
            
            <SectionTitle theme={theme}>
              Recent
            </SectionTitle>
            <SidebarSection theme={theme}>
              {recentChats.length > 0 ? (
                recentChats.map(chat => (
                  <div 
                    key={chat.id}
                    style={{
                      position: 'relative',
                      width: '100%',
                      '&:hover .chat-actions': {
                        opacity: 1
                      }
                    }}
                  >
                    <SidebarButton 
                      theme={theme}
                      onClick={() => {
                        setActiveSection('chat');
                        // In real implementation, would set current chat here
                      }}
                      style={{ width: '100%' }}
                    >
                      <ChatIcon />
                      <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis'}}>
                        {chat.title}
                      </span>
                    </SidebarButton>
                    <ChatActions className="chat-actions">
                      <ActionButton 
                        theme={theme} 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this chat?')) {
                            deleteChat(chat.id);
                          }
                        }}
                        title="Delete chat"
                      >
                        <DeleteIcon fontSize="small" />
                      </ActionButton>
                    </ChatActions>
                  </div>
                ))
              ) : (
                <div style={{ padding: '0 16px', color: theme.colors.tertiaryText, fontSize: '13px' }}>
                  No recent chats
                </div>
              )}
            </SidebarSection>
          </>
        )}
        
        <ProfileSection theme={theme} collapsed={sidebarCollapsed}>
          <ProfileImage theme={theme} onClick={handleProfileClick}>
            {profile.picture ? (
              <img src={profile.picture} alt="Profile" />
            ) : (
              <AccountIcon fontSize="large" />
            )}
          </ProfileImage>
          
          <ProfileInfo collapsed={sidebarCollapsed} theme={theme}>
            <ProfileName theme={theme}>{profile.name}</ProfileName>
            <ConnectionStatus theme={theme} status={connectionStatus}>
              {connectionStatus}
            </ConnectionStatus>
          </ProfileInfo>
          
          {!sidebarCollapsed && (
            <ProfileActions className="profile-actions">
              <ProfileActionButton theme={theme} onClick={handleEditProfile} title="Edit Profile">
                <EditIcon fontSize="small" />
              </ProfileActionButton>
              {profile.picture && (
                <ProfileActionButton theme={theme} onClick={handleRemoveProfilePicture} title="Remove Photo">
                  <DeleteIcon fontSize="small" />
                </ProfileActionButton>
              )}
              <ProfileActionButton theme={theme} onClick={handleProfileClick} title="Upload Photo">
                <PhotoIcon fontSize="small" />
              </ProfileActionButton>
            </ProfileActions>
          )}
          
          <FileInput 
            ref={fileInputRef} 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
          />
        </ProfileSection>
      </SidebarContainer>
      
      <ToggleButton theme={theme} onClick={toggleSidebar}>
        {sidebarCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
      </ToggleButton>
    </SidebarWrapper>
  );
};

export default Sidebar;