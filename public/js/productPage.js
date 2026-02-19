// public/js/productPage.js

// Global variables
let currentPage = 1;
const limit = 12;
let userWishlistIds = new Set();
let isUserLoggedIn = false;
const pendingWishlistOperations = new Map(); // Prevent duplicate requests

// DOM Elements
const filterToggleBtn = document.getElementById("filterToggleBtn");
const filterBackdrop = document.getElementById("filterBackdrop");
const filterSidebar = document.getElementById("filterSidebar");
const closeFiltersBtn = document.getElementById("closeFiltersBtn");
const sortSelect = document.getElementById("sortSelect");
const inStockOnly = document.getElementById("inStockOnly");
const onSaleOnly = document.getElementById("onSaleOnly"); // Ensure this ID exists in HTML
const priceRange = document.getElementById("priceRange");

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // 1. Initial URL Parameter Check (For "Explore Now" button)
  const urlParams = new URLSearchParams(window.location.search);

  // Auto-check the toggle if onSale=true is in the URL
  if (urlParams.get("onSale") === "true" && onSaleOnly) {
    onSaleOnly.checked = true;
  }

  // Load categories and brands
  loadCategoriesForFilter();
  loadBrandsForFilter();

  // Load user wishlist FIRST to ensure UI syncs properly
  loadUserWishlist().finally(() => {
    // Load products after wishlist is ready
    setTimeout(loadProducts, 100);
  });

  // Initialize Search from URL
  const navbarSearch = document.getElementById("navbarSearch");
  if (navbarSearch) {
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

  // Filter Change Listeners
  const filterControls = [sortSelect, onSaleOnly, inStockOnly];
  filterControls.forEach((control) => {
    if (control) {
      control.addEventListener("change", () => {
        currentPage = 1;
        loadProducts();
      });
    }
  });

  if (priceRange) {
    const priceValue = document.getElementById("priceValue");
    priceRange.addEventListener("input", (e) => {
      if (priceValue) {
        priceValue.textContent = `Rs. ${parseInt(e.target.value).toLocaleString("en-IN")}`;
      }
    });
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

// Open filter sidebar
function openFilterSidebar() {
  filterSidebar.classList.add("open");
  filterBackdrop.classList.add("show");
  document.body.style.overflow = "hidden";
}

// Close filter sidebar
function closeFilterSidebar() {
  filterSidebar.classList.remove("open");
  filterBackdrop.classList.remove("show");
  document.body.style.overflow = "auto";
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

  document.getElementById("loading").style.display = "block";
  container.innerHTML = "";
  document.getElementById("emptyState").style.display = "none";

  // Gather Filter Values
  const sort = sortSelect?.value || "best-selling";
  const inStock = inStockOnly?.checked || false;
  const onSale = onSaleOnly?.checked || false; // Captured state
  const maxPrice = priceRange?.value || 1000000;
  const search = document.getElementById("navbarSearch")?.value || "";

  // Build Query
  const queryParams = new URLSearchParams({
    page: currentPage,
    limit: limit,
    sort: sort,
    inStock: inStock,
    onSale: onSale, // Sent to backend API
    maxPrice: maxPrice,
    search: search,
  });

  // Categories
  const selectedCats = Array.from(
    document.querySelectorAll("#categoryList input:checked"),
  )
    .map((cb) => cb.value)
    .filter((val) => val !== "all");
  if (selectedCats.length > 0)
    queryParams.append("category", selectedCats.join(","));

  // Brands
  const selectedBrands = Array.from(
    document.querySelectorAll("#brandList input:checked"),
  ).map((cb) => cb.value);
  if (selectedBrands.length > 0)
    queryParams.append("brand", selectedBrands.join(","));

  try {
    const res = await fetch(
      `/api/admin/products/public?${queryParams.toString()}`,
    );
    const data = await res.json();

    document.getElementById("loading").style.display = "none";

    if (data.success && data.products.length > 0) {
      container.innerHTML = data.products
        .map((p) => renderProductCard(p))
        .join("");
      syncWishlistUI(); // Re-sync UI after render
      if (data.pagination) renderPagination(data.pagination);
    } else {
      document.getElementById("emptyState").style.display = "block";
      document.getElementById("paginationContainer").innerHTML = "";
    }
  } catch (err) {
    console.error("Fetch failed:", err);
    document.getElementById("loading").style.display = "none";
  }
}

// Pagination logic (Preserved style)
function renderPagination(pagination) {
  const container = document.getElementById("paginationContainer");
  if (!container) return;
  const { page, pages } = pagination;
  let html = `<li class="page-item ${page <= 1 ? "disabled" : ""}">
                <button class="page-link" onclick="changePage(${page - 1})">Previous</button></li>`;

  for (let i = 1; i <= pages; i++) {
    html += `<li class="page-item ${page === i ? "active" : ""}">
                <button class="page-link" onclick="changePage(${i})">${i}</button></li>`;
  }

  html += `<li class="page-item ${page >= pages ? "disabled" : ""}">
            <button class="page-link" onclick="changePage(${page + 1})">Next</button></li>`;
  container.innerHTML = html;
}

window.changePage = function (newPage) {
  if (newPage < 1) return;
  currentPage = newPage;
  loadProducts();
  const grid = document.getElementById("productContainer");
  if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
};

// Wishlist Handling
async function loadUserWishlist() {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) return;
  try {
    const res = await fetch("/api/user/wishlist", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    if (data.success) {
      isUserLoggedIn = true;
      userWishlistIds = new Set(
        data.wishlist.map((item) => String(item._id || item)),
      );
    }
  } catch (err) {
    console.error("Wishlist error:", err);
  }
}

async function toggleWishlist(btn, productId) {
  const normalizedId = String(productId).trim();
  if (!normalizedId || normalizedId === "undefined") return;
  if (pendingWishlistOperations.has(normalizedId)) return;

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) {
    window.location.href = `/User/userLogin.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    return;
  }

  const isAdding = !userWishlistIds.has(normalizedId);
  const icon = btn.querySelector("i");
  btn.disabled = true;
  btn.classList.toggle("active", isAdding);
  icon?.classList.replace(
    isAdding ? "fa-regular" : "fa-solid",
    isAdding ? "fa-solid" : "fa-regular",
  );

  pendingWishlistOperations.set(normalizedId, true);
  try {
    const url = isAdding
      ? "/api/user/wishlist"
      : `/api/user/wishlist/${normalizedId}`;
    const res = await fetch(url, {
      method: isAdding ? "POST" : "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: isAdding ? JSON.stringify({ productId: normalizedId }) : null,
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error("Server Error");
    isAdding
      ? userWishlistIds.add(normalizedId)
      : userWishlistIds.delete(normalizedId);
  } catch (error) {
    btn.classList.toggle("active", !isAdding);
    icon?.classList.replace(
      isAdding ? "fa-solid" : "fa-regular",
      isAdding ? "fa-regular" : "fa-solid",
    );
    Swal.fire({
      icon: "warning",
      title: "Action Failed",
      text: "Server issue. Try again.",
    });
  } finally {
    btn.disabled = false;
    pendingWishlistOperations.delete(normalizedId);
  }
}

function syncWishlistUI() {
  document.querySelectorAll(".wishlist-btn").forEach((btn) => {
    const id = btn.dataset.id;
    const active = userWishlistIds.has(String(id));
    btn.classList.toggle("active", active);
    const icon = btn.querySelector("i");
    if (icon)
      icon.className = active ? "fa-solid fa-heart" : "fa-regular fa-heart";
  });
}

// Render Card logic with Fixed Heights & Fallbacks
function renderProductCard(product) {
  const isOutOfStock = product.stock === 0 || product.status === "outofstock";
  const rawId =
    product._id ||
    product.id ||
    (product._id && product._id.$oid ? product._id.$oid : null);
  const pId = rawId ? String(rawId).trim() : null;

  if (!pId || pId === "undefined") return "";

  const actualPrice = product.actualPrice || product.regularPrice || 0;
  const offerPrice = product.offerPrice || product.salePrice || actualPrice;
  const hasDiscount = offerPrice < actualPrice;

  return `
    <div class="col-6 col-md-4 col-lg-3 col-xl-20-percent mb-4">
      <div class="product-card h-100 ${isOutOfStock ? "sold-out" : ""}" style="min-height:400px; display:flex; flex-direction:column;">
        <div class="card-img-wrapper" ${!isOutOfStock ? `onclick="window.location.href='./singleProductPage.html?id=${pId}'" style="cursor:pointer;"` : ""}>
          ${hasDiscount ? `<div class="sale-badge">SAVE</div>` : ""}
          <button class="wishlist-btn" data-id="${pId}"><i class="fa-heart"></i></button>
          ${!isOutOfStock ? `<div class="add-to-cart-banner" data-id="${pId}">ADD TO CART</div>` : ""}
          <img src="${product.mainImage || "/images/logo.jpg"}" alt="${product.name}" onerror="this.src='/images/logo.jpg'" />
        </div>
        <div class="product-info px-2 flex-grow-1 d-flex flex-column">
          <div class="product-vendor">${product.brand || "Generic"}</div>
          <h6 class="product-title" style="height:2.6em; overflow:hidden;">${product.name}</h6>
          <div class="price-row mt-auto pb-2">
            <span class="current-price text-danger fw-bold">₹${offerPrice.toLocaleString("en-IN")}</span>
            ${hasDiscount ? `<span class="old-price ms-1">₹${actualPrice.toLocaleString("en-IN")}</span>` : ""}
          </div>
        </div>
      </div>
    </div>`;
}

// Handle Add To Cart
async function addToCart(productId) {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) return (window.location.href = "/User/userLogin.html");
  try {
    const res = await fetch("/api/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    if (res.ok)
      Swal.fire({
        icon: "success",
        title: "Added to Cart!",
        timer: 1500,
        showConfirmButton: false,
      });
  } catch (err) {
    console.error(err);
  }
}

// Common functions
async function handleProductClicks(event) {
  const wishlistBtn = event.target.closest(".wishlist-btn");
  if (wishlistBtn) {
    event.preventDefault();
    event.stopPropagation();
    const id = wishlistBtn.dataset.id;
    if (id) await toggleWishlist(wishlistBtn, id);
    return;
  }
  const cartBanner = event.target.closest(".add-to-cart-banner");
  if (cartBanner) {
    event.preventDefault();
    event.stopPropagation();
    const id = cartBanner.dataset.id;
    if (id) addToCart(id);
  }
}
// Open filter sidebar
function openFilterSidebar() {
  filterSidebar.classList.add("open");
  filterBackdrop.classList.add("show");
  document.body.style.overflow = "hidden"; // Prevent background scroll
}

// Close filter sidebar
function closeFilterSidebar() {
  filterSidebar.classList.remove("open");
  filterBackdrop.classList.remove("show");
  document.body.style.overflow = "auto"; // Restore scroll
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
  const onSale = document.getElementById("onSaleOnly")?.checked || false;
  const maxPrice = document.getElementById("priceRange")?.value || 1000000;

  // Categories
  const selectedCats = Array.from(
    document.querySelectorAll("#categoryList input:checked"),
  )
    .map((cb) => cb.value)
    .filter((val) => val !== "all");
  const categoryParam = selectedCats.length > 0 ? selectedCats.join(",") : "";

  // Brands
  const selectedBrands = Array.from(
    document.querySelectorAll("#brandList input:checked"),
  ).map((cb) => cb.value);
  const brandParam = selectedBrands.length > 0 ? selectedBrands.join(",") : "";

  // Search
  const search = document.getElementById("navbarSearch")?.value || "";

  // Build Query
  const queryParams = new URLSearchParams({
    page: currentPage,
    limit: limit,
    sort: sort,
    inStock: inStock,
    onSale: onSale,
    maxPrice: maxPrice,
    search: search,
  });

  if (categoryParam) queryParams.append("category", categoryParam);
  if (brandParam) queryParams.append("brand", brandParam);

  try {
    const res = await fetch(
      `/api/admin/products/public?${queryParams.toString()}`,
    );
    const data = await res.json();

    document.getElementById("loading").style.display = "none";

    if (data.success && data.products.length > 0) {
      container.innerHTML = data.products
        .map((p) => renderProductCard(p))
        .join("");

      // Re-sync wishlist UI after rendering new products
      syncWishlistUI();

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
    Swal.fire({
      icon: "error",
      title: "Loading Failed",
      text: "Unable to load products. Please check your connection and try again.",
      confirmButtonColor: "#d32f2f",
    });
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
    grid.scrollIntoView({ behavior: "smooth", block: "start" });
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

      categoryList.innerHTML = `<li><input type="checkbox" class="form-check-input" id="category-all" value="all" ${allChecked ? "checked" : ""} /><label for="category-all" class="form-check-label">All Categories</label></li>`;

      data.categories.forEach((cat) => {
        const isChecked = selectedCategories.includes(cat._id);
        const li = document.createElement("li");
        li.innerHTML = `<input type="checkbox" class="form-check-input" id="category-${cat._id}" value="${cat._id}" ${isChecked ? "checked" : ""} /><label for="category-${cat._id}" class="form-check-label">${cat.name} (${cat.productCount})</label>`;
        categoryList.appendChild(li);
      });
      setupCategoryFilterListeners();
    }
  } catch (err) {
    console.error("Error loading categories:", err);
    Swal.fire({
      icon: "error",
      title: "Categories Failed",
      text: "Unable to load categories. Some filters may not work.",
      confirmButtonColor: "#d32f2f",
    });
  }
}

function setupCategoryFilterListeners() {
  const allCheckbox = document.getElementById("category-all");
  const otherCheckboxes = document.querySelectorAll(
    '#categoryList input[type="checkbox"]:not(#category-all)',
  );

  // "All" checkbox listener
  if (allCheckbox) {
    allCheckbox.addEventListener("change", (e) => {
      if (e.target.checked) {
        // Uncheck all others
        otherCheckboxes.forEach((cb) => (cb.checked = false));
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
      // If all deselected, select "All"
      const anyChecked = Array.from(otherCheckboxes).some((c) => c.checked);
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

// ==================== WISHLIST SYSTEM (FIXED & ENHANCED) ====================

// Fetch user wishlist IDs with proper auth handling
async function loadUserWishlist() {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  // Reset state if no token
  if (!token) {
    isUserLoggedIn = false;
    userWishlistIds.clear();
    return;
  }

  try {
    const res = await fetch("/api/user/wishlist", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Handle 401/403 explicitly
    if (res.status === 401 || res.status === 403) {
      // Clear invalid token
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      isUserLoggedIn = false;
      userWishlistIds.clear();
      return;
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.wishlist)) {
      isUserLoggedIn = true;
      // Normalize IDs to strings for reliable Set operations
      userWishlistIds = new Set(
        data.wishlist.map((item) => String(item._id || item)),
      );
    } else {
      isUserLoggedIn = false;
      userWishlistIds.clear();
    }
  } catch (err) {
    console.error("Error loading wishlist:", err);
    isUserLoggedIn = false;
    userWishlistIds.clear();
  }
}

// Sync wishlist UI state across all product cards
function syncWishlistUI() {
  document.querySelectorAll(".wishlist-btn").forEach((btn) => {
    const productId = btn.dataset.id;
    if (!productId) return;

    const isWishlisted = userWishlistIds.has(String(productId));
    const icon = btn.querySelector("i");

    if (isWishlisted) {
      btn.classList.add("active");
      icon?.classList.replace("fa-regular", "fa-solid");
    } else {
      btn.classList.remove("active");
      icon?.classList.replace("fa-solid", "fa-regular");
    }
  });
}

// Internal toggle logic with duplicate request prevention
async function toggleWishlist(btn, productId) {
  // Normalize ID to string for consistent handling
  const normalizedId = String(productId).trim();

  // Critical validation
  if (
    !normalizedId ||
    normalizedId === "undefined" ||
    normalizedId === "null"
  ) {
    console.error("Wishlist Error: Invalid Product ID:", productId);
    return Swal.fire({
      icon: "error",
      title: "Invalid Product",
      text: "This product cannot be added to wishlist. Please refresh the page.",
      confirmButtonColor: "#d32f2f",
    });
  }

  // Prevent duplicate requests for same product
  if (pendingWishlistOperations.has(normalizedId)) {
    console.warn("Wishlist operation already in progress for:", normalizedId);
    return;
  }

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) {
    // Redirect to login with current page as redirect
    const currentPath = encodeURIComponent(
      window.location.pathname + window.location.search,
    );
    window.location.href = `/User/userLogin.html?redirect=${currentPath}`;
    return;
  }

  const isAdding = !userWishlistIds.has(normalizedId);
  const icon = btn.querySelector("i");

  // Optimistic UI update with visual feedback
  btn.disabled = true; // Prevent rapid clicks
  btn.classList.toggle("active", isAdding);

  if (isAdding) {
    icon?.classList.replace("fa-regular", "fa-solid");
    icon?.classList.add("pulse-animation"); // Visual feedback
  } else {
    icon?.classList.replace("fa-solid", "fa-regular");
  }

  // Track operation to prevent duplicates
  pendingWishlistOperations.set(normalizedId, true);

  try {
    const url = isAdding
      ? "/api/user/wishlist"
      : `/api/user/wishlist/${normalizedId}`; // Ensure backend has :productId route

    const options = {
      method: isAdding ? "POST" : "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    // Only add body for POST requests
    if (isAdding) {
      options.body = JSON.stringify({ productId: normalizedId });
    }

    const res = await fetch(url, options);

    // Handle auth failures
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      window.location.href = `/User/userLogin.html?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(
        data.message ||
          `Failed to ${isAdding ? "add" : "remove"} from wishlist`,
      );
    }

    // Update local state
    if (isAdding) {
      userWishlistIds.add(normalizedId);
    } else {
      userWishlistIds.delete(normalizedId);
    }

    // Success feedback
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 1800,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: "success",
      title: isAdding ? "Added to wishlist ❤️" : "Removed from wishlist",
      customClass: {
        popup: isAdding ? "wishlist-added-toast" : "wishlist-removed-toast",
      },
    });
  } catch (error) {
    console.error("Wishlist operation failed:", error);

    // Revert UI on failure
    btn.classList.toggle("active", !isAdding);
    if (isAdding) {
      icon?.classList.replace("fa-solid", "fa-regular");
    } else {
      icon?.classList.replace("fa-regular", "fa-solid");
    }

    // Show user-friendly error
    Swal.fire({
      icon: "warning",
      title: "Action Failed",
      text: error.message || "Unable to update wishlist. Please try again.",
      confirmButtonColor: "#d32f2f",
    });
  } finally {
    // Cleanup
    btn.disabled = false;
    icon?.classList.remove("pulse-animation");
    pendingWishlistOperations.delete(normalizedId);
  }
}

