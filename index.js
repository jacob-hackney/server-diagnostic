import child_process from "child_process";
import { promises as fs } from "fs";
import path from "path";

class ServerHub {
  constructor(useRestarter = false) {
    this.useRestarter = useRestarter;
    this.servers = [];
  }
  async addServers(...filePaths) {
    for (let path of filePaths) {
      fs.access(path);
      if (path.extname !== ".js") {
        throw new Error("Invalid file type. Only .js files are allowed.");
      } else {
        this.servers.push(path);
      }
    }
  }
  async removeServers(...filePaths) {
    for (let path of filePaths) {
      fs.access(path);
      this.servers = this.servers.filter((server) => server !== path);
    }
  }
}

export default ServerHub;
