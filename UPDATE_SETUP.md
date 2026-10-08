# GitHub Auto-Updater Setup Guide

Your Electron app is configured with `electron-updater` to automatically check for and install updates from GitHub releases.

## Current Configuration

The updater is already configured in:
- `package.json` - Build and publish settings
- `main.js` - Update checking logic

## Setup Instructions

### 1. Create a GitHub Personal Access Token

To publish releases and enable auto-updates, you need a GitHub Personal Access Token:

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name (e.g., "zanora-app-updater")
4. Select the following scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `public_repo` (Access public repositories)
5. Click "Generate token"
6. **Copy the token** - you won't see it again!

### 2. Set the Token as Environment Variable

**For Windows (Command Prompt):**
```cmd
set GH_TOKEN=your_token_here
```

**For Windows (PowerShell):**
```powershell
$env:GH_TOKEN="your_token_here"
```

**For permanent setup (Windows):**
- Right-click "This PC" → Properties → Advanced system settings
- Click "Environment Variables"
- Add a new system variable:
  - Name: `GH_TOKEN`
  - Value: `your_token_here`

### 3. Build and Publish Your App

Build the application and publish it to GitHub:

```bash
npm run build:win
```

This will:
- Build the Windows installer and portable executable
- Create a GitHub release with the installer files
- Tag the release with the version from `package.json`

### 4. Update Your App

When you make changes:

1. **Update the version** in `package.json`:
   ```json
   "version": "1.0.1"
   ```

2. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "Update to version 1.0.1"
   git push origin main
   ```

3. **Build and publish** the new version:
   ```bash
   npm run build:win
   ```

The electron-builder will automatically:
- Create a new GitHub release (e.g., v1.0.1)
- Upload the installer files to the release
- Update the latest release

### 5. How Updates Work for Users

When users run your app:
1. The app checks for updates automatically on startup
2. If an update is available, it downloads it in the background
3. When the download is complete, the user is notified
4. The app can be updated by calling `autoUpdater.quitAndInstall()`

## Manual Update Check

To manually check for updates from the renderer process (in your web app):

```javascript
// In preload.js (already configured)
contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  checkForUpdates: () => ipcRenderer.send('check-for-updates')
});

// In main.js - add this handler
ipcMain.on('check-for-updates', () => {
  autoUpdater.checkForUpdates();
});

// In your web app (loaded in Electron)
if (window.electronAPI && window.electronAPI.checkForUpdates) {
  window.electronAPI.checkForUpdates();
}
```

## Update Events

The updater sends these events that you can listen to:

- `checking-for-update` - Started checking for updates
- `update-available` - New version found
- `update-not-available` - Already on latest version
- `download-progress` - Download progress (percent, bytes transferred)
- `update-downloaded` - Update ready to install
- `error` - Something went wrong

## Troubleshooting

### Updates not showing:
- Make sure version numbers in `package.json` are incremented
- Check that GitHub releases are public
- Verify the `GH_TOKEN` has correct permissions

### Build fails:
- Ensure `GH_TOKEN` is set correctly
- Check that you have push access to the repository
- Verify the repository name and owner in `package.json`

### Update downloads but doesn't install:
- The app needs to be restarted to install updates
- Call `autoUpdater.quitAndInstall()` when the user confirms

## Additional Resources

- [electron-updater documentation](https://www.electron.build/auto-update)
- [electron-builder documentation](https://www.electron.build/)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
