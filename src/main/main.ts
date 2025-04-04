/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import {spawn} from 'child_process'; // need to communicate with
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};


// const startPythonBackend = () => {
//   // Path to your Python backend script
//   const pythonScriptPath = path.join(__dirname, '../../backend/app.py');
//   // Spawn the Python process. Change 'python' to your python executable if needed.
//   const pyProc = spawn('python', [pythonScriptPath]);

//   // Listen for data from stdout
//   pyProc.stdout?.on('data', (data) => {
//       console.log(`Python stdout: ${data.toString().trim()}`);
//   });

//   // Listen for errors from stderr
//   pyProc.stderr?.on('data', (data) => {
//       console.error(`Python error: ${data.toString().trim()}`);
//   });

//   // Handle process close
//   pyProc.on('close', (code) => {
//       console.log(`Python process exited with code ${code}`);
//   });

//   return pyProc;
// };
const runCommand = (command: string, args: string[], cwd: string) => {
  return spawn(command, args, { cwd });
};
const startDockerBackend = () => {
  // Assuming docker-compose.yml is located at two levels up from the current file:
  const projectRoot = path.join(__dirname, '../../');
  
  // Pull the latest backend image
  const pullProcess = runCommand('docker-compose', ['pull', 'backend'], projectRoot);

  pullProcess.stdout.on('data', (data) => {
    console.log(`docker-compose pull stdout: ${data}`);
  });

  pullProcess.stderr.on('data', (data) => {
    console.error(`docker-compose pull stderr: ${data}`);
  });

  pullProcess.on('close', (code) => {
    if (code === 0) {
      console.log('Successfully pulled backend image.');
      // Now run the container in detached mode
      const upProcess = runCommand('docker-compose', ['up', '-d', 'backend'], projectRoot);
      upProcess.stdout.on('data', (data) => {
        console.log(`docker-compose up stdout: ${data}`);
      });
      upProcess.stderr.on('data', (data) => {
        console.error(`docker-compose up stderr: ${data}`);
      });
      upProcess.on('close', (code) => {
        console.log(`docker-compose up exited with code ${code}`);
      });
    } else {
      console.error('Failed to pull backend image.');
    }
  });
};





/**
 * Add event listeners...
 */




app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    //startPythonBackend();
    startDockerBackend();
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
