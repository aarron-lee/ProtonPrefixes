const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronUtils", {
  getSteamGames: () => ipcRenderer.send("getSteamGames"),
  // From frontend to backend.
  send: (channel, args) => {
    ipcRenderer.send(channel, args);
  },
  // From backend to frontend.
  receive: (channel, listener) => {
    ipcRenderer.on(channel, (event, ...args) => listener(...args));
  },
  // From backend to frontend and back again.
  invoke: (channel, args) => ipcRenderer.invoke(channel, args),
  showContextMenu: async (txt) =>
    await ipcRenderer.invoke("show-context-menu", txt),
});
