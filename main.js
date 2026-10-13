const { app, BrowserWindow, ipcMain, session, Notification } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Enable Picture-in-Picture command line switches
app.commandLine.appendSwitch('enable-pip');
app.commandLine.appendSwitch('enable-features', 'PictureInPicture');

function createWindow() {
  // Enable Picture-in-Picture in the default session
  const defaultSession = session.defaultSession;
  defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'fullscreen' || permission === 'picture-in-picture') {
      callback(true);
    } else {
      callback(false);
    }
  });
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#0a0a0a',
    icon: path.join(__dirname, 'zanora-logo-app.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      plugins: true,
      experimentalFeatures: true,
      sandbox: false
    }
  });

  mainWindow.loadFile('loading.html');

  // Handle Picture-in-Picture events
  mainWindow.on('app-command', (e, cmd) => {
    if (cmd === 'media-play-pause') {
      // Handle media play/pause if needed
    }
  });

  // Inject custom CSS and window controls
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.insertCSS(`
      /* Premium scrollbar styling */
      ::-webkit-scrollbar {
        width: 6px !important;
      }

      ::-webkit-scrollbar-track {
        background: #0a0a0a !important;
      }

      ::-webkit-scrollbar-thumb {
        background: #333 !important;
        border-radius: 3px !important;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: #444 !important;
      }

      /* Window drag area */
      #window-drag-area {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 30px;
        -webkit-app-region: drag;
        z-index: 999998;
      }

      /* Window controls styling */
      #window-controls {
        position: fixed;
        top: 0;
        right: 0;
        z-index: 999999;
        display: flex;
        background: #0a0a0a;
        padding: 10px;
        opacity: 1;
        transition: opacity 0.2s ease;
        -webkit-app-region: no-drag;
      }

      #window-controls.hidden {
        opacity: 0;
      }

      .window-btn {
        width: 46px;
        height: 30px;
        border: none;
        background: transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
        padding: 0;
      }

      .window-btn svg {
        width: 16px;
        height: 16px;
      }

      .window-btn:hover {
        background: #1a1a1a;
      }

      .window-btn.close:hover {
        background: #e81123;
      }
    `);

    // Inject window controls using executeJavaScript
    mainWindow.webContents.executeJavaScript(`
      (function() {
        // Remove existing controls if any
        const existing = document.getElementById('window-controls');
        if (existing) existing.remove();

        const existingDrag = document.getElementById('window-drag-area');
        if (existingDrag) existingDrag.remove();

        // Create drag area
        const dragArea = document.createElement('div');
        dragArea.id = 'window-drag-area';
        document.body.appendChild(dragArea);

        // Create controls
        const controls = document.createElement('div');
        controls.id = 'window-controls';
        controls.innerHTML = \`
          <button class="window-btn minimize">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50px" height="50px">
              <path fill="#cccccc" d="M41,4H9C6.24,4,4,6.24,4,9v32c0,2.76,2.24,5,5,5h32c2.76,0,5-2.24,5-5V9C46,6.24,43.76,4,41,4z M37,36c0,0.55-0.45,1-1,1H14 c-0.55,0-1-0.45-1-1v-2c0-0.55,0.45-1,1-1h22c0.55,0,1,0.45,1,1V36z"/>
            </svg>
          </button>
          <button class="window-btn maximize">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px">
              <path fill="#cccccc" d="M36.5,42h-25C8.467,42,6,39.532,6,36.5v-25C6,8.468,8.467,6,11.5,6h25c3.033,0,5.5,2.468,5.5,5.5v25	C42,39.532,39.533,42,36.5,42z"/>
            </svg>
          </button>
          <button class="window-btn close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50px" height="50px">
              <path fill="#cccccc" d="M41,4H9C6.24,4,4,6.24,4,9v32c0,2.76,2.24,5,5,5h32c2.76,0,5-2.24,5-5V9C46,6.24,43.76,4,41,4z M34.71,33.29l-1.42,1.42 L25,26.42l-8.29,8.29l-1.42-1.42L23.58,25l-8.29-8.29l1.42-1.42L25,23.58l8.29-8.29l1.42,1.42L26.42,25L34.71,33.29z"/>
            </svg>
          </button>
        \`;
        document.body.appendChild(controls);

        // Prevent text selection on navigation elements
        function preventSelection(element) {
          if (element) {
            element.style.webkitUserSelect = 'none';
            element.style.userSelect = 'none';
          }
        }

        // Apply to navigation elements when they exist
        const navSelectors = ['nav', 'header', '.navbar', '.navigation', '[role="navigation"]'];
        navSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => preventSelection(el));
        });

        // Also prevent selection on buttons and links
        document.querySelectorAll('button, a').forEach(el => preventSelection(el));

        // Watch for dynamically added elements
        const observer = new MutationObserver(() => {
          navSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => preventSelection(el));
          });
          document.querySelectorAll('button, a').forEach(el => preventSelection(el));
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Auto-hide functionality
        let hideTimeout;
        const controlsEl = document.getElementById('window-controls');

        function showControls() {
          controlsEl.classList.remove('hidden');
          clearTimeout(hideTimeout);
        }

        function hideControls() {
          clearTimeout(hideTimeout);
          hideTimeout = setTimeout(() => {
            controlsEl.classList.add('hidden');
          }, 500);
        }

        // Show on hover
        controlsEl.addEventListener('mouseenter', showControls);
        controlsEl.addEventListener('mouseleave', hideControls);

        // Start hidden - only show on hover
        controlsEl.classList.add('hidden');

        // Add event listeners
        document.querySelector('.minimize').addEventListener('click', () => {
          window.electronAPI.minimize();
        });

        document.querySelector('.maximize').addEventListener('click', () => {
          window.electronAPI.maximize();
        });

        document.querySelector('.close').addEventListener('click', () => {
          window.electronAPI.close();
        });
      })();
    `);
  });

  // Handle window control events
  ipcMain.on('window-minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    mainWindow.close();
  });

  // Handle loading complete - load the actual app
  ipcMain.on('loading-complete', () => {
    mainWindow.loadURL('https://zanora-movies.vercel.app/index.html');

    // Enable PiP after loading the URL
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.executeJavaScript(`
        // Enable Picture-in-Picture for all videos
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
          video.setAttribute('webkit-playsinline', '');
          video.setAttribute('playsinline', '');
          video.setAttribute('allow', 'picture-in-picture');
          video.setAttribute('controls', '');
        });

        // Watch for dynamically added videos
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeName === 'VIDEO') {
                node.setAttribute('webkit-playsinline', '');
                node.setAttribute('playsinline', '');
                node.setAttribute('allow', 'picture-in-picture');
                node.setAttribute('controls', '');
              }
            });
          });
        });
        observer.observe(document.body, { childList: true, subtree: true });
      `);
    });
  });

  // Update handlers
  ipcMain.on('check-for-updates', () => {
    autoUpdater.checkForUpdates();
  });

  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
  });

  // Auto updater setup
  // Set the feed URL explicitly to GitHub
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'kiwuna',
    repo: 'zanora-app'
  });

  // Auto updater events
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info);

    // Show notification to user
    new Notification({
      title: 'Update Available',
      body: `A new version (${info.version}) is available. Downloading now...`,
      icon: path.join(__dirname, 'zanora-logo-app.png')
    }).show();

    // Also send to renderer
    mainWindow.webContents.send('update-available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available:', info);
  });

  autoUpdater.on('error', (err) => {
    console.log('Error in auto-updater:', err);

    // Show error notification
    new Notification({
      title: 'Update Error',
      body: 'Failed to check for updates. Please try again later.',
      icon: path.join(__dirname, 'zanora-logo-app.png')
    }).show();
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    console.log(log_message);
    // Send progress to renderer
    mainWindow.webContents.send('download-progress', progressObj);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info);

    // Show notification with install button option
    new Notification({
      title: 'Update Ready',
      body: 'A new version has been downloaded. Restart to install.',
      icon: path.join(__dirname, 'zanora-logo-app.png')
    }).show();

    // Notify user that update is ready to install
    mainWindow.webContents.send('update-downloaded', info);

    // Auto-install and restart after 10 seconds
    setTimeout(() => {
      autoUpdater.quitAndInstall();
    }, 10000);
  });
}

app.whenReady().then(() => {
  createWindow();

  // Check for updates when app starts (with delay to ensure window is ready)
  setTimeout(() => {
    console.log('Starting update check...');
    autoUpdater.checkForUpdates().catch(err => {
      console.error('Update check failed:', err);
    });
  }, 5000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
