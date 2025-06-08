# Queue ChatGPT Chrome Extension

## Project Overview
This is a Chrome extension that allows users to queue multiple messages for ChatGPT and process them sequentially. The extension provides automation for sending messages to ChatGPT with configurable wait times between messages.

## Architecture
- **Manifest V3** Chrome extension
- **Background Service Worker** (`background.js`) - Handles storage initialization
- **Content Script** (`content.js`) - Injects into ChatGPT pages to automate message sending
- **Popup Interface** (`popup.html`, `popup.js`) - User interface for managing message queue
- **Styling** (`styles.css`) - Popup interface styling

## Key Features
1. **Message Queue Management**
   - Add messages to queue
   - Remove individual messages
   - Clear entire queue
   - Visual queue display with numbering

2. **Queue Processing**
   - Start/pause queue processing
   - Automatic message sending to ChatGPT
   - Wait for AI response completion before next message
   - Configurable minimum wait time between messages

3. **Import/Export**
   - Export queue to JSON file
   - Import queue from JSON file
   - Preserves wait time settings

4. **Status Monitoring**
   - Connection status to ChatGPT
   - Current tab information display
   - Processing status updates

## Technical Details

### Message Processing Flow
1. User adds messages to queue via popup
2. When "Start Queue" is clicked, popup sends message to content script
3. Content script:
   - Finds ChatGPT input textarea (`#prompt-textarea`)
   - Sets message text and dispatches input events
   - Clicks send button (`#composer-submit-button`)
   - Waits for response completion (monitors for "Stop streaming" button)
4. After response, waits minimum time before next message

### Storage
- Uses `chrome.storage.local` for persistence
- Stores:
  - `messageQueue`: Array of message strings
  - `minWaitTime`: Minimum wait time in milliseconds

### Permissions
- `activeTab` - Interact with current tab
- `storage` - Persist queue data
- `tabs` - Query tab information
- Host permission for `https://chatgpt.com/*`

## Current Issues & Improvements Needed

### Critical Issues
1. **Extension Name Mismatch** - Fixed: Extension is now properly named "queue-chatgpt"
2. **Missing Icons** - Empty icon definitions in manifest.json
3. **Error Handling** - Limited error recovery if ChatGPT UI changes
4. **Response Detection** - Relies on presence of "Stop streaming" button which may be fragile

### Suggested Improvements
1. **Enhanced Message Processing**
   - Add retry mechanism for failed messages
   - Better detection of ChatGPT UI elements
   - Handle conversation context/threading
   - Support for code blocks and formatting

2. **User Experience**
   - Add progress indicator showing queue position
   - Estimated time remaining based on average response times
   - Sound/notification when queue completes
   - Keyboard shortcuts for common actions
   - Drag-and-drop to reorder queue items

3. **Advanced Features**
   - Message templates/variables
   - Conditional message flows
   - Response parsing and actions
   - Multiple queue presets
   - Schedule queue execution
   - Export conversation history

4. **Technical Improvements**
   - Add comprehensive logging system
   - Implement proper state management
   - Add unit tests
   - Better TypeScript support
   - Optimize content script injection
   - Add message validation

5. **UI/UX Polish**
   - Dark mode support
   - Responsive design improvements
   - Better visual feedback for actions
   - Accessibility improvements
   - Collapsible queue sections for long lists

## Development Commands
No package.json found - this is a vanilla JavaScript Chrome extension.

To test:
1. Open Chrome Extensions page (chrome://extensions/)
2. Enable Developer mode
3. Click "Load unpacked" and select this directory
4. The extension will appear in the toolbar

## File Structure
```
queue-chatgpt/
├── manifest.json      # Extension manifest (needs name update)
├── background.js      # Service worker for storage
├── content.js        # ChatGPT page automation
├── popup.html        # Extension popup UI
├── popup.js          # Popup logic and queue management
├── styles.css        # Popup styling
└── CLAUDE.md         # This file - project documentation
```