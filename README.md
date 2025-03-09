# server-diagnostic

[https://www.npmjs.com/package/server-diagnostic](https://www.npmjs.com/package/server-diagnostic) \
[https://github.com/jacob-hackney/server-diagnostic](https://github.com/jacob-hackney/server-diagnostic)

## Installation

```sh
npm install server-diagnostic --save
```

## Usage

First, you have to import the library and create an instance of the ServerHub class:

```js
const ServerHub = require("server-diagnostic");
// or import ServerHub from 'server-diagnostic';
const myHub = new ServerHub();
```

### Class constructor

There are two optional parameters for the ServerHub constructor:

- useRestarter (boolean, default false)
- restartInterval (integer, default 10000)
  If useRestarter is set to false, you cannot specify a value for restartInterval. When useRestarter is enabled, the servers added to the hub will automatically restart if they crash every \[restartInterval\] milliseconds.

### Add server method

This method will save a server to the hub you created. It has two parameters:

- filePath (string/null)
- url (string)
  Example:

```js
const myHub = new ServerHub();
myHub.addServer("server.js", "http://localhost:3000").then(() => {
  //rest of code
});
```

```js
const myHub = new ServerHub();
myHub
  .addServer("server.js", "http://localhost:3000")
  .otherServerHubMethod(/*params*/);
```

**The server added must have a /testpath route or respond to any request. The ServerHub class will not test if the given server meets the requirements.**

### Remove server method

This is just the opposite of the addServer method. There is not a URL parameter, just a filePath parameter for this method. \
Example:

```js
myHub.addServer("server.js", "http://localhost:3000");
myHub.removeServer("server.js");
```

### Open diagnostic window method

This method will open a new tab in your default browser and updates the following diagnostics in real-time:

- The URL(italicized)
- Status(Online/Offline)
- Your ping to it
  This method is simple enough, with no parameters:

```js
myHub.openDiagnosticWindow();
```

### Get servers method

This method will return an array of all of the servers currently stored in your hub:

```js
const myHub = new ServerHub();

myHub.addServer("server.js", "http://localhost:3000");
myHub.addServer("server2.js", "http://localhost:3001");

console.log(myHub.getServers);
```

## Dependencies

- express @4.21.2
- open @10.1.0

## Credits

This whole library was created by Jacob Hackney.
