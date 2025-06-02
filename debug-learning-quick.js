// Quick Learning Monitor Debug Script
// Run this in your browser console while viewing the Learning Monitor

console.log('🔍 LEARNING MONITOR DEBUG REPORT');
console.log('='.repeat(50));

// Check if data exists in localStorage
const storageKeys = [
  'aria_memory_system',
  'aria_knowledge_base', 
  'aria_proactive_intelligence',
  'aria_learning_notifications'
];

let foundData = false;

storageKeys.forEach(key => {
  const data = localStorage.getItem(key);
  const hasData = data && data !== 'null' && data !== '{}' && data !== '[]';
  
  console.log(`${hasData ? '✅' : '❌'} ${key}: ${hasData ? 'HAS DATA' : 'EMPTY'}`);
  
  if (hasData) {
    foundData = true;
    try {
      const parsed = JSON.parse(data);
      console.log(`   📊 Size: ${JSON.stringify(parsed).length} chars`);
      if (key === 'aria_knowledge_base' && parsed.realTimeKnowledge) {
        console.log(`   📰 Knowledge items: ${Object.keys(parsed.realTimeKnowledge).length}`);
      }
    } catch (e) {
      console.log(`   ⚠️  Parse error: ${e.message}`);
    }
  }
});

// Check if services are loaded
console.log('\n🔧 SERVICE STATUS:');
const hasKnowledgeService = typeof window.knowledgeService !== 'undefined';
console.log(`${hasKnowledgeService ? '✅' : '❌'} KnowledgeService: ${hasKnowledgeService ? 'LOADED' : 'NOT FOUND'}`);

// Check network activity
console.log('\n🌐 NETWORK CHECK:');
console.log('Look for these log messages in console:');
console.log('- [Knowledge] Fetching real news data...');
console.log('- [Knowledge] ✅ Fetched top stories from Hacker News');
console.log('- [Knowledge] Added real-time: news:...');

// Quick fix attempt
if (!foundData) {
  console.log('\n🔧 QUICK FIX: No data found. Trying to trigger collection...');
  
  // Try to force knowledge update if service is available
  if (window.knowledgeService) {
    console.log('📡 Triggering knowledge update...');
    window.knowledgeService.updateRealTimeKnowledge();
  } else {
    console.log('❌ KnowledgeService not accessible from window');
  }
  
  // Add minimal test data to verify display works
  const testData = {
    realTimeKnowledge: {
      'test:debug-item': {
        title: 'Test Learning Item',
        content: 'This is test data to verify the Learning Monitor displays correctly',
        category: 'debug',
        source: 'debug-script',
        timestamp: Date.now()
      }
    }
  };
  
  localStorage.setItem('aria_knowledge_base', JSON.stringify(testData));
  console.log('✅ Added test data. Refresh Learning Monitor to see if display works.');
}

console.log('\n📋 RECOMMENDATIONS:');
if (!foundData) {
  console.log('1. Wait 5-10 minutes after app starts for data collection');
  console.log('2. Check if private browsing mode is disabled');
  console.log('3. Look for network errors in console');
  console.log('4. Refresh the Learning Monitor component');
} else {
  console.log('1. Data exists! The issue is likely in the display component');
  console.log('2. Click "Refresh" in the Learning Monitor');
  console.log('3. Check for component rendering errors');
}

console.log('\n🔍 Check complete. See above for detailed results.');