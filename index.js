import express from "express";
import open from "open";

import child_process from "child_process";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import EventEmitter from "events";

class ServerHub extends EventEmitter {
  constructor(useRestarter = false, restartInterval) {
    super();
    this.useRestarter = useRestarter;
    this.restartInterval = restartInterval ? restartInterval : 10000;
    this.servers = [];
    this.#initialize();
  }

  async addServer(filePath, url) {
    if (path.extname(filePath) !== ".js") {
      filePath += ".js";
    }
    await fs.access(filePath);
    const newServer = [filePath, url];
    let exists = false;
    if (this.servers) {
      for (let server of this.servers) {
        if (server[0] === filePath || server[1] === url) {
          exists = true;
          break;
        }
      }
    }
    if (!exists) {
      this.servers.push(newServer);
    } else {
      this.emit("error", "Server already exists.");
    }
    return this;
  }

  async removeServer(filePath) {
    await fs.access(filePath);
    this.servers = this.servers.filter((server) => server[0] !== filePath);
    return this;
  }

  openDiagnosticWindow(port) {
    const app = express();
    const publicPath = resolve(this.#__dirname, "diagnostics");

    app.use("/", express.static(publicPath));

    app.get("/", (req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.send(
        `<a href="http://localhost:${port}/diagnostics.html">Go to diagnostics</a>`
      );
    });
    app.get("/servers", (req, res) => {
      res.json(this.servers);
    });

    app.listen(port, () => open(`http://localhost:${port}/diagnostics.html`));
  }

  getServers() {
    return this.servers;
  }

  #initialize() {
    if (this.useRestarter) {
      setInterval(this.#checkServerCrash.bind(this), this.restartInterval);
    }
  }

  async #checkServerCrash() {
    if (this.servers) {
      for (let server of this.servers) {
        await fetch(`${server[1]}/testpath`).catch(() => {
          let url = server[1];
          this.emit("crash", url);
          child_process.exec(`node ${server[0]}`);
          this.emit("restart", url);
        });
      }
    } else {
      this.emit("error", "No servers to check for crash.");
    }
  }

  #__dirname = dirname(fileURLToPath(import.meta.url));
}

export default ServerHub;
