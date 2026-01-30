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
document.getElementById("signupForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const signupBtn = document.getElementById("signupBtn");
  const originalBtnText = signupBtn.innerText;
  signupBtn.disabled = true;
  signupBtn.innerText = "Sending Code...";

  const data = {
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    password: document.getElementById("password").value,
    confirmPassword: document.getElementById("confirmPassword").value,
  };

  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    // Handle 409: Already Verified
    if (res.status === 409) {
      Swal.fire({
        icon: 'warning',
        title: 'Already Registered',
        text: result.message || 'This email is already registered. Please login.',
        confirmButtonText: 'Login Now'
      }).then((r) => {
        if (r.isConfirmed) {
          window.location.href = "userLogin.html";
        }
      });
      signupBtn.disabled = false;
      signupBtn.innerText = originalBtnText;
      return;
    }

    // Handle Success (200: OTP Sent)
    if (res.ok) {
      Swal.fire({
        icon: 'success',
        title: 'OTP Sent!',
        text: 'Please check your email for the verification code.',
        showConfirmButton: false,
        timer: 2000
      });

      // Hide Signup Form Elements (except container if needed)
      // Just hiding the form children to be safe and simple
      document.querySelectorAll('#signupForm > div:not(#otpSection), #signupForm > button, #signupForm > .divider, #signupForm > #google-btn-container').forEach(el => el.classList.add('d-none'));

      // Show OTP Section
      const otpSection = document.getElementById("otpSection");
      otpSection.classList.remove("d-none");
      document.getElementById("otpEmailDisplay").innerText = data.email;

      startOtpTimer();

    } else if (res.status === 503) {
      Swal.fire({
        icon: 'warning',
        title: 'Service Temporarily Unavailable',
        text: result.message || 'OTP service is down. Please try again later.',
      });
      signupBtn.disabled = false;
      signupBtn.innerText = originalBtnText;

    } else {
      // Other errors (400, 500)
      Swal.fire({
        icon: 'error',
        title: 'Signup Failed',
        text: result.message || 'An error occurred',
      });
      signupBtn.disabled = false;
      signupBtn.innerText = originalBtnText;
    }
  } catch (error) {
    console.error("Signup error:", error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'An error occurred during signup',
    });
    signupBtn.disabled = false;
    signupBtn.innerText = originalBtnText;
  }
});

// OTP Logic
let timerInterval;

function startOtpTimer() {
  let timeLeft = 30; // 30 seconds cooldown
  const resendBtn = document.getElementById("resendOtpBtn");
  const timerSpan = document.getElementById("timerSpan");

  resendBtn.disabled = true;
  timerSpan.innerText = `(${timeLeft}s)`;

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    timerSpan.innerText = `(${timeLeft}s)`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      resendBtn.disabled = false;
      timerSpan.innerText = "";
    }
  }, 1000);
}

// Global scope for onclick handlers
window.verifyOTP = async function () {
  const otp = document.getElementById("otpInput").value;
  const email = document.getElementById("otpEmailDisplay").innerText;

  if (otp.length !== 6) {
    return Swal.fire('Invalid OTP', 'Please enter a 6-digit code', 'warning');
  }

  try {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    const result = await res.json();

    if (res.ok) {
      // Save Token Logic (Login immediately on verification)
      localStorage.setItem('user', JSON.stringify(result.user));
      if (result.token) localStorage.setItem('token', result.token);

      Swal.fire({
        icon: 'success',
        title: 'Verified & Logged In!',
        text: 'Redirecting to home...',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        window.location.href = "index.html";
      });
    } else {
      Swal.fire('Verification Failed', result.message, 'error');
    }
  } catch (error) {
    console.error(error);
    Swal.fire('Error', 'Verification failed', 'error');
  }
};

window.resendOTP = async function () {
  const email = document.getElementById("otpEmailDisplay").innerText;

  try {
    const res = await fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      Swal.fire({
        icon: 'success',
        title: 'OTP Resent',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      });
      startOtpTimer();
    } else {
      const data = await res.json();
      Swal.fire('Error', data.message, 'error');
    }
  } catch (error) {
    console.error(error);
    Swal.fire('Error', 'Failed to resend OTP', 'error');
  }
};

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

  if (YOUR_GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID" || !YOUR_GOOGLE_CLIENT_ID) {
    console.warn("⚠️ Google Client ID is not set. Google Sign-In is disabled.");
    document.getElementById("google-btn-container").style.display = "none";
    return;
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
