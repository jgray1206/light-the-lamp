var jwt = localStorage.getItem("jwt");
//if (jwt == null) {
  //window.location.href = "./login.html";
//}

function loadGames() {
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/api/game/user");
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.setRequestHeader("Authorization", "Bearer " + jwt);
  xhttp.send();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        const games = JSON.parse(this.responseText);
        console.log(games);
        const xhttp2 = new XMLHttpRequest();
        xhttp2.open("GET", "/api/pick/user");
        xhttp2.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhttp2.setRequestHeader("Authorization", "Bearer " + jwt);
        xhttp2.send();
        xhttp2.onreadystatechange = function () {
          if (this.readyState == 4) {
            if (this.status == 200) {
                const picks = JSON.parse(this.responseText);
                console.log(picks);
                const xhttp3 = new XMLHttpRequest();
                xhttp3.open("GET", "/api/user");
                xhttp3.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                xhttp3.setRequestHeader("Authorization", "Bearer " + jwt);
                xhttp3.send();
                xhttp3.onreadystatechange = function () {
                  if (this.readyState == 4) {
                      if (this.status == 200) {
                        const user = JSON.parse(this.responseText);
                        console.log(user);
                        var sortedGames = games.sort(function(a, b) { return new Date(b.date[0], b.date[1]-1, b.date[2], b.date[3], b.date[4]) - new Date(a.date[0], a.date[1]-1, a.date[2], a.date[3], a.date[4])});
                        var activeGame = sortedGames.toReversed().find((game) => { return game.gameState == "Live" || game.gameState == "Preview" }) || sortedGames[0];
                        sortedGames.forEach((game) => { createTable(game, picks, user, activeGame, sortedGames) });
                      } else if (this.status == 401 || this.status == 403) {
                          localStorage.removeItem("jwt");
                          window.location.href = "./login.html";
                      }
                    }
                };
            } else if (this.status == 401 || this.status == 403) {
                localStorage.removeItem("jwt");
                window.location.href = "./login.html";
            }
          }
        };
      } else if (this.status == 401 || this.status == 403) {
         localStorage.removeItem("jwt");
         window.location.href = "./login.html";
     }
    }
  };
}

