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
          if (this.status == 200) {
              const picks = JSON.parse(this.responseText);
              console.log(picks);
              createTable(picks);
          } else if (this.status == 401 || this.status == 403) {
              localStorage.removeItem("jwt");
              window.location.href = "./login.html";
          }
        }
      };
}

function createTable(picks) {
    var headers = ["Username", "Points"];
    var table = document.createElement("table");  //makes a table element for the page
    table.setAttribute("class", "table table-hover");

    var groupedPicks = Object.entries(picks.reduce((x, y) => {
        (x[y.user.email] = x[y.user.email] || []).push(y);
        return x;
    }, {}))
        .map( pick => pick[1] = pick[1].reduce((a, b) => a + (b.points || 0), 0));

    console.log(groupedPicks);
    var i = 0;
    //groupedPicks
    //.sort((aKey, bKey) => groupedPicks[bKey].reduce((a, b) => a + (b.points || 0), 0) - groupedPicks[aKey].reduce((a, b) => a + (b.points || 0), 0) )
    //.forEach( key =>{
    //   var row = table.insertRow(i);
    //   row.insertCell(0).innerHTML = key.split("@")[0];
    //   row.insertCell(1).innerHTML = groupedPicks[key].reduce((a, b) => a + (b.points || 0), 0);
    //   i++;
    //});

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