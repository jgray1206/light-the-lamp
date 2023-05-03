function loadFriends() {
    const xhttp = new XMLHttpRequest();
    xhttp.open("GET", "/api/user");
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.setRequestHeader("Authorization", "Bearer " + jwt);
    xhttp.send();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4) {
          if (this.status == 200) {
              var user = JSON.parse(this.responseText);
              document.getElementById("friend-link").value = "https://www.lightthelamp.dev/friends.html?addFriend="+user.confirmationUuid;
              console.log(user);
              if (user.friends == undefined || user.friends.length == 0) {
                  document.getElementById("card-body").append("You don't have any friends yet! Send your link to your friends and have them click it.");
              } else {
                  tbody = document.getElementById("friends-table");
                  user.friends.forEach(function (friend) {
                       tr = document.createElement("tr");
                       picTd = document.createElement("td");
                       picTdImd = document.createElement("imd");
                       picTdImg.src = "data:image/png;base64," + friend.profilePic;
                       picTd.appendChild(picTdImg);
                       tr.appendChild(picTd);

                       nameTd = document.createElement("td");
                       nameTd.innerHTML = friend.displayName;
                       tr.appendChild(nameTd);

                       removeButtonTd = document.createElement("td");
                       removeButton = document.createElement("button");
                       removeButton.type = "button";
                       removeButton.className = "btn btn-danger";
                       removeButton.innerHtml = "Remove";
                       removeButton.onclick = "removeFriend(\""+friend.confirmationUuid+"\");";

                       tr.appendChild(removeButton);

                       tbody.appendChild(tr);
                  });
              }
          } else if (this.status == 401 || this.status == 403) {
              localStorage.removeItem("jwt");
              window.location.href = "./login.html";
          }
        }
      };
}

function copyLink() {
  // Get the text field
  var copyText = document.getElementById("friend-link");

  // Select the text field
  copyText.select();
  copyText.setSelectionRange(0, 99999); // For mobile devices

   // Copy the text inside the text field
  navigator.clipboard.writeText("Add me on the Light the Lamp! "+copyText.value);
}

function removeFriend(confirmationUuid) {
    const xhttp = new XMLHttpRequest();
    xhttp.open("DELETE", "/api/friends/" + confirmationUuid);
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.setRequestHeader("Authorization", "Bearer " + jwt);
    xhttp.send();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
            if (this.status == 200) {
              window.location.href = "./friends.html";
            } else if (this.status == 401 || this.status == 403) {
              localStorage.removeItem("jwt");
              window.location.href = "./login.html";
            }
         }
    };
}

if (getURLParameter("addFriend")) {
    const xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/api/friends/" + getURLParameter("addFriend"));
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.setRequestHeader("Authorization", "Bearer " + jwt);
    xhttp.send();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
          if (this.status == 401 || this.status == 403) {
            localStorage.removeItem("jwt");
            window.location.href = "./login.html";
          } else if (this.status > 500) {
            var response = JSON.parse(this.responseText);
            Swal.fire({
                text: response["_embedded"]["errors"][0]["message"] || response["message"],
                icon: "error",
                confirmButtonText: "OK",
              });
          }
        }
    };
}

loadFriends();
