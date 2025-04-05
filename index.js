const { app, BrowserWindow, Tray, ipcMain, Menu, shell } = require("electron");
const path = require("path");
const { initializeSettings, IS_WINDOW_HIDDEN } = require("./src/settings");
const { setItem, getItem } = initializeSettings(app);
const { initSteam } = require("./src/steam");

let win;
let tray;

const Steam = initSteam(app);

async function createWindow() {
  const show = !getItem(IS_WINDOW_HIDDEN);
  win = new BrowserWindow({
    minWidth: 800,
    useContentSize: true,
    show,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "./src/preload.js"),
    },
  });
  // win.webContents.openDevTools();

  win.setMenuBarVisibility(false);

  win.loadFile("./index.html");

  createTray();

  tray.on("click", () => {
    const toggleWindow = () => {
      const windowIsVisible = win.isVisible();
      if (windowIsVisible) {
        win.hide();
        setItem(IS_WINDOW_HIDDEN, true);
      } else {
        win.show();
        setItem(IS_WINDOW_HIDDEN, false);
      }
    };
    toggleWindow();
  });
}

app.whenReady().then(() => {
  createCopyMenu();
  createWindow();
});

ipcMain.on("getSteamGames", (_) => {
  const prefixPaths = Steam.getAllPrefixPaths();

  win.webContents.send(
    "gamesInfo",
    prefixPaths.sort((a, b) => a.name.localeCompare(b.name)),
  );
});

ipcMain.on("openPrefixFolder", (_, path) => {
  shell.showItemInFolder(path);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function createTray() {
  tray = new Tray(path.join(__dirname, "./img/icon.png"));

  tray?.setToolTip("ProtonPrefixes");
}

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

const createCopyMenu = () => {
  ipcMain.handle("show-context-menu", async (event, txt) => {
    const template = [
      {
        label: "Copy",
        click: () => {
          event.sender.send("context-menu-command", txt);
        },
      },
    ];
    const menu = Menu.buildFromTemplate(template);
    menu.popup(BrowserWindow.fromWebContents(event.sender));
  });
};
