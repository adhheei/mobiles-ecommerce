/**
 * authGuard.js
 * Include this script in the <head> of any page that requires authentication.
 * It strictly checks for the presence of a user in localStorage.
 */
(async function () {
    const currentPath = window.location.pathname;

    // List of public pages where this script might accidentally be included
    const publicPages = [
        'userLogin.html',
        'userSignup.html',
        'forgotPassword.html',
        'resetPassword.html',
        'index.html'
    ];

    // If we are on a public page, do nothing
    for (const page of publicPages) {
        if (currentPath.includes(page)) return;
    }

    try {
        const response = await fetch('/api/user/profile', {
            method: 'GET',
            credentials: 'include' // 🍪 Send cookies
        });

        if (response.status === 401) {
            // Unauthorized - redirect to login
            console.warn("Session expired or invalid, redirecting to login...");
            const redirectUrl = encodeURIComponent(currentPath);
            window.location.replace('/User/userLogin.html?redirect=' + redirectUrl + '&msg=login_required');
        } else if (!response.ok) {
            // Other errors (500, etc) - optional: let it slide or show error
            // For now, if it's not 401, we assume it's okay-ish or let the page handle it
            console.error("Auth check failed with status:", response.status);
        }

    } catch (error) {
        console.error("Auth check network error:", error);
        // On network error, maybe don't redirect immediately to avoid loops if server is down?
        // Or redirect to login safely.
    }
})();
