
const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

async function createWindow() {
  if (!process.env.DB_PATH) {
    const userDataDir = app.getPath("userData");
    const persistentDb = path.join(userDataDir, "mg_online_data.sqlite");

    try {
      const projectDb = path.join(__dirname, "..", "backend", "data.sqlite");
      if (!fs.existsSync(persistentDb) && fs.existsSync(projectDb)) {
        fs.mkdirSync(userDataDir, { recursive: true });
        fs.copyFileSync(projectDb, persistentDb);
      }
    } catch {
    }

    process.env.DB_PATH = persistentDb;
  }

  const port = process.env.PORT || "8787";
  const serverMod = await import(path.join(__dirname, "..", "backend", "server.js"));
  await serverMod.startServer(parseInt(port, 10));

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: "#0b0b10",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  await win.loadURL(`http://localhost:${port}/`);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
