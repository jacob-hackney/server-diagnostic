import ansi from "ansi-escape-sequences";
import child_process from "child_process";
import { promises as fs } from "fs";
import path from "path";

class ServerHub {
  constructor(useRestarter = false, restartInterval) {
    this.useRestarter = useRestarter;
    this.restartInterval = restartInterval ? restartInterval : 10000;
    if (!useRestarter && restartInterval) {
      throw new Error(
        "Cannot set restart interval without enabling restarter."
      );
    }
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
      throw new Error(
        "Server with the same file path or URL already exists on this hub."
      );
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
          console.log(
            ansi.format(`Server at ${server[1]} has crashed. Restarting...`, [
              "yellow",
            ])
          );
          child_process.exec(`node ${server[0]}`);
          console.log(`Server at ${server[1]} has been restarted.`);
        });
      }
    } else {
      console.error(ansi.format("No servers to check for crash.", ["red"]));
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
