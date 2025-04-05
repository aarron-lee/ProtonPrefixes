const path = require("path");
const fs = require("fs");
const glob = require("glob");
const { parse } = require("@node-steam/vdf");
const steamBinaryVdf = require("steam-binary-vdf");

function readVdf(path, encoding = "utf8") {
  try {
    if (fs.existsSync(path)) {
      const rawData = fs.readFileSync(path, encoding);

      const settings = parse(rawData);

      return settings;
    }
  } catch (e) {
    console.error(e);
  }
  return {};
}

function findACFFiles(directory) {
  const pattern = path.join(directory, "**", "*.acf");

  try {
    const files = glob.sync(pattern);
    return files;
  } catch (err) {
    console.error("Error occurred while searching for *.acf files:", err);
    return [];
  }
}

function initSteam(app) {
  const HOME_DIR = app.getPath("home");
  const STEAMAPP_PATHS = getSteamAppPaths();

  function getConfigData() {
    const VDF_PATH = `${HOME_DIR}/.steam/steam/config/config.vdf`;

    console.log(VDF_PATH);

    console.log(readVdf(VDF_PATH));
  }

  function getLibraryPaths() {
    const VDF_PATH = `${HOME_DIR}/.steam/steam/config/libraryfolders.vdf`;

    const r = readVdf(VDF_PATH);
    const { libraryfolders } = r;

    const paths = [];

    Object.values(libraryfolders).forEach((folder) => paths.push(folder.path));

    return paths;
  }

  function getSteamAppPaths() {
    const libraryPaths = getLibraryPaths();

    const paths = [];

    libraryPaths.forEach((path) => {
      const steamAppPath = `${path}/steamapps`;
      try {
        if (fs.existsSync(steamAppPath)) {
          paths.push(steamAppPath);
        }
      } catch (e) {
        console.error(e);
      }
    });

    return paths;
  }

  function getInstalledAppData(excludeProton = true) {
    let acfFiles = [];

    STEAMAPP_PATHS.forEach((path) => {
      const foundFiles = findACFFiles(path);

      if (foundFiles.length > 0) {
        acfFiles = acfFiles.concat(foundFiles);
      }
    });

    const appData = [];

    acfFiles.forEach((f) => {
      const info = readVdf(f);
      if (info.AppState) {
        if (info.AppState.name.includes("Proton") && excludeProton) {
          return;
        }
        appData.push(info);
      }
    });

    return appData;
  }

  function getShortcutsPath() {
    const pattern = path.join(
      HOME_DIR,
      ".steam/steam/userdata/*/config/shortcuts.vdf",
    );

    const files = glob.sync(pattern);

    if (files.length === 0) {
      console.log("No matching files found.");
      return;
    } else {
      // console.log("Matching shortcuts.vdf file:", files);
      return files[0];
    }
  }

  function getNonSteamAppData() {
    const p = getShortcutsPath();
    if (!p) {
      return;
    }

    let shortcutData;

    try {
      if (fs.existsSync(p)) {
        const rawData = fs.readFileSync(p);

        shortcutData = steamBinaryVdf.readVdf(rawData);
      }
    } catch (e) {
      console.error(e);
    }

    return Object.values(shortcutData.shortcuts);
  }

  function getAllPrefixPaths() {
    const steamAppData = getInstalledAppData();
    const nonSteamAppData = getNonSteamAppData();

    const allAppInfo = [];

    steamAppData.forEach((app) => {
      const {
        AppState: { name, appid },
      } = app;

      const prefixPath = `${HOME_DIR}/.steam/steam/steamapps/compatdata/${appid}`;

      try {
        if (fs.existsSync(prefixPath)) {
          allAppInfo.push({
            name,
            appid,
            prefixPath,
            details: app,
          });
        }
      } catch (e) {
        console.error(e);
      }
    });

    nonSteamAppData.forEach((app) => {
      const { appid, AppName } = app;

      const prefixPath = `${HOME_DIR}/.steam/steam/steamapps/compatdata/${appid}`;

      try {
        if (fs.existsSync(prefixPath)) {
          allAppInfo.push({
            name: AppName,
            appid,
            prefixPath,
            details: app,
          });
        }
      } catch (e) {
        console.error(e);
      }
    });

    return allAppInfo;
  }

  return {
    getAllPrefixPaths,
  };
}
module.exports = { initSteam };