// Add pulse animation CSS dynamically
(function addWishlistAnimation() {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes pulse-wishlist {
      0% { transform: scale(1); }
      50% { transform: scale(1.25); }
      100% { transform: scale(1); }
    }
    .wishlist-btn i.pulse-animation {
      animation: pulse-wishlist 0.4s ease-in-out;
    }
    .wishlist-added-toast {
      border-left: 4px solid #d32f2f !important;
    }
    .wishlist-removed-toast {
      border-left: 4px solid #6c757d !important;
    }
  `;
  document.head.appendChild(style);
})();

// ==================== END WISHLIST SYSTEM ====================

async function addToCart(productId) {
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
      confirmButtonColor: "#0d6efd",
      cancelButtonColor: "#d33",
    }).then((result) => {
      if (result.isConfirmed) {
        const currentPath = encodeURIComponent(
          window.location.pathname + window.location.search,
        );
        window.location.href = `/User/userLogin.html?redirect=${currentPath}`;
      }
    });
    return;
  }

  try {
    // Prevent duplicate rapid clicks
    const cartBtn = document.querySelector(
      `.add-to-cart-banner[data-id="${productId}"]`,
    );
    if (cartBtn?.dataset.loading === "true") return;
    if (cartBtn) cartBtn.dataset.loading = "true";

    const res = await fetch("/api/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ productId, quantity: 1 }),
    });

    const data = await res.json();

    if (cartBtn) cartBtn.dataset.loading = "false";

    if (res.ok) {
      // Visual feedback on the button itself
      if (cartBtn) {
        const originalText = cartBtn.textContent;
        cartBtn.textContent = "✓ ADDED!";
        cartBtn.style.background = "#28a745";

        setTimeout(() => {
          cartBtn.textContent = originalText;
          cartBtn.style.background = "";
        }, 1500);
      }

      Swal.fire({
        title: "Added to Cart!",
        text: "Product added successfully",
        icon: "success",
        confirmButtonColor: "#1a1a1a",
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      // Update cart badge immediately if function exists
      if (typeof window.updateCartBadge === "function") {
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
      confirmButtonColor: "#d32f2f",
    });
  }
}

// Helper to render a single card (to keep code clean)
function renderProductCard(product) {
  const isOutOfStock = product.stock === 0 || product.status === "outofstock";

  // Normalize ID to prevent 'undefined' errors
  const rawId =
    product._id ||
    product.id ||
    (product._id && product._id.$oid ? product._id.$oid : null);
  const pId = rawId ? String(rawId).trim() : null;

  // Critical Fix: Missing closing brace was breaking previous version
  if (!pId || pId === "undefined" || pId === "null") {
    console.warn("Product skipped due to missing ID:", product.name);
    return "";
  }

  const actualPrice =
    product.actualPrice || product.regularPrice || product.price || 0;
  const offerPrice = product.offerPrice || product.salePrice || actualPrice;
  const hasDiscount = offerPrice < actualPrice;
  const discountPercent = hasDiscount
    ? Math.round(((actualPrice - offerPrice) / actualPrice) * 100)
    : 0;

  return `
    <div class="col-6 col-md-4 col-lg-3 col-xl-20-percent mb-4">
      <div class="product-card h-100 ${isOutOfStock ? "sold-out" : ""}">
        <div class="card-img-wrapper" ${!isOutOfStock ? `onclick="window.location.href='./singleProductPage.html?id=${pId}'" style="cursor:pointer;"` : ""}>
          ${hasDiscount ? `<div class="sale-badge">SAVE ${discountPercent}%</div>` : ""}
          <button class="wishlist-btn ${userWishlistIds.has(pId) ? "active" : ""}" data-id="${pId}">
            <i class="fa-${userWishlistIds.has(pId) ? "solid" : "regular"} fa-heart"></i>
          </button>
          ${!isOutOfStock ? `<div class="add-to-cart-banner" data-id="${pId}">ADD TO CART</div>` : ""}
          <img src="${product.mainImage || "/images/logo.jpg"}" alt="${product.name}" onerror="this.src='/images/logo.jpg'" />
        </div>
        <div class="product-info px-2">
          <div class="product-vendor">${product.brand || "Generic"}</div>
          <h6 class="product-title mb-0" title="${product.name}">${product.name || "Unnamed Product"}</h6>
          <div class="price-row mt-1">
            <span class="current-price">₹${offerPrice.toLocaleString("en-IN")}</span>
            ${hasDiscount ? `<span class="old-price ms-1">₹${actualPrice.toLocaleString("en-IN")}</span>` : ""}
          </div>
        </div>
      </div>
    </div>`;
}
