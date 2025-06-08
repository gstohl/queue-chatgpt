# queue-chatgpt

A Chrome extension that allows you to queue multiple messages for ChatGPT and process them sequentially with automatic response handling.

## Features

- 🚀 **Message Queue Management** - Add, remove, and reorder messages in a queue
- ⏯️ **Automated Processing** - Send messages automatically with configurable wait times
- 💾 **Import/Export** - Save and load message queues as JSON files
- 🔄 **Retry Mechanism** - Automatic retry with exponential backoff for failed messages
- 🌓 **Dark/Light Mode** - Automatically follows system theme preferences
- ⌨️ **Keyboard Shortcuts** - Quick actions for power users
- 📊 **Progress Tracking** - Visual indicators for queue status and progress

## Installation

### Method 1: Load Unpacked (Development)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" button
5. Select the `queue-chatgpt` directory
6. The extension icon will appear in your Chrome toolbar

### Method 2: From Source

```bash
# Clone the repository
git clone https://github.com/yourusername/queue-chatgpt.git
cd queue-chatgpt

# Open Chrome Extensions page
# chrome://extensions/

# Enable Developer mode and load the folder
```

## Usage

1. **Open ChatGPT** - Navigate to [chatgpt.com](https://chatgpt.com)
2. **Click Extension Icon** - Click the queue-chatgpt icon in your toolbar
3. **Add Messages** - Type messages and click "Add" or press Enter
4. **Start Queue** - Click "Start Queue" to begin processing
5. **Monitor Progress** - Watch as messages are sent automatically

### Keyboard Shortcuts

- `Ctrl/Cmd + Enter` - Start/Pause queue processing
- `Ctrl/Cmd + Shift + C` - Clear entire queue
- `Ctrl/Cmd + E` - Export queue to JSON
- `Ctrl/Cmd + I` - Import queue from JSON

## Configuration

### Wait Time
Set the minimum wait time between messages (in seconds) to avoid overwhelming ChatGPT and ensure responses are fully received.

### Import/Export Format
Queues are exported as JSON files with the following structure:
```json
{
  "queue": ["Message 1", "Message 2", "Message 3"],
  "waitTime": 3000
}
```

## Technical Details

- **Manifest Version**: V3
- **Permissions Required**: activeTab, storage, tabs
- **Host Permissions**: https://chatgpt.com/*
- **Browser Compatibility**: Chrome/Edge (Chromium-based browsers)

## Features in Detail

### Automatic Retry
- Failed messages retry up to 3 times
- Exponential backoff between retries
- Clear error messages for debugging

### UI Element Detection
- Multiple selector fallbacks for ChatGPT interface
- Robust response completion detection
- Handles UI changes gracefully

### Dark Mode Support
- Automatically detects system theme preference
- Seamless switching without reload
- Optimized colors for both themes

## Troubleshooting

### Extension Not Working?
1. Ensure you're on chatgpt.com
2. Refresh the ChatGPT page
3. Check Chrome console for error messages
4. Reload the extension from chrome://extensions/

### Messages Not Sending?
1. Check if ChatGPT is fully loaded
2. Ensure no dialog boxes are open in ChatGPT
3. Try increasing the wait time
4. Check for ChatGPT rate limits

### Connection Errors?
1. Verify you're logged into ChatGPT
2. Check your internet connection
3. Disable other ChatGPT extensions
4. Clear browser cache and cookies

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built for the ChatGPT community
- Icon designed with AI assistance
- Inspired by productivity automation needs

## Changelog

### Version 1.0
- Initial release
- Basic queue functionality
- Import/Export support
- Dark mode support
- Keyboard shortcuts
- Retry mechanism
- Progress indicators

## Support

For issues, feature requests, or questions:
- Create an issue on GitHub
- Check existing issues for solutions
- Read the troubleshooting guide above

---

Made with ❤️ for efficient ChatGPT interactions