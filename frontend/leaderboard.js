function loadLeaderboards() {
    const xhttp = new XMLHttpRequest();
    xhttp.open("GET", "/api/pick");
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.setRequestHeader("Authorization", "Bearer " + jwt);
    xhttp.send();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4) {
          if (this.status == 200) {
              var picks = JSON.parse(this.responseText);
              var groupBy = function(xs, key) {
                return xs.reduce(function(rv, x) {
                  (rv[x[key]['id']] = rv[x[key]['id']] || []).push(x);
                  return rv;
                }, {});
              };
              picks = groupBy(picks, 'team')
              Object.keys(picks).forEach(function(key) {
                console.log('Key : ' + key + ', Value : ' + picks[key])
              })
              createTableHeaderForTeam(team, index);
              var teamContentDiv = document.createElement("div");
              if (index == 0) {
                 teamContentDiv.setAttribute("class", "tab-pane fade active show");
              } else {
                 teamContentDiv.setAttribute("class", "tab-pane fade");
              }
              teamContentDiv.setAttribute("id", "team"+team.id);
              teamContentDiv.setAttribute("role", "tabpanel");
              teamContentDiv.setAttribute("aria-labelledby", "tab"+team.id);

              var teamTabHeader = document.createElement("ul");
              teamTabHeader.setAttribute("class", "nav nav-tabs text-nowrap flex-nowrap");
              teamTabHeader.setAttribute("style", "overflow-x: auto; overflow-y: hidden;");
              teamTabHeader.setAttribute("id", "teamTabHeader-"+team.id);
              teamTabHeader.setAttribute("role", "tablist");
              var gameTabContent = document.createElement("div");
              gameTabContent.setAttribute("class", "tab-content");
              gameTabContent.setAttribute("id", "gameTabContent-"+team.id);
              teamContentDiv.append(teamTabHeader);
              teamContentDiv.append(gameTabContent);
              createTable(picks);
          } else if (this.status == 401 || this.status == 403) {
              localStorage.removeItem("jwt");
              window.location.href = "./login.html";
          }
        }
      };
}

function createTable(picks) {
    var headers = ["User", "Points"];
    var table = document.createElement("table");  //makes a table element for the page
    table.setAttribute("class", "table table-hover");

    var groupedPicks = Object.entries(picks.reduce((x, y) => {
        (x[y.user.email] = x[y.user.email] || []).push(y);
        return x;
    }, {}))
        .map( pick => {
            pick[2] = pick[1][0].user.displayName;
            pick[1] = pick[1].reduce((a, b) => a + (b.points || 0), 0);
            return pick;
        })
        .sort((aPick, bPick) => bPick[1] - aPick[1]);

    console.log(groupedPicks);
    var i = 0;
    groupedPicks
    .forEach( pick =>{
       var row = table.insertRow(i);
       if (pick[2]) {
           row.insertCell(0).innerHTML = pick[2];
       } else {
           row.insertCell(0).innerHTML = pick[0].split("@")[0];
       }
       row.insertCell(1).innerHTML = pick[1];
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
