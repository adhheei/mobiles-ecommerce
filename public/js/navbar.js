
// navbar.js - Global navbar functionality

// navbar.js - Global navbar functionality

// Function to load the navbar dynamically
async function loadNavbar() {
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) return;

    try {
        const response = await fetch('/components/navbar.html');
        if (!response.ok) throw new Error('Failed to load navbar');

        const html = await response.text();
        placeholder.innerHTML = html;

        // Initialize features after navbar is loaded
        initializeNavbarFeatures();
        setActiveLink();

        // Close User Dropdown when clicking outside
        document.addEventListener('click', function (e) {
            // Close User Dropdown (target any shown dropdown toggle not clicked)
            const userDropdownToggle = document.querySelector('.nav-icons .dropdown-toggle.show');
            if (userDropdownToggle && !userDropdownToggle.contains(e.target)) {
                const dropdownMenu = userDropdownToggle.nextElementSibling;
                if (dropdownMenu) {
                    dropdownMenu.classList.remove('show');
                    userDropdownToggle.classList.remove('show');
                    userDropdownToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });

        // Add click outside listener to close navbar mobile menu
        document.addEventListener('click', function (event) {
            const navbarCollapse = document.getElementById('navbarNav');
            const navbarToggler = document.querySelector('.navbar-toggler');

            if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                // Check if click is outside navbar and toggler
                if (!navbarCollapse.contains(event.target) && !navbarToggler.contains(event.target)) {
                    const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
                        toggle: false
                    });
                    bsCollapse.hide();
                }
            }
        });

    } catch (error) {
        console.error('Error loading navbar:', error);
    }
}

