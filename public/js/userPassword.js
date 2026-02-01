document.addEventListener("DOMContentLoaded", () => {
    const saveBtn = document.getElementById("savePasswordBtn");

    if (!saveBtn) return; // safety check

    saveBtn.addEventListener("click", async () => {
        const currentPassword = document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            alert("All fields are required");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        try {
            const res = await fetch("/api/user/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message);
                return;
            }

            alert(data.message);
            window.location.href = "/login.html";
        } catch (error) {
            console.error(error);
            alert("Something went wrong");
        }
    });
});
