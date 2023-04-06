var jwt = localStorage.getItem("jwt");
if (jwt != null) {
  window.location.href = "./index.html";
}

const batchTrack = document.getElementById("team");
console.log({ batchTrack });
const getPost = async () => {
  const response = await fetch("https://www.lightthelamp.dev/api/teams");
  const data = await response.json();
  return data;
};

const displayOption = async () => {
  const options = await getPost();
  for (option of options) {
    const newOption = document.createElement("option");
    newOption.value = option.id;
    newOption.text = option.teamName;
    batchTrack.appendChild(newOption);
  }
};

displayOption();

function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const xhttp = new XMLHttpRequest();
  xhttp.open("POST", "https://www.lightthelamp.dev/api/user");
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.send(
    JSON.stringify({
      email: username,
      password: password,
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