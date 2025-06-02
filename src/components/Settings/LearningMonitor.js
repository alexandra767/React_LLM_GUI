import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { 
  Refresh as RefreshIcon, 
  Psychology as BrainIcon, 
  Timeline as PatternIcon,
  Notifications as NotificationIcon,
  Settings as SettingsIcon 
} from '@mui/icons-material';

const MonitorContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
});

const MonitorSection = styled('div')({
  backgroundColor: '#1E1E1E',
  borderRadius: '6px',
  padding: '16px',
  border: '1px solid #333333'
});

const SectionHeader = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '12px',
  paddingBottom: '8px',
  borderBottom: '1px solid #333333'
});

const SectionTitle = styled('h3')({
  fontSize: '16px',
  fontWeight: '500',
  color: '#FFFFFF',
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
});

const RefreshButton = styled('button')({
  background: 'none',
  border: '1px solid #444444',
  color: '#AAAAAA',
  borderRadius: '4px',
  padding: '4px 8px',
  cursor: 'pointer',
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  '&:hover': {
    backgroundColor: '#333333',
    color: '#FFFFFF'
  }
});

const DataList = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
});

const DataItem = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px',
  backgroundColor: '#252525',
  borderRadius: '4px',
  fontSize: '14px'
});

const DataLabel = styled('span')({
  color: '#CCCCCC',
  fontWeight: '500'
});

const DataValue = styled('span')({
  color: '#FFFFFF',
  fontFamily: 'monospace'
});

const ConversationItem = styled('div')({
  padding: '8px',
  backgroundColor: '#252525',
  borderRadius: '4px',
  marginBottom: '8px'
});

const ConversationDate = styled('div')({
  fontSize: '12px',
  color: '#AAAAAA',
  marginBottom: '4px'
});

const ConversationTopic = styled('div')({
  fontSize: '14px',
  color: '#FFFFFF',
  marginBottom: '4px'
});

const ConversationExtracted = styled('div')({
  fontSize: '12px',
  color: '#88DD88',
  fontStyle: 'italic'
});

const PatternItem = styled('div')({
  padding: '8px',
  backgroundColor: '#252525',
  borderRadius: '4px',
  marginBottom: '8px',
  fontSize: '14px'
});

const PatternType = styled('div')({
  color: '#FFBB33',
  fontWeight: '500',
  marginBottom: '4px'
});

const PatternDescription = styled('div')({
  color: '#CCCCCC'
});

const EmptyState = styled('div')({
  textAlign: 'center',
  padding: '24px',
  color: '#AAAAAA',
  fontStyle: 'italic'
});

const ToggleSwitch = styled('label')({
  position: 'relative',
  display: 'inline-block',
  width: '44px',
  height: '24px',
  '& input': {
    opacity: 0,
    width: 0,
    height: 0,
  },
  '& .slider': {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#333333',
    transition: '.4s',
    borderRadius: '24px',
    '&:before': {
      position: 'absolute',
      content: '""',
      height: '18px',
      width: '18px',
      left: '3px',
      bottom: '3px',
      backgroundColor: '#FFFFFF',
      transition: '.4s',
      borderRadius: '50%',
    },
  },
  '& input:checked + .slider': {
    backgroundColor: '#FF643D',
  },
  '& input:checked + .slider:before': {
    transform: 'translateX(20px)',
  },
});

const PreferenceItem = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 0',
  borderBottom: '1px solid #333333',
  '&:last-child': {
    borderBottom: 'none'
  }
});

const PreferenceLabel = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
});

const PreferenceTitle = styled('span')({
  color: '#FFFFFF',
  fontSize: '14px',
  fontWeight: '500'
});

const PreferenceDescription = styled('span')({
  color: '#AAAAAA',
  fontSize: '12px'
});

const NotificationItem = styled('div')({
  padding: '12px',
  backgroundColor: '#252525',
  borderRadius: '6px',
  marginBottom: '8px',
  borderLeft: '3px solid #FF643D'
});

const NotificationTitle = styled('div')({
  color: '#FFFFFF',
  fontSize: '14px',
  fontWeight: '500',
  marginBottom: '4px'
});

const NotificationMessage = styled('div')({
  color: '#CCCCCC',
  fontSize: '12px',
  marginBottom: '4px'
});

const NotificationTime = styled('div')({
  color: '#AAAAAA',
  fontSize: '11px'
});

