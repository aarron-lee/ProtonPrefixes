document.addEventListener("DOMContentLoaded", async () => {
  electronUtils.getSteamGames();
});

electronUtils.receive("gamesInfo", (data) => {
  const gameNames = document.getElementById("gamesList");

  // initialize appInfo with first entry
  updateAppInfo(data[0].name, data[0]);

  data.forEach((gameInfo) => {
    const { name, appid, prefixPath } = gameInfo;

    const game = document.createElement("button");

    game.innerHTML = name;
    game.setAttribute(
      "style",
      `
          text-transform: capitalize;
          padding: 1rem;
          border: 1px solid black;
        `,
    );

    game.addEventListener("click", () => {
      updateAppInfo(name, gameInfo);
    });

    gameNames.appendChild(game);
  });
});

function updateAppInfo(name, info) {
  const el = document.getElementById("gameInfo");
  el.setAttribute("style", `padding-left: 1rem;`);

  el.innerHTML = generateDescription(name, info);

  const openPathButton = document.createElement("button");

  openPathButton.innerHTML = "Open Prefix in File Browser";

  openPathButton.addEventListener("click", (e) => {
    electronUtils.openPrefixFolder(`${info.prefixPath}/pfx/drive_c`);
  });

  openPathButton.setAttribute(
    "style",
    `
        text-transform: capitalize;
        padding: 1rem;
        border: 1px solid black;
      `,
  );

  el.appendChild(openPathButton);
}

function generateDescription(name, appInfo) {
  return `
    <h2 style="text-transform: capitalize;">${name}</h2>

    <h3>App ID:</h3>
    <p>${appInfo.appid}</p>
    <h3>Prefix Path:</h3>
    <p>${appInfo.prefixPath}</p>
`;
}

window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  electronUtils.showContextMenu(window.getSelection().toString());
});

window.electronUtils.receive("context-menu-command", (data) => {
  navigator.clipboard.writeText(data);
});
