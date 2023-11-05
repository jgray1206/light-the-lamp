var maxGames = 5;
var globalActiveGame = undefined;

function loadGames() {
  document.getElementById("teamsTabContent").innerHTML = "";
  document.getElementById("teamsTabHeader").innerHTML = "";
  var seasonDropdown = document.getElementById("season");
  const xhttp = new XMLHttpRequest();
  xhttp.open(
    "GET",
    "/api/game/announcers?season=" +
      seasonDropdown.value +
      "&maxGames=" +
      maxGames
  );
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
        xhttp2.open(
          "GET",
          "/api/pick/announcer?season=" + seasonDropdown.value
        );
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
              xhttp3.open("GET", "/api/announcers");
              xhttp3.setRequestHeader(
                "Content-Type",
                "application/json;charset=UTF-8"
              );
              xhttp3.setRequestHeader("Authorization", "Bearer " + jwt);
              xhttp3.send();
              xhttp3.onreadystatechange = function () {
                if (this.readyState == 4) {
                  if (this.status == 200) {
                    const announcers = JSON.parse(this.responseText);
                    console.log(announcers);
                    if (games.length == 0) {
                      document.getElementById("teamsTabContent").innerHTML =
                        "<h1>No games yet :(</h1>";
                      return;
                    }
                    var teamGroupedAnnouncers = announcers.reduce(
                      (acc, obj) => (
                        (acc[obj.team.id] = acc[obj.team.id] || []).push(obj),
                        acc
                      ),
                      {}
                    );
                    var activeTeam =
                      teamGroupedAnnouncers[
                        Object.keys(teamGroupedAnnouncers).find((teamId) => {
                          return (
                            teamId == games[0].awayTeam.id ||
                            teamId == games[0].homeTeam.id
                          );
                        })
                      ][0].team;
                    Object.keys(teamGroupedAnnouncers).forEach((teamId) => {
                      var announcers = teamGroupedAnnouncers[teamId];
                      var team = teamGroupedAnnouncers[teamId][0].team;
                      createTableHeaderForTeam(team, activeTeam);
                      var teamContentDiv = document.createElement("div");
                      if (team == activeTeam) {
                        teamContentDiv.setAttribute(
                          "class",
                          "tab-pane fade active show"
                        );
                      } else {
                        teamContentDiv.setAttribute("class", "tab-pane fade");
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
                        "nav nav-tabs text-nowrap flex-nowrap teamtabheader"
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
                        globalActiveGame ||
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
                          activeGame,
                          teamGames,
                          announcers
                        );
                      });
                      createMoreGamesButton(teamGames, team);
                    });
                  } else if (this.status == 401 || this.status == 403) {
                    localStorage.removeItem("jwt");
                    window.location.href =
                      "./login.html?redirect=" +
                      encodeURIComponent(window.location.href);
                  }
                }
              };
            } else if (this.status == 401 || this.status == 403) {
              localStorage.removeItem("jwt");
              window.location.href =
                "./login.html?redirect=" +
                encodeURIComponent(window.location.href);
            }
          }
        };
      } else if (this.status == 401 || this.status == 403) {
        localStorage.removeItem("jwt");
        window.location.href =
          "./login.html?redirect=" + encodeURIComponent(window.location.href);
      }
    }
  };
}

