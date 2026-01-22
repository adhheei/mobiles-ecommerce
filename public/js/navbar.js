
// navbar.js - Global navbar functionality

document.addEventListener('DOMContentLoaded', () => {
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
});
