// public/js/productPage.js

// Global variables
let currentPage = 1;
const limit = 12;

// DOM Elements
const filterToggleBtn = document.getElementById('filterToggleBtn');
const filterBackdrop = document.getElementById('filterBackdrop');
const filterSidebar = document.getElementById('filterSidebar');
const closeFiltersBtn = document.getElementById('closeFiltersBtn');
const sortSelect = document.getElementById('sortSelect');
const inStockOnly = document.getElementById('inStockOnly');
const priceRange = document.getElementById('priceRange');

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Load categories for filter (and then load products)
  loadCategoriesForFilter();

  // Setup event listeners
  setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
  // Filter toggle button
  if (filterToggleBtn) {
    filterToggleBtn.addEventListener('click', openFilterSidebar);
  }

  // Close filter sidebar (backdrop and close button)
  if (filterBackdrop) {
    filterBackdrop.addEventListener('click', closeFilterSidebar);
  }
  if (closeFiltersBtn) {
    closeFiltersBtn.addEventListener('click', closeFilterSidebar);
  }

  // Sort selection
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      currentPage = 1;
      loadProducts();
    });
  }

  // In stock only toggle
  if (inStockOnly) {
    inStockOnly.addEventListener('change', () => {
      currentPage = 1;
      loadProducts();
    });
  }

  // Price range
  if (priceRange) {
    priceRange.addEventListener('input', () => {
      currentPage = 1;
      loadProducts();
    });
  }

  // Navbar search (debounced)
  const navbarSearch = document.getElementById('navbarSearch');
  if (navbarSearch) {
    // Initialize value from URL param
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      navbarSearch.value = searchParam;
    }

    navbarSearch.addEventListener('input', debounce(() => {
      currentPage = 1;
      loadProducts();
    }, 300));
  }

  // EVENT DELEGATION for Products Container (Wishlist & Cart)
  const container = document.getElementById('productsContainer');
  if (container) {
    container.addEventListener('click', handleProductClicks);
  }
}

// Handle clicks inside products container (Event Delegation)
async function handleProductClicks(event) {
  // 1. Handle Wishlist Click
  const wishlistBtn = event.target.closest('.wishlist-btn');
  if (wishlistBtn) {
    event.preventDefault(); // Stop link navigation
    event.stopPropagation();
    const productId = wishlistBtn.dataset.id;
    if (productId) {
      await toggleWishlist(wishlistBtn, productId);
    }
    return;
  }

  // 2. Handle Add To Cart Click (Banner)
  const cartBanner = event.target.closest('.add-to-cart-banner');
  if (cartBanner) {
    event.preventDefault();
    event.stopPropagation();
    const productId = cartBanner.dataset.id;
    if (productId) {
      console.log('Added to cart:', productId);
      // alert('Product added to cart! (Demo)');
      addToCart(productId);
    }
    return;
  }
}

// Open filter sidebar
function openFilterSidebar() {
  filterSidebar.classList.add('open');
  filterBackdrop.classList.add('show');
}

// Close filter sidebar
function closeFilterSidebar() {
  filterSidebar.classList.remove('open');
  filterBackdrop.classList.remove('show');
}