// Set active link based on current URL
function setActiveLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && (currentPath.includes(href.replace('./', '')) || (currentPath === '/' && href.includes('index.html')))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Main initialization function
function initializeNavbarFeatures() {
    const navbarSearch = document.getElementById('navbarSearch');

    // Create autocomplete dropdown container
    const autocompleteContainer = document.createElement('div');
    autocompleteContainer.id = 'search-autocomplete';
    autocompleteContainer.className = 'autocomplete-dropdown d-none';
    if (navbarSearch) {
        navbarSearch.parentElement.style.position = 'relative'; // Ensure parent is relative
        navbarSearch.parentElement.appendChild(autocompleteContainer);
    }

    // Add CSS for autocomplete
    const style = document.createElement('style');
    style.innerHTML = `
        .autocomplete-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            z-index: 1050;
            max-height: 400px;
            overflow-y: auto;
        }
        .autocomplete-item {
            padding: 10px 15px;
            border-bottom: 1px solid #f1f1f1;
            cursor: pointer;
            display: flex;
            align-items: center;
        }
        .autocomplete-item:last-child {
            border-bottom: none;
        }
        .autocomplete-item:hover {
            background-color: #f8f9fa;
        }
        .suggestion-group {
            padding: 8px 15px;
            font-size: 0.75rem;
            font-weight: 700;
            color: #6c757d;
            background: #f8f9fa;
            text-transform: uppercase;
        }
        .suggestion-img {
            width: 40px;
            height: 40px;
            object-fit: cover;
            border-radius: 4px;
            margin-right: 12px;
        }
        .suggestion-text {
            display: flex;
            flex-direction: column;
        }
        .suggestion-name {
            font-size: 0.9rem;
            font-weight: 500;
            color: #333;
        }
        .suggestion-sub {
            font-size: 0.75rem;
            color: #888;
        }
    `;
    document.head.appendChild(style);

    if (navbarSearch) {
        // Debounce function
        function debounce(func, wait) {
            let timeout;
            return function (...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!navbarSearch.contains(e.target) && !autocompleteContainer.contains(e.target)) {
                autocompleteContainer.classList.add('d-none');
            }
        });

        // Handle input for autocomplete
        navbarSearch.addEventListener('input', debounce(async (e) => {
            const query = e.target.value.trim();

            if (query.length < 1) {
                autocompleteContainer.classList.add('d-none');
                autocompleteContainer.innerHTML = '';
                return;
            }

            try {
                const res = await fetch(`/api/admin/search/suggestions?q=${encodeURIComponent(query)}`);
                const data = await res.json();

                if (data.success && data.suggestions && data.suggestions.length > 0) {
                    renderSuggestions(data.suggestions);
                } else {
                    autocompleteContainer.classList.add('d-none');
                }
            } catch (err) {
                console.error('Error fetching suggestions:', err);
            }
        }, 300));

        // Render suggestions
        function renderSuggestions(suggestions) {
            autocompleteContainer.innerHTML = '';
            autocompleteContainer.classList.remove('d-none');

            // Group by type
            const categories = suggestions.filter(s => s.type === 'category');
            const products = suggestions.filter(s => s.type === 'product');

            if (categories.length > 0) {
                // Header
                const catHeader = document.createElement('div');
                catHeader.className = 'suggestion-group';
                catHeader.innerText = 'Categories';
                autocompleteContainer.appendChild(catHeader);

                categories.forEach(cat => {
                    const div = document.createElement('div');
                    div.className = 'autocomplete-item';
                    div.innerHTML = `<span class="suggestion-name"><i class="fa-solid fa-layer-group me-2 text-secondary"></i>${cat.label}</span>`;
                    div.onclick = () => window.location.href = `./productPage.html?category=${cat.id}`;
                    autocompleteContainer.appendChild(div);
                });
            }

            if (products.length > 0) {
                // Header
                const prodHeader = document.createElement('div');
                prodHeader.className = 'suggestion-group';
                prodHeader.innerText = 'Products';
                autocompleteContainer.appendChild(prodHeader);

                products.forEach(prod => {
                    const div = document.createElement('div');
                    div.className = 'autocomplete-item';
                    div.innerHTML = `
                    <img src="${prod.image || '/images/logo.jpg'}" class="suggestion-img" onerror="this.src='/images/logo.jpg'" />
                    <div class="suggestion-text">
                        <span class="suggestion-name">${prod.label}</span>
                    </div>
                  `;
                    div.onclick = () => window.location.href = prod.url;
                    autocompleteContainer.appendChild(div);
                });
            }
        }

        // Check if we are currently on the product page
        const isProductPage = window.location.pathname.includes('productPage.html');

        if (!isProductPage) {
            // Handle 'Enter' key press to redirect
            navbarSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = navbarSearch.value.trim();
                    if (query) {
                        window.location.href = `./productPage.html?search=${encodeURIComponent(query)}`;
                    }
                }
            });

            // Handle search icon click
            const searchIcon = navbarSearch.parentElement.querySelector('.fa-magnifying-glass');
            if (searchIcon) {
                searchIcon.addEventListener('click', () => {
                    const query = navbarSearch.value.trim();
                    if (query) {
                        window.location.href = `./productPage.html?search=${encodeURIComponent(query)}`;
                    }
                });
            }
        }
    }



    // Check login state
    checkUserLogin();
}

document.addEventListener('DOMContentLoaded', () => {
    // If placeholder exists, load dynamic navbar
    if (document.getElementById('navbar-placeholder')) {
        loadNavbar();
    } else {
        // Fallback for pages without placeholder (like login)
        initializeNavbarFeatures();
    }
});



