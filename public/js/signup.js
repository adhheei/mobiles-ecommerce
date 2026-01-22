// PASSWORD VISIBILITY TOGGLE
document.querySelectorAll(".password-toggle").forEach(icon => {
  icon.addEventListener("click", () => {
    const input = icon.closest(".input-group").querySelector("input");
    input.type = input.type === "password" ? "text" : "password";
    icon.classList.toggle("fa-eye");
    icon.classList.toggle("fa-eye-slash");
  });
});

// SIGNUP FORM SUBMIT
document.getElementById("signupForm").addEventListener("submit", async e => {
  e.preventDefault();

  const data = {
    firstName: firstName.value,
    lastName: lastName.value,
    email: email.value,
    phone: phone.value,
    password: password.value,
    confirmPassword: confirmPassword.value
  };

  try {
    const res = await fetch("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    alert(result.message);

    if (res.ok) {
      window.location.href = "userLogin.html";
    }
  } catch (err) {
    alert("Something went wrong");
  }
});

// GOOGLE SIGNUP (UNCHANGED)
function handleCredentialResponse(response) {
  alert("Google signup successful");
}

window.onload = function () {
  google.accounts.id.initialize({
    client_id: "YOUR_GOOGLE_CLIENT_ID",
    callback: handleCredentialResponse
  });

  google.accounts.id.renderButton(
    document.getElementById("google-btn-container"),
    {
      theme: "outline",
      size: "large",
      width: "420",
      text: "signup_with"
    }
  );
};

// GOOGLE SIGNUP FUNCTIONALITY
function handleCredentialResponse(response) {
  fetch("http://localhost:3000/api/auth/google-signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      credential: response.credential,
    }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Signup successful");
        window.location.href = "userLogin.html";
      } else {
        alert(data.message);
      }
    })
    .catch(() => alert("Google signup failed"));
}

window.onload = function () {
  google.accounts.id.initialize({
    client_id: "YOUR_GOOGLE_CLIENT_ID",
    callback: handleCredentialResponse,
  });

  google.accounts.id.renderButton(
    document.getElementById("google-btn-container"),
    {
      theme: "outline",
      size: "large",
      width: "420",
      text: "signup_with",
      shape: "pill",
    }
  );
};
