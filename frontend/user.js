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
          } else if (this.status == 401 || this.status == 403) {
             localStorage.removeItem("jwt");
             window.location.href = "./login.html";
         }
     }
    };
};

document.forms.userUpdate.addEventListener('submit', e => {
  e.preventDefault();

  let formData = new FormData(e.target);
  formData.set('profilePic', document.getElementById('profilePic').files[0]);

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
           }
       }
      };
      return false;
});

getUser();
