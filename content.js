// Track images in the conversation
let conversationImages = new Set();

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processMessage') {
    console.log('📥 Received message to process:', request.message);
    console.log('🎨 Image queue mode:', request.imageQueueMode);
    
    // Validate message before processing
    if (!request.message || typeof request.message !== 'string' || request.message.trim().length === 0) {
      console.error('❌ Invalid message: empty or not a string');
      sendResponse({ success: false, error: 'Invalid message: cannot be empty' });
      return false;
    }
    
    // Check if we're on ChatGPT
    if (!window.location.hostname.includes('chatgpt.com')) {
      console.error('❌ Not on ChatGPT domain');
      sendResponse({ success: false, error: 'Not on ChatGPT website' });
      return false;
    }
    
    // Count current images before processing
    if (request.imageQueueMode) {
      countCurrentImages();
    }
    
    processMessage(request.message, request.imageQueueMode)
      .then(() => {
        console.log('✅ Message processed successfully');
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('❌ Error processing message:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Required for async response
  }
});

async function processMessage(message, imageQueueMode) {
  console.log('🔍 Looking for ChatGPT input...');
  
  // Try multiple selectors for better compatibility
  const selectors = [
    '#prompt-textarea[contenteditable="true"]',
    'div[contenteditable="true"][data-placeholder]',
    'textarea[data-id="prompt-textarea"]',
    '.text-base[contenteditable="true"]'
  ];
  
  let textarea = null;
  for (const selector of selectors) {
    textarea = document.querySelector(selector);
    if (textarea) {
      console.log(`✅ Found input using selector: ${selector}`);
      break;
    }
  }
  
  if (!textarea) {
    console.error('❌ ChatGPT input not found with any selector');
    throw new Error('ChatGPT input not found. The ChatGPT interface may have changed.');
  }

  // Focus and click the input first
  console.log('🎯 Focusing input...');
  textarea.focus();
  textarea.click();
  console.log('✅ Input focused');

  // Set the message in the contenteditable div
  console.log('📝 Setting message in input...');
  
  // Clear existing content
  textarea.innerHTML = '';
  
  // Set new content
  textarea.innerHTML = message;
  
  // Create and dispatch proper input event
  const inputEvent = new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertText',
    data: message
  });
  textarea.dispatchEvent(inputEvent);
  
  // Simulate text change events
  const textChangeEvent = new Event('textChange', { bubbles: true });
  textarea.dispatchEvent(textChangeEvent);
  
  // Create a new keyboard event for Enter
  const enterKeyEvent = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false
  });
  
  console.log('✅ Message set in input');

  // Wait 1 second after setting text
  console.log('⏳ Waiting 1 second after text input...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('✅ Wait complete');

  // Find and click the send button using multiple selectors
  console.log('🔍 Looking for send button...');
  
  const buttonSelectors = [
    '#composer-submit-button',
    'button[data-testid="send-button"]',
    'button[aria-label="Send message"]',
    'button[aria-label="Send prompt"]',
    'button svg.icon-2xl'
  ];
  
  let sendButton = null;
  for (const selector of buttonSelectors) {
    if (selector.includes('svg')) {
      // For SVG selector, find the parent button
      const svg = document.querySelector(selector);
      sendButton = svg?.closest('button');
    } else {
      sendButton = document.querySelector(selector);
    }
    
    if (sendButton && !sendButton.disabled) {
      console.log(`✅ Found send button using selector: ${selector}`);
      break;
    }
  }
  
  if (!sendButton) {
    console.error('❌ Send button not found with any selector');
    throw new Error('Send button not found. The ChatGPT interface may have changed.');
  }
  
  // Small delay to ensure events are processed
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('🚀 Clicking send button...');
  sendButton.click();
  console.log('✅ Send button clicked');

  // Wait for the response to complete
  console.log('⏳ Waiting for response...');
  await waitForResponse(imageQueueMode);
  console.log('✅ Response complete');
}

