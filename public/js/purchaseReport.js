/**
 * Jinsa Mobiles Admin - Purchase Report Module
 * Handles purchase order management, table rendering, modals, and interactions
 */

document.addEventListener("DOMContentLoaded", function () {
  // ==================== CONFIG ====================
  const API_BASE = "/api"; // Update with your actual API endpoint
  const ITEMS_PER_PAGE = 10;
  let currentPage = 1;
  let allPurchases = [];
  let filteredPurchases = [];
  let allProductsList = [];
  let modalInstance = null;

  // ==================== DOM ELEMENTS ====================
  const elements = {
    sidebar: document.getElementById("sidebar"),
    overlay: document.getElementById("sidebarOverlay"),
    sidebarToggle: document.getElementById("sidebarToggleBtn"),
    purchasesTableBody: document.getElementById("purchasesTableBody"),
    searchInput: document.getElementById("searchInput"),
    startDate: document.getElementById("startDate"),
    endDate: document.getElementById("endDate"),
    sortSelect: document.getElementById("sortPurchases"),
    exportBtn: document.getElementById("exportBtn"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    pageInfo: document.getElementById("pageInfoText"),
    pageNumber: document.getElementById("pageNumberDisplay"),
    openNewPurchaseBtn: document.getElementById("openNewPurchaseBtn"),
    newPurchaseForm: document.getElementById("newPurchaseForm"),
    addItemBtn: document.getElementById("addItemBtn"),
    itemsTableBody: document.getElementById("itemsTableBody"),
    emptyItemsMsg: document.getElementById("emptyItemsMsg"),
    grandTotal: document.getElementById("grandTotal"),
    purchaseDate: document.getElementById("purchaseDate"),
    productSuggestions: document.getElementById("productSuggestions"),
    // Summary cards
    totalInvestmentCard: document.getElementById("totalInvestmentCard"),
    pendingCountCard: document.getElementById("pendingCountCard"),
    completedCountCard: document.getElementById("completedCountCard"),
    itemsCountCard: document.getElementById("itemsCountCard"),
  };

  // ==================== INITIALIZATION ====================
  function init() {
    initSidebar();
    initModal();
    initEventListeners();
    setDefaultDate();
    loadProductsForSuggestions();
    fetchPurchases();
  }

  function initSidebar() {
    if (elements.sidebarToggle && elements.overlay) {
      elements.sidebarToggle.addEventListener("click", toggleSidebar);
      elements.overlay.addEventListener("click", closeSidebar);
    }
  }

  function toggleSidebar() {
    elements.sidebar.classList.toggle("active");
    elements.overlay.classList.toggle("active");
  }

  function closeSidebar() {
    elements.sidebar.classList.remove("active");
    elements.overlay.classList.remove("active");
  }

  function initModal() {
    modalInstance = new bootstrap.Modal(
      document.getElementById("newPurchaseModal"),
    );
  }

  function initEventListeners() {
    // Search & Filters
    elements.searchInput?.addEventListener(
      "input",
      debounce(filterPurchases, 300),
    );
    elements.startDate?.addEventListener("change", filterPurchases);
    elements.endDate?.addEventListener("change", filterPurchases);
    elements.sortSelect?.addEventListener("change", filterPurchases);

    // Pagination
    elements.prevBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      if (currentPage > 1) {
        currentPage--;
        renderTable();
      }
    });
    elements.nextBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      const totalPages = Math.ceil(filteredPurchases.length / ITEMS_PER_PAGE);
      if (currentPage < totalPages) {
        currentPage++;
        renderTable();
      }
    });

    // New Purchase Modal
    elements.openNewPurchaseBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      resetPurchaseForm();
      modalInstance.show();
    });

    elements.addItemBtn?.addEventListener("click", addNewItemRow);

    // Form Submission
    elements.newPurchaseForm?.addEventListener("submit", handlePurchaseSubmit);

    // Quick Add Product Submission
    document.getElementById("quickAddProductForm")?.addEventListener("submit", handleQuickProductSubmit);
    document.getElementById('newProductModal')?.addEventListener('show.bs.modal', function () {
      loadCategoriesForQuickAdd();
    });

    // Export
    elements.exportBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      exportPurchases();
    });

    // Delegate event for dynamic elements
    elements.purchasesTableBody?.addEventListener("click", handleTableActions);
    elements.itemsTableBody?.addEventListener("click", handleItemRowActions);
    elements.itemsTableBody?.addEventListener("input", handleItemInput);
  }

  function setDefaultDate() {
    if (elements.purchaseDate) {
      elements.purchaseDate.valueAsDate = new Date();
    }
  }

  // ==================== API & DATA ====================
  async function fetchPurchases() {
    try {
      const response = await fetch(`${API_BASE}/admin/purchase/report`);
      const result = await response.json();

      if (result.success) {
        allPurchases = result.reports || [];
      } else {
        allPurchases = [];
      }

      filteredPurchases = [...allPurchases];
      updateSummaryCards();
      renderTable();
    } catch (error) {
      console.error("Error fetching purchases:", error);
      Swal.fire("Error", "Failed to load purchase data", "error");
    }
  }

  async function loadProductsForSuggestions() {
    try {
      const response = await fetch(`${API_BASE}/admin/products?limit=1000`);
      const result = await response.json();

      allProductsList = result.formatted || [];
      updateAllProductDropdowns();
    } catch (error) {
      console.error("Error loading products:", error);
    }
  }

  function updateAllProductDropdowns() {
    const selects = document.querySelectorAll('.product-select');
    selects.forEach(select => {
      const currentValue = select.value;

      let productOptions = '<option value="">Select a Product</option>';
      allProductsList.forEach(p => {
        const selected = (p.name === currentValue) ? 'selected' : '';
        productOptions += `<option value="${escapeHtml(p.name)}" ${selected}>${escapeHtml(p.name)}</option>`;
      });

      select.innerHTML = productOptions;
    });
  }

  async function loadCategoriesForQuickAdd() {
    try {
      const res = await fetch(`${API_BASE}/admin/products/categories`);
      const data = await res.json();
      if (data.success) {
        const select = document.getElementById("quickProductCategory");
        if (!select) return;
        select.innerHTML = '<option value="">Select Category</option>';
        data.categories.forEach((cat) => {
          const option = document.createElement("option");
          option.value = cat._id;
          option.textContent = cat.name;
          select.appendChild(option);
        });
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  }

  async function handleQuickProductSubmit(e) {
    e.preventDefault();
    const saveBtn = document.getElementById("saveQuickProductBtn");
    saveBtn.disabled = true;
    saveBtn.innerHTML = 'Saving...';

    try {
      const name = document.getElementById("quickProductName").value.trim();
      const price = document.getElementById("quickProductPrice").value;
      const stock = document.getElementById("quickProductStock").value;
      const category = document.getElementById("quickProductCategory").value;

      const formData = new FormData();
      formData.append("name", name);
      formData.append("price", price);
      formData.append("actualPrice", price);
      formData.append("offerPrice", price);
      formData.append("stock", stock);
      formData.append("category", category);

      // Default fields
      formData.append("status", "active");
      formData.append("visibility", "public");

      const res = await fetch(`${API_BASE}/admin/products`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        // Hide modal
        const modalEl = document.getElementById('newProductModal');
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();

        document.getElementById("quickAddProductForm").reset();

        // Reload products so the autocomplete updates with the new product
        await loadProductsForSuggestions();
        Swal.fire({
          icon: "success",
          title: "Added!",
          text: "Product added successfully.",
          timer: 1500,
          showConfirmButton: false,
        });

        // Automatically populate the last item empty row if empty
        const itemRows = document.querySelectorAll('.item-row');
        if (itemRows.length > 0) {
          const lastRow = itemRows[itemRows.length - 1];
          const productInput = lastRow.querySelector('.product-name');
          if (!productInput.value) {
            productInput.value = name;
          }
        }
      } else {
        throw new Error(data.error || "Failed to add product");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err.message, "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Save Product';
    }
  }

  // ==================== RENDERING ====================
  function renderTable() {
    if (!elements.purchasesTableBody) return;

    if (filteredPurchases.length === 0) {
      elements.purchasesTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-5 text-muted">
            <i class="fa-solid fa-inbox fa-3x mb-3"></i>
            <p class="mb-0">No purchase records found</p>
            <small class="text-muted">Create a new purchase order to get started</small>
          </td>
        </tr>
      `;
      updatePagination(0);
      return;
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageData = filteredPurchases.slice(startIndex, endIndex);

    elements.purchasesTableBody.innerHTML = pageData
      .map(
        (purchase) => `
      <tr>
        <td><strong>${escapeHtml(purchase.id || "PUR-" + Date.now())}</strong></td>
        <td>
          <div><strong>${escapeHtml(purchase.supplierName)}</strong></div>
          <small class="text-muted">${escapeHtml(purchase.items?.[0]?.productName || "")}${purchase.items?.length > 1 ? ` +${purchase.items.length - 1} more` : ""}</small>
        </td>
        <td>${formatDate(purchase.purchaseDate)}</td>
        <td>${purchase.totalQuantity || 0}</td>
        <td><strong>₹${formatCurrency(purchase.totalAmount || 0)}</strong></td>
        <td class="text-end">
          <a href="#" class="action-btn" data-action="view" data-id="${purchase.id}" title="View">
            <i class="fa-solid fa-eye"></i>
          </a>
          <a href="#" class="action-btn" data-action="edit" data-id="${purchase.id}" title="Edit">
            <i class="fa-solid fa-pen"></i>
          </a>
        </td>
      </tr>
    `,
      )
      .join("");

    updatePagination(filteredPurchases.length);
  }

  function updatePagination(totalRecords) {
    const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE) || 1;
    const start =
      totalRecords === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const end = Math.min(currentPage * ITEMS_PER_PAGE, totalRecords);

    if (elements.pageInfo) {
      elements.pageInfo.textContent = `Showing ${start}-${end} of ${totalRecords} records`;
    }
    if (elements.pageNumber) {
      elements.pageNumber.textContent = currentPage;
    }
    if (elements.prevBtn) {
      elements.prevBtn.style.opacity = currentPage === 1 ? "0.5" : "1";
      elements.prevBtn.style.pointerEvents =
        currentPage === 1 ? "none" : "auto";
    }
    if (elements.nextBtn) {
      elements.nextBtn.style.opacity = currentPage === totalPages ? "0.5" : "1";
      elements.nextBtn.style.pointerEvents =
        currentPage === totalPages ? "none" : "auto";
    }
  }

  function updateSummaryCards() {
    const total = allPurchases.reduce(
      (sum, p) => sum + (p.totalAmount || 0),
      0,
    );
    const pending = allPurchases.filter((p) => p.status !== "completed").length;
    const completed = allPurchases.filter(
      (p) => p.status === "completed",
    ).length;
    const items = allPurchases.reduce(
      (sum, p) => sum + (p.totalQuantity || 0),
      0,
    );

    if (elements.totalInvestmentCard)
      elements.totalInvestmentCard.textContent = `₹${formatCurrency(total)}`;
    if (elements.pendingCountCard)
      elements.pendingCountCard.textContent = pending;
    if (elements.completedCountCard)
      elements.completedCountCard.textContent = completed;
    if (elements.itemsCountCard) elements.itemsCountCard.textContent = items;
  }

  // ==================== FILTERING & SEARCH ====================
  function filterPurchases() {
    const searchTerm = elements.searchInput?.value.toLowerCase() || "";
    const startDate = elements.startDate?.value;
    const endDate = elements.endDate?.value;
    const sortBy = elements.sortSelect?.value || "newest";

    filteredPurchases = allPurchases.filter((p) => {
      const matchesSearch =
        !searchTerm ||
        p.supplierName?.toLowerCase().includes(searchTerm) ||
        p.items?.some((item) =>
          item.productName?.toLowerCase().includes(searchTerm),
        );

      const purchaseDate = new Date(p.purchaseDate);
      const matchesDate =
        (!startDate || purchaseDate >= new Date(startDate)) &&
        (!endDate || purchaseDate <= new Date(endDate));

      return matchesSearch && matchesDate;
    });

    // Sort
    filteredPurchases.sort((a, b) => {
      const dateA = new Date(a.purchaseDate);
      const dateB = new Date(b.purchaseDate);
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    currentPage = 1;
    renderTable();
  }

  // ==================== MODAL & FORM ====================
  function resetPurchaseForm() {
    if (elements.newPurchaseForm) elements.newPurchaseForm.reset();
    if (elements.itemsTableBody) elements.itemsTableBody.innerHTML = "";
    if (elements.emptyItemsMsg) elements.emptyItemsMsg.style.display = "block";
    if (elements.grandTotal) elements.grandTotal.textContent = "₹0.00";
    setDefaultDate();
  }

  function addNewItemRow(productData = {}) {
    if (!elements.itemsTableBody) return;

    if (elements.emptyItemsMsg) {
      elements.emptyItemsMsg.style.display = "none";
    }

    const rowId = Date.now() + Math.random().toString(36).substr(2, 9);
    const row = document.createElement("tr");
    row.dataset.rowId = rowId;
    row.className = "item-row"; // Added item-row class

    // Generate product options
    let productOptions = '<option value="">Select a Product</option>';
    allProductsList.forEach(p => {
      const selected = (p.name === productData.productName) ? 'selected' : '';
      productOptions += `<option value="${escapeHtml(p.name)}" ${selected}>${escapeHtml(p.name)}</option>`;
    });

    row.innerHTML = `
      <td>
        <select class="form-select form-select-sm product-select" name="productName" required>
          ${productOptions}
        </select>
      </td>
      <td>
        <input type="number" class="form-control form-control-sm item-qty" 
               name="quantity" min="1" value="${productData.quantity || 1}" required />
      </td>
      <td>
        <input type="number" class="form-control form-control-sm item-price" 
               name="unitPrice" min="0" step="0.01" value="${productData.unitPrice || ""}" required />
      </td>
      <td>
        <strong class="item-total">₹0.00</strong>
      </td>
      <td>
        <button type="button" class="remove-item-btn" data-row-id="${rowId}" title="Remove">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    `;
    elements.itemsTableBody.appendChild(row);
    updateGrandTotal();
  }

  function handleItemRowActions(e) {
    if (e.target.closest(".remove-item-btn")) {
      const btn = e.target.closest(".remove-item-btn");
      const rowId = btn.dataset.rowId;
      const row = document.querySelector(`tr[data-row-id="${rowId}"]`);
      if (row) {
        row.remove();
        if (
          elements.itemsTableBody.children.length === 0 &&
          elements.emptyItemsMsg
        ) {
          elements.emptyItemsMsg.style.display = "block";
        }
        updateGrandTotal();
      }
    }
  }

  function handleItemInput(e) {
    const input = e.target;
    if (
      input.classList.contains("item-qty") ||
      input.classList.contains("item-price")
    ) {
      updateRowTotal(input.closest("tr"));
      updateGrandTotal();
    }
  }

  function updateRowTotal(row) {
    const qty = parseFloat(row.querySelector(".item-qty")?.value) || 0;
    const price = parseFloat(row.querySelector(".item-price")?.value) || 0;
    const total = qty * price;
    const totalEl = row.querySelector(".item-total");
    if (totalEl) {
      totalEl.textContent = `₹${formatCurrency(total)}`;
    }
  }

  function updateGrandTotal() {
    let grandTotal = 0;
    document.querySelectorAll("#itemsTableBody tr").forEach((row) => {
      const qty = parseFloat(row.querySelector(".item-qty")?.value) || 0;
      const price = parseFloat(row.querySelector(".item-price")?.value) || 0;
      grandTotal += qty * price;
    });
    if (elements.grandTotal) {
      elements.grandTotal.textContent = `₹${formatCurrency(grandTotal)}`;
    }
  }

  async function handlePurchaseSubmit(e) {
    e.preventDefault();

    if (!elements.newPurchaseForm) return;

    // Collect form data
    const supplierName = document.getElementById("supplierName")?.value;
    const purchaseDate = document.getElementById("purchaseDate")?.value;

    // Collect items
    const items = [];
    document.querySelectorAll("#itemsTableBody tr").forEach((row) => {
      const productName = row.querySelector('[name="productName"]')?.value;
      const quantity =
        parseInt(row.querySelector('[name="quantity"]')?.value) || 0;
      const unitPrice =
        parseFloat(row.querySelector('[name="unitPrice"]')?.value) || 0;

      if (productName && quantity > 0 && unitPrice > 0) {
        items.push({
          productName,
          quantity,
          unitPrice,
          total: quantity * unitPrice,
        });
      }
    });

    if (items.length === 0) {
      Swal.fire("Warning", "Please add at least one item", "warning");
      return;
    }

    const purchaseData = {
      supplierName,
      purchaseDate,
      items,
      totalAmount: items.reduce((sum, item) => sum + item.total, 0),
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      status: "pending",
    };

    try {
      const response = await fetch(`${API_BASE}/admin/purchase/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseData)
      });
      const result = await response.json();

      if (result.success) {
        Swal.fire({
          title: "Success!",
          text: "Purchase order created successfully",
          icon: "success",
          confirmButtonColor: "#000",
        });

        modalInstance.hide();
        resetPurchaseForm();
        await fetchPurchases();
      } else {
        Swal.fire("Error", result.message || "Failed to create purchase order", "error");
      }
    } catch (error) {
      console.error("Error creating purchase:", error);
      Swal.fire("Error", "Failed to create purchase order", "error");
    }
  }

  // ==================== TABLE ACTIONS ====================
  function handleTableActions(e) {
    const actionBtn = e.target.closest(".action-btn");
    if (!actionBtn) return;

    e.preventDefault();
    const action = actionBtn.dataset.action;
    const id = actionBtn.dataset.id;

    switch (action) {
      case "view":
        viewPurchaseDetails(id);
        break;
      case "edit":
        editPurchase(id);
        break;
    }
  }

  function viewPurchaseDetails(id) {
    // Implement view logic or navigate to detail page
    console.log("View purchase:", id);
    // window.location.href = `purchaseDetail.html?id=${id}`;
  }

  function editPurchase(id) {
    // Implement edit logic
    console.log("Edit purchase:", id);
    // Pre-fill modal with purchase data and open
  }

  // ==================== EXPORT ====================
  function exportPurchases() {
    if (filteredPurchases.length === 0) {
      Swal.fire("Info", "No data to export", "info");
      return;
    }

    // CSV Export
    const headers = [
      "Purchase ID",
      "Supplier",
      "Date",
      "Quantity",
      "Amount",
    ];
    const rows = filteredPurchases.map((p) => [
      p.id,
      p.supplierName,
      p.purchaseDate,
      p.totalQuantity,
      p.totalAmount,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((field) => `"${field}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `purchases_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ==================== UTILITIES ====================
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

  function escapeHtml(text) {
    if (!text) return "";
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function formatDate(dateString) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // ==================== START ====================
  init();
});
