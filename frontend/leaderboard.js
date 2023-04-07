var jwt = localStorage.getItem("jwt");
if (jwt == null) {
  window.location.href = "./login.html";
}

function loadLeaderboards() {
    const xhttp = new XMLHttpRequest();
    xhttp.open("GET", "/api/pick");
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.setRequestHeader("Authorization", "Bearer " + jwt);
    xhttp.send();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4) {
          const picks = JSON.parse(this.responseText);
          console.log(picks);
          if (this.status == 200) {
            createTable(picks);
          }
        }
      };
}

function createTable(picks) {
    var headers = ["Username", "Points"];
    var table = document.createElement("table");  //makes a table element for the page
    table.setAttribute("class", "table table-hover");

    var groupedPicks = picks.reduce((x, y) => {
        (x[y.user.email] = x[y.user.email] || []).push(y);
        return x;
    }, {});
    console.log(groupedPicks);
    var i = 0;
    map1.forEach((key, value) => {
       var row = table.insertRow(i);
       row.insertCell(0).innerHTML = key.split("@")[0];
       row.insertCell(1).innerHTML = value.reduce((a, b) => a + b.points || 0, 0);
       i++;
    });

    var header = table.createTHead();
    var headerRow = header.insertRow(0);
    for(var i = 0; i < headers.length; i++) {
        headerRow.insertCell(i).innerHTML = headers[i];
    }
    document.getElementById("card-body").append(table);
}

loadLeaderboards();

function logout() {
  localStorage.removeItem("jwt");
  window.location.href = "./login.html";
}

function to_picks() {
  window.location.href = "./index.html";
}