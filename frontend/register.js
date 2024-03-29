var jwt = localStorage.getItem("jwt");
if (jwt != null) {
  window.location.href = "./index.html";
}

function teams() {
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/api/teams");
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.send();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        const options = JSON.parse(this.responseText);
        console.log(options);
        options.sort(function (x, y) {
          return x.teamName == "Detroit Red Wings"
            ? -1
            : y.teamName == "Detroit Red Wings"
            ? 1
            : 0;
        });
        const batchTrack = document.getElementById("teams");
        for (option of options) {
          const newOption = document.createElement("option");
          newOption.value = option.id;
          newOption.text = option.teamName;
          batchTrack.appendChild(newOption);
        }
      } else {
        Swal.fire({
          text: "Failed to retrieve teams, please refresh.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  };
}

teams();

function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const displayName = document.getElementById("displayname").value;
  const redditUsername = document.getElementById("redditusername").value;
  const teams = document.getElementById("teams").selectedOptions;
  var teamValues = Array.from(teams).map(({ value }) => value);

  const xhttp = new XMLHttpRequest();
  xhttp.open("POST", "/api/user");
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  var jsonToSend = {
     email: username,
     password: password,
     teams: teamValues,
     displayName: displayName
  }
  if (redditUsername) {
    jsonToSend.redditUsername = redditUsername
  }
  xhttp.send(
    JSON.stringify(jsonToSend)
  );
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      const objects = JSON.parse(this.responseText);
      console.log(objects);
      if (this.status == 200) {
        Swal.fire({
          text: "Registration successful! Check your email to confirm your account.",
          icon: "success",
          confirmButtonText: "OK",
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = "./login.html";
          }
        });
      } else {
        Swal.fire({
          text:
            objects["_embedded"]["errors"][0]["message"] || objects["message"],
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  };
  return false;
}

document.getElementById("register-form").onsubmit = function() {
    return register();
}

document.getElementById("confirm-password").addEventListener('input', function() {
    var pass1 = document.getElementById("password");
    var pass2 = document.getElementById("confirm-password");
    pass2.setCustomValidity(pass2.value != pass1.value ? "Passwords do not match." : "");
    pass2.reportValidity();
}, true);
