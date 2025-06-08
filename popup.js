let messageQueue = [];
let isProcessing = false;
let minWaitTime = 3000; // Default 3 seconds
let retryAttempts = {}; // Track retry attempts for each message
const MAX_RETRIES = 3;

document.addEventListener('DOMContentLoaded', () => {
  // Load saved queue and settings from storage
  chrome.storage.local.get(['messageQueue', 'minWaitTime'], (result) => {
    if (result.messageQueue) {
      messageQueue = result.messageQueue;
      updateQueueDisplay();
    }
    if (result.minWaitTime) {
      minWaitTime = result.minWaitTime;
      document.getElementById('minWaitTime').value = minWaitTime / 1000;
    }
  });

  // Add message to queue
  document.getElementById('addButton').addEventListener('click', addMessage);
  document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addMessage();
  });

  // Start processing queue
  document.getElementById('playButton').addEventListener('click', toggleProcessing);

  // Clear queue
  document.getElementById('clearButton').addEventListener('click', clearQueue);

  // Export queue
  document.getElementById('exportButton').addEventListener('click', exportQueue);

  // Import queue
  document.getElementById('importButton').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });

  document.getElementById('fileInput').addEventListener('change', importQueue);

  // Wait time setting
  document.getElementById('minWaitTime').addEventListener('change', (e) => {
    const seconds = parseInt(e.target.value) || 3;
    minWaitTime = Math.max(1, seconds) * 1000;
    chrome.storage.local.set({ minWaitTime });
    setStatus(`Minimum wait time set to ${seconds} seconds`);
  });

  // Setup keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to start/pause queue
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      toggleProcessing();
    }
    // Ctrl/Cmd + Shift + C to clear queue
    else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      if (confirm('Clear all messages from queue?')) {
        clearQueue();
      }
    }
    // Ctrl/Cmd + E to export
    else if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      exportQueue();
    }
    // Ctrl/Cmd + I to import
    else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      document.getElementById('fileInput').click();
    }
  });

  // Check current tab and update status
  updateCurrentTabInfo();
});

function updateCurrentTabInfo() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    const isChatGPT = currentTab.url.includes('chatgpt.com');
    
    const statusDiv = document.getElementById('status');
    const tabInfo = `
      <div class="tab-info">
        <div class="tab-title">${currentTab.title}</div>
        <div class="tab-url">${currentTab.url}</div>
      </div>
    `;
    
    if (isChatGPT) {
      statusDiv.innerHTML = `
        <div class="connection-status">
          Connected to ChatGPT
        </div>
        ${tabInfo}
      `;
      statusDiv.className = 'status success';
    } else {
      statusDiv.innerHTML = `
        <div class="connection-status">
          Not connected to ChatGPT
        </div>
        ${tabInfo}
        <div class="instruction">Please open chatgpt.com</div>
      `;
      statusDiv.className = 'status error';
    }
  });
}

function addMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();
  
  if (message) {
    messageQueue.push(message);
    chrome.storage.local.set({ messageQueue });
    updateQueueDisplay();
    input.value = '';
  }
}

function updateQueueDisplay() {
  const list = document.getElementById('messageList');
  list.innerHTML = '';
  
  if (messageQueue.length === 0) {
    const emptyMsg = document.createElement('li');
    emptyMsg.textContent = 'Queue is empty';
    emptyMsg.style.fontStyle = 'italic';
    emptyMsg.style.color = '#999';
    list.appendChild(emptyMsg);
  } else {
    messageQueue.forEach((message, index) => {
      const li = document.createElement('li');
      
      const messageText = document.createElement('span');
      messageText.textContent = `${index + 1}. ${message}`;
      if (index === 0 && isProcessing) {
        messageText.style.fontWeight = 'bold';
        messageText.style.color = '#2ecc71';
      }
      
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'X';
      deleteBtn.onclick = () => removeMessage(index);
      
      li.appendChild(messageText);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    });
  }

  updatePlayButton();
}

function removeMessage(index) {
  messageQueue.splice(index, 1);
  chrome.storage.local.set({ messageQueue });
  updateQueueDisplay();
}

function clearQueue() {
  messageQueue = [];
  chrome.storage.local.set({ messageQueue });
  updateQueueDisplay();
  setStatus('Queue cleared');
}

function toggleProcessing() {
  if (isProcessing) {
    isProcessing = false;
    updatePlayButton();
    setStatus('Processing paused');
  } else {
    if (messageQueue.length > 0) {
      isProcessing = true;
      updatePlayButton();
      processQueue();
    } else {
      setStatus('Queue is empty');
    }
  }
}

