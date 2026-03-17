
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
        window.updateCartBadge(); // Update badge

        // Close User Dropdown when clicking outside
        document.addEventListener('click', function (e) {
            const dropdowns = document.querySelectorAll('.dropdown-toggle.show');
            dropdowns.forEach(toggle => {
                if (!toggle.contains(e.target)) {
                    const menu = toggle.nextElementSibling;
                    if (menu && !menu.contains(e.target)) {
                        menu.classList.remove('show');
                        toggle.classList.remove('show');
                    }
                }
            });
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
        if (href && (currentPath.includes(href.replace('./', '')) || (currentPath === '/' && (href === '/' || href.includes('index.html'))))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function formatImageUrl(path) {
    if (!path) return "/images/logo.jpg";
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    let cleanPath = path.replace(/\\/g, "/").replace(/^public\//, "").replace(/^User\//, "").replace(/^\//, "");
    return "/" + cleanPath;
}

// Main initialization function
function initializeNavbarFeatures() {
    const searchInputs = document.querySelectorAll('.navbarSearch');

    searchInputs.forEach(input => {
        // Create autocomplete dropdown container
        const autocompleteContainer = document.createElement('div');
        autocompleteContainer.className = 'autocomplete-dropdown d-none';
        input.parentElement.style.position = 'relative';
        input.parentElement.appendChild(autocompleteContainer);

        setupSearchInput(input, autocompleteContainer);
    });

    // Mobile Search Toggle
    const mobileSearchBtn = document.getElementById('mobileSearchBtn');
    const mobileSearchArea = document.getElementById('mobileSearchArea');
    if (mobileSearchBtn && mobileSearchArea) {
        mobileSearchBtn.addEventListener('click', () => {
            mobileSearchArea.classList.toggle('d-none');
            if (!mobileSearchArea.classList.contains('d-none')) {
                const input = mobileSearchArea.querySelector('input');
                if (input) input.focus();
            }
        });
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

    function setupSearchInput(input, autocompleteContainer) {
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
            if (!input.contains(e.target) && !autocompleteContainer.contains(e.target)) {
                autocompleteContainer.classList.add('d-none');
            }
        });

        // Handle input for autocomplete
        input.addEventListener('input', debounce(async (e) => {
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
                    renderSuggestions(data.suggestions, autocompleteContainer);
                } else {
                    autocompleteContainer.classList.add('d-none');
                }
            } catch (err) {
                console.error('Error fetching suggestions:', err);
            }
        }, 300));

        // Render suggestions
        function renderSuggestions(suggestions, container) {
            container.innerHTML = '';
            container.classList.remove('d-none');

            // Group by type
            const categories = suggestions.filter(s => s.type === 'category');
            const products = suggestions.filter(s => s.type === 'product');

            if (categories.length > 0) {
                const catHeader = document.createElement('div');
                catHeader.className = 'suggestion-group';
                catHeader.innerText = 'Categories';
                container.appendChild(catHeader);

                categories.forEach(cat => {
                    const div = document.createElement('div');
                    div.className = 'autocomplete-item';
                    div.innerHTML = `<span class="suggestion-name"><i class="fa-solid fa-layer-group me-2 text-secondary"></i>${cat.label}</span>`;
                    div.onclick = () => window.location.href = `/user/productPage.html?category=${cat.id}`;
                    container.appendChild(div);
                });
            }

            if (products.length > 0) {
                const prodHeader = document.createElement('div');
                prodHeader.className = 'suggestion-group';
                prodHeader.innerText = 'Products';
                container.appendChild(prodHeader);

                products.forEach(prod => {
                    const div = document.createElement('div');
                    div.className = 'autocomplete-item';
                    div.innerHTML = `
                    <img src="${formatImageUrl(prod.image)}" class="suggestion-img" onerror="this.src='/images/logo.jpg'" />
                    <div class="suggestion-text">
                        <span class="suggestion-name">${prod.label}</span>
                    </div>
                  `;
                    div.onclick = () => window.location.href = prod.url;
                    container.appendChild(div);
                });
            }
        }

        // Handle 'Enter' key press
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = input.value.trim();
                if (query) {
                    window.location.href = `/user/productPage.html?search=${encodeURIComponent(query)}`;
                }
            }
        });

        // Handle search icon click
        const searchIcon = input.parentElement.querySelector('.fa-magnifying-glass');
        if (searchIcon) {
            searchIcon.addEventListener('click', () => {
                const query = input.value.trim();
                if (query) {
                    window.location.href = `/user/productPage.html?search=${encodeURIComponent(query)}`;
                }
            });
        }
    }



    // Check login state
    checkUserLogin();
}




