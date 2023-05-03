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
            xhttp.open("GET", "/api/user");
            xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
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
                    if (user.profilePic) {
                        document.getElementById("profilePicPreview").src = "data:image/png;base64," + user.profilePic;
                    }
                    var index = 0;
                    teams.forEach((team) => {
                        var option = document.createElement("option");
                        option.value = team.id;
                        option.innerHTML = team.teamName;
                        var teamSelect = document.getElementById("teams");
                        teamSelect.append(option);
                        if (user.teams?.some((userTeam) => team.id == userTeam.id) == true) {
                            teamSelect.options[index].selected = true;
                        }
                        index++;
                    });
                  } else if (this.status == 401 || this.status == 403) {
                     localStorage.removeItem("jwt");
                     window.location.href = "./login.html";
                 }
             }
            };
        }
    }
    }
};

document.forms.userUpdate.addEventListener('submit', e => {
  e.preventDefault();

  let formData = new FormData();
  if (document.getElementById('profilePic').files[0]) {
    formData.set('profilePic', document.getElementById('profilePic').files[0]);
  }
  if (document.getElementById('displayName').value) {
    formData.set('displayName', document.getElementById('displayName').value);
  }
  var teamOptions = document.getElementById('teams').selectedOptions;
  var teamValues = Array.from(teamOptions).map(({ value }) => value);
  formData.set('teams', teamValues);

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
               window.location.href = "./login.html";
           } else if (this.status == 413) {
              Swal.fire({
                text: "Picture is too large! Please select a picture smaller than 1MB.",
                icon: "error",
                confirmButtonText: "OK",
              });
           } else if (this.status == 400) {
             Swal.fire({
               text: objects["_embedded"]["errors"][0]["message"] || objects["message"],
               icon: "error",
               confirmButtonText: "OK",
             });
           }
       }
      };
      return false;
});

getUser();
