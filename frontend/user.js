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
                document.getElementById("profilePic").value = user.profilePic;
            }
          } else if (this.status == 401 || this.status == 403) {
             localStorage.removeItem("jwt");
             window.location.href = "./login.html";
         }
     }
    };
};

function getBase64(file) {
   var reader = new FileReader();
   reader.readAsDataURL(file);
   reader.onload = function () {
     console.log(reader.result);
   };
   reader.onerror = function (error) {
     console.log('Error: ', error);
   };
};

function updateUser() {
    const displayName = document.getElementById("displayName").value
    const profilePic = getBase64(document.getElementById("profilePic").files[0]);
    const xhttp = new XMLHttpRequest();
    xhttp.open("PUT", "/api/user");
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.setRequestHeader("Authorization", "Bearer " + jwt);
    xhttp.send(
        JSON.stringify({
          displayName: displayName,
          profilePic: profilePic
        })
      );
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4) {
          if (this.status == 200 || this.status == 204) {
            Swal.fire({
              text: "User update successful!",
              icon: "success",
              confirmButtonText: "OK",
            }).then((result) => {
              if (result.isConfirmed) {
                window.location.href = "./index.html";
              }
            });
          } else if (this.status == 401 || this.status == 403) {
             localStorage.removeItem("jwt");
             window.location.href = "./login.html";
         }
     }
    };
};

getUser();