// --- Global Cart Badge Logic ---
window.updateCartBadge = async function () {
    try {
        // Find badge element (search for .fa-cart-shopping parent/sibling)
        // Assuming typical navbar structure: <a href="/user/cart.html" ...><i class="fa-solid fa-cart-shopping"></i> <span class="badge">...</span></a>
        // Let's look for a generic selector or specific ID if exists. 
        // If not, we will try to find it relative to the icon.

        // Strategy: find all cart icons and check for badge suffix
        const cartIcons = document.querySelectorAll('.fa-cart-shopping, .fa-shopping-cart');

        if (cartIcons.length === 0) return;

        // Fetch count
        const token = localStorage.getItem("token") || sessionStorage.getItem("token"); // Optional: if using cookies, this might be null but browser sends cookie

        // Logic: if not logged in (no cookie/token), count is 0? 
        // Or if using cookies, we just request.

        const res = await fetch('/api/user/cart/count', {
            method: 'GET',
            headers: {
                // If you use token-based auth mixed with cookies, include header if available
                ...(token ? { "Authorization": "Bearer " + token } : {})
            }
        });

        if (res.ok) {
            const data = await res.json();
            const count = data.count || 0;

            cartIcons.forEach(icon => {
                let badge = icon.parentElement.querySelector('.badge, .cart-badge');

                // If badge doesn't exist, create it
                if (!badge && count > 0) {
                    badge = document.createElement('span');
                    badge.className = 'position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger cart-badge';
                    badge.style.fontSize = '0.65rem';
                    icon.parentElement.style.position = 'relative'; // Ensure parent is relative
                    icon.parentElement.appendChild(badge);
                }

                if (badge) {
                    if (count > 0) {
                        badge.innerText = count > 9 ? '9+' : count;
                        badge.classList.remove('d-none');
                    } else {
                        badge.classList.add('d-none');
                    }
                }
            });
        } else {
            // If auth failed or other error, hide badge
            cartIcons.forEach(icon => {
                let badge = icon.parentElement.querySelector('.badge, .cart-badge');
                if (badge) badge.classList.add('d-none');
            });
        }
    } catch (error) {
        console.error("Failed to update cart badge:", error);
        // Hide badge on error
        const cartIcons = document.querySelectorAll('.fa-cart-shopping, .fa-shopping-cart');
        cartIcons.forEach(icon => {
            let badge = icon.parentElement.querySelector('.badge, .cart-badge');
            if (badge) badge.classList.add('d-none');
        });
    }
};

// Call on load
document.addEventListener('DOMContentLoaded', () => {
    // If placeholder exists, load dynamic navbar
    if (document.getElementById('navbar-placeholder')) {
        loadNavbar();
    } else {
        // Fallback for pages without placeholder (like login)
        initializeNavbarFeatures();
        window.updateCartBadge();
    }
});



