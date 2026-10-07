const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#0a0a0a',
    icon: path.join(__dirname, 'zanora-logo-app.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Make window draggable
  mainWindow.setWindowButtonPosition({ x: 0, y: 0 });

  mainWindow.loadURL('https://zanora-movies.vercel.app/index.html');

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
        transition: opacity 0.3s ease;
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
        color: #fff;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
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
          <button class="window-btn minimize">─</button>
          <button class="window-btn maximize">□</button>
          <button class="window-btn close">✕</button>
        \`;
        document.body.appendChild(controls);

        // Auto-hide functionality
        let hideTimeout;
        const controlsEl = document.getElementById('window-controls');

        function showControls() {
          controlsEl.classList.remove('hidden');
          clearTimeout(hideTimeout);
          hideTimeout = setTimeout(() => {
            controlsEl.classList.add('hidden');
          }, 5000);
        }

        function hideControls() {
          clearTimeout(hideTimeout);
          hideTimeout = setTimeout(() => {
            controlsEl.classList.add('hidden');
          }, 5000);
        }

        // Show on hover
        controlsEl.addEventListener('mouseenter', showControls);
        controlsEl.addEventListener('mouseleave', hideControls);

        // Initial hide after 5 seconds
        showControls();

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

  // Auto updater setup
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
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available:', info);
  });

  autoUpdater.on('error', (err) => {
    console.log('Error in auto-updater:', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    console.log(log_message);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info);
    // Prompt user to install update
    autoUpdater.quitAndInstall();
  });

  // Check for updates when app starts
  autoUpdater.checkForUpdatesAndNotify();
}

app.whenReady().then(() => {
  createWindow();

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
