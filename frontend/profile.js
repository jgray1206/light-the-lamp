function getUser() {
  const xhttp1 = new XMLHttpRequest();
  xhttp1.open("GET", "/api/teams");
  xhttp1.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp1.setRequestHeader("Authorization", "Bearer " + jwt);
  xhttp1.send();
  xhttp1.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        const teams = JSON.parse(this.responseText);
        teams.sort((a, b) => a.teamName.localeCompare(b.teamName));
        console.log(teams);
        const xhttp = new XMLHttpRequest();
        xhttp.open("GET", "/api/user?profilePic=true");
        xhttp.setRequestHeader(
          "Content-Type",
          "application/json;charset=UTF-8"
        );
        xhttp.setRequestHeader("Authorization", "Bearer " + jwt);
        xhttp.send();
        xhttp.onreadystatechange = function () {
          if (this.readyState == 4) {
            if (this.status == 200) {
              const user = JSON.parse(this.responseText);
              console.log(user);
              if (user.displayName) {
                document.getElementById("displayName").value = user.displayName;
              }
              if (user.redditUsername) {
                document.getElementById("redditUsername").value = user.redditUsername;
              }
              if (user.profilePic) {
                document.getElementById("profilePicPreview").src =
                  "data:image/png;base64," + user.profilePic;
              } else {
                document.getElementById("profilePicPreview").src = "/shrug.png";
              }
              var index = 0;
              teams.forEach((team) => {
                var option = document.createElement("option");
                option.value = team.id;
                option.innerHTML = team.teamName;
                var teamSelect = document.getElementById("teams");
                teamSelect.append(option);
                if (
                  user.teams?.some((userTeam) => team.id == userTeam.id) == true
                ) {
                  teamSelect.options[index].selected = true;
                }
                index++;
              });
            } else if (this.status == 401 || this.status == 403) {
              localStorage.removeItem("jwt");
             window.location.href = "./login.html?redirect=" + encodeURIComponent(window.location.href);
            }
          }
        };
      }
    }
  };
}

document.forms.userUpdate.addEventListener("submit", (e) => {
  e.preventDefault();

  let formData = new FormData();
  if (document.getElementById("profilePic").files[0]) {
    formData.set("profilePic", document.getElementById("profilePic").files[0]);
  }
  if (document.getElementById("displayName").value) {
    formData.set("displayName", document.getElementById("displayName").value);
  }
  if (document.getElementById("redditUsername").value) {
    formData.set("redditUsername", document.getElementById("redditUsername").value);
  } else {
    formData.set("redditUsername", "");
  }
  if (document.getElementById("password").value) {
    formData.set("password", document.getElementById("password").value);
  }
  var teamOptions = document.getElementById("teams").selectedOptions;
  var teamValues = Array.from(teamOptions).map(({ value }) => value);
  formData.set("teams", teamValues);

  const xhttp = new XMLHttpRequest();
  xhttp.open("PUT", "/api/user");
  xhttp.setRequestHeader("Authorization", "Bearer " + jwt);
  xhttp.send(formData);
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200 || this.status == 204) {
        const objects = JSON.parse(this.responseText);
        console.log(objects);
        Swal.fire({
          text: "User update successful!",
          icon: "success",
          confirmButtonText: "OK",
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = "./profile.html";
          }
        });
      } else if (this.status == 401 || this.status == 403) {
        localStorage.removeItem("jwt");
        window.location.href = "./login.html?redirect=" + encodeURIComponent(window.location.href);
      } else if (this.status == 413) {
        Swal.fire({
          text: "Picture is too large! Please select a picture smaller than 1MB.",
          icon: "error",
          confirmButtonText: "OK",
        });
      } else if (this.status == 400) {
        const objects = JSON.parse(this.responseText);
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
});

getUser();

document.getElementById("confirm-password").addEventListener('input', function() {
    var pass1 = document.getElementById("password");
    var pass2 = document.getElementById("confirm-password");
    pass2.setCustomValidity(pass2.value != pass1.value ? "Passwords do not match." : "");
    pass2.reportValidity();
}, true);