function createTable(game, picks, user, activeGame, sortedGames) {
    var teamIsAwayOrHome = game.awayTeam.id == user.team.id ? "away" : "home";
    var gameDate = new Date(game.date[0], game.date[1]-1, game.date[2], game.date[3], game.date[4]);
    var date = new Date();
    var curDateUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
                                     date.getUTCDate(), date.getUTCHours(),
                                     date.getUTCMinutes(), date.getUTCSeconds());
    var pickEnabled = picks.find(pick => pick.game.id == game.id) == undefined && gameDate > curDateUtc;
    var pick = picks.find(pick => pick.game.id == game.id)
    var headers = ["Player", "Position", "Points"];
    if (pickEnabled) { headers.push("Pick"); }

    var gameStringLong = game.date[1] + "-" + game.date[2] + "-" + game.date[0] + ": " + game.homeTeam.teamName + " vs. " + game.awayTeam.teamName;
    var gameStringShort = game.date[1] + "-" + game.date[2] + "-" + game.date[0] + " ";
    if (teamIsAwayOrHome == "away") {
        gameStringShort += "<br/>@ " + game.homeTeam.teamName;
    } else {
       gameStringShort += "<br/>v " + game.awayTeam.teamName;
    }
    createTableHeader(game, pick, user, gameStringShort, activeGame);

    var lastGame = sortedGames.filter(prevGame => prevGame.gameState == "Final" )[0];

    var tableDiv = document.createElement("div");
    if (game == activeGame) {
        tableDiv.setAttribute("class", "table-responsive tab-pane fade active show");
    } else {
        tableDiv.setAttribute("class", "table-responsive tab-pane fade ");
    }
    tableDiv.setAttribute("id", "game"+game.id);
    tableDiv.setAttribute("role", "tabpanel");
    tableDiv.setAttribute("aria-labelledby", game.id + "-tab");
    var table = document.createElement("table");  //makes a table element for the page
    tableDiv.appendChild(table);
    table.setAttribute("class", "table table-hover");
    var caption = table.createCaption();
    caption.innerHTML = gameStringLong;
    caption.setAttribute("class","caption-top");

    var nonGoalies = game.players.filter(player => player.position != "Goalie");

    for(var i = 0; i < nonGoalies.length; i++) {
        var row = table.insertRow(i);
        var id = nonGoalies[i].id.playerId;
        if (pick && pick.gamePlayer && pick.gamePlayer.id.playerId == id) {
            row.className = "table-danger";
        }
        if (!pick && lastGame) {
          var lastGameStats = lastGame.players.find(player => player.id.playerId == id);
          if (lastGameStats && !lastGameStats.timeOnIce) {
            row.className = "table-warning";
          }
        }
        row.insertCell(0).innerHTML = '<figure><img width="90" height="90" class="rounded-circle img-thumbnail" src="https://cms.nhl.bamgrid.com/images/headshots/current/168x168/'+id+'.jpg" onerror=\'this.src="/shrug.png"\'>' + "<figcaption>" + nonGoalies[i].name + "</figcaption></figure>";
        if (nonGoalies[i].position == "Defenseman") {
            row.insertCell(1).innerHTML = "Defense";
        } else {
            row.insertCell(1).innerHTML = nonGoalies[i].position;
        }
        if (pickEnabled) {
            if (nonGoalies[i].position == "Defenseman") {
                row.insertCell(2).innerHTML = "3/goal, 1/assist, *2/shorty";
            } else if (nonGoalies[i].position == "Forward") {
                row.insertCell(2).innerHTML = "2/goal, 1/assist, *2/shorty";
            }
            row.insertCell(3).innerHTML = '<button type="button" class="btn btn-primary" onclick="doPick(this,'+game.id+',\''+nonGoalies[i].name+'\')">Pick</button>'
        } else {
            if (nonGoalies[i].position == "Defenseman") {
                row.insertCell(2).innerHTML = (nonGoalies[i].goals || 0)*3 + (nonGoalies[i].assists || 0) + (nonGoalies[i].shortGoals || 0)*6 + (nonGoalies[i].shortAssists || 0)*2;
            } else if (nonGoalies[i].position == "Forward") {
                row.insertCell(2).innerHTML = (nonGoalies[i].goals || 0)*2 + (nonGoalies[i].assists || 0) + (nonGoalies[i].shortGoals || 0)*4 + (nonGoalies[i].shortAssists || 0)*2;
            }
        }
    }

    var goalies = game.players.filter(player => player.position == "Goalie");
    var row = table.insertRow(nonGoalies.length);
    if (pick && pick.goalies != undefined) {
        row.className = "table-danger";
    }
    var goalieImages = goalies.map(player => '<img width="90" height="90" class="rounded-circle img-thumbnail" onerror=\'this.src="/shrug.png"\' src="https://cms.nhl.bamgrid.com/images/headshots/current/168x168/'+player.id.playerId+'.jpg">').join("");
    row.insertCell(0).innerHTML = "<figure>" + goalieImages + "<figcatpion>The Goalies</figcatpion></figure>";
    row.insertCell(1).innerHTML = "Goalie";
    if (pickEnabled) {
        row.insertCell(2).innerHTML = "5/shutout, 2/single-goal game";
        row.insertCell(3).innerHTML = '<button type="button" class="btn btn-primary" onclick="doPick(this,'+game.id+',\'goalies\')">Pick</button>'
    } else {
        var goals = goalies.reduce((a, b) => a + (b.goalsAgainst || 0), 0);
        if (goals > 1) {
            row.insertCell(2).innerHTML = 0;
        } else if (goals > 0) {
            row.insertCell(2).innerHTML = 2;
        } else {
            row.insertCell(2).innerHTML = 5;
        }

    }

    var row = table.insertRow(nonGoalies.length+1);
    if (pick && pick.team != undefined) {
        row.className = "table-danger";
    }
    row.insertCell(0).innerHTML = "<figure><figcatpion>The Detroit Red Wings!</figcatpion></figure>";
    row.insertCell(1).innerHTML = "Team";
    if (pickEnabled) {
        row.insertCell(2).innerHTML = "5/5+ goal game, 4/4 goal game";
        row.insertCell(3).innerHTML = '<button type="button" class="btn btn-primary" onerror=\'this.src="/shrug.png"\' onclick="doPick(this,'+game.id+',\'team\')">Pick</button>';
    } else {
        var goals = teamIsAwayOrHome == "home" ? game.homeTeamGoals : game.awayTeamGoals;
        if ((goals || 0) >= 5) {
             row.insertCell(2).innerHTML = 5;
        } else if ((goals || 0) >= 4) {
            row.insertCell(2).innerHTML = 4;
        } else {
            row.insertCell(2).innerHTML = 0;
        }
    }

    var header = table.createTHead();
    var headerRow = header.insertRow(0);
    for(var i = 0; i < headers.length; i++) {
        var cell = headerRow.insertCell(i)
        cell.outerHTML = "<th scope=\"col\">"+headers[i]+"</th>";
    }
    document.getElementById("tabContent").append(tableDiv);
}

function createTableHeader(game, pick, user, gameString, activeGame) {
    var headerLi = document.createElement("li");
    headerLi.setAttribute("class", "nav-item");
    headerLi.setAttribute("role", "presentation");

    var headerButton = document.createElement("button");
    var classString = "nav-link ";
    if (game == activeGame) {
        headerButton.setAttribute("aria-selected", "true");
        classString += " active";
    } else {
        headerButton.setAttribute("aria-selected", "false");
    }
    if (pick && game.gameState != "Final") {
        classString += " text-danger"
    } else if (game.gameState != "Final") {
        classString += " text-success"
    } else if (game.gameState == "Final") {
        classString += " text-secondary"
    }
    headerButton.setAttribute("class", classString);
    headerButton.setAttribute("role", "tab");
    headerButton.setAttribute("data-bs-toggle", "tab");
    headerButton.setAttribute("data-bs-target", "#game"+game.id);
    headerButton.setAttribute("id", "tab" + game.id);
    headerButton.setAttribute("aria-controls", "game"+game.id);
    headerButton.innerHTML = gameString;

    headerLi.appendChild(headerButton);
    document.getElementById("tabHeader").append(headerLi);

}

function doPick(elem, gameId, pick) {
    var message = ""
    if (elem.parentNode.parentNode.classList.contains("table-warning")) {
        message = pick + " had no time-on-ice the previous game! Are you sure you want to pick them? You can't change a pick once locked in!";
    } else {
        message = "Are you sure you want to pick " + pick + "? You can't change a pick once locked in!";
    }
    Swal.fire({
        text: message,
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
          if (this.status == 200) {
              const objects = JSON.parse(this.responseText);
              console.log(objects);
              window.location.href = "./index.html";
          } else if (this.status == 401 || this.status == 403) {
              localStorage.removeItem("jwt");
              window.location.href = "./login.html";
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

function to_leaderboard() {
  window.location.href = "./leaderboard.html";
}