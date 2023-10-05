var jwt = localStorage.getItem("jwt");

if (jwt == null && window.location.pathname != "/about.html") {
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

document.getElementById("toAbout").onclick = function () {
  window.location.href = "./about.html";
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

function getPic(id, picTdImg) {
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/api/user/" + id + "/pic");
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.setRequestHeader("Authorization", "Bearer " + jwt);
  xhttp.send();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        if (this.responseText) {
            picTdImg.src = "data:image/png;base64," + this.responseText;
        } else {
            picTdImg.src = "/shrug.png";
        }
      } else if (this.status == 401 || this.status == 403) {
        localStorage.removeItem("jwt");
        window.location.href = "./login.html?redirect=" + encodeURIComponent(window.location.href);
      } else {
        picTdImg.src = "/shrug.png";
      }
    }
  };
};

function getSubFromJwt() {
    var base64Url = jwt.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload)['sub'];
}