const LearningMonitor = () => {
  const [memoryData, setMemoryData] = useState(null);
  const [proactiveData, setProactiveData] = useState(null);
  const [knowledgeData, setKnowledgeData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);

  const loadLearningData = () => {
    try {
      // Load memory system data
      const memorySystem = localStorage.getItem('aria_memory_system');
      if (memorySystem) {
        setMemoryData(JSON.parse(memorySystem));
      }

      // Load proactive intelligence data
      const proactiveIntelligence = localStorage.getItem('aria_proactive_intelligence');
      if (proactiveIntelligence) {
        setProactiveData(JSON.parse(proactiveIntelligence));
      }

      // Load knowledge data
      const knowledge = localStorage.getItem('aria_knowledge');
      if (knowledge) {
        setKnowledgeData(JSON.parse(knowledge));
      }

      // Load notifications data
      const notificationData = localStorage.getItem('aria_learning_notifications');
      if (notificationData) {
        const parsedNotifications = JSON.parse(notificationData);
        setNotifications(parsedNotifications.slice(0, 10)); // Show last 10
      }

      // Load preferences
      const preferencesData = localStorage.getItem('aria_notification_preferences');
      if (preferencesData) {
        setPreferences(JSON.parse(preferencesData));
      } else {
        // Default preferences
        setPreferences({
          enableNotifications: true,
          notificationTypes: {
            interesting_articles: true,
            programming_trends: true,
            new_tools: true,
            learning_insights: true,
            daily_summary: true
          },
          maxPerDay: 10,
          cooldownMinutes: 30
        });
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error loading learning data:', error);
    }
  };

  useEffect(() => {
    loadLearningData();
  }, []);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getRecentConversations = () => {
    if (!memoryData?.conversations) return [];
    
    // Handle MemoryService format: conversations is an array
    if (Array.isArray(memoryData.conversations)) {
      return memoryData.conversations
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
    }
    
    // Fallback to old object format
    return Object.entries(memoryData.conversations)
      .map(([id, conv]) => ({ id, ...conv }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
  };

  const getPersonalFacts = () => {
    // Handle MemoryService format: personal is an array of [key, valueObject] pairs
    if (memoryData?.personal && Array.isArray(memoryData.personal)) {
      return memoryData.personal
        .map(([key, valueObj]) => ({ 
          key, 
          value: valueObj?.value || valueObj,
          timestamp: valueObj?.timestamp,
          context: valueObj?.context
        }))
        .slice(0, 10);
    }
    
    // Fallback to old format for compatibility
    if (memoryData?.personalInfo) {
      return Object.entries(memoryData.personalInfo)
        .map(([key, value]) => ({ key, value }))
        .slice(0, 10);
    }
    
    return [];
  };

  const getBehaviorPatterns = () => {
    if (!proactiveData?.patterns) return [];
    return Array.from(proactiveData.patterns)
      .map(([key, pattern]) => ({ key, ...pattern }))
      .slice(0, 5);
  };

  const getKnowledgeUpdates = () => {
    if (!knowledgeData?.realTime) return [];
    return Object.entries(knowledgeData.realTime)
      .map(([category, data]) => ({ category, ...data }))
      .filter(item => item.lastUpdated)
      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
      .slice(0, 5);
  };

  const updatePreference = (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    localStorage.setItem('aria_notification_preferences', JSON.stringify(newPreferences));
  };

  const updateNotificationType = (type, enabled) => {
    const newTypes = { ...preferences.notificationTypes, [type]: enabled };
    const newPreferences = { ...preferences, notificationTypes: newTypes };
    setPreferences(newPreferences);
    localStorage.setItem('aria_notification_preferences', JSON.stringify(newPreferences));
  };

  return (
    <MonitorContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ color: '#FFFFFF', margin: 0 }}>Learning Monitor</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {lastUpdated && (
            <span style={{ fontSize: '12px', color: '#AAAAAA' }}>
              Last updated: {lastUpdated}
            </span>
          )}
          <RefreshButton onClick={loadLearningData}>
            <RefreshIcon style={{ fontSize: '14px' }} />
            Refresh
          </RefreshButton>
        </div>
      </div>

      {/* Memory Statistics */}
      <MonitorSection>
        <SectionHeader>
          <SectionTitle>
            <BrainIcon style={{ fontSize: '18px' }} />
            Memory System
          </SectionTitle>
        </SectionHeader>
        <DataList>
          <DataItem>
            <DataLabel>Total Conversations</DataLabel>
            <DataValue>{
              memoryData?.conversations 
                ? Array.isArray(memoryData.conversations) 
                  ? memoryData.conversations.length
                  : Object.keys(memoryData.conversations).length
                : 0
            }</DataValue>
          </DataItem>
          <DataItem>
            <DataLabel>Personal Facts Stored</DataLabel>
            <DataValue>{
              memoryData?.personal && Array.isArray(memoryData.personal) 
                ? memoryData.personal.length
                : memoryData?.personalInfo 
                  ? Object.keys(memoryData.personalInfo).length 
                  : 0
            }</DataValue>
          </DataItem>
          <DataItem>
            <DataLabel>Relationships Tracked</DataLabel>
            <DataValue>{
              memoryData?.relationships 
                ? Array.isArray(memoryData.relationships)
                  ? memoryData.relationships.length
                  : Object.keys(memoryData.relationships).length
                : 0
            }</DataValue>
          </DataItem>
          <DataItem>
            <DataLabel>Communication Style Learned</DataLabel>
            <DataValue>{
              memoryData?.learningState?.communicationStyle && 
              Object.keys(memoryData.learningState.communicationStyle).length > 0 
                ? 'Yes' 
                : 'No'
            }</DataValue>
          </DataItem>
        </DataList>
      </MonitorSection>

      {/* Recent Conversations */}
      <MonitorSection>
        <SectionHeader>
          <SectionTitle>Recent Conversations Learned From</SectionTitle>
        </SectionHeader>
        {getRecentConversations().length > 0 ? (
          getRecentConversations().map(conv => (
            <ConversationItem key={conv.id}>
              <ConversationDate>{formatDate(conv.timestamp)}</ConversationDate>
              <ConversationTopic>Topic: {conv.topic || 'General conversation'}</ConversationTopic>
              {conv.extractedFacts && conv.extractedFacts.length > 0 && (
                <ConversationExtracted>
                  Learned: {conv.extractedFacts.join(', ')}
                </ConversationExtracted>
              )}
            </ConversationItem>
          ))
        ) : (
          <EmptyState>No conversation data available</EmptyState>
        )}
      </MonitorSection>

      {/* Personal Facts */}
      <MonitorSection>
        <SectionHeader>
          <SectionTitle>Personal Information Learned</SectionTitle>
        </SectionHeader>
        {getPersonalFacts().length > 0 ? (
          <DataList>
            {getPersonalFacts().map(fact => (
              <DataItem key={fact.key} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                  <DataLabel>{fact.key}</DataLabel>
                  <DataValue>{typeof fact.value === 'object' ? JSON.stringify(fact.value) : fact.value}</DataValue>
                </div>
                {fact.timestamp && (
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                    Learned: {formatDate(fact.timestamp)}
                    {fact.context && ` • Context: ${fact.context}`}
                  </div>
                )}
              </DataItem>
            ))}
          </DataList>
        ) : (
          <EmptyState>No personal information learned yet</EmptyState>
        )}
      </MonitorSection>

      {/* Behavior Patterns */}
      <MonitorSection>
        <SectionHeader>
          <SectionTitle>
            <PatternIcon style={{ fontSize: '18px' }} />
            Detected Patterns
          </SectionTitle>
        </SectionHeader>
        {getBehaviorPatterns().length > 0 ? (
          getBehaviorPatterns().map((pattern, index) => (
            <PatternItem key={index}>
              <PatternType>{pattern.type || 'Behavioral Pattern'}</PatternType>
              <PatternDescription>
                Confidence: {(pattern.confidence * 100).toFixed(1)}%
                {pattern.description && ` - ${pattern.description}`}
              </PatternDescription>
            </PatternItem>
          ))
        ) : (
          <EmptyState>No behavioral patterns detected yet</EmptyState>
        )}
      </MonitorSection>

      {/* Knowledge Updates */}
      <MonitorSection>
        <SectionHeader>
          <SectionTitle>Recent Knowledge Updates</SectionTitle>
        </SectionHeader>
        {getKnowledgeUpdates().length > 0 ? (
          getKnowledgeUpdates().map((update, index) => (
            <PatternItem key={index}>
              <PatternType>{update.category}</PatternType>
              <PatternDescription>
                Updated: {formatDate(update.lastUpdated)}
                {update.summary && ` - ${update.summary}`}
              </PatternDescription>
            </PatternItem>
          ))
        ) : (
          <EmptyState>No recent knowledge updates</EmptyState>
        )}
      </MonitorSection>

      {/* Recent Notifications */}
      <MonitorSection>
        <SectionHeader>
          <SectionTitle>
            <NotificationIcon style={{ fontSize: '18px' }} />
            Recent Learning Notifications ({notifications.length})
          </SectionTitle>
        </SectionHeader>
        {notifications.length > 0 ? (
          notifications.map((notification, index) => (
            <NotificationItem key={index}>
              <NotificationTitle>{notification.title}</NotificationTitle>
              <NotificationMessage>{notification.message}</NotificationMessage>
              <NotificationTime>
                {formatDate(notification.timestamp)} • {notification.type}
              </NotificationTime>
            </NotificationItem>
          ))
        ) : (
          <EmptyState>No notifications yet - Aria will notify you when she learns something interesting!</EmptyState>
        )}
      </MonitorSection>

      {/* Learning Preferences */}
      <MonitorSection>
        <SectionHeader>
          <SectionTitle>
            <SettingsIcon style={{ fontSize: '18px' }} />
            Learning Preferences
          </SectionTitle>
          <RefreshButton onClick={() => setShowPreferences(!showPreferences)}>
            {showPreferences ? 'Hide' : 'Show'} Settings
          </RefreshButton>
        </SectionHeader>
        
        {showPreferences && preferences && (
          <div>
            <PreferenceItem>
              <PreferenceLabel>
                <PreferenceTitle>Enable Learning Notifications</PreferenceTitle>
                <PreferenceDescription>Allow Aria to notify you about interesting discoveries</PreferenceDescription>
              </PreferenceLabel>
              <ToggleSwitch>
                <input 
                  type="checkbox" 
                  checked={preferences.enableNotifications}
                  onChange={(e) => updatePreference('enableNotifications', e.target.checked)}
                />
                <span className="slider"></span>
              </ToggleSwitch>
            </PreferenceItem>

            <PreferenceItem>
              <PreferenceLabel>
                <PreferenceTitle>Interesting Articles</PreferenceTitle>
                <PreferenceDescription>Notify about notable articles and news</PreferenceDescription>
              </PreferenceLabel>
              <ToggleSwitch>
                <input 
                  type="checkbox" 
                  checked={preferences.notificationTypes?.interesting_articles || false}
                  onChange={(e) => updateNotificationType('interesting_articles', e.target.checked)}
                />
                <span className="slider"></span>
              </ToggleSwitch>
            </PreferenceItem>

            <PreferenceItem>
              <PreferenceLabel>
                <PreferenceTitle>Programming Trends</PreferenceTitle>
                <PreferenceDescription>GitHub trending repos and tech developments</PreferenceDescription>
              </PreferenceLabel>
              <ToggleSwitch>
                <input 
                  type="checkbox" 
                  checked={preferences.notificationTypes?.programming_trends || false}
                  onChange={(e) => updateNotificationType('programming_trends', e.target.checked)}
                />
                <span className="slider"></span>
              </ToggleSwitch>
            </PreferenceItem>

            <PreferenceItem>
              <PreferenceLabel>
                <PreferenceTitle>Daily Learning Summary</PreferenceTitle>
                <PreferenceDescription>Daily summary of what Aria learned (6 PM)</PreferenceDescription>
              </PreferenceLabel>
              <ToggleSwitch>
                <input 
                  type="checkbox" 
                  checked={preferences.notificationTypes?.daily_summary || false}
                  onChange={(e) => updateNotificationType('daily_summary', e.target.checked)}
                />
                <span className="slider"></span>
              </ToggleSwitch>
            </PreferenceItem>

            <PreferenceItem>
              <PreferenceLabel>
                <PreferenceTitle>Max Notifications Per Day</PreferenceTitle>
                <PreferenceDescription>Limit: {preferences.maxPerDay} notifications daily</PreferenceDescription>
              </PreferenceLabel>
              <input 
                type="range"
                min="1"
                max="20"
                value={preferences.maxPerDay}
                onChange={(e) => updatePreference('maxPerDay', parseInt(e.target.value))}
                style={{
                  width: '60px',
                  accentColor: '#FF643D'
                }}
              />
            </PreferenceItem>
          </div>
        )}
        
        {!showPreferences && (
          <div style={{ padding: '16px', textAlign: 'center', color: '#AAAAAA' }}>
            Click "Show Settings" to configure learning preferences
          </div>
        )}
      </MonitorSection>
    </MonitorContainer>
  );
};

export default LearningMonitor;