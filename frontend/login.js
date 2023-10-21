var jwt = localStorage.getItem("jwt");
if (jwt != null) {
  window.location.href = "./index.html";
}

document.getElementById("register").onclick = function () {
  location.href = "./register.html";
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

if (getURLParameter("confirmation")) {
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/api/user/confirm/" + getURLParameter("confirmation"));
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.send();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      const objects = JSON.parse(this.responseText);
      console.log(objects);
      if (objects["confirmed"] == true) {
        Swal.fire({
          text: "Account Confirmed! Please login.",
          icon: "success",
          confirmButtonText: "OK",
        });
      } else {
        Swal.fire({
          text: objects["message"],
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  };
}

function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const xhttp = new XMLHttpRequest();
  xhttp.open("POST", "/api/login");
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.send(
    JSON.stringify({
      username: username,
      password: password,
    })
  );
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      const objects = JSON.parse(this.responseText);
      if (objects["access_token"]) {
        localStorage.setItem("jwt", objects["access_token"]);
        if (getURLParameter("redirect")) {
            window.location.href = decodeURIComponent(getURLParameter("redirect"));
        } else {
            window.location.href = "./index.html";
        }
      } else {
        Swal.fire({
          text: objects["message"],
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  };
  return false;
}

document.getElementById("login-form").onsubmit = function() {
  return login()
}

document.getElementById("forgotpassword").onclick = function() {
    const username = document.getElementById("username").value;
    if (!username || username.trim().length === 0) {
       Swal.fire({
             text: "Please enter your email before clicking forgot password",
             icon: "error",
             confirmButtonText: "OK",
       });
       return;
    }

    const xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/api/passwordreset?email="+username);
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.send();
    xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        Swal.fire({
          text: "Password reset email sent! Check your email and click the link. If you don't find the email, do check your spam.",
          icon: "success",
          confirmButtonText: "OK",
        });
      } else {
        const objects = JSON.parse(this.responseText);
        Swal.fire({
          text: objects["_embedded"]["errors"][0]["message"] || objects["message"],
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  };
}