// Check for User Login State
async function checkUserLogin() {
    let user = JSON.parse(localStorage.getItem('user'));
    const navIcons = document.querySelector('.nav-icons');

    if (!navIcons) return;

    const renderLoggedInParams = (userData) => {
        // Find existing login button
        const loginBtn = document.getElementById('nav-login');
        if (loginBtn) loginBtn.remove();

        // Check if dropdown already exists
        let userDropdown = document.querySelector('.dropdown.ms-4');
        if (!userDropdown) {
            userDropdown = document.createElement('div');
            userDropdown.className = 'dropdown ms-4';
            navIcons.appendChild(userDropdown);
        }

        // initial placeholder
        let avatarHtml = `<i class="fa-solid fa-user-circle fa-lg"></i>`;
        let userName = userData.firstName || (userData.name ? userData.name.split(' ')[0] : 'User');

        if (userData.profileImage) {
            let imgSrc = userData.profileImage;
            // Normalize path
            imgSrc = imgSrc.replace(/\\/g, "/");
            if (imgSrc.startsWith("public/")) imgSrc = imgSrc.replace("public/", "");
            if (!imgSrc.startsWith("http") && !imgSrc.startsWith("/")) {
                imgSrc = '/' + imgSrc;
            }
            if (!imgSrc.startsWith('http')) {
                imgSrc += (imgSrc.includes("?") ? "&" : "?") + `t=${new Date().getTime()}`;
            }

            avatarHtml = `<img src="${imgSrc}" alt="Avatar" class="rounded-circle border" style="width: 35px; height: 35px; object-fit: cover;">`;
        }

        userDropdown.innerHTML = `
            <a class="nav-link dropdown-toggle d-flex align-items-center gap-2 text-dark" href="#" role="button" aria-expanded="false" id="userDropdownToggle">
                <div id="nav-avatar-container" class="d-flex align-items-center justify-content-center" style="width: 35px; height: 35px;">
                    ${avatarHtml}
                </div>
                <span class="fw-bold" id="nav-username">${userName}</span>
            </a>
            <ul class="dropdown-menu dropdown-menu-end border-0 shadow-sm mt-2">
                <li><a class="dropdown-item" href="/User/userProfilePage.html"><i class="fa-solid fa-user me-2"></i>Profile</a></li>
                <li><a class="dropdown-item" href="/User/userWishListPage.html"><i class="fa-solid fa-heart me-2"></i>Wishlist</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item text-danger" href="#" onclick="handleLogout()"><i class="fa-solid fa-right-from-bracket me-2"></i>Logout</a></li>
            </ul>
        `;

        // Toggle logic
        const userToggle = userDropdown.querySelector('.dropdown-toggle');
        if (userToggle) {
            userToggle.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const menu = this.nextElementSibling;
                if (menu) {
                    menu.classList.toggle('show');
                    this.classList.toggle('show');
                    this.setAttribute('aria-expanded', this.classList.contains('show'));
                }
            });
        }
    };

    // Optimistic render if local user exists
    if (user) {
        renderLoggedInParams(user);
    }

    // Always verify with backend (Cookie Check)
    try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.user) {
                // Update Local Storage
                const userData = { ...data.user, name: data.user.firstName || 'User' };
                localStorage.setItem('user', JSON.stringify(userData));
                // Update UI (refreshes image/name)
                renderLoggedInParams(userData);
            }
        } else if (res.status === 401) {
            // Cookie invalid or expired
            localStorage.removeItem('user');
            localStorage.removeItem('token'); // Just in case

            // If we optimistically rendered, we must revert (reload or remove)
            if (user) {
                // Simplest way to clear UI is reload or remove element
                // Removing element is smoother
                const userDropdown = document.querySelector('.dropdown.ms-4');
                if (userDropdown) userDropdown.remove();

                // Restore Login Button if not present
                if (!document.getElementById('nav-login')) {
                    // We probably need to reload to restore original state or manually re-add text
                    // Reload is safer to ensure consistent state
                    // But might loop if checking on every page load?
                    // No, if localstorage is cleared, next load won't render optimistic.
                    // And 401 response means we stay logged out.
                    // So reload is acceptable ONLY if we were optimistically logged in.
                    window.location.reload();
                }
            }
        }
    } catch (err) {
        console.error("Auth check failed", err);
    }
}

// Handle Logout
// Helper to load SweetAlert2 dynamically
function loadSweetAlert() {
    return new Promise((resolve, reject) => {
        if (window.Swal) return resolve();
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Handle Logout with Confirmation
window.handleLogout = async function () {
    try {
        // Ensure SweetAlert2 is loaded
        await loadSweetAlert();

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You will be logged out.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#000',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Logout'
        });

        if (result.isConfirmed) {
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
            } catch (err) {
                console.warn('Logout API call failed, clearing local state anyway', err);
            }

            localStorage.removeItem('user');
            localStorage.removeItem('token');

            await Swal.fire({
                title: 'Logged Out',
                text: 'See you soon!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });

            window.location.href = '/User/index.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
        // Fallback force logout
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/User/index.html';
    }
};


