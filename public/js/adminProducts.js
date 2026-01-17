// public/js/adminProducts.js
document.addEventListener("DOMContentLoaded", () => {
  let currentPage = 1;
  const limit = 10;

  // Elements
  const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const searchInput = document.getElementById("searchInput");
  const filterCategory = document.getElementById("filterCategory");
  const sortProducts = document.getElementById("sortProducts");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  // Sidebar toggle
  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
      overlay.classList.toggle("active");
    });
  }
  if (overlay) {
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
    });
  }

  // Load categories for filter dropdown
  async function loadCategoriesForFilter() {
    try {
      const res = await fetch("/api/admin/products/categories");
      const data = await res.json();

      if (data.success) {
        const select = document.getElementById("filterCategory");
        select.innerHTML = '<option value="all">All Categories</option>';

        // Use "categories" key (not "data")
        data.categories.forEach((cat) => {
          const option = document.createElement("option");
          option.value = cat._id;
          option.textContent = cat.name;
          select.appendChild(option);
        });
      }
    } catch (err) {
      console.error("Failed to load categories for filter:", err);
    }
  }

  // Load products
  async function loadProducts(page = 1) {
    try {
      const search = document.getElementById('searchInput').value || '';
      const category = document.getElementById('filterCategory').value || 'all';
      const sort = document.getElementById('sortProducts').value || 'newest';

      const params = new URLSearchParams({
        page: page,
        limit: limit,
        search: search,
        category: category,
        sort: sort
      });

      const res = await fetch(`/api/admin/products?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${res.statusText}`);
      }

      const data = await res.json();

      console.log('API Response:', data); // 🔍 Debug log

      if (data.success) {
        // ✅ Handle backend's "formatted" structure
        const products = data.formatted || [];
        console.log('Products to render:', products); // 🔍 Debug log

        renderTable(products);
        renderPagination({
          total: data.pagination.total, // ✅ Use total from backend pagination
          page: page,
          pages: data.pagination.pages
        });
        currentPage = page;
      } else {
        throw new Error(data.error || 'Failed to load products');
      }
    } catch (err) {
      console.error('Error loading products:', err);
      Swal.fire('Error', `Failed to fetch: ${err.message}`, 'error');
      renderTable([]);
      renderPagination({ total: 0, page: 1, pages: 1 });
    }
  }

  // Render table
  function renderTable(products) {
    const tbody = document.getElementById("productsTableBody");
    tbody.innerHTML = "";

    if (!Array.isArray(products) || products.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-5 text-muted">
            No products found.
          </td>
        </tr>
      `;
      return;
    }

    products.forEach((product) => {
      let statusClass = "status-active";
      if (product.status === "draft") statusClass = "status-draft";
      if (product.status === "outofstock") statusClass = "status-out";

      const row = `
        <tr>
          <td>
            <div class="product-cell">
              <img 
                src="${product.mainImage}" 
                class="product-img" 
                alt="${product.name}"
                onerror="this.src='/images/logo.jpg'"
              >
              <div class="product-info">
                <h6>${product.name}</h6>
                <span>${product.sku || "No SKU"}</span>
              </div>
            </div>
          </td>
          <td>${product.category}</td>
          <td><span class="price-text">₹${product.offerPrice.toFixed(2)}</span></td>
          <td>${product.stock}</td>
          <td><span class="badge-custom ${statusClass}">${product.status.toUpperCase()}</span></td>
          <td class="text-end">
            <a href="./adminEditProduct.html?id=${product.id}" class="action-btn" title="Edit">
              <i class="fa-solid fa-pen"></i>
            </a>
            <button class="action-btn btn-delete" data-id="${product.id}" title="Delete">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
      tbody.innerHTML += row;
    });

    // Attach delete handlers
    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        deleteProduct(id);
      });
    });
  }

  // Render pagination

  function renderPagination(pagination) {
    const { total, page, pages } = pagination;
    const start = total === 0 ? 0 : (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    document.getElementById("pageInfoText").textContent =
      `Showing ${start} to ${end} of ${total} entries`;

    document.getElementById("pageNumberDisplay").textContent = page;

    // Update button states
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    prevBtn.style.opacity = page <= 1 ? "0.3" : "1";
    prevBtn.style.pointerEvents = page <= 1 ? "none" : "auto";

    nextBtn.style.opacity = page >= pages ? "0.3" : "1";
    nextBtn.style.pointerEvents = page >= pages ? "none" : "auto";
  }

  // Delete product
  async function deleteProduct(id) {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This product will be removed permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#000",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/admin/products/${id}`, {
          method: "DELETE",
        });
        const data = await res.json();

        if (data.success) {
          Swal.fire("Deleted!", "Product has been removed.", "success");
          loadProducts(currentPage);
        } else {
          throw new Error(data.error || "Failed to delete product");
        }
      } catch (err) {
        Swal.fire("Error", err.message, "error");
      }
    }
  }

  // Event listeners
  if (searchInput) {
    searchInput.addEventListener("keyup", () => {
      currentPage = 1;
      loadProducts(1);
    });
  }

  if (filterCategory) {
    filterCategory.addEventListener("change", () => {
      currentPage = 1;
      loadProducts(1);
    });
  }

  if (sortProducts) {
    sortProducts.addEventListener("change", () => {
      loadProducts(currentPage);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (currentPage > 1) {
        loadProducts(currentPage - 1);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      loadProducts(currentPage + 1);
    });
  }

  // Initialize
  loadCategoriesForFilter();
  loadProducts(1);
});
