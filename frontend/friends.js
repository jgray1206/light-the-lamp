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
        document.getElementById("friend-link").value =
          "https://www.lightthelamp.dev/friends.html?addFriend=" +
          user.confirmationUuid;
        console.log(user);
        if (user.friends == undefined || user.friends.length == 0) {
          document
            .getElementById("card-body")
            .append(
              "You don't have any friends yet! Send your link to your friends and have them click it."
            );
        } else {
          tbody = document.getElementById("friends-table");
          user.friends.forEach(function (friend) {
            tr = document.createElement("tr");
            picTd = document.createElement("td");
            picTdImg = document.createElement("img");
            picTdImg.width = "150";
            picTdImg.height = "150";
            picTdImg.className = "img-thumbnail";
            getPic(friend.id, picTdImg);
            picTd.appendChild(picTdImg);
            tr.appendChild(picTd);

            nameTd = document.createElement("td");
            if (friend.displayName) {
              nameTd.innerHTML = friend.displayName;
            } else {
              nameTd.innerHTML = "No display name:(";
            }
            tr.appendChild(nameTd);

            removeButtonTd = document.createElement("td");
            removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "btn btn-danger";
            removeButton.innerHTML = "Remove";
            removeButton.onclick = function () {
              removeFriend(friend.id);
            };
            removeButtonTd.appendChild(removeButton);
            tr.appendChild(removeButtonTd);

            tbody.appendChild(tr);
          });
        }
      } else if (this.status == 401 || this.status == 403) {
        localStorage.removeItem("jwt");
        window.location.href = "./login.html?redirect=" + encodeURIComponent(window.location.href);
      }
    }
  };
}

document.getElementById("copy-button").onclick = function () {
  // Get the text field
  var copyText = document.getElementById("friend-link");

  // Select the text field
  copyText.select();
  copyText.setSelectionRange(0, 99999); // For mobile devices

  // Copy the text inside the text field
  navigator.clipboard.writeText("Add me on Light the Lamp! " + copyText.value);
}

function removeFriend(id) {
  Swal.fire({
    text: "Are you sure you want to delete this friend?",
    icon: "error",
    confirmButtonText: "YES",
    showCancelButton: true
  }).then((result) => {
    if (result.isConfirmed) {
      const xhttp = new XMLHttpRequest();
      xhttp.open("DELETE", "/api/friends/" + id);
      xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      xhttp.setRequestHeader("Authorization", "Bearer " + jwt);
      xhttp.send();
      xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
          if (this.status == 200) {
            window.location.href = "./friends.html";
          } else if (this.status == 401 || this.status == 403) {
            localStorage.removeItem("jwt");
            window.location.href = "./login.html?redirect=" + encodeURIComponent(window.location.href);
          }
        }
      };
    }
  });
}

function getPic(id, picTdImg) {
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/api/user/" + id + "/pic");
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.setRequestHeader("Authorization", "Bearer " + jwt);
  xhttp.send();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        picTdImg.src = "data:image/png;base64," + this.responseText;
      } else if (this.status == 401 || this.status == 403) {
        localStorage.removeItem("jwt");
        window.location.href = "./login.html?redirect=" + encodeURIComponent(window.location.href);
      } else {
        picTdImg.src = "/shrug.png";
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
      if (this.status == 200) {
        window.location.href = "./friends.html";
      } else if (this.status == 401 || this.status == 403) {
        localStorage.removeItem("jwt");
        window.location.href = "./login.html?redirect=" + encodeURIComponent(window.location.href);
      } else if (this.status >= 500) {
        var response = JSON.parse(this.responseText);
        Swal.fire({
          text:
            response["_embedded"]["errors"][0]["message"] ||
            response["message"],
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  };
}

var tooltip = new bootstrap.Tooltip(document.getElementById("copy-button"), {
  trigger: "click",
});
document.getElementById("copy-button").addEventListener("click", () => {
  setTimeout(() => tooltip.hide(), 1500);
});
loadFriends();
