function createTableHeaderForTeam(team, index) {
  var headerLi = document.createElement("li");
  headerLi.setAttribute("class", "nav-item");
  headerLi.setAttribute("role", "presentation");

  var headerButton = document.createElement("button");
  var classString = "nav-link text-secondary";
  if (index == 0) {
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
};

function loadLeaderboards() {
  document.getElementById("teamsTabContent").innerHTML = '';
  document.getElementById("teamsTabHeader").innerHTML = '';
  var seasonDropdown = document.getElementById("season");
  var leaderboardDisplayType = document.getElementById("displayType").value;
  const xhttp = new XMLHttpRequest();
  if (leaderboardDisplayType == "Friends") {
    xhttp.open("GET", "/api/pick/friends-and-self?season=" + seasonDropdown.value);
  } else if (leaderboardDisplayType == "Reddit") {
    xhttp.open("GET", "/api/pick/reddit?season=" + seasonDropdown.value);
  } else {
    xhttp.open("GET", "/api/pick?season=" + seasonDropdown.value);
  }
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.setRequestHeader("Authorization", "Bearer " + jwt);
  xhttp.send();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        var picks = JSON.parse(this.responseText);
        if (picks.length == 0) {
          document
            .getElementById("teamsTabContent")
            .append(
              "No picks yet! Either there are no picks for this season yet, or you have not joined any teams. Please check your profile settings."
            );
        }
        var groupBy = function (xs, key) {
          return xs.reduce(function (rv, x) {
            (rv[x[key]["id"]] = rv[x[key]["id"]] || []).push(x);
            return rv;
          }, {});
        };
        groupedPicks = groupBy(picks, "team");
        var index = 0;
        Object.keys(groupedPicks).forEach(function (key) {
          var picks = groupedPicks[key];
          var team = picks[0].team;

          createTableHeaderForTeam(team, index);
          var teamContentDiv = document.createElement("div");
          if (index == 0) {
            teamContentDiv.setAttribute("class", "tab-pane fade active show");
          } else {
            teamContentDiv.setAttribute("class", "tab-pane fade");
          }
          teamContentDiv.setAttribute("id", "team" + team.id);
          teamContentDiv.setAttribute("role", "tabpanel");
          teamContentDiv.setAttribute("aria-labelledby", "tab" + team.id);
          document.getElementById("teamsTabContent").append(teamContentDiv);
          createTable(picks, team, leaderboardDisplayType == "Reddit");
          index++;
        });
      } else if (this.status == 401 || this.status == 403) {
        localStorage.removeItem("jwt");
        window.location.href = "./login.html?redirect=" + encodeURIComponent(window.location.href);
      }
    }
  };
};

function createTable(picks, team, isRedditDisplay) {
  var curUserId = getIdFromJwt()
  var headers = ["", "User", "Num Picks", "Points"];
  var table = document.createElement("table"); //makes a table element for the page
  table.setAttribute("class", "table table-hover");

  var filterGames = new Set();
  if (document.getElementById("my-picks").checked) {
    picks.filter((pick) => pick.user?.id == curUserId).forEach((pick) => filterGames.add(pick.game.id));
  }
  if (document.getElementById("announcer-picks").checked) {
    picks.filter((pick) => pick.announcer).forEach((pick) => filterGames.add(pick.game.id));
  }

  var groupedPicks = Object.entries(
    picks
    .filter((pick) => {
        if (filterGames.size > 0) {
            return filterGames.has(pick.game.id);
        } else {
            return true;
        }
    })
    .reduce((x, y) => {
      (x[y.user?.id || ("a"+y.announcer.id)] = x[y.user?.id || ("a"+y.announcer.id)] || []).push(y);
      return x;
    }, {})
  )
    .map((pick) => {
      pick[2] = isRedditDisplay ? pick[1][0].user.redditUsername : (pick[1][0].user?.displayName || pick[1][0].announcer.displayName);
      pick[3] = pick[1].length;
      pick[1] = pick[1].reduce((a, b) => a + (b.points || 0), 0);
      return pick;
    })
    .sort((aPick, bPick) => bPick[1] - aPick[1] || aPick[3] - bPick[3]);

  var i = 0;
  var rank = 0;
  var lastPoints = -1;
  var lastNumPicks = -1;
  groupedPicks.forEach((pick) => {
    var row = table.insertRow(i);
    if (pick[0] == curUserId) {
        row.className = "table-active";
    }
    if (pick[0][0]=='a') {
        row.className = "table-danger";
    }
    if (pick[1] != lastPoints || pick[3] != lastNumPicks) {
        rank += 1;
        lastPoints = pick[1];
        lastNumPicks = pick[3];
    }
    row.insertCell(0).innerHTML = rank;
    if (pick[2]) {
      row.insertCell(1).innerHTML = pick[2];
    } else {
      row.insertCell(1).innerHTML = pick[0].split("@")[0];
    }
    row.insertCell(2).innerHTML = pick[3];
    row.insertCell(3).innerHTML = "<b>" + pick[1] + "</b>";
    i++;
  });

  var header = table.createTHead();
  var headerRow = header.insertRow(0);
  for (var i = 0; i < headers.length; i++) {
    headerRow.insertCell(i).innerHTML = headers[i];
  }
  document.getElementById("team" + team.id).append(table);
};
document.getElementById("announcer-pick-form").style.display = "none";
document.getElementById("displayType").onchange = function () {
  if (document.getElementById("displayType").value == "Global") {
    document.getElementById("announcer-pick-form").style.display = '';
  } else {
    document.getElementById("announcer-picks").checked = false;
    document.getElementById("announcer-pick-form").style.display = "none";
  }
  loadLeaderboards()
};
document.getElementById("season").onchange = function () {
  loadLeaderboards()
};
document.getElementById("my-picks").onchange = function () {
  if (document.getElementById("announcer-picks").checked) {
        document.getElementById("announcer-picks").checked = false;
  }
  loadLeaderboards();
};
document.getElementById("announcer-picks").onchange = function () {
  if (document.getElementById("my-picks").checked) {
        document.getElementById("my-picks").checked = false;
  }
  loadLeaderboards();
};
loadLeaderboards();
