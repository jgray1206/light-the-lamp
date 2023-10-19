function getURLParameter(sParam) {
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split("&");
  for (var i = 0; i < sURLVariables.length; i++) {
    var sParameterName = sURLVariables[i].split("=");
    if (sParameterName[0] == sParam) {
      return sParameterName[1];
    }
  }
}

if (!getURLParameter("resetUuid")) {
  window.location.href = "./login.html";
}

function resetPass() {
  const resetUuid = getURLParameter("resetUuid")
  const password = document.getElementById("password").value;

  const xhttp = new XMLHttpRequest();
  xhttp.open("PUT", "/api/passwordreset?password=" + password + "&uuid=" + resetUuid);
  xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhttp.send();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        Swal.fire({
          text: "Password reset successfully! Please login now.",
          icon: "success",
          confirmButtonText: "OK",
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = "./login.html";
          }
        });
      } else {
        const objects = JSON.parse(this.responseText);
        console.log(objects);
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
}

document.getElementById("reset-form").onsubmit = function() {
    return resetPass();
}

document.getElementById("confirm-password").addEventListener('input', function() {
    var pass1 = document.getElementById("password");
    var pass2 = document.getElementById("confirm-password");
    pass2.setCustomValidity(pass2.value != pass1.value ? "Passwords do not match." : "");
    pass2.reportValidity();
}, true);
