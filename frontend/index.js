var maxGames = 5;

function loadGames() {
  document.getElementById("teamsTabContent").innerHTML = "";
  document.getElementById("teamsTabHeader").innerHTML = "";
  var seasonDropdown = document.getElementById("season");
  const xhttp = new XMLHttpRequest();
  xhttp.open(
    "GET",
    "/api/game/user?season=" + seasonDropdown.value + "&maxGames=" + maxGames
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
                          console.log(friendPicks);
                          friendPicks.forEach((friendPick) => {
                            if (friendPick.user) {
                              friendPick.user = user.friends?.find((user) => {
                                return user.id == friendPick.user.id;
                              });
                            }
                          });
                          if (user.teams == null) {
                            document.getElementById("root-div").innerHTML =
                              "<h1>You have not joined any teams yet!</h1><p>Please check your profile settings.</p>";
                            return;
                          }
                          if (games.length == 0) {
                            document.getElementById(
                              "teamsTabContent"
                            ).innerHTML = "<h1>No games yet :(</h1>";
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

function createTable(
  team,
  game,
  picks,
  user,
  activeGame,
  sortedGames,
  allFriendPicks
) {
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
  var pick = picks.find(
    (pick) => pick.game.id == game.id && pick.team.id == team.id
  );
  var pickEnabled = pick == undefined && gameDate > curDate;
  var friendPicks = allFriendPicks.filter(
    (pick) => pick.game.id == game.id && pick.team.id == team.id
  );
  var friendPicksMap = friendPicks.reduce(
    (acc, obj) => (
      (acc[
        obj.gamePlayer?.id?.playerId ||
          (obj.theTeam && "theTeam") ||
          (obj.goalies && "goalies")
      ] =
        acc[
          obj.gamePlayer?.id?.playerId ||
            (obj.theTeam && "theTeam") ||
            (obj.goalies && "goalies")
        ] || []).push(obj),
      acc
    ),
    {}
  );
  var headers = ["Player", "Friends", "Points"];
  var collapseClassValue = "";
  if (pickEnabled) {
    headers.push("Pick");
    collapseClassValue = "collapse multi-collapse";
  }

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
  createTableHeaderForGame(
    game,
    pick,
    pickEnabled,
    user,
    gameStringShort,
    activeGame,
    team
  );

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
      if (
        lastGameStats &&
        (!lastGameStats.timeOnIce || lastGameStats.timeOnIce == "0:00")
      ) {
        row.className = "table-warning";
      }
    }
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
    var friendsCell = row.insertCell(1);
    friendsCell.className = collapseClassValue;
    if (id in friendPicksMap) {
      friendPicksMap[id].forEach((pick) => {
        addFriendsPickToCell(friendsCell, pick);
      });
    } else {
      friendsCell.innerHTML = "";
    }
    if (pickEnabled) {
      if (nonGoalies[i].position == "Defenseman") {
        row.insertCell(2).innerHTML = "3/goal<br/>1/assist<br/>*2/shorty";
      } else if (nonGoalies[i].position == "Forward") {
        row.insertCell(2).innerHTML = "2/goal<br/>1/assist<br/>*2/shorty";
      }
      createPickButton(game.id, nonGoalies[i].name, team.id, row.insertCell(3));
    } else {
      var htmlString = "";
      if (nonGoalies[i].position == "Defenseman") {
        htmlString =
          "<h1>" +
          ((nonGoalies[i].goals || 0) * 3 +
            (nonGoalies[i].assists || 0) +
            (nonGoalies[i].shortGoals || 0) * 6 +
            (nonGoalies[i].shortAssists || 0) * 2) +
          "</h1></br>";
      } else if (nonGoalies[i].position == "Forward") {
        htmlString =
          "<h1>" +
          ((nonGoalies[i].goals || 0) * 2 +
            (nonGoalies[i].assists || 0) +
            (nonGoalies[i].shortGoals || 0) * 4 +
            (nonGoalies[i].shortAssists || 0) * 2) +
          "</h1></br>";
      }
      if (nonGoalies[i].goals) {
        htmlString += "G: " + nonGoalies[i].goals + "</br>";
      }
      if (nonGoalies[i].assists) {
        htmlString += "A: " + nonGoalies[i].assists + "</br>";
      }
      if (nonGoalies[i].shortGoals) {
        htmlString += "SHG: " + nonGoalies[i].shortGoals + "</br>";
      }
      if (nonGoalies[i].shortAssists) {
        htmlString += "SHA: " + nonGoalies[i].shortAssists;
      }
      row.insertCell(2).innerHTML = htmlString;
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
  var friendsCell = row.insertCell(1);
  friendsCell.className = collapseClassValue;
  if ("goalies" in friendPicksMap) {
    friendPicksMap["goalies"].forEach((pick) => {
      addFriendsPickToCell(friendsCell, pick);
    });
  } else {
    friendsCell.innerHTML = "";
  }
  if (pickEnabled) {
    row.insertCell(2).innerHTML = "5/shutout<br/>3/one-or-two GA";
    createPickButton(game.id, "goalies", team.id, row.insertCell(3));
  } else {
    var goals =
      (teamIsAwayOrHome == "home" ? game.awayTeamGoals : game.homeTeamGoals) ||
      0;
    var htmlString = "";
    if (goals > 2) {
      htmlString = "<h1>0</h1></br>";
    } else if (goals > 0) {
      htmlString = "<h1>3</h1></br>";
    } else {
      htmlString = "<h1>5</h1></br>";
    }
    htmlString += "GA: " + goals;
    row.insertCell(2).innerHTML = htmlString;
  }

  var row;
  if (pick && pick.theTeam != undefined) {
    row = table.insertRow(0);
    row.className = "table-danger";
  } else {
    row = table.insertRow(nonGoalies.length + 1);
  }
  row.insertCell(0).innerHTML =
    "<figure><figcaption>The " + team.teamName + "!</figcaption></figure>";
  var friendsCell = row.insertCell(1);
  friendsCell.className = collapseClassValue;
  if ("theTeam" in friendPicksMap) {
    friendPicksMap["theTeam"].forEach((pick) => {
      addFriendsPickToCell(friendsCell, pick);
    });
  } else {
    friendsCell.innerHTML = "";
  }
  if (pickEnabled) {
    row.insertCell(2).innerHTML = "4/4goals<br/>5/5goals<br/>6/6goals etc";
    createPickButton(game.id, "team", team.id, row.insertCell(3));
  } else {
    var goals =
      (teamIsAwayOrHome == "home" ? game.homeTeamGoals : game.awayTeamGoals) ||
      0;
    var htmlString = "";
    if (goals >= 4) {
      htmlString = "<h1>" + goals + "</h1></br>";
    } else {
      htmlString = "<h1>0</h1></br>";
    }
    htmlString += "G: " + goals;
    row.insertCell(2).innerHTML = htmlString;
  }

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

function addFriendsPickToCell(friendsCell, pick) {
  if (pick.user) {
    picTdImg = document.createElement("img");
    picTdImg.width = "30";
    picTdImg.height = "30";
    picTdImg.style.marginBottom = "1px";
    picTdImg.className = "rounded-circle";
    getPic(pick.user.id, picTdImg);
    friendsCell.appendChild(picTdImg);
    var span = document.createElement("span");
    span.style.fontSize = "14px";
    span.innerHTML = " " + pick.user.displayName;
    friendsCell.appendChild(span);
    friendsCell.appendChild(document.createElement("br"));
  } else {
    var span = document.createElement("span");
    span.style.fontSize = "13px";
    span.innerHTML = " " + pick.announcer.nickname;
    friendsCell.appendChild(span);
    friendsCell.appendChild(document.createElement("br"));
  }
}

function createPickButton(gameId, pick, teamId, cell) {
  var pickButton = document.createElement("button");
  pickButton.type = "button";
  pickButton.className = "btn btn-primary";
  pickButton.textContent = "Pick";
  pickButton.addEventListener(
    "click",
    function (e) {
      doPick(e.target, gameId, pick, teamId);
    },
    false
  );
  cell.appendChild(pickButton);
}

function createTableHeaderForGame(
  game,
  pick,
  pickEnabled,
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
  } else if (pickEnabled && game.gameState != "Final") {
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
            window.location.href =
              "./login.html?redirect=" +
              encodeURIComponent(window.location.href);
          } else {
            const objects = JSON.parse(this.responseText);
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

document.getElementById("season").onchange = function () {
  loadGames();
};
loadGames();
