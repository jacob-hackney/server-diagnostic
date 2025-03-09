import ansi from "ansi-escape-sequences";
import child_process from "child_process";
import { promises as fs } from "fs";
import path from "path";
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

  async logDiagnostics() {
    console.log(ansi.format("[SERVER DIAGNOSTIC LOG]", ["bold", "cyan"]));
    for (let server of this.servers) {
      await this.#logSingleServerDiagnostic(server);
      console.log(ansi.format("-".repeat(50), ["bold", "cyan"]));
    }
    return this;
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

  async #logSingleServerDiagnostic(server) {
    console.log(ansi.format(server[1], ["italic"]));
    const start = performance.now();
    try {
      await fetch(`${server[1]}/testpath`)
        .catch(() => {
          throw new Error("skip to catch block");
        })
        .then(() => {
          const end = performance.now();
          const ping = end - start;
          process.stdout.write("Status:");
          console.log(ansi.format("Online", ["green", "bold"]));
          process.stdout.write("Ping:");
          if (ping < 100) {
            console.log(ansi.format(`${ping} ms`, ["green", "bold"]));
          } else if (ping < 200) {
            console.log(ansi.format(`${ping} ms`, ["yellow", "bold"]));
          } else {
            console.log(ansi.format(`${ping} ms`, ["red", "bold"]));
          }
        });
    } catch {
      process.stdout.write("Status:");
      console.log(ansi.format("Offline", ["red", "bold"]));
      process.stdout.write("Ping:");
      console.log(ansi.format("N/A", ["magenta", "bold"]));
    }
  }
}

export default ServerHub;
