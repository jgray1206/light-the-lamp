function getUser() {
    const xhttp3 = new XMLHttpRequest();
    xhttp3.open("GET", "/api/user");
    xhttp3.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp3.setRequestHeader("Authorization", "Bearer " + jwt);
    xhttp3.send();
    xhttp3.onreadystatechange = function () {
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

getUser();
