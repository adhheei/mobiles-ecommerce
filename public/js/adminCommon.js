// adminCommon.js

document.addEventListener("DOMContentLoaded", () => {
    // 1. Sidebar Toggle Logic
    const toggleBtn = document.getElementById("toggleSidebar");
    const sidebar = document.querySelector(".sidebar");
    const mainContent = document.querySelector(".main-content");

    if (toggleBtn && sidebar && mainContent) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");
            mainContent.classList.toggle("collapsed");
        });
    }

    // 2. Logout Logic
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();

            const result = await Swal.fire({
                title: "Logout?",
                text: "Are you sure you want to end your session?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#000",
                cancelButtonColor: "#d33",
                confirmButtonText: "Yes, Logout"
            });

            if (result.isConfirmed) {
                try {
                    await fetch("/api/auth/logout", { method: "POST" });
                } catch (err) {
                    console.error("Logout API failed", err);
                }

                // Clear any leftover local storage just in case (though we stopped using it)
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminInfo");

                Swal.fire({
                    title: "Logged Out",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = "/Admin/adminLogin.html";
                });
            }
        });
    }

    // 3. Highlight Active Link
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".sidebar .nav-link");
    navLinks.forEach(link => {
        if (link.getAttribute("href") && currentPath.includes(link.getAttribute("href"))) {
            link.classList.add("active");
        }
    });
});
