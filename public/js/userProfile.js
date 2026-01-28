document.addEventListener("DOMContentLoaded", async () => {
    const firstNameEl = document.getElementById("firstName");
    const lastNameEl = document.getElementById("lastName");
    const emailEl = document.getElementById("email");
    const mobileEl = document.getElementById("mobile");

    // Function to fetch user profile
    const fetchProfile = async () => {
        try {
            // Check for token (handled by authGuard but double check doesn't hurt)
            // The authGuard.js usually ensures we're logged in before this script runs

            const response = await fetch("/api/user/profile", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    // 'Authorization': 'Bearer ' + token // If storing in localStorage
                },
            });

            if (response.status === 401) {
                // Unauthorized - redirect to login
                window.location.href = "/User/userLogin.html";
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to fetch profile");
            }

            const data = await response.json();

            if (data.success) {
                // Populate fields
                firstNameEl.innerText = data.user.firstName || "";
                lastNameEl.innerText = data.user.lastName || "";
                emailEl.innerText = data.user.email || "";
                mobileEl.innerText = data.user.phone || ""; // Mapping phone -> mobile
            } else {
                console.error("Failed to load profile:", data.message);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            // Optionally show an error message on UI
        }
    };

    fetchProfile();
});
