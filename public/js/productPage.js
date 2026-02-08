// public/js/productPage.js

// Global variables
let currentPage = 1;
const limit = 12;

// DOM Elements
const filterToggleBtn = document.getElementById("filterToggleBtn");
const filterBackdrop = document.getElementById("filterBackdrop");
const filterSidebar = document.getElementById("filterSidebar");
const closeFiltersBtn = document.getElementById("closeFiltersBtn");
const sortSelect = document.getElementById("sortSelect");
const inStockOnly = document.getElementById("inStockOnly");
const priceRange = document.getElementById("priceRange");

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Load categories for filter (and then load products)
  loadCategoriesForFilter();
  loadBrandsForFilter();
  // Load user wishlist
  loadUserWishlist();

  // Initialize Search from URL
  const navbarSearch = document.getElementById("navbarSearch");
  if (navbarSearch) {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get("search");
    if (searchParam) {
      navbarSearch.value = searchParam;
    }
  }

  // Setup event listeners
  setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
  if (filterToggleBtn)
    filterToggleBtn.addEventListener("click", openFilterSidebar);
  if (filterBackdrop)
    filterBackdrop.addEventListener("click", closeFilterSidebar);
  if (closeFiltersBtn)
    closeFiltersBtn.addEventListener("click", closeFilterSidebar);

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      currentPage = 1;
      loadProducts();
    });
  }

  if (inStockOnly) {
    inStockOnly.addEventListener("change", () => {
      currentPage = 1;
      loadProducts();
    });
  }

  if (priceRange) {
    const priceValue = document.getElementById("priceValue");

    // Update text on slide
    priceRange.addEventListener("input", (e) => {
      if (priceValue) {
        priceValue.textContent = `Rs. ${parseInt(e.target.value).toLocaleString("en-IN")}`;
      }
    });

    // Trigger load on release
    priceRange.addEventListener("change", () => {
      currentPage = 1;
      loadProducts();
    });
  }

  const navbarSearch = document.getElementById("navbarSearch");
  if (navbarSearch) {
    navbarSearch.addEventListener(
      "input",
      debounce(() => {
        currentPage = 1;
        loadProducts();
      }, 500),
    );
  }

  const container = document.getElementById("productContainer");
  if (container) {
    container.addEventListener("click", handleProductClicks);
  }
}

// Handle clicks inside products container (Event Delegation)
async function handleProductClicks(event) {
  // 1. Handle Wishlist Click
  const wishlistBtn = event.target.closest(".wishlist-btn");
  if (wishlistBtn) {
    event.preventDefault(); // Stop link navigation
    event.stopPropagation();

    // Auth Check
    const user = localStorage.getItem("user");
    if (!user) {
      Swal.fire({
        title: "Login Required",
        text: "Please login to add products to your wishlist.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Login Now",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#0d6efd",
        cancelButtonColor: "#d33",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href =
            "/User/userLogin.html?redirect=" +
            encodeURIComponent(window.location.pathname);
        }
      });
      return;
    }

    const productId = wishlistBtn.dataset.id;
    if (productId) {
      await toggleWishlist(wishlistBtn, productId);
    }
    return;
  }

  // 2. Handle Add To Cart Click (Banner)
  const cartBanner = event.target.closest(".add-to-cart-banner");
  if (cartBanner) {
    event.preventDefault();
    event.stopPropagation();

    // Auth Check
    const user = localStorage.getItem("user");
    if (!user) {
      Swal.fire({
        title: "Login Required",
        text: "Please login to add products to your cart.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Login Now",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#0d6efd",
        cancelButtonColor: "#d33",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href =
            "/User/userLogin.html?redirect=" +
            encodeURIComponent(window.location.pathname);
        }
      });
      return;
    }

    const productId = cartBanner.dataset.id;
    if (productId) {
      console.log("Added to cart:", productId);
      addToCart(productId);
    }
    return;
  }
}

// Open filter sidebar
function openFilterSidebar() {
  filterSidebar.classList.add("open");
  filterBackdrop.classList.add("show");
}

// Close filter sidebar
function closeFilterSidebar() {
  filterSidebar.classList.remove("open");
  filterBackdrop.classList.remove("show");
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

async function loadProducts() {
  const container = document.getElementById("productContainer");
  if (!container) return;

  // Show loading
  document.getElementById("loading").style.display = "block";
  container.innerHTML = "";
  document.getElementById("emptyState").style.display = "none";

  // Gather Filter Values
  const sort = document.getElementById("sortSelect")?.value || "best-selling";
  const inStock = document.getElementById("inStockOnly")?.checked || false;
  const maxPrice = document.getElementById("priceRange")?.value || 1000000;

  // Categories
  const selectedCats = Array.from(document.querySelectorAll('#categoryList input:checked'))
    .map(cb => cb.value)
    .filter(val => val !== 'all');
  const categoryParam = selectedCats.length > 0 ? selectedCats.join(",") : "";

  // Brands
  const selectedBrands = Array.from(document.querySelectorAll('#brandList input:checked'))
    .map(cb => cb.value);
  const brandParam = selectedBrands.length > 0 ? selectedBrands.join(",") : "";

  // Search
  const search = document.getElementById("navbarSearch")?.value || "";

  // Build Query
  const queryParams = new URLSearchParams({
    page: currentPage,
    limit: limit,
    sort: sort,
    inStock: inStock,
    maxPrice: maxPrice,
    search: search
  });

  if (categoryParam) queryParams.append("category", categoryParam);
  if (brandParam) queryParams.append("brand", brandParam);

  try {
    const res = await fetch(`/api/admin/products/public?${queryParams.toString()}`);
    const data = await res.json();

    document.getElementById("loading").style.display = "none";

    if (data.success && data.products.length > 0) {
      container.innerHTML = data.products
        .map((p) => renderProductCard(p))
        .join("");

      if (data.pagination) {
        renderPagination(data.pagination);
      }
    } else {
      document.getElementById("emptyState").style.display = "block";
      document.getElementById("paginationContainer").innerHTML = "";
    }
  } catch (err) {
    console.error("Fetch failed:", err);
    document.getElementById("loading").style.display = "none";
  }
}

// Render pagination buttons
function renderPagination(pagination) {
  const container = document.getElementById("paginationContainer");
  if (!container) return;

  const { page, pages, total } = pagination;
  let html = "";

  // Previous Button
  html += `
    <li class="page-item ${page <= 1 ? "disabled" : ""}">
      <button class="page-link" onclick="changePage(${page - 1})" ${page <= 1 ? "disabled" : ""}>Previous</button>
    </li>
  `;

  // Page Numbers
  for (let i = 1; i <= pages; i++) {
    html += `
      <li class="page-item ${page === i ? "active" : ""}">
        <button class="page-link" onclick="changePage(${i})">${i}</button>
      </li>
    `;
  }

  // Next Button
  html += `
    <li class="page-item ${page >= pages ? "disabled" : ""}">
      <button class="page-link" onclick="changePage(${page + 1})" ${page >= pages ? "disabled" : ""}>Next</button>
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
  const grid = document.getElementById("productContainer");
  if (grid) {
    grid.scrollIntoView({ behavior: "smooth" });
  }
};

// Load categories with product counts for filtering
async function loadCategoriesForFilter() {
  try {
    const res = await fetch("/api/admin/products/categories-with-counts");
    const data = await res.json();
    if (data.success && data.categories) {
      const categoryList = document.getElementById("categoryList");
      if (!categoryList) return;

      // check URL for existing category
      const urlParams = new URLSearchParams(window.location.search);
      const urlCategory = urlParams.get("category");
      const selectedCategories = urlCategory ? urlCategory.split(",") : [];

      let allChecked = selectedCategories.length === 0;

      categoryList.innerHTML =
        `<li><input type="checkbox" class="form-check-input" id="category-all" value="all" ${allChecked ? "checked" : ""} /><label for="category-all" class="form-check-label">All Categories</label></li>`;

      data.categories.forEach((cat) => {
        const isChecked = selectedCategories.includes(cat._id);
        const li = document.createElement("li");
        li.innerHTML = `<input type="checkbox" class="form-check-input" id="category-${cat._id}" value="${cat._id}" ${isChecked ? "checked" : ""} /><label for="category-${cat._id}" class="form-check-label">${cat.name} (${cat.productCount})</label>`;
        categoryList.appendChild(li);
      });
      setupCategoryFilterListeners();
      loadProducts();
    }
  } catch (err) {
    console.error("Error loading categories:", err);
  }
}

function setupCategoryFilterListeners() {
  const allCheckbox = document.getElementById("category-all");
  const otherCheckboxes = document.querySelectorAll('#categoryList input[type="checkbox"]:not(#category-all)');

  // "All" checkbox listener
  if (allCheckbox) {
    allCheckbox.addEventListener("change", (e) => {
      if (e.target.checked) {
        // Uncheck all others
        otherCheckboxes.forEach(cb => cb.checked = false);
      }
      currentPage = 1;
      loadProducts();
    });
  }

  // Other checkboxes listeners
  otherCheckboxes.forEach((cb) => {
    cb.addEventListener("change", (e) => {
      if (e.target.checked && allCheckbox) {
        allCheckbox.checked = false;
      }
      // If all deselected, maybe select "All"? Optional.
      const anyChecked = Array.from(otherCheckboxes).some(c => c.checked);
      if (!anyChecked && allCheckbox) {
        allCheckbox.checked = true;
      }

      currentPage = 1;
      loadProducts();
    });
  });
}

// Load brands from backend and inject into the sidebar
async function loadBrandsForFilter() {
  try {
    const res = await fetch("/api/admin/products/brands-with-counts");
    const data = await res.json();

    if (data.success && data.brands) {
      const brandList = document.getElementById("brandList");
      if (!brandList) return;

      brandList.innerHTML = data.brands
        .map(
          (brand) => `
        <li>
          <input type="checkbox" class="form-check-input brand-checkbox" 
                 id="brand-${brand.id}" value="${brand.name}" />
          <label for="brand-${brand.id}" class="form-check-label">
            ${brand.name} <span class="text-muted">(${brand.count})</span>
          </label>
        </li>
      `,
        )
        .join("");

      // Setup listeners for newly created checkboxes
      document.querySelectorAll(".brand-checkbox").forEach((cb) => {
        cb.addEventListener("change", () => {
          currentPage = 1;
          loadProducts();
        });
      });
    }
  } catch (err) {
    console.error("Error loading brands:", err);
  }
}

// --- RESTORED VARIABLES AND FUNCTIONS ---

let userWishlistIds = new Set();
let isUserLoggedIn = false;

// Fetch user wishlist IDs
async function loadUserWishlist() {
  try {
    const res = await fetch("/api/user/wishlist");
    if (res.status === 401) {
      isUserLoggedIn = false;
      userWishlistIds.clear();
      return;
    }
    const data = await res.json();
    if (data.success) {
      isUserLoggedIn = true;
      userWishlistIds = new Set(data.wishlist.map((item) => item._id || item));
    }
  } catch (err) {
    console.error("Error loading wishlist:", err);
  }
}

// Internal toggle logic (called by event delegation)
async function toggleWishlist(btn, productId) {
  // Check login logic implicitly by API response or pre-check
  if (!isUserLoggedIn) {
    window.location.href = "/User/userLogin.html";
    return;
  }

  const icon = btn.querySelector("i");
  const isAdding = !btn.classList.contains("active");

  // Optimistic UI Update
  btn.classList.toggle("active");
  if (isAdding) {
    icon.classList.remove("fa-regular");
    icon.classList.add("fa-solid");
  } else {
    icon.classList.remove("fa-solid");
    icon.classList.add("fa-regular");
  }

  try {
    const url = isAdding
      ? "/api/user/wishlist"
      : `/api/user/wishlist/${productId}`;
    const method = isAdding ? "POST" : "DELETE";
    const body = isAdding ? JSON.stringify({ productId }) : null;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (res.status === 401) {
      window.location.href = "/User/userLogin.html";
      return;
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to update wishlist");
    }

    // Update local set
    if (isAdding) userWishlistIds.add(productId);
    else userWishlistIds.delete(productId);

    // Show toast/notification (optional)
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: "success",
      title: isAdding
        ? "Product added to wishlist ❤️"
        : "Product removed from wishlist",
    });
  } catch (error) {
    console.error("Error updating wishlist:", error);
    // Revert UI
    btn.classList.toggle("active");
    if (isAdding) {
      icon.classList.remove("fa-solid");
      icon.classList.add("fa-regular");
    } else {
      icon.classList.remove("fa-regular");
      icon.classList.add("fa-solid");
    }

    Swal.fire({
      icon: "warning",
      title: "Action Failed",
      text: error.message || "Something went wrong!",
      confirmButtonColor: "#1a1a1a",
    });
  }
}

async function addToCart(productId) {
  // Check auth again (double check)
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) {
    Swal.fire({
      title: "Login Required",
      text: "Please login to add products to your cart.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Login Now",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href =
          "/User/userLogin.html?redirect=" +
          encodeURIComponent(window.location.pathname);
      }
    });
    return;
  }

  try {
    const res = await fetch("/api/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ productId, quantity: 1 }),
    });

    const data = await res.json();

    if (res.ok) {
      Swal.fire({
        title: "Added to Cart!",
        text: "Product added successfully",
        icon: "success",
        confirmButtonColor: "#1a1a1a",
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      // Update cart badge immediately
      if (window.updateCartBadge) {
        window.updateCartBadge();
      }
    } else {
      throw new Error(data.message || "Failed to add to cart");
    }
  } catch (error) {
    console.error("Add to cart error:", error);
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: error.message || "Something went wrong!",
      confirmButtonColor: "#1a1a1a",
    });
  }
}

// Helper to render a single card (to keep code clean)
function renderProductCard(product) {
  const pId = product._id || product.id;
  const isOutOfStock = product.stock === 0 || product.status === "outofstock";
  const linkHref = isOutOfStock
    ? "javascript:void(0)"
    : `./singleProductPage.html?id=${pId}`;
  const isInWishlist = userWishlistIds.has(pId);

  return `
    <div class="col-6 col-md-4 col-lg-3 col-xl-20-percent mb-4">
      <a href="${linkHref}" class="product-card-link" style="${isOutOfStock ? "cursor: not-allowed;" : ""}">
        <div class="product-card ${isOutOfStock ? "sold-out" : ""}">
          <div class="card-img-wrapper">
            ${isOutOfStock ? '<div class="badge-overlay"><span class="sold-out-badge">Sold Out</span></div>' : ""}
            <button class="wishlist-btn ${isInWishlist ? "active" : ""}" data-id="${pId}">
              <i class="${isInWishlist ? "fa-solid" : "fa-regular"} fa-heart"></i>
            </button>
            ${!isOutOfStock ? `<div class="add-to-cart-banner" data-id="${pId}">Add to Cart</div>` : ""}
            <img src="${product.mainImage}" alt="${product.name}" onerror="this.src='/images/logo.jpg'" />
          </div>
          <div class="product-info px-2">
            <div class="product-vendor">${product.brand || 'Generic'}</div>
            <div class="d-flex justify-content-between align-items-start gap-2">
               <h6 class="product-title" title="${product.name}">${product.name}</h6>
               <div class="text-end flex-shrink-0">
                  <div class="current-price">₹${product.offerPrice.toLocaleString("en-IN")}</div>
                  ${product.offerPrice < product.actualPrice ? `<div class="old-price">₹${product.actualPrice.toLocaleString("en-IN")}</div>` : ''}
               </div>
            </div>
          </div>
        </div>
      </a>
    </div>`;
}
