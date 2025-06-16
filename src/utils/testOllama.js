// Simple test to check if Ollama is responding
async function testOllama() {
  try {
    console.log('Testing Ollama connection...');
    
    // Test 1: Check if API is available
    const response1 = await fetch('http://localhost:11434/api/tags');
    console.log('API tags endpoint status:', response1.status);
    const data1 = await response1.json();
    console.log('Available models:', data1.models?.map(m => m.name) || []);
    
    // Test 2: Try a simple generate request
    console.log('\nTesting generate endpoint...');
    const response2 = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-r1:8b-m4',
        prompt: 'Say hello',
        stream: false
      })
    });
    
    console.log('Generate endpoint status:', response2.status);
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('Generate response:', data2);
    } else {
      console.error('Generate failed:', await response2.text());
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testOllama();