// PASSWORD VISIBILITY TOGGLE
document.querySelectorAll(".password-toggle").forEach((icon) => {
  icon.addEventListener("click", () => {
    const input = icon.closest(".input-group").querySelector("input");
    input.type = input.type === "password" ? "text" : "password";
    icon.classList.toggle("fa-eye");
    icon.classList.toggle("fa-eye-slash");
  });
});

// SIGNUP FORM SUBMIT
document
  .getElementById("signupForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    console.log("Form submitted");

    const data = {
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      password: document.getElementById("password").value,
      confirmPassword: document.getElementById("confirmPassword").value,
    };

    try {
      // Use relative URL to avoid port mismatch issues
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        alert(result.message);
        window.location.href = "userLogin.html";
      } else {
        alert(result.message || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("An error occurred during signup");
    }
  });

// GOOGLE SIGNUP FUNCTIONALITY
function handleCredentialResponse(response) {
  fetch("/api/auth/google-signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      credential: response.credential,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        alert("Signup successful");
        window.location.href = "userLogin.html";
      } else {
        alert(data.message || "Google signup failed");
      }
    })
    .catch((err) => {
      console.error("Google signup error:", err);
      alert("Google signup failed");
    });
}

window.onload = function () {
  const YOUR_GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"; // TODO: Replace this with your actual Client ID

  if (YOUR_GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID") {
    console.warn("⚠️ Google Client ID is not set. Google Sign-In will not work.");
  }

  google.accounts.id.initialize({
    client_id: YOUR_GOOGLE_CLIENT_ID,
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
    },
  );
};
