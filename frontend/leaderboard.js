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

    for(var i = 0; i < picks.length; i++) {
        var row = table.insertRow(i);
        row.insertCell(0).innerHTML = picks[i].user.email.split("@")[0];
        row.insertCell(1).innerHTML = picks[i].points;
    }

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