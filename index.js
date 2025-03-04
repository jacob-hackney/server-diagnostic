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
    this.#initialize();
  }
  async addServer(filePath, url) {
    if (path.extname(filePath) !== ".js") {
      filePath += ".js";
    } else {
      await fs.access(filePath);
      const server = [filePath, url];
      let exists = false;
      for (let server of this.#servers) {
        if (server[0] === filePath) {
          exists = true;
          break;
        }
        if (server[1] === url) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        this.#servers.push(server);
      } else {
        throw new Error(
          "Server with the same file path or URL already exists on this hub."
        );
      }
    }
    return this;
  }
  async removeServer(filePath) {
    await fs.access(filePath);
    this.#servers = this.servers.filter((server) => server[0] !== filePath);
    return this;
  }
  async logDiagnostics() {
    console.log(ansi.format("[SERVER DIAGNOSTIC LOG]", ["bold", "cyan"]));
    for (let server of this.#servers) {
      await this.#logSingleServerDiagnostic(server);
      console.log(ansi.format("-".repeat(50), ["bold", "cyan"]));
    }
    return this;
  }
  getServers() {
    return this.#servers;
  }
  #initialize() {
    for (let server of this.#servers) {
      child_process.exec(`node ${server[0]}`);
    }
    if (this.useRestarter) {
      setInterval(this.#checkServerCrash(), this.restartInterval);
    }
  }
  async #checkServerCrash() {
    for (let server of this.#servers) {
      fetch(`${server[1]}/testpath`).catch(() => {
        console.warn(`Server at ${server[1]} has crashed. Restarting...`);
        child_process
          .exec(`node ${server[0]}`)
          .then(() =>
            console.log(`Server at ${server[1]} has been restarted.`)
          );
      });
    }
  }
  async #logSingleServerDiagnostic(server) {
    console.log(ansi.format(server[1], ["italic"]));
    const start = performance.now();
    try {
      await fetch(`${server[1]}/testpath`).catch(() => {
        throw new Error("skip to catch block");
      });
      const end = performance.now();
      const ping = end - start;
      process.stdout.write("Status: ");
      console.log(ansi.format("Online", ["green", "bold"]));
      process.stdout.write("Ping: ");
      if (ping < 100) {
        console.log(ansi.format(`${ping} ms`, ["green", "bold"]));
      } else if (ping < 200) {
        console.log(ansi.format(`${ping} ms`, ["yellow", "bold"]));
      } else {
        console.log(ansi.format(`${ping} ms`, ["red", "bold"]));
      }
    } catch {
      process.stdout.write("Status: ");
      console.log(ansi.format("Offline", ["red", "bold"]));
      process.stdout.write("Ping: ");
      console.log(ansi.format("N/A", ["magenta", "bold"]));
    }
  }
  #servers = [];
}

export default ServerHub;