async function waitForResponse(imageQueueMode) {
  return new Promise((resolve, reject) => {
    const maxWaitTime = 120000; // 2 minutes timeout
    const startTime = Date.now();
    let checkCount = 0;
    let lastMessageCount = 0;
    
    const checkCompletion = () => {
      checkCount++;
      
      // Multiple ways to detect if response is complete
      const streamingIndicators = [
        'button[aria-label="Stop streaming"]',
        'button[aria-label="Stop generating"]',
        '.result-streaming',
        '[data-testid="stop-button"]'
      ];
      
      let isStreaming = false;
      for (const selector of streamingIndicators) {
        if (document.querySelector(selector)) {
          isStreaming = true;
          break;
        }
      }
      
      // Also check if new messages are being added
      const messages = document.querySelectorAll('[data-message-author-role="assistant"]');
      const currentMessageCount = messages.length;
      const messageCountChanged = currentMessageCount !== lastMessageCount;
      lastMessageCount = currentMessageCount;
      
      if (!isStreaming && !messageCountChanged) {
        // No streaming indicators and message count stable
        if (Date.now() - startTime > 2000) { // Wait at least 2 seconds
          
          // If image queue mode, check for new images
          if (imageQueueMode) {
            console.log('🎨 Checking for image generation...');
            waitForImageGeneration()
              .then(() => {
                console.log(`✅ Response complete with image after ${checkCount} checks (${Date.now() - startTime}ms)`);
                resolve();
              })
              .catch((error) => {
                console.error('❌ Image wait failed:', error);
                resolve(); // Continue anyway
              });
          } else {
            console.log(`✅ Response complete after ${checkCount} checks (${Date.now() - startTime}ms)`);
            resolve();
          }
        } else {
          console.log('⏳ Waiting for response stabilization...');
          setTimeout(checkCompletion, 300);
        }
      } else {
        // Still streaming or messages changing
        if (checkCount % 10 === 0) {
          console.log(`⏳ AI still responding... (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`);
        }
        setTimeout(checkCompletion, 500);
      }
    };

    // Start checking
    console.log('🔄 Starting response check...');
    checkCompletion();

    // Set timeout
    setTimeout(() => {
      console.error(`❌ Response timeout after ${maxWaitTime/1000} seconds`);
      reject(new Error('Response timeout'));
    }, maxWaitTime);
  });
}

function countCurrentImages() {
  // Clear previous count and recount all images in the conversation
  conversationImages.clear();
  
  // Find all images in the conversation
  const imageSelectors = [
    'img[alt*="Generated"]',
    'img[alt*="Image"]',
    '[data-message-author-role="assistant"] img',
    '.markdown img',
    'img[src*="dalle"]',
    'img[src*="oaiusercontent"]'
  ];
  
  imageSelectors.forEach(selector => {
    const images = document.querySelectorAll(selector);
    images.forEach(img => {
      if (img.src && !img.src.includes('avatar') && !img.src.includes('logo')) {
        conversationImages.add(img.src);
      }
    });
  });
  
  console.log(`📸 Current image count: ${conversationImages.size}`);
}

async function waitForImageGeneration() {
  return new Promise((resolve, reject) => {
    const maxRetries = 10; // 10 retries = 1 minute total
    const retryDelay = 6000; // 6 seconds between retries
    let retryCount = 0;
    
    const initialImageCount = conversationImages.size;
    console.log(`🎨 Initial image count: ${initialImageCount}`);
    
    const checkForNewImage = () => {
      retryCount++;
      
      // Count current images again
      const previousCount = conversationImages.size;
      countCurrentImages();
      const currentCount = conversationImages.size;
      
      console.log(`🔍 Image check ${retryCount}/${maxRetries}: ${currentCount} images (was ${previousCount})`);
      
      if (currentCount > initialImageCount) {
        console.log(`✅ New image detected! (${currentCount - initialImageCount} new)`);
        resolve();
      } else if (retryCount >= maxRetries) {
        console.log(`⏱️ Image generation timeout after ${maxRetries} attempts`);
        reject(new Error('Image generation timeout'));
      } else {
        console.log(`⏳ No new image yet, waiting ${retryDelay/1000}s before retry...`);
        setTimeout(checkForNewImage, retryDelay);
      }
    };
    
    // Start checking after a small initial delay
    setTimeout(checkForNewImage, 2000);
  });
} 