// Debounce function for search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Load products from backend
async function loadProducts() {
  const container = document.getElementById('productsContainer');
  const loading = document.getElementById('loading');
  const emptyState = document.getElementById('emptyState');

  // Show loading state
  loading.style.display = 'block';
  emptyState.style.display = 'none';
  if (container) container.innerHTML = '';

  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('page', currentPage);
    params.append('limit', limit);

    // Add sort parameter
    if (sortSelect && sortSelect.value) {
      params.append('sort', sortSelect.value);
    }

    // Add category filter (from checkboxes)
    const selectedCategories = [];
    const categoryCheckboxes = document.querySelectorAll('#categoryList input[type="checkbox"]:checked');

    categoryCheckboxes.forEach(checkbox => {
      if (checkbox.value !== 'all') {
        selectedCategories.push(checkbox.value);
      }
    });

    if (selectedCategories.length > 0) {
      params.append('category', selectedCategories.join(','));
    }

    // Add in-stock filter
    if (inStockOnly && inStockOnly.checked) {
      params.append('inStock', 'true');
    }

    // Add price range
    if (priceRange) {
      params.append('maxPrice', priceRange.value);
    }

    // Add search query from navbar
    const navbarSearch = document.getElementById('navbarSearch');
    if (navbarSearch && navbarSearch.value.trim() !== '') {
      params.append('search', navbarSearch.value.trim());
    }

    // Fetch products and wishlist in parallel
    const [productsRes, _] = await Promise.all([
      fetch(`/api/admin/products/public?${params}`),
      loadUserWishlist()
    ]);

    const data = await productsRes.json();

    if (data.success && data.products && data.products.length > 0) {
      loading.style.display = 'none';

      const html = data.products.map(product => {
        // Use _id preferably, fallback to id
        const pId = product._id || product.id;
        const isOutOfStock = product.stock === 0 || product.status === 'outofstock';
        // If out of stock, disable the link (void(0)) and add styling
        const linkHref = isOutOfStock ? 'javascript:void(0)' : `./singleProductPage.html?id=${pId}`;
        const cursorStyle = isOutOfStock ? 'cursor: not-allowed;' : '';

        const isInWishlist = userWishlistIds.has(pId);

        return `
        <div class="col-6 col-md-4 col-xl-20-percent">
          <a href="${linkHref}" class="product-card-link" style="${cursorStyle}">
            <div class="product-card ${isOutOfStock ? 'sold-out' : ''}">
              <div class="card-img-wrapper">
                ${isOutOfStock ?
            '<div class="badge-overlay"><span class="sold-out-badge">Sold Out</span></div>' :
            ''
          }
                <!-- Wishlist Icon (Event Delegated) -->
                <button class="wishlist-btn ${isInWishlist ? 'active' : ''}" data-id="${pId}">
                    <i class="${isInWishlist ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </button>

                <!-- Add To Cart Banner (Event Delegated) -->
                ${!isOutOfStock ?
            `<div class="add-to-cart-banner" data-id="${pId}">
                    Add to Cart
                </div>` : ''}

                <img 
                  src="${product.mainImage}" 
                  alt="${product.name}" 
                  onerror="this.src='/images/logo.jpg'"
                />
              </div>
              <div class="product-info">
                <div class="product-vendor">${product.brand}</div>
                <div class="d-flex justify-content-between align-items-start">
                   <div class="product-title mb-0 text-truncate" style="max-width: 60%;" title="${product.name}">${product.name}</div>
                   <div class="text-end">
                      ${product.offerPrice < product.actualPrice ?
            `<div class="current-price sale-price" style="font-size: 0.95rem;">Rs. ${product.offerPrice}</div>
                         <div class="old-price" style="font-size: 0.75rem;">Rs. ${product.actualPrice}</div>` :
            `<div class="current-price" style="font-size: 0.95rem;">Rs. ${product.offerPrice}</div>`
          }
                   </div>
                </div>
              </div>
            </div>
          </a>
        </div>
      `;
      }).join('');

      if (container) container.innerHTML = html;

      // Render pagination
      if (data.pagination) {
        renderPagination(data.pagination);
      }
    } else {
      loading.style.display = 'none';
      emptyState.style.display = 'block';
      // Clear pagination if no products
      const pContainer = document.getElementById('paginationContainer');
      if (pContainer) pContainer.innerHTML = '';
    }
  } catch (err) {
    console.error('Error loading products:', err);
    loading.style.display = 'none';
    emptyState.style.display = 'block';
  }
}

// Render pagination buttons
function renderPagination(pagination) {
  const container = document.getElementById('paginationContainer');
  if (!container) return;

  const { page, pages, total } = pagination;
  let html = '';

  // Previous Button
  html += `
    <li class="page-item ${page <= 1 ? 'disabled' : ''}">
      <button class="page-link" onclick="changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>Previous</button>
    </li>
  `;

  // Page Numbers
  for (let i = 1; i <= pages; i++) {
    html += `
      <li class="page-item ${page === i ? 'active' : ''}">
        <button class="page-link" onclick="changePage(${i})">${i}</button>
      </li>
    `;
  }

  // Next Button
  html += `
    <li class="page-item ${page >= pages ? 'disabled' : ''}">
      <button class="page-link" onclick="changePage(${page + 1})" ${page >= pages ? 'disabled' : ''}>Next</button>
    </li>
  `;

  container.innerHTML = html;
}

// Global function to handle page change
window.changePage = function (newPage) {
  if (newPage < 1) return;
  currentPage = newPage;
  loadProducts();

  // Smooth scroll to top of product grid
  const grid = document.getElementById('productsContainer');
  if (grid) {
    grid.scrollIntoView({ behavior: 'smooth' });
  }
};

