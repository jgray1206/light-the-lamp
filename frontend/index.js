var jwt = localStorage.getItem("jwt");
if (jwt == null) {
  window.location.href = "./login.html";
}

function loadGames() {
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/api/game/user");
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.setRequestHeader("Authorization", "Bearer " + jwt);
  xhttp.send();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      const games = JSON.parse(this.responseText);
      console.log(games);
      if (this.status == 200) {
        const xhttp2 = new XMLHttpRequest();
        xhttp2.open("GET", "/api/pick/user");
        xhttp2.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhttp2.setRequestHeader("Authorization", "Bearer " + jwt);
        xhttp2.send();
        xhttp2.onreadystatechange = function () {
          if (this.readyState == 4) {
            const picks = JSON.parse(this.responseText);
            console.log(picks);
            const xhttp3 = new XMLHttpRequest();
            xhttp3.open("GET", "/api/user");
            xhttp3.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xhttp3.setRequestHeader("Authorization", "Bearer " + jwt);
            xhttp3.send();
            xhttp3.onreadystatechange = function () {
              if (this.readyState == 4) {
                  const user = JSON.parse(this.responseText);
                  console.log(user);
                  if (this.status == 200) {
                    games.sort(function(a, b) { return new Date(b.date[0], b.date[1]-1, b.date[2], b.date[3], b.date[4]) - new Date(a.date[0], a.date[1]-1, a.date[2], a.date[3], a.date[4])})
                                        .forEach((game) => { createTable(game, picks, user) });
                  }
                }
              };
          }
        };
      }
    }
  };
}

function createTable(game, picks, user) {
    var teamIsAwayOrHome = game.awayTeam.id == user.team.id ? "away" : "home";
    var gameDate = new Date(game.date[0], game.date[1]-1, game.date[2], game.date[3], game.date[4]);
    var date = new Date();
    var curDateUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
                                     date.getUTCDate(), date.getUTCHours(),
                                     date.getUTCMinutes(), date.getUTCSeconds());
    console.log(gameDate);
    console.log(curDateUtc);
    var pickEnabled = picks.find(pick => pick.game.id == game.id) == undefined && gameDate > curDateUtc;
    var pick = picks.find(pick => pick.game.id == game.id)

    var headers = ["Picture", "Name", "Position", "Points"];
    if (pickEnabled) { headers.push("Pick"); }

    var table = document.createElement("table");  //makes a table element for the page
    table.setAttribute("class", "table table-hover");
    var caption = table.createCaption();
    caption.innerHTML = game.date[1] + "-" + game.date[2] + "-" + game.date[0] + ": " + game.homeTeam.teamName + " vs. " + game.awayTeam.teamName;
    caption.setAttribute("class","caption-top");

    var nonGoalies = game.players.filter(player => player.position != "Goalie");

    for(var i = 0; i < nonGoalies.length; i++) {
        var row = table.insertRow(i);
        var id = nonGoalies[i].id.playerId;
        row.insertCell(0).innerHTML = '<img width="90" height="90" class="rounded-circle img-thumbnail" src="https://cms.nhl.bamgrid.com/images/headshots/current/168x168/'+id+'.jpg" onerror=\'this.src="/shrug.png"\'>';
        row.insertCell(1).innerHTML = nonGoalies[i].name;
        row.insertCell(2).innerHTML = nonGoalies[i].position;
        if (pickEnabled) {
            if (nonGoalies[i].position == "Defenseman") {
                row.insertCell(3).innerHTML = "2 per goal, 1 per assist";
            } else if (nonGoalies[i].position == "Forward") {
                row.insertCell(3).innerHTML = "1 per goal, 1 per assist";
            }
            row.insertCell(4).innerHTML = '<button type="button" class="btn btn-primary" onclick="doPick('+game.id+',\''+nonGoalies[i].name+'\')">Pick</button>'
        } else {
            if (nonGoalies[i].position == "Defenseman") {
                row.insertCell(3).innerHTML = (nonGoalies[i].goals || 0)*2 + (nonGoalies[i].assists || 0);
            } else if (nonGoalies[i].position == "Forward") {
                row.insertCell(3).innerHTML = (nonGoalies[i].goals || 0) + (nonGoalies[i].assists || 0);
            }
        }
    }

    var goalies = game.players.filter(player => player.position == "Goalie");
    var row = table.insertRow(nonGoalies.length);
    var goalieImages = goalies.map(player => '<img width="90" height="90" class="rounded-circle img-thumbnail" onerror=\'this.src="/shrug.png"\' src="https://cms.nhl.bamgrid.com/images/headshots/current/168x168/'+player.id.playerId+'.jpg">').join("");
    row.insertCell(0).innerHTML = goalieImages;
    row.insertCell(1).innerHTML = "The Goalies";
    row.insertCell(2).innerHTML = "Goalie";
    if (pickEnabled) {
        row.insertCell(3).innerHTML = "5 for a shutout, 2 for a single-goal game";
        row.insertCell(4).innerHTML = '<button type="button" class="btn btn-primary" onclick="doPick('+game.id+',\'goalies\')">Pick</button>'
    } else {
        var goals = goalies.reduce((a, b) => a + b.goalsAgainst, 0);
        if (goals > 1) {
            row.insertCell(3).innerHTML = 0;
        } else if (goals > 0) {
            row.insertCell(3).innerHTML = 2;
        } else {
            row.insertCell(3).innerHTML = 5;
        }

    }

    var row = table.insertRow(nonGoalies.length+1);
    row.insertCell(0).innerHTML = "The Detroit Red Wings!";
    row.insertCell(1).innerHTML = "The Team";
    row.insertCell(2).innerHTML = "Team";
    if (pickEnabled) {
        row.insertCell(3).innerHTML = "5 for a 6+ goal game, 2 for a 4/5 goal game";
        row.insertCell(4).innerHTML = '<button type="button" class="btn btn-primary" onerror=\'this.src="/shrug.png"\' onclick="doPick('+game.id+',\'team\')">Pick</button>';
    } else {
        var goals = teamIsAwayOrHome == "home" ? game.homeTeamGoals : game.awayTeamGoals;
        console.log(goals);
        if ((goals || 0) >= 6) {
             row.insertCell(3).innerHTML = 5;
        } else if ((goals || 0) >= 4) {
            row.insertCell(3).innerHTML = 2;
        } else {
            row.insertCell(3).innerHTML = 0;
        }
    }

    var header = table.createTHead();
    var headerRow = header.insertRow(0);
    for(var i = 0; i < headers.length; i++) {
        headerRow.insertCell(i).innerHTML = headers[i];
    }
    document.getElementById("card-body").append(table);
}

function doPick(gameId, pick) {
    Swal.fire({
        text: "Are you sure you want to pick " + pick + "? You can't change a pick once locked in!",
        icon: "warning",
        confirmButtonText: "OK",
    }).then((result) => {
    const xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/api/pick/user?gameId="+gameId+"&pick="+pick);
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.setRequestHeader("Authorization", "Bearer " + jwt);
    xhttp.send();
    xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      const objects = JSON.parse(this.responseText);
      console.log(picks);
      if (this.status == 200) {
          window.location.href = "./index.html";
      } else {
        Swal.fire({
          text: objects["_embedded"]["errors"][0]["message"] || objects["message"],
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  };
  });
}

loadGames();

function logout() {
  localStorage.removeItem("jwt");
  window.location.href = "./login.html";
}