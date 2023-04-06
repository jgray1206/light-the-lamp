var jwt = localStorage.getItem("jwt");
if (jwt == null) {
  window.location.href = "./login.html";
}

function loadUser() {
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/api/user");
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.setRequestHeader("Authorization", "Bearer " + jwt);
  xhttp.send();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      const objects = JSON.parse(this.responseText);
      console.log(objects);
      if (this.status == 200) {
        //document.getElementById("username").innerHTML = objects["email"];
      }
    }
  };
}

function loadGames() {
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/api/game/user");
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.setRequestHeader("Authorization", "Bearer " + jwt);
  xhttp.send();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      const objects = JSON.parse(this.responseText);
      console.log(objects);
      if (this.status == 200) {
        //document.getElementById("username").innerHTML = objects["email"];
      }
    }
  };
}

function loadPicks() {
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/api/pick/user");
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.setRequestHeader("Authorization", "Bearer " + jwt);
  xhttp.send();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      const objects = JSON.parse(this.responseText);
      console.log(objects);
      if (this.status == 200) {
        //document.getElementById("username").innerHTML = objects["email"];
      }
    }
  };
}

loadUser();
loadGames();
loadPicks();

function logout() {
  localStorage.removeItem("jwt");
  window.location.href = "./login.html";
}