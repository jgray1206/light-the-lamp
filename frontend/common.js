var jwt = localStorage.getItem("jwt");
if (jwt == null) {
  window.location.href = "./login.html";
}

function logout() {
  localStorage.removeItem("jwt");
  window.location.href = "./login.html";
}

function toPicks() {
  window.location.href = "./index.html";
}

function toLeaderboard() {
  window.location.href = "./leaderboard.html";
}

function toUser() {
  window.location.href = "./user.html";
}

function toFriends() {
  window.location.href = "./friends.html";
}

function getURLParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++)
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam)
        {
            return sParameterName[1];
        }
    }
}