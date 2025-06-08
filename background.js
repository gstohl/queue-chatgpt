// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage with empty queue
  chrome.storage.local.set({ messageQueue: [] });
});

// Listen for uninstall
chrome.runtime.onSuspend.addListener(() => {
  // Clean up storage
  chrome.storage.local.clear();
}); 