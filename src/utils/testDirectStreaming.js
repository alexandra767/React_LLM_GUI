// Direct test of Ollama streaming
export async function testDirectStreaming() {
  console.log('=== DIRECT STREAMING TEST ===');
  
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-r1:8b-m4',
        prompt: 'Say hello in one sentence',
        stream: true
      })
    });

    console.log('Response:', {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      console.error('Response not OK:', await response.text());
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let chunkCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('=== STREAMING COMPLETE ===');
        console.log('Total chunks:', chunkCount);
        console.log('Full content:', fullContent);
        break;
      }

      chunkCount++;
      const chunk = decoder.decode(value, { stream: true });
      console.log(`Chunk ${chunkCount}:`, chunk);
      
      // Try to parse each line
      const lines = chunk.split('\n').filter(line => line.trim());
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          console.log('Parsed:', data);
          if (data.response) {
            fullContent += data.response;
          }
        } catch (e) {
          console.warn('Parse error for line:', line);
        }
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Make it available globally for testing
window.testDirectStreaming = testDirectStreaming;