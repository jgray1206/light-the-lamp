function getUser() {
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
            user.teams.forEach(team =>
                var option = document.createElement("option");
                option.value = team.id;
                option.innerHTML = team.teamName;
                var teamSelect = document.getElementById("team");
                teamSelect.append(option);
                teamSelect.options[index].selected = true;
                index++;
            )
          } else if (this.status == 401 || this.status == 403) {
             localStorage.removeItem("jwt");
             window.location.href = "./login.html";
         }
     }
    };
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
                  window.location.href = "./user.html";
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