function updatePlayButton() {
  const playButton = document.getElementById('playButton');
  playButton.textContent = isProcessing ? 'Pause' : 'Start Queue';
  playButton.style.backgroundColor = isProcessing ? '#e74c3c' : '#2ecc71';
}

function setStatus(message) {
  const statusDiv = document.getElementById('status');
  const currentContent = statusDiv.innerHTML;
  const processStatus = `
    <div class="process-status">
      ${message}
    </div>
  `;
  
  // Insert the process status at the beginning while preserving the tab info
  if (currentContent.includes('tab-info')) {
    statusDiv.innerHTML = currentContent.replace(
      /<div class="connection-status">.*?<\/div>/s,
      `<div class="connection-status">${processStatus}</div>`
    );
  } else {
    statusDiv.innerHTML = processStatus + currentContent;
  }
}

function exportQueue() {
  const data = {
    queue: messageQueue,
    waitTime: minWaitTime
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chatgpt-queue.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  setStatus('Queue exported successfully');
}

function importQueue(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (Array.isArray(data.queue)) {
        messageQueue = data.queue;
        if (typeof data.waitTime === 'number') {
          minWaitTime = data.waitTime;
          document.getElementById('minWaitTime').value = minWaitTime / 1000;
        }
        chrome.storage.local.set({ messageQueue, minWaitTime });
        updateQueueDisplay();
        setStatus('Queue imported successfully');
      } else {
        setStatus('Invalid queue file format');
      }
    } catch (error) {
      setStatus('Error importing queue file');
    }
  };
  reader.readAsText(file);
  e.target.value = ''; // Reset file input
}

function processQueue() {
  if (!isProcessing || messageQueue.length === 0) {
    isProcessing = false;
    updatePlayButton();
    setStatus('Queue processing complete');
    retryAttempts = {}; // Clear retry attempts
    return;
  }

  const message = messageQueue[0];
  const messageKey = `${message}_${Date.now()}`;
  const currentRetries = retryAttempts[messageKey] || 0;
  
  setStatus(`Processing (${messageQueue.length} remaining): ${message}`);

  // Send message to content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      setStatus('Error: No active tab found');
      isProcessing = false;
      updatePlayButton();
      return;
    }
    
    chrome.tabs.sendMessage(tabs[0].id, { 
      action: 'processMessage',
      message: message
    }, async (response) => {
      if (chrome.runtime.lastError) {
        // Handle connection errors
        console.error('Runtime error:', chrome.runtime.lastError);
        handleMessageError(message, messageKey, 'Connection error: Is ChatGPT loaded?');
        return;
      }
      
      if (response && response.success) {
        // Success - remove message and continue
        messageQueue.shift();
        delete retryAttempts[messageKey];
        chrome.storage.local.set({ messageQueue });
        updateQueueDisplay();
        
        // Wait the minimum time before processing next message
        if (messageQueue.length > 0) {
          setStatus(`Success! Waiting ${minWaitTime/1000}s before next message...`);
          await new Promise(resolve => setTimeout(resolve, minWaitTime));
        }
        
        processQueue();
      } else {
        // Error - handle retry logic
        const errorMsg = response?.error || 'Unknown error';
        handleMessageError(message, messageKey, errorMsg);
      }
    });
  });
}

function handleMessageError(message, messageKey, error) {
  const currentRetries = retryAttempts[messageKey] || 0;
  
  if (currentRetries < MAX_RETRIES) {
    retryAttempts[messageKey] = currentRetries + 1;
    const retryDelay = (currentRetries + 1) * 2000; // Exponential backoff
    
    setStatus(`Error: ${error}. Retry ${currentRetries + 1}/${MAX_RETRIES} in ${retryDelay/1000}s...`);
    
    setTimeout(() => {
      if (isProcessing) {
        processQueue();
      }
    }, retryDelay);
  } else {
    // Max retries reached - skip this message
    setStatus(`Failed after ${MAX_RETRIES} retries: ${error}. Skipping message.`);
    messageQueue.shift();
    delete retryAttempts[messageKey];
    chrome.storage.local.set({ messageQueue });
    updateQueueDisplay();
    
    // Continue with next message after a delay
    setTimeout(() => {
      if (isProcessing) {
        processQueue();
      }
    }, 2000);
  }
} 