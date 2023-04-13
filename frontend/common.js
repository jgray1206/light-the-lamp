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