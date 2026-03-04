// adminCommon.js

/**
 * Global Sidebar Toggle Function
 * Handles both desktop (collapsed) and mobile (active/overlay) states.
 */
window.toggleSidebar = function () {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    const mainContent = document.querySelector(".main-content");

    if (sidebar) {
        const wasActive = sidebar.classList.contains("active");
        sidebar.classList.toggle("active"); // Mobile
        sidebar.classList.toggle("collapsed"); // Desktop
        console.log(`[AdminCommon] Sidebar toggled. Active: ${sidebar.classList.contains("active")}, Collapsed: ${sidebar.classList.contains("collapsed")}`);
    }
    if (overlay) {
        overlay.classList.toggle("active");
    }
    if (mainContent) {
        mainContent.classList.toggle("collapsed");
    }
};

/**
 * Unified Admin Fetch Helper
 * Automatically adds Authorization header and credentials: include
 */
window.adminFetch = async function (url, options = {}) {
    const token = localStorage.getItem("adminToken");
    const headers = options.headers || {};

    const fetchOptions = {
        ...options,
        credentials: "include", // Ensure cookies are sent
        headers: {
            ...headers,
        },
    };

    // Only add Authorization header if token exists and is valid string
    if (token && token !== "undefined" && token !== "null") {
        fetchOptions.headers["Authorization"] = `Bearer ${token}`;
    }

    // Set Content-Type unless it's FormData
    if (!(options.body instanceof FormData) && !fetchOptions.headers["Content-Type"]) {
        fetchOptions.headers["Content-Type"] = "application/json";
    }

    return fetch(url, fetchOptions);
};

document.addEventListener("DOMContentLoaded", () => {
    // 1. Sidebar Toggle Listener
    const toggleSelectors = [
        "#toggleSidebar",
        "#sidebarToggleBtn",
        ".mobile-nav button",
        "#sidebarOverlay"
    ];

    const elements = new Set();
    toggleSelectors.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) {
            console.log(`[AdminCommon] Sidebar toggle listener attached to: ${selector}`);
            elements.add(el);
        }
    });

    elements.forEach(el => {
        el.addEventListener("click", (e) => {
            console.log(`[AdminCommon] Sidebar toggle clicked on element:`, el);
            e.preventDefault();
            window.toggleSidebar();
        });
    });

    // 2. Logout Logic
    const logoutBtn = document.getElementById("logoutBtn") || document.querySelector(".logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();

            const result = await Swal.fire({
                title: "Logout?",
                text: "Are you sure you want to end your session?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#1a1a1a",
                cancelButtonColor: "#d33",
                confirmButtonText: "Yes, Logout",
            });

            if (result.isConfirmed) {
                try {
                    await window.adminFetch("/api/auth/logout", { method: "POST" });
                } catch (err) {
                    console.error("Logout API failed", err);
                }

                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminInfo");

                Swal.fire({
                    title: "Logged Out",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                }).then(() => {
                    window.location.href = "/Admin/adminLogin.html";
                });
            }
        });
    }

    // 3. Highlight Active Link
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".sidebar .menu-link, .sidebar .nav-link");
    navLinks.forEach((link) => {
        const href = link.getAttribute("href");
        if (href && (currentPath.includes(href) || (href !== "#" && currentPath.endsWith(href)))) {
            link.classList.add("active");
        }
    });

    // 4. Update Admin Info in Sidebar
    const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");
    const sidebarName = document.getElementById("sidebarName");
    if (sidebarName && adminInfo.email) {
        sidebarName.textContent = adminInfo.name || "Admin";
        const emailSpan = sidebarName.nextElementSibling;
        if (emailSpan && emailSpan.tagName === "SPAN") {
            emailSpan.textContent = adminInfo.email;
        }
    }
});
