var jwt = localStorage.getItem("jwt");
if (jwt == null) {
  window.location.href = "./login.html?redirect=" + encodeURIComponent(window.location.href);
}

document.getElementById("logout").onclick = function () {
  localStorage.removeItem("jwt");
  window.location.href = "./login.html";
};

document.getElementById("toPicks").onclick = function () {
  window.location.href = "./index.html";
};

document.getElementById("toLeaderboard").onclick = function () {
  window.location.href = "./leaderboard.html";
};

document.getElementById("toProfile").onclick = function () {
  window.location.href = "./profile.html";
};

document.getElementById("toFriends").onclick = function () {
  window.location.href = "./friends.html";
};

function getURLParameter(sParam) {
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split("&");
  for (var i = 0; i < sURLVariables.length; i++) {
    var sParameterName = sURLVariables[i].split("=");
    if (sParameterName[0] == sParam) {
      return sParameterName[1];
    }
  }
}