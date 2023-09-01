function loadGames() {
  document.getElementById("teamsTabContent").innerHTML = "";
  document.getElementById("teamsTabHeader").innerHTML = "";
  var seasonDropdown = document.getElementById("season");
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/api/game/user?season=" + seasonDropdown.value);
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.setRequestHeader("Authorization", "Bearer " + jwt);
  xhttp.send();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        const games = JSON.parse(this.responseText).sort(function (a, b) {
          return (
            new Date(
              b.date[0],
              b.date[1] - 1,
              b.date[2],
              b.date[3],
              b.date[4]
            ) -
            new Date(a.date[0], a.date[1] - 1, a.date[2], a.date[3], a.date[4])
          );
        });
        console.log(games);
        const xhttp2 = new XMLHttpRequest();
        xhttp2.open("GET", "/api/pick/user?season=" + seasonDropdown.value);
        xhttp2.setRequestHeader(
          "Content-Type",
          "application/json;charset=UTF-8"
        );
        xhttp2.setRequestHeader("Authorization", "Bearer " + jwt);
        xhttp2.send();
        xhttp2.onreadystatechange = function () {
          if (this.readyState == 4) {
            if (this.status == 200) {
              const picks = JSON.parse(this.responseText);
              console.log(picks);
              const xhttp3 = new XMLHttpRequest();
              xhttp3.open("GET", "/api/user");
              xhttp3.setRequestHeader(
                "Content-Type",
                "application/json;charset=UTF-8"
              );
              xhttp3.setRequestHeader("Authorization", "Bearer " + jwt);
              xhttp3.send();
              xhttp3.onreadystatechange = function () {
                if (this.readyState == 4) {
                  if (this.status == 200) {
                    const user = JSON.parse(this.responseText);
                    console.log(user);
                    const xhttp4 = new XMLHttpRequest();
                    xhttp4.open(
                      "GET",
                      "/api/pick/friends?season=" + seasonDropdown.value
                    );
                    xhttp4.setRequestHeader(
                      "Content-Type",
                      "application/json;charset=UTF-8"
                    );
                    xhttp4.setRequestHeader("Authorization", "Bearer " + jwt);
                    xhttp4.send();
                    xhttp4.onreadystatechange = function () {
                      if (this.readyState == 4) {
                        if (this.status == 200) {
                          const friendPicks = JSON.parse(this.responseText);
                          friendPicks.forEach((friendPick) => {
                            friendPick.user = user.friends?.find((user) => {return user.id == friendPick.user.id});
                          });
                          if (user.teams == null) {
                            document.getElementById("root-div").innerHTML =
                              "<h1>You have not joined any teams yet!</h1><p>Please check your profile settings.</p>";
                            return;
                          }
                          if (games.length == 0) {
                            document.getElementById(
                              "teamsTabContent"
                            ).innerHTML =
                              "<h1>No games yet :( Plz come back hockey</h1>";
                            return;
                          }
                          var activeTeam = user.teams?.find((team) => {
                            return (
                              team.id == games[0].awayTeam.id ||
                              team.id == games[0].homeTeam.id
                            );
                          });
                          user.teams?.forEach((team) => {
                            createTableHeaderForTeam(team, activeTeam);
                            var teamContentDiv = document.createElement("div");
                            if (team == activeTeam) {
                              teamContentDiv.setAttribute(
                                "class",
                                "tab-pane fade active show"
                              );
                            } else {
                              teamContentDiv.setAttribute(
                                "class",
                                "tab-pane fade"
                              );
                            }
                            teamContentDiv.setAttribute("id", "team" + team.id);
                            teamContentDiv.setAttribute("role", "tabpanel");
                            teamContentDiv.setAttribute(
                              "aria-labelledby",
                              "tab" + team.id
                            );

                            var teamTabHeader = document.createElement("ul");
                            teamTabHeader.setAttribute(
                              "class",
                              "nav nav-tabs text-nowrap flex-nowrap"
                            );
                            teamTabHeader.setAttribute(
                              "style",
                              "overflow-x: auto; overflow-y: hidden;"
                            );
                            teamTabHeader.setAttribute(
                              "id",
                              "teamTabHeader-" + team.id
                            );
                            teamTabHeader.setAttribute("role", "tablist");
                            var gameTabContent = document.createElement("div");
                            gameTabContent.setAttribute("class", "tab-content");
                            gameTabContent.setAttribute(
                              "id",
                              "gameTabContent-" + team.id
                            );
                            teamContentDiv.append(teamTabHeader);
                            teamContentDiv.append(gameTabContent);
                            document
                              .getElementById("teamsTabContent")
                              .append(teamContentDiv);
                            var teamGames = games.filter((game) => {
                              return (
                                game.awayTeam.id == team.id ||
                                game.homeTeam.id == team.id
                              );
                            });
                            var reversedGames = Array.from(teamGames).reverse();
                            var activeGame =
                              reversedGames.find((game) => {
                                return game.gameState == "Live";
                              }) ||
                              reversedGames.find((game) => {
                                return game.gameState == "Preview";
                              }) ||
                              teamGames[0];
                            teamGames.forEach((game) => {
                              createTable(
                                team,
                                game,
                                picks,
                                user,
                                activeGame,
                                teamGames,
                                friendPicks
                              );
                            });
                          });
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
      } else if (this.status == 401 || this.status == 403) {
        localStorage.removeItem("jwt");
        window.location.href = "./login.html";
      }
    }
  };
}

function createTable(team, game, picks, user, activeGame, sortedGames, allFriendPicks) {
  var teamIsAwayOrHome = game.awayTeam.id == team.id ? "away" : "home";
  var gameDate = new Date(
    Date.UTC(
      game.date[0],
      game.date[1] - 1,
      game.date[2],
      game.date[3],
      game.date[4]
    )
  );
  var curDate = new Date();
  var pickEnabled =
    picks.find((pick) => pick.game.id == game.id && pick.team.id == team.id) ==
      undefined && gameDate > curDate;
  var pick = picks.find(
    (pick) => pick.game.id == game.id && pick.team.id == team.id
  );
  var friendPicks = allFriendPicks.filter(
    (pick) => pick.game.id == game.id && pick.team.id == team.id
  );
  var friendPicksMap = friendPicks.reduce((acc, obj) => ((acc[obj.gamePlayer?.id?.playerId || (obj.theTeam && "theTeam") || (obj.goalies && "goalies")] = acc[obj.gamePlayer?.id?.playerId || (obj.theTeam && "theTeam") || (obj.goalies && "goalies")] || []).push(obj), acc), {})
  console.log(friendPicksMap);
  var headers = ["Player", "Pos", "Points"];
  if (pickEnabled) {
    headers.push("Pick");
  } else {
    headers.push("Friends");
  }

  var gameStringShort =
    gameDate.getMonth() +
    1 +
    "-" +
    gameDate.getDate() +
    "-" +
    gameDate.getFullYear() +
    " ";
  if (teamIsAwayOrHome == "away") {
    gameStringShort += "<br/>@ " + game.homeTeam.teamName;
  } else {
    gameStringShort += "<br/>v " + game.awayTeam.teamName;
  }
  createTableHeaderForGame(game, pick, user, gameStringShort, activeGame, team);

  var lastGame = sortedGames.filter(
    (prevGame) => prevGame.gameState == "Final"
  )[0];

  var tableDiv = document.createElement("div");
  if (game == activeGame) {
    tableDiv.setAttribute(
      "class",
      "table-responsive tab-pane fade active show"
    );
  } else {
    tableDiv.setAttribute("class", "table-responsive tab-pane fade ");
  }
  tableDiv.setAttribute("id", "game" + game.id + team.id);
  tableDiv.setAttribute("role", "tabpanel");
  tableDiv.setAttribute("aria-labelledby", "tab" + game.id + team.id);
  var table = document.createElement("table"); //makes a table element for the page
  tableDiv.appendChild(table);
  table.setAttribute("class", "table table-hover");

  var players = game.players.filter((player) => player.team.id == team.id);
  var nonGoalies = players
    .filter((player) => player.position != "Goalie")
    .sort((a, b) =>
      a.name.split(" ").reverse().join(",") >
      b.name.split(" ").reverse().join(",")
        ? 1
        : -1
    )
    .sort((a, b) =>
      pick && pick.gamePlayer && pick.gamePlayer.id.playerId == a.id.playerId
        ? -1
        : 1
    );

  for (var i = 0; i < nonGoalies.length; i++) {
    var row = table.insertRow(i);
    var id = nonGoalies[i].id.playerId;
    if (pick && pick.gamePlayer && pick.gamePlayer.id.playerId == id) {
      row.className = "table-danger";
    }
    if (!pick && lastGame && pickEnabled) {
      var lastGameStats = lastGame.players.find(
        (player) => player.id.playerId == id
      );
      if (lastGameStats && !lastGameStats.timeOnIce) {
        row.className = "table-warning";
      }
    }
    row.insertCell(0).innerHTML =
      '<figure><img width="90" height="90" class="rounded-circle img-thumbnail" src="https://cms.nhl.bamgrid.com/images/headshots/current/168x168/' +
      id +
      '.jpg" onerror=\'this.src="/shrug.png"\'>' +
      "<figcaption>" +
      nonGoalies[i].name +
      "</figcaption></figure>";
    if (nonGoalies[i].position == "Defenseman") {
      row.insertCell(1).innerHTML = "D";
    } else {
      row.insertCell(1).innerHTML = "F";
    }
    if (pickEnabled) {
      if (nonGoalies[i].position == "Defenseman") {
        row.insertCell(2).innerHTML = "3/goal, 1/assist, *2/shorty";
      } else if (nonGoalies[i].position == "Forward") {
        row.insertCell(2).innerHTML = "2/goal, 1/assist, *2/shorty";
      }
      row.insertCell(3).innerHTML =
        '<button type="button" class="btn btn-primary" onclick="doPick(this,' +
        game.id +
        ",'" +
        nonGoalies[i].name +
        "'," +
        team.id +
        ')">Pick</button>';
    } else {
      if (nonGoalies[i].position == "Defenseman") {
        row.insertCell(2).innerHTML =
          (nonGoalies[i].goals || 0) * 3 +
          (nonGoalies[i].assists || 0) +
          (nonGoalies[i].shortGoals || 0) * 3 +
          (nonGoalies[i].shortAssists || 0);
      } else if (nonGoalies[i].position == "Forward") {
        row.insertCell(2).innerHTML =
          (nonGoalies[i].goals || 0) * 2 +
          (nonGoalies[i].assists || 0) +
          (nonGoalies[i].shortGoals || 0) * 2 +
          (nonGoalies[i].shortAssists || 0);
      }
      if (id in friendPicksMap) {
        row.insertCell(3).innerHTML = friendPicksMap[id].map(pick => pick.user.displayName).join("<br/>");
      } else {
        row.insertCell(3).innerHTML = "";
      }
    }
  }

  var goalies = players.filter((player) => player.position == "Goalie");
  var row;
  if (pick && pick.goalies != undefined) {
    row = table.insertRow(0);
    row.className = "table-danger";
  } else {
    row = table.insertRow(nonGoalies.length);
  }
  var goalieImages = goalies
    .map(
      (player) =>
        '<img width="90" height="90" class="rounded-circle img-thumbnail" onerror=\'this.src="/shrug.png"\' src="https://cms.nhl.bamgrid.com/images/headshots/current/168x168/' +
        player.id.playerId +
        '.jpg">'
    )
    .join("");
  row.insertCell(0).innerHTML =
    "<figure>" + goalieImages + "<figcatpion>The Goalies</figcatpion></figure>";
  row.insertCell(1).innerHTML = "G";
  if (pickEnabled) {
    row.insertCell(2).innerHTML = "5/shutout, 2/single-goal game";
    row.insertCell(3).innerHTML =
      '<button type="button" class="btn btn-primary" onclick="doPick(this,' +
      game.id +
      ",'goalies'," +
      team.id +
      ')">Pick</button>';
  } else {
    var goals = goalies.reduce((a, b) => a + (b.goalsAgainst || 0), 0);
    if (goals > 1) {
      row.insertCell(2).innerHTML = 0;
    } else if (goals > 0) {
      row.insertCell(2).innerHTML = 2;
    } else {
      row.insertCell(2).innerHTML = 5;
    }
    if ("goalies" in friendPicksMap) {
      row.insertCell(3).innerHTML = friendPicksMap["goalies"].map(pick => pick.user.displayName).join("<br/>");
    } else {
      row.insertCell(3).innerHTML = "";
    }
  }

  var row;
  if (pick && pick.theTeam != undefined) {
    row = table.insertRow(0);
    row.className = "table-danger";
  } else {
    row = table.insertRow(nonGoalies.length + 1);
  }
  row.insertCell(0).innerHTML =
    "<figure><figcatpion>The " + team.teamName + "!</figcatpion></figure>";
  row.insertCell(1).innerHTML = "Team";
  if (pickEnabled) {
    row.insertCell(2).innerHTML = "5/5+ goal game, 4/4 goal game";
    row.insertCell(3).innerHTML =
      '<button type="button" class="btn btn-primary" onerror=\'this.src="/shrug.png"\' onclick="doPick(this,' +
      game.id +
      ",'team'," +
      team.id +
      ')">Pick</button>';
  } else {
    var goals =
      teamIsAwayOrHome == "home" ? game.homeTeamGoals : game.awayTeamGoals;
    if ((goals || 0) >= 5) {
      row.insertCell(2).innerHTML = 5;
    } else if ((goals || 0) >= 4) {
      row.insertCell(2).innerHTML = 4;
    } else {
      row.insertCell(2).innerHTML = 0;
    }
    if ("theTeam" in friendPicksMap) {
      row.insertCell(3).innerHTML = friendPicksMap["theTeam"].map(pick => pick.user.displayName).join("<br/>");
    } else {
      row.insertCell(3).innerHTML = "";
    }
  }
  //how to make disappear: row.className = "collapse multi-collapse";

  var header = table.createTHead();
  var headerRow = header.insertRow(0);
  for (var i = 0; i < headers.length; i++) {
    var cell = headerRow.insertCell(i);
    cell.outerHTML = '<th scope="col">' + headers[i] + "</th>";
  }

  document.getElementById("gameTabContent-" + team.id).append(tableDiv);
}

function createTableHeaderForGame(
  game,
  pick,
  user,
  gameString,
  activeGame,
  team
) {
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
    classString += " text-danger";
  } else if (game.gameState != "Final") {
    classString += " text-success";
  } else if (game.gameState == "Final") {
    classString += " text-secondary";
  }
  headerButton.setAttribute("class", classString);
  headerButton.setAttribute("role", "tab");
  headerButton.setAttribute("data-bs-toggle", "tab");
  headerButton.setAttribute("data-bs-target", "#game" + game.id + team.id);
  headerButton.setAttribute("id", "tab" + game.id + team.id);
  headerButton.setAttribute("aria-controls", "game" + game.id + team.id);
  headerButton.innerHTML = gameString;

  headerLi.appendChild(headerButton);

  document.getElementById("teamTabHeader-" + team.id).append(headerLi);
}

function createTableHeaderForTeam(team, activeTeam) {
  var headerLi = document.createElement("li");
  headerLi.setAttribute("class", "nav-item");
  headerLi.setAttribute("role", "presentation");

  var headerButton = document.createElement("button");
  var classString = "nav-link text-secondary";
  if (team == activeTeam) {
    headerButton.setAttribute("aria-selected", "true");
    classString += " active";
  } else {
    headerButton.setAttribute("aria-selected", "false");
  }
  headerButton.setAttribute("class", classString);
  headerButton.setAttribute("role", "tab");
  headerButton.setAttribute("data-bs-toggle", "tab");
  headerButton.setAttribute("data-bs-target", "#team" + team.id);
  headerButton.setAttribute("id", "tab" + team.id);
  headerButton.setAttribute("aria-controls", "team" + team.id);
  headerButton.innerHTML = team.teamName;

  headerLi.appendChild(headerButton);

  document.getElementById("teamsTabHeader").append(headerLi);
}

function doPick(elem, gameId, pick, teamId) {
  var message = "";
  if (elem.parentNode.parentNode.classList.contains("table-warning")) {
    message =
      pick +
      " had no time-on-ice the previous game! Are you sure you want to pick them? You can't change a pick once locked in!";
  } else {
    message =
      "Are you sure you want to pick " +
      pick +
      "? You can't change a pick once locked in!";
  }
  Swal.fire({
    text: message,
    icon: "warning",
    confirmButtonText: "OK",
    showCancelButton: true,
    cancelButtonText: "NOPE!",
  }).then((result) => {
    if (result["isConfirmed"]) {
      const xhttp = new XMLHttpRequest();
      xhttp.open(
        "POST",
        "/api/pick/user?gameId=" +
          gameId +
          "&pick=" +
          pick +
          "&teamId=" +
          teamId
      );
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
              text:
                objects["_embedded"]["errors"][0]["message"] ||
                objects["message"],
              icon: "error",
              confirmButtonText: "OK",
            });
          }
        }
      };
    }
  });
}

loadGames();
