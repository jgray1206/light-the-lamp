var jwt = localStorage.getItem("jwt");
if (jwt == null) {
  window.location.href = "./login.html";
}

function loadUser() {
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "https://www.lightthelamp.dev/api/user");
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.setRequestHeader("Authorization", "Bearer " + jwt);
  xhttp.send();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      const user = JSON.parse(this.responseText);
      if (this.status == 200) {
        document.getElementById("username").innerHTML = user["email"];
      }
    }
  };
}

loadUser();

function logout() {
  localStorage.removeItem("jwt");
  window.location.href = "./login.html";
}