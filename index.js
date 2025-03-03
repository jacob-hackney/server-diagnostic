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
    fs.access(filePath);
    if (path.extname(filePath) !== ".js") {
      throw new Error("Invalid file type. Only .js files are allowed.");
    } else {
      this.servers.push([filePath, url]);
    }
    return this;
  }
  async removeServers(filePath) {
    fs.access(filePath);
    this.servers = this.servers.filter((server) => server[0] !== filePath);
  }
  #initialize() {
    for (let server of this.servers) {
      child_process.exec(`node ${server}`);
    }
    if (this.useRestarter) {
      setInterval(this.#checkServerCrash, this.restartInterval);
    }
  }
  async #checkServerCrash() {
    for (let server of this.servers) {
      const response = await fetch(`${server[1]}/testpath`);
      if (!response.ok) {
        console.warn(`Server at ${server[1]} has crashed. Restarting...`);
        child_process
          .exec(`node ${server[0]}`)
          .then(() =>
            console.log(`Server at ${server[1]} has been restarted.`)
          );
      }
    }
  }
}

export default ServerHub;
