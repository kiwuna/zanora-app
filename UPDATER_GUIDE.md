# Zanora Movies Desktop - Auto-Updater Configuration Guide

## Current Setup

Your app is configured to use **GitHub Releases** for auto-updates via `electron-updater`.

### Configuration Details:
- **Provider**: GitHub
- **Owner**: kiwuna
- **Repository**: zanora-app
- **Current Version**: 1.0.1

---

## How the Auto-Updater Works

1. When the app starts, it checks for updates from your GitHub repository
2. If a newer version is found on GitHub Releases, it downloads it
3. The user is notified when an update is available
4. Once downloaded, the user can install the update

---

## How to Release Updates

### Step 1: Update the Version in package.json

Before building, increment the version number in `package.json`:

```json
{
  "version": "1.0.2"  // Increment this (1.0.1 -> 1.0.2 -> 1.0.3, etc.)
}
```

Version format: `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes (2.0.0)
- MINOR: New features (1.1.0)
- PATCH: Bug fixes (1.0.2)

### Step 2: Build the App

Run the build command (this automatically cleans the dist folder first):

```bash
npm run build
```

This will create:
- `dist/Zanora Movies Setup 1.0.2.exe` (NSIS installer)
- `dist/Zanora Movies-1.0.2.yml` (Update manifest)
- `dist/Zanora Movies-1.0.2-win.blockmap` (Block map for delta updates)

### Step 3: Create a GitHub Release

1. Go to your GitHub repository: https://github.com/kiwuna/zanora-app/releases
2. Click "Create a new release"
3. Tag version: `v1.0.2` (must match package.json version with 'v' prefix)
4. Release title: `Version 1.0.2`
5. Description: Add release notes (what's new, bug fixes, etc.)
6. **Important**: Upload the following files from the `dist` folder:
   - `Zanora Movies Setup 1.0.2.exe`
   - `Zanora Movies-1.0.2.yml`
   - `Zanora Movies-1.0.2-win.blockmap`
7. Click "Publish release"

### Step 4: Users Get the Update

When users open your app, it will:
1. Check for updates automatically
2. Detect the new version on GitHub
3. Download the update in the background
4. Notify the user when ready to install

---

## Build Configuration Changes Made

### 1. Auto-Clean Dist Folder
- Added `prebuild` script that cleans the `dist` folder before each build
- No more old versions accumulating in dist

### 2. Better File Inclusion
- Added `loading.html` to the build
- Added `Assets/**/*` to include your SVG icons
- Cleaner build output

### 3. NSIS Installer Improvements
- Allows users to choose installation directory
- Creates desktop and start menu shortcuts
- Per-machine installation (no admin required)

### 4. Build Scripts

- `npm start` - Run the app in development
- `npm run build` - Build the NSIS installer

---

## Testing the Updater

To test the updater before releasing:

1. Build version 1.0.2
2. Install version 1.0.1
3. Run version 1.0.1
4. The app should detect and offer to update to 1.0.2

---

## Troubleshooting

### Updater not working?
- Make sure the GitHub repository is public (or use a private token)
- Verify the `.yml` and `.blockmap` files are uploaded to the release
- Check that the version in package.json matches the GitHub release tag
- Ensure the `publish` configuration in package.json is correct

### Build errors?
- Delete the `dist` folder manually: `rm -rf dist`
- Clear electron-builder cache: `rm -rf ~/.electron-builder`
- Reinstall dependencies: `rm -rf node_modules && npm install`

---

## GitHub Personal Access Token (Optional)

If your repository is private, you need a GitHub token:

1. Go to GitHub Settings -> Developer Settings -> Personal Access Tokens
2. Generate a new token with `repo` scope
3. Add it to your environment:
   ```bash
   export GH_TOKEN=your_token_here
   ```
4. Or add to electron-builder config (not recommended for security)

---

## Quick Reference

**Release Workflow:**
1. Update version in package.json
2. Run `npm run build`
3. Create GitHub release with dist files
4. Done! Users auto-update automatically