// Check for User Login State
async function checkUserLogin() {
    const navIcons = document.querySelector('.nav-icons');
    if (!navIcons) return;

    const loginBtn = document.getElementById('nav-login');
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    // If no token exists, show login button immediately to prevent delay/flicker
    if (!token) {
        if (loginBtn) loginBtn.classList.remove('d-none');
        return;
    }

    const renderLoggedInParams = (userData) => {
        // Remove login button and mobile login item
        if (loginBtn) loginBtn.classList.add('d-none');
        const mobileLoginItem = document.getElementById('mobile-login-item');
        if (mobileLoginItem) mobileLoginItem.classList.add('d-none');

        // Initial placeholder/avatar
        let avatarHtml = `<i class="fa-solid fa-user-circle fa-lg"></i>`;
        let userName = userData.firstName || (userData.name ? userData.name.split(' ')[0] : 'User');

        if (userData.profileImage) {
            let imgSrc = formatImageUrl(userData.profileImage);
            if (!imgSrc.startsWith('http')) {
                imgSrc += (imgSrc.includes("?") ? "&" : "?") + `t=${new Date().getTime()}`;
            }
            avatarHtml = `<img src="${imgSrc}" alt="Avatar" class="rounded-circle border" style="width: 32px; height: 32px; object-fit: cover;">`;
        }

        // Inject into Desktop Container
        const desktopContainer = document.getElementById('desktop-user-container');
        if (desktopContainer) {
            desktopContainer.innerHTML = `
                <div class="dropdown">
                    <a class="nav-link dropdown-toggle d-flex align-items-center gap-2 text-dark" href="#" role="button" aria-expanded="false">
                        <div class="d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                            ${avatarHtml}
                        </div>
                        <span class="fw-bold d-none d-xl-inline">${userName}</span>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end border-0 shadow mt-2">
                        <li><a class="dropdown-item" href="/user/userProfilePage.html"><i class="fa-solid fa-user me-2"></i>Profile</a></li>
                        <li><a class="dropdown-item" href="/user/userWishListPage.html"><i class="fa-solid fa-heart me-2"></i>Wishlist</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="handleLogout()"><i class="fa-solid fa-right-from-bracket me-2"></i>Logout</a></li>
                    </ul>
                </div>
            `;
        }

        // Inject into Mobile Placeholder
        const mobilePlaceholder = document.getElementById('mobile-user-placeholder');
        if (mobilePlaceholder) {
            mobilePlaceholder.innerHTML = `
                <div class="dropdown">
                    <a class="btn btn-link text-dark p-2 dropdown-toggle border-0" href="#" role="button" aria-expanded="false">
                        ${avatarHtml}
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end border-0 shadow mt-2">
                        <li class="px-3 py-2 fw-bold text-secondary text-uppercase" style="font-size: 0.7rem;">Hi, ${userName}</li>
                        <li><a class="dropdown-item" href="/user/userProfilePage.html"><i class="fa-solid fa-user me-2"></i>Profile</a></li>
                        <li><a class="dropdown-item" href="/user/userWishListPage.html"><i class="fa-solid fa-heart me-2"></i>Wishlist</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="handleLogout()"><i class="fa-solid fa-right-from-bracket me-2"></i>Logout</a></li>
                    </ul>
                </div>
            `;
        }

        // Standard Dropdown Toggle Listener for newly injected elements
        document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
            toggle.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                // Close other open dropdowns first
                document.querySelectorAll('.dropdown-toggle').forEach(other => {
                    if (other !== toggle) {
                        other.classList.remove('show');
                        if(other.nextElementSibling) other.nextElementSibling.classList.remove('show');
                    }
                });
                const menu = this.nextElementSibling;
                if (menu) {
                    menu.classList.toggle('show');
                    this.classList.toggle('show');
                }
            });
        });
    };

    // Verify with backend
    try {
        const headers = {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch('/api/user/profile', { headers });

        if (res.ok) {
            const data = await res.json();
            if (data.success && data.user) {
                const userData = { ...data.user, name: data.user.firstName || 'User' };
                renderLoggedInParams(userData);
            } else {
                if (loginBtn) loginBtn.classList.remove('d-none');
            }
        } else {
            // Not authenticated or error
            if (res.status === 401) {
                const userDropdown = document.querySelector('.dropdown.ms-4');
                if (userDropdown) userDropdown.remove();
                
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                await fetch('/api/auth/logout', { method: 'POST' });
            }
            if (loginBtn) loginBtn.classList.remove('d-none');
        }
    } catch (err) {
        console.error("Auth check failed", err);
        if (loginBtn) loginBtn.classList.remove('d-none');
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
                console.warn('Logout API call failed', err);
            }

            await Swal.fire({
                title: 'Logged Out',
                text: 'See you soon!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });

            window.location.href = '/user';
        }
    } catch (error) {
        console.error('Logout error:', error);
        // Fallback force logout
        window.location.href = '/user';
    }
};


