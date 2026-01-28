/**
 * authGuard.js
 * Include this script in the <head> of any page that requires authentication.
 * It strictly checks for the presence of a user in localStorage.
 */
(function () {
    function checkAuth() {
        const user = localStorage.getItem('user');
        const currentPath = window.location.pathname;

        // List of public pages where this script might accidentally be included
        // (Safety check, though we should only include it in protected pages)
        const publicPages = [
            'userLogin.html',
            'userSignup.html',
            'forgotPassword.html',
            'resetPassword.html',
            'index.html'
        ];

        // If we are on a public page, do nothing (shouldn't happen if used correctly)
        for (const page of publicPages) {
            if (currentPath.includes(page)) return;
        }

        if (!user) {
            // Save current location for redirect after login
            const redirectUrl = encodeURIComponent(currentPath);
            window.location.replace('/User/userLogin.html?redirect=' + redirectUrl + '&msg=login_required');

            // Stop further execution and hide body to prevent flash content
            // (Though script in <head> usually runs before body render)
            document.documentElement.style.display = 'none';
        }
    }

    checkAuth();
})();
