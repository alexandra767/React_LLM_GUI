import React, { useState, useEffect } from 'react';

const MemoryDebugger = () => {
  const [memoryData, setMemoryData] = useState(null);
  const [companionMode, setCompanionMode] = useState(false);
  const [testMessage, setTestMessage] = useState("do you remember our last conversation?");
  const [patternResult, setPatternResult] = useState(null);

  useEffect(() => {
    checkMemoryStatus();
  }, []);

  const checkMemoryStatus = () => {
    try {
      // Check memory system
      const memorySystem = localStorage.getItem('aria_memory_system');
      const companionModeValue = localStorage.getItem('companionMode') === 'true';
      const settings = localStorage.getItem('settings');
      
      let parsedMemory = null;
      if (memorySystem) {
        parsedMemory = JSON.parse(memorySystem);
      }

      let settingsObj = null;
      if (settings) {
        try {
          settingsObj = JSON.parse(settings);
        } catch (e) {
          console.error('Settings parse error:', e);
        }
      }

      setMemoryData({
        hasMemorySystem: !!memorySystem,
        memorySystem: parsedMemory,
        companionModeGlobal: companionModeValue,
        settingsCompanionMode: settingsObj?.companionMode,
        conversations: parsedMemory?.conversations || [],
        personalInfo: parsedMemory?.personal || {},
        relationships: parsedMemory?.relationships || {}
      });

      setCompanionMode(companionModeValue);
    } catch (error) {
      console.error('Error checking memory status:', error);
    }
  };

  const testMemoryPattern = () => {
    const lowerMessage = testMessage.toLowerCase();
    const isConversationMemoryQuestion = lowerMessage.includes("do you remember our") ||
                                       lowerMessage.includes("remember our last") ||
                                       lowerMessage.includes("remember our previous") ||
                                       lowerMessage.includes("our last conversation") ||
                                       lowerMessage.includes("our previous conversation") ||
                                       lowerMessage.includes("remember what we talked about") ||
                                       lowerMessage.includes("remember what we discussed") ||
                                       lowerMessage.includes("do you remember me") ||
                                       lowerMessage.includes("remember me") ||
                                       lowerMessage.includes("do you know me");

    const patterns = [
      "do you remember our",
      "remember our last", 
      "remember our previous",
      "our last conversation",
      "our previous conversation",
      "remember what we talked about",
      "remember what we discussed",
      "do you remember me",
      "remember me",
      "do you know me"
    ];

    const matches = patterns.map(pattern => ({
      pattern,
      matches: lowerMessage.includes(pattern)
    }));

    setPatternResult({
      message: testMessage,
      isMemoryQuestion: isConversationMemoryQuestion,
      patternMatches: matches
    });
  };

  const addSampleConversations = () => {
    try {
      const sampleMemory = {
        conversations: [
          {
            timestamp: new Date().toISOString(),
            topics: ['programming', 'react'],
            userMessage: 'Can you help me with React?',
            ariaResponse: 'I can help with React development!'
          },
          {
            timestamp: new Date().toISOString(),
            topics: ['ai', 'learning'],
            userMessage: 'How do you learn new things?',
            ariaResponse: 'I process information through my training...'
          }
        ],
        personal: {
          name: { value: 'Alexandra', source: 'user_introduced' }
        },
        relationships: {},
        interests: {},
        patterns: {},
        emotions: [],
        achievements: [],
        knowledge: {},
        preferences: {}
      };

      localStorage.setItem('aria_memory_system', JSON.stringify(sampleMemory));
      localStorage.setItem('companionMode', 'true');
      
      alert('✓ Added sample conversation data to memory system');
      checkMemoryStatus();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const toggleCompanionMode = () => {
    const newValue = !companionMode;
    localStorage.setItem('companionMode', newValue.toString());
    setCompanionMode(newValue);
    checkMemoryStatus();
  };

  const clearMemory = () => {
    if (window.confirm('Are you sure you want to clear all memory data?')) {
      localStorage.removeItem('aria_memory_system');
      checkMemoryStatus();
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Memory Debugger</h2>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Companion Mode Status</h3>
        <p><strong>Global Companion Mode:</strong> {companionMode ? 'Enabled' : 'Disabled'}</p>
        <p><strong>Settings Companion Mode:</strong> {memoryData?.settingsCompanionMode || 'not set'}</p>
        <button onClick={toggleCompanionMode} style={{ padding: '10px', margin: '5px' }}>
          {companionMode ? 'Disable' : 'Enable'} Companion Mode
        </button>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Memory System Status</h3>
        <p><strong>Memory System:</strong> {memoryData?.hasMemorySystem ? 'exists' : 'empty'}</p>
        <p><strong>Conversations:</strong> {memoryData?.conversations?.length || 0}</p>
        <p><strong>Personal Info:</strong> {Object.keys(memoryData?.personalInfo || {}).length} items</p>
        <p><strong>Relationships:</strong> {Object.keys(memoryData?.relationships || {}).length} items</p>
        
        {memoryData?.conversations?.length > 0 && (
          <div>
            <h4>Recent Conversations:</h4>
            {memoryData.conversations.slice(-3).map((conv, i) => (
              <p key={i}>Conv {i+1}: {conv.topics ? conv.topics.join(', ') : 'no topics'}</p>
            ))}
          </div>
        )}
        
        {memoryData?.personalInfo?.name && (
          <p><strong>Stored Name:</strong> {memoryData.personalInfo.name.value}</p>
        )}
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Test Memory Question Pattern</h3>
        <input
          type="text"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          style={{ width: '300px', padding: '5px', marginRight: '10px' }}
        />
        <button onClick={testMemoryPattern} style={{ padding: '5px 15px' }}>Test Pattern</button>
        
        {patternResult && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0' }}>
            <p><strong>Message:</strong> "{patternResult.message}"</p>
            <p><strong>Is Memory Question:</strong> {patternResult.isMemoryQuestion ? '✓ Yes' : '✗ No'}</p>
            <h4>Pattern Matches:</h4>
            {patternResult.patternMatches.map((match, i) => (
              <p key={i}>{match.pattern}: {match.matches ? '✓' : '✗'}</p>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Actions</h3>
        <button onClick={addSampleConversations} style={{ padding: '10px', margin: '5px' }}>
          Add Sample Conversations
        </button>
        <button onClick={checkMemoryStatus} style={{ padding: '10px', margin: '5px' }}>
          Refresh Status
        </button>
        <button onClick={clearMemory} style={{ padding: '10px', margin: '5px', backgroundColor: '#ff6b6b', color: 'white' }}>
          Clear Memory
        </button>
      </div>
    </div>
  );
};

export default MemoryDebugger;