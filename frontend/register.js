var jwt = localStorage.getItem("jwt");
if (jwt != null) {
  window.location.href = "./index.html";
}

function teams() {
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", "https://www.lightthelamp.dev/api/teams");
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.send();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
        const options = JSON.parse(this.responseText);
        if (this.status == 200) {
            console.log(options);
            const batchTrack = document.getElementById("team");
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
  }
};

teams();

function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const e = document.getElementById("team");
  const teamId = parseInt(e.options[e.selectedIndex].value);

  const xhttp = new XMLHttpRequest();
  xhttp.open("POST", "https://www.lightthelamp.dev/api/user");
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.send(
    JSON.stringify({
      email: username,
      password: password,
      teamId: teamId
    })
  );
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      const objects = JSON.parse(this.responseText);
      console.log(objects);
      if (objects["id"]) {
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
          text: objects["_embedded"]["errors"][0]["message"],
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  };
  return false;
}