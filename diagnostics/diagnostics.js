setInterval(getDiagnostics, 500);
let isFetching = false;

async function getDiagnostics() {
  if (isFetching) return;
  isFetching = true;
  try {
    const response = await fetch(
      `${window.location.protocol}//${window.location.hostname}:${window.location.port}/servers`
    );
    const servers = await response.json();
    isFetching = false;
    document.querySelector("#connected-to-hub").innerHTML = "";
    await updateTable(servers);
  } catch (error) {
    console.error(error);
    isFetching = false;
    document.querySelector("#connected-to-hub").innerHTML =
      "<strong>Lost connection to hub!</strong>";
  }
}

async function updateTable(servers) {
  const table = document.querySelector("tbody");
  if (servers) {
    for (const server of servers) {
      let row = document.getElementById(`server-${server[1]}`);
      if (!row) {
        row = createRow(server[1], "Checking", "N/A");
        table.appendChild(row);
      }

      try {
        const start = performance.now();
        await fetch(server[1]);
        const end = performance.now();
        const ping = end - start;
        updateRow(row, "Online", ping);
      } catch (error) {
        updateRow(row, "Offline", "N/A");
      }
    }
  }
}

function updateRow(row, status, ping) {
  row.querySelector(".status").innerHTML = `<strong>${status}</strong>`;
  row.querySelector(".ping").innerHTML = ping;
  row.querySelector(".status").style.color =
    status === "Online" ? "green" : "red";
  row.querySelector(".ping").style.color = getPingColor(ping);
}

function createRow(address, status, ping) {
  const newRow = document.createElement("tr");
  newRow.id = `server-${address}`;
  newRow.innerHTML = `
    <td class="address">${address}</td>
    <td class="status"><strong>${status}</strong></td>
    <td class="ping">${ping}</td>
  `;
  newRow.querySelector(".status").style.color =
    status === "Online" ? "green" : "red";
  newRow.querySelector(".ping").style.color = getPingColor(ping);
  return newRow;
}

function getPingColor(ping) {
  if (ping === "N/A") return "magenta";
  if (ping < 100) return "green";
  if (ping < 200) return "orange";
  return "red";
}