function createTable(team, game, picks, activeGame, sortedGames, announcers) {
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
  var headers = ["Player", "Pick"];
  var gameStringShort =
    gameDate.getMonth() +
    1 +
    "/" +
    gameDate.getDate() +
    "/" +
    gameDate.getFullYear() +
    " ";
  if (teamIsAwayOrHome == "away") {
    gameStringShort += "<br/>@ " + game.homeTeam.shortName;
  } else {
    gameStringShort += "<br/>v " + game.awayTeam.shortName;
  }
  var isPicksDone =
    (picks.filter((pick) => pick.game.id == game.id)?.length || 0) ==
    announcers.length;
  createTableHeaderForGame(
    game,
    gameStringShort,
    activeGame,
    team,
    isPicksDone
  );

  var lastGame = sortedGames.filter(
    (prevGame) => prevGame.gameState == "Final"
  )[0];

  var tableDiv = document.createElement("div");
  if (game.id == activeGame.id) {
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
  var seasonDropdown = document.getElementById("season");
  var seasonText = seasonDropdown.options[seasonDropdown.selectedIndex].text
    .split(" ")[0]
    .replace("-", "");
  var players = game.players.filter((player) => player.team.id == team.id);
  var nonGoalies = players
    .filter((player) => player.position != "Goalie")
    .sort((a, b) =>
      a.name.split(" ").reverse().join(",") >
      b.name.split(" ").reverse().join(",")
        ? 1
        : -1
    );

  for (var i = 0; i < nonGoalies.length; i++) {
    var row = table.insertRow(i);
    var id = nonGoalies[i].id.playerId;
    var positionText = "(F)";
    if (nonGoalies[i].position == "Defenseman") {
      positionText = "(D)";
    }
    var picCell = row.insertCell(0);
    var figure = document.createElement("figure");
    picCell.appendChild(figure);
    var image = document.createElement("img");
    var caption = document.createElement("figcaption");
    figure.appendChild(image);
    figure.appendChild(caption);
    image.width = "90";
    image.height = "90";
    image.className = "rounded-circle img-thumbnail";
    image.src =
      "https://assets.nhle.com/mugs/nhl/" +
      seasonText +
      "/" +
      team.abbreviation +
      "/" +
      id +
      ".png";
    image.onerror = function (e) {
      e.target.src = "/shrug.png";
    };
    caption.innerText = nonGoalies[i].name + " " + positionText;
    var buttonCell = row.insertCell(1);
    announcers.forEach((announcer) => {
      createPickButton(
        game.id,
        nonGoalies[i].name,
        announcer,
        buttonCell,
        picks
      );
    });
  }

  var goalies = players.filter((player) => player.position == "Goalie");
  var row = table.insertRow(nonGoalies.length);
  var picCell = row.insertCell(0);
  var figure = document.createElement("figure");
  picCell.appendChild(figure);
  var goalieImages = goalies.forEach((player) => {
    var image = document.createElement("img");
    figure.appendChild(image);
    image.width = "90";
    image.height = "90";
    image.className = "rounded-circle img-thumbnail";
    image.src =
      "https://assets.nhle.com/mugs/nhl/" +
      seasonText +
      "/" +
      team.abbreviation +
      "/" +
      player.id.playerId +
      ".png";
    image.onerror = function (e) {
      e.target.src = "/shrug.png";
    };
  });
  var caption = document.createElement("figcaption");
  caption.innerText = "The Goalies";
  figure.appendChild(caption);
  var buttonCell = row.insertCell(1);
  announcers.forEach((announcer) => {
    createPickButton(game.id, "goalies", announcer, buttonCell, picks);
  });

  var row = table.insertRow(nonGoalies.length + 1);
  row.insertCell(0).innerHTML =
    "<figure><figcaption>The " + team.teamName + "!</figcaption></figure>";
  var buttonCell = row.insertCell(1);
  announcers.forEach((announcer) => {
    createPickButton(game.id, "team", announcer, buttonCell, picks);
  });

  var header = table.createTHead();
  var headerRow = header.insertRow(0);
  for (var i = 0; i < headers.length; i++) {
    var cell = headerRow.insertCell(i);
    if (headers[i] == "Friends") {
      cell.outerHTML =
        '<th scope="col" class="' +
        collapseClassValue +
        '">' +
        headers[i] +
        "</th>";
    } else {
      cell.outerHTML = '<th scope="col">' + headers[i] + "</th>";
    }
  }

  document.getElementById("gameTabContent-" + team.id).append(tableDiv);
}

function createPickButton(gameId, pickName, announcer, cell, picks) {
  var pickButton = document.createElement("button");
  var hasPicked = picks.find(
      (pick) =>
        pick.announcer.id == announcer.id &&
        pick.game.id == gameId
    );
  var pick = picks.find(
    (pick) =>
      pick.announcer.id == announcer.id &&
      pick.game.id == gameId &&
      (pick.gamePlayer?.name == pickName ||
        (pickName == "team" && pick.theTeam == true) ||
        (pickName == "goalies" && pick.goalies == true))
  );
  pickButton.type = "button";
  if (pick != undefined) {
    pickButton.className = "btn btn-primary m-1";
  } else {
    pickButton.className = "btn btn-secondary m-1";
  }
  pickButton.textContent = announcer.nickname.split("WITH").pop();
  pickButton.addEventListener(
    "click",
    function (e) {
      doPick(e.target, gameId, pickName, announcer.id, pick?.id);
    },
    false
  );
  if (pick != undefined || !hasPicked) {
    cell.appendChild(pickButton);
  }
}

function createTableHeaderForGame(
  game,
  gameString,
  activeGame,
  team,
  pickingDone
) {
  var headerLi = document.createElement("li");
  headerLi.setAttribute("class", "nav-item");
  headerLi.setAttribute("role", "presentation");

  var headerButton = document.createElement("button");
  headerButton.onclick = function saveActiveGame() {
    globalActiveGame = game;
  };
  var classString = "nav-link ";
  if (game.id == activeGame.id) {
    headerButton.setAttribute("aria-selected", "true");
    classString += " active";
  } else {
    headerButton.setAttribute("aria-selected", "false");
  }
  if (!pickingDone) {
    classString += " text-success";
  } else {
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

function createMoreGamesButton(games, team) {
  if (games.length == maxGames) {
    var headerLi = document.createElement("li");
    headerLi.setAttribute("class", "nav-item");
    headerLi.setAttribute("role", "presentation");

    var headerButton = document.createElement("button");
    headerButton.setAttribute("aria-selected", "false");
    var classString = "nav-link text-secondary";
    headerButton.setAttribute("class", classString);
    headerButton.setAttribute("role", "tab");
    headerButton.innerHTML = "Load More</br>Games";
    headerButton.onclick = function incrementMaxGames() {
      maxGames = maxGames + 20;
      loadGames();
    };
    headerLi.appendChild(headerButton);

    document.getElementById("teamTabHeader-" + team.id).append(headerLi);
  }
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

function doPick(elem, gameId, pick, announcerId, pickId) {
  const xhttp = new XMLHttpRequest();
  if (pickId) {
    xhttp.open(
      "DELETE",
      "/api/pick/announcer?" + "gameId=" + gameId + "&announcerId=" + announcerId
    );
  } else {
    xhttp.open(
      "POST",
      "/api/pick/announcer?gameId=" +
        gameId +
        "&pick=" +
        pick +
        "&announcerId=" +
        announcerId
    );
  }
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.setRequestHeader("Authorization", "Bearer " + jwt);
  xhttp.send();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        const objects = JSON.parse(this.responseText);
        console.log(objects);
        loadGames();
      } else if (this.status == 401 || this.status == 403) {
        localStorage.removeItem("jwt");
        window.location.href =
          "./login.html?redirect=" + encodeURIComponent(window.location.href);
      } else {
        const objects = JSON.parse(this.responseText);
        Swal.fire({
          text:
            objects["_embedded"]["errors"][0]["message"] || objects["message"],
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  };
}

document.getElementById("season").onchange = function () {
  loadGames();
};

loadGames();
