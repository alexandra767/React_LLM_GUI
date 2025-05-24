// PDF text extraction utility
// This uses a more comprehensive approach to extract text from PDFs

export const extractTextFromPDF = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async function(e) {
      try {
        const arrayBuffer = e.target.result;
        const bytes = new Uint8Array(arrayBuffer);
        
        // Try multiple extraction methods
        let extractedText = '';
        
        // Method 1: Direct text extraction
        extractedText = extractPDFText(bytes);
        
        // Method 2: If first method fails, try alternative approach
        if (!extractedText || extractedText.trim().length < 50) {
          extractedText = extractPDFTextAlternative(bytes);
        }
        
        // Method 3: Look for any readable ASCII text in the file
        if (!extractedText || extractedText.trim().length < 50) {
          extractedText = extractRawText(bytes);
        }
        
        if (extractedText && extractedText.trim().length > 0) {
          console.log('[PDF Extractor] Successfully extracted', extractedText.length, 'characters');
          resolve(extractedText);
        } else {
          // If we can't extract text, return a note
          resolve('');
        }
      } catch (error) {
        console.error('Error extracting PDF text:', error);
        resolve('');
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read PDF file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Simple PDF text extractor
function extractPDFText(data) {
  try {
    // Convert to string for searching
    const bytes = new Uint8Array(data);
    let pdfContent = '';
    
    // Try to decode as UTF-8
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const text = decoder.decode(bytes);
    
    // Look for text between BT (Begin Text) and ET (End Text) markers
    const textRegex = /BT\s*(.*?)\s*ET/gs;
    const matches = text.matchAll(textRegex);
    
    for (const match of matches) {
      const content = match[1];
      // Extract text from PDF commands
      const textCommands = content.match(/\((.*?)\)/g);
      if (textCommands) {
        for (const cmd of textCommands) {
          // Remove parentheses and decode
          let extractedText = cmd.slice(1, -1);
          // Basic unescape for PDF strings
          extractedText = extractedText
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\')
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t');
          
          pdfContent += extractedText + ' ';
        }
      }
    }
    
    // Also try to find text in streams
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    const streams = text.matchAll(streamRegex);
    
    for (const stream of streams) {
      const streamContent = stream[1];
      // Look for readable text in streams
      const readableText = streamContent.match(/[\x20-\x7E\s]{10,}/g);
      if (readableText) {
        pdfContent += '\n' + readableText.join(' ');
      }
    }
    
    // Clean up the extracted text
    pdfContent = pdfContent
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\s]/g, '')
      .trim();
    
    return pdfContent;
  } catch (error) {
    console.error('Error in PDF text extraction:', error);
    return '';
  }
}

// Alternative PDF text extraction method
function extractPDFTextAlternative(data) {
  try {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(data);
    let extractedText = '';
    
    // Look for text objects in PDF
    const textObjectRegex = /<<[^>]*\/Length\s+(\d+)[^>]*>>\s*stream([\s\S]*?)endstream/g;
    let match;
    
    while ((match = textObjectRegex.exec(text)) !== null) {
      const streamContent = match[2];
      // Extract readable text from stream
      const readable = streamContent.match(/\((.*?)\)/g);
      if (readable) {
        for (const r of readable) {
          let content = r.slice(1, -1);
          // Decode PDF escape sequences
          content = content
            .replace(/\\(\d{3})/g, (match, oct) => String.fromCharCode(parseInt(oct, 8)))
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\');
          
          extractedText += content + ' ';
        }
      }
    }
    
    return extractedText.trim();
  } catch (error) {
    console.error('Error in alternative PDF extraction:', error);
    return '';
  }
}

// Extract any readable text from binary data
function extractRawText(data) {
  try {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(data);
    
    // Find all sequences of printable ASCII characters
    const readableChunks = text.match(/[\x20-\x7E\r\n\t]{20,}/g) || [];
    
    // Filter out PDF commands and focus on actual text content
    const filteredChunks = readableChunks
      .filter(chunk => {
        // Skip chunks that look like PDF commands
        if (chunk.match(/^(obj|endobj|stream|endstream|xref|trailer)/)) return false;
        if (chunk.match(/^<<.*>>$/)) return false;
        if (chunk.match(/^\d+\s+\d+\s+(obj|R)$/)) return false;
        
        // Keep chunks that look like actual text
        const wordCount = chunk.split(/\s+/).filter(w => w.length > 2).length;
        return wordCount > 3;
      })
      .join('\n');
    
    // Clean up the text
    const cleanedText = filteredChunks
      .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleanedText;
  } catch (error) {
    console.error('Error extracting raw text:', error);
    return '';
  }
}

export default extractTextFromPDF;