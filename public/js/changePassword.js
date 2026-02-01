// Helper to get token
function getToken() {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
}

// Toggle Password Visibility
function togglePassword(inputId, iconSpan) {
    const input = document.getElementById(inputId);
    const icon = iconSpan.querySelector("i");

    if (!input || !icon) return;

    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
}

// Logout Utility
function handleLogout() {
    Swal.fire({
        title: 'Are you sure?',
        text: "You will be logged out!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#000',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, logout!'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem("token");
            localStorage.removeItem("jwt"); // Cleanup old key if exists
            localStorage.removeItem("user");
            sessionStorage.removeItem("token");
            document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.href = './userLogin.html';
        }
    });
}

// Safe JSON Parse helper (FIX)
function safeJsonParse(text) {
    try {
        return JSON.parse(text);
    } catch (e) {
        return null;
    }
}

// Handle Change Password Submit
async function handleChangePassword(e) {
    e.preventDefault();

    console.log("Form submitted");

    // 1. Safe Input Reading with querySelector
    const oldPasswordEl = document.querySelector("#oldPassword");
    const newPasswordEl = document.querySelector("#newPassword");
    const confirmPasswordEl = document.querySelector("#confirmPassword");

    if (!oldPasswordEl || !newPasswordEl || !confirmPasswordEl) {
        Swal.fire({
            icon: 'error',
            title: 'System Error',
            text: 'Input field not found. Check input IDs.'
        });
        return;
    }

    const oldPassword = oldPasswordEl.value.trim();
    const newPassword = newPasswordEl.value.trim();
    const confirmPassword = confirmPasswordEl.value.trim();

    console.log({ oldPassword, newPassword, confirmPassword });

    // 2. Token Check
    const token = getToken();

    if (!token) {
        Swal.fire({
            icon: 'error',
            title: 'Authentication Error',
            text: 'You are not logged in. Redirecting to login...'
        }).then(() => {
            window.location.href = './userLogin.html';
        });
        return;
    }

    // 3. Basic Empty Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
        Swal.fire({ icon: 'warning', title: 'Validation Error', text: 'All fields are required' });
        return;
    }

    // 4. Strict Validation Rules
    // Min 8 chars
    if (newPassword.length < 8) {
        Swal.fire({ icon: 'warning', title: 'Weak Password', text: 'Password must be at least 8 characters long.' });
        return;
    }
    // Uppercase
    if (!/[A-Z]/.test(newPassword)) {
        Swal.fire({ icon: 'warning', title: 'Weak Password', text: 'Password must contain at least one uppercase letter.' });
        return;
    }
    // Lowercase
    if (!/[a-z]/.test(newPassword)) {
        Swal.fire({ icon: 'warning', title: 'Weak Password', text: 'Password must contain at least one lowercase letter.' });
        return;
    }
    // Number
    if (!/\d/.test(newPassword)) {
        Swal.fire({ icon: 'warning', title: 'Weak Password', text: 'Password must contain at least one number.' });
        return;
    }
    // Special Char
    if (!/[!@#$%^&*]/.test(newPassword)) {
        Swal.fire({ icon: 'warning', title: 'Weak Password', text: 'Password must contain at least one special character (!@#$%^&*).' });
        return;
    }

    // Match Check
    if (newPassword !== confirmPassword) {
        Swal.fire({ icon: 'warning', title: 'Validation Error', text: 'New passwords do not match.' });
        return;
    }

    // Old vs New Check
    if (newPassword === oldPassword) {
        Swal.fire({ icon: 'warning', title: 'Validation Error', text: 'New password cannot be the same as old password.' });
        return;
    }

    try {
        const res = await fetch("/api/user/change-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                oldPassword: oldPassword,
                newPassword: newPassword,
                confirmPassword: confirmPassword
            })
        });

        // ✅ FIX: handle non-JSON responses safely
        const rawText = await res.text();
        const data = safeJsonParse(rawText) || { message: rawText };

        // Handle session invalid
        if (res.status === 401) {
            Swal.fire({
                icon: 'error',
                title: 'Session Expired',
                text: data.message || 'Please login again.'
            }).then(() => {
                handleLogout();
            });
            return;
        }

        // Handle forbidden (sometimes backend uses 403)
        if (res.status === 403) {
            Swal.fire({
                icon: 'error',
                title: 'Forbidden',
                text: data.message || 'You are not allowed to perform this action.'
            });
            return;
        }

        // Any other error
        if (!res.ok) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || "Failed to change password"
            });
            return;
        }

        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: data.message || 'Password changed successfully'
        }).then(() => {
            // Force logout so user logs in with new password
            handleLogout();
        });

    } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Error', text: "Server connection failed" });
    }
}

// Add Event Listener
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector("#changePasswordForm");
    if (form) {
        form.addEventListener("submit", handleChangePassword);
    }
});