// Load categories with product counts for filtering
async function loadCategoriesForFilter() {
  try {
    const res = await fetch('/api/admin/products/categories-with-counts');
    const data = await res.json();

    if (data.success && data.categories) {
      const categoryList = document.getElementById('categoryList');
      if (!categoryList) return;

      // Clear existing options
      categoryList.innerHTML = '';

      // Add "All Categories" option
      const allOption = document.createElement('li');
      allOption.innerHTML = `
        <input type="checkbox" class="form-check-input" id="category-all" value="all" />
        <label for="category-all" class="form-check-label">All Categories</label>
      `;
      categoryList.appendChild(allOption);

      // Add categories with counts
      data.categories.forEach(cat => {
        const li = document.createElement('li');
        li.innerHTML = `
          <input type="checkbox" class="form-check-input" id="category-${cat._id}" value="${cat._id}" />
          <label for="category-${cat._id}" class="form-check-label">${cat.name} (${cat.productCount})</label>
        `;
        categoryList.appendChild(li);
      });

      // CHECK URL AND PRE-SELECT CATEGORY
      const urlParams = new URLSearchParams(window.location.search);
      const categoryId = urlParams.get('category');

      if (categoryId) {
        const checkbox = document.getElementById(`category-${categoryId}`);
        if (checkbox) {
          checkbox.checked = true;
        }
      }

      // Setup event listeners for category checkboxes
      setupCategoryFilterListeners();

      // NOW load products (after filters are set)
      loadProducts();



    }
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

// Setup event listeners for category checkboxes
function setupCategoryFilterListeners() {
  const categoryCheckboxes = document.querySelectorAll('#categoryList input[type="checkbox"]');

  categoryCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      currentPage = 1;
      loadProducts();
    });
  });
}

// --- Card Interactions ---
// --- Wishlist Logic ---
let userWishlistIds = new Set();
let isUserLoggedIn = false;

// Fetch user wishlist IDs
async function loadUserWishlist() {
  try {
    const res = await fetch('/api/user/wishlist');
    if (res.status === 401) {
      isUserLoggedIn = false;
      userWishlistIds.clear();
      return;
    }
    const data = await res.json();
    if (data.success) {
      isUserLoggedIn = true;
      userWishlistIds = new Set(data.wishlist.map(item => item._id || item));
    }
  } catch (err) {
    console.error('Error loading wishlist:', err);
  }
}

// Internal toggle logic (called by event delegation)
async function toggleWishlist(btn, productId) {
  // Check login logic implicitly by API response or pre-check
  if (!isUserLoggedIn) {
    window.location.href = '/User/userLogin.html';
    return;
  }

  const icon = btn.querySelector('i');
  const isAdding = !btn.classList.contains('active');

  // Optimistic UI Update
  btn.classList.toggle('active');
  if (isAdding) {
    icon.classList.remove('fa-regular');
    icon.classList.add('fa-solid');
  } else {
    icon.classList.remove('fa-solid');
    icon.classList.add('fa-regular');
  }

  try {
    const url = isAdding ? '/api/user/wishlist' : `/api/user/wishlist/${productId}`;
    const method = isAdding ? 'POST' : 'DELETE';
    const body = isAdding ? JSON.stringify({ productId }) : null;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body
    });

    if (res.status === 401) {
      window.location.href = '/User/userLogin.html';
      return;
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to update wishlist');
    }

    // Update local set
    if (isAdding) userWishlistIds.add(productId);
    else userWishlistIds.delete(productId);

    // Show toast/notification (optional)
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    })

    Toast.fire({
      icon: 'success',
      title: isAdding ? 'Product added to wishlist ❤️' : 'Product removed from wishlist'
    })

  } catch (error) {
    console.error('Error updating wishlist:', error);
    // Revert UI
    btn.classList.toggle('active');
    if (isAdding) {
      icon.classList.remove('fa-solid');
      icon.classList.add('fa-regular');
    } else {
      icon.classList.remove('fa-regular');
      icon.classList.add('fa-solid');
    }

    // Show warning for known errors like OOS (which we send as 400)
    // Or just generic error
    Swal.fire({
      icon: 'warning',
      title: 'Action Failed',
      text: error.message || 'Something went wrong!',
      confirmButtonColor: '#1a1a1a',
    })
  }
};

function addToCart(productId) {
  console.log('Added to cart:', productId);
  Swal.fire({
    title: 'Added to Cart!',
    text: 'Product added successfully (Demo).',
    icon: 'success',
    confirmButtonColor: '#1a1a1a',
    timer: 2000,
    timerProgressBar: true
  });
};