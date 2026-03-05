/**
 * Jinsa Mobiles Admin - Purchase Report Module
 * Handles purchase order management, table rendering, modals, and View/Edit interactions
 */

document.addEventListener("DOMContentLoaded", function () {
  // ==================== CONFIG ====================
  const API_BASE = "/api";
  const ITEMS_PER_PAGE = 10;
  let currentPage = 1;
  let allPurchases = [];
  let filteredPurchases = [];
  let allProductsList = [];
  let modalInstance = null; // New Purchase Modal
  let viewModal = null; // View Details Modal

  // ==================== DOM ELEMENTS ====================
  const elements = {
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
    // Summary cards
    totalInvestmentCard: document.getElementById("totalInvestmentCard"),
    pendingCountCard: document.getElementById("pendingCountCard"),
    completedCountCard: document.getElementById("completedCountCard"),
    itemsCountCard: document.getElementById("itemsCountCard"),
    // View Modal Elements
    vSupplier: document.getElementById("vSupplierName"),
    vDate: document.getElementById("vPurchaseDate"),
    vItemsBody: document.getElementById("vItemsBody"),
    vGrandTotal: document.getElementById("vGrandTotal"),
  };

  // ==================== INITIALIZATION ====================
  function init() {
    initModals();
    initEventListeners();
    setDefaultDate();
    loadProductsForSuggestions();
    fetchPurchases();
  }

  function initModals() {
    modalInstance = new bootstrap.Modal(
      document.getElementById("newPurchaseModal"),
    );
    viewModal = new bootstrap.Modal(
      document.getElementById("viewPurchaseModal"),
    );
  }

  function initEventListeners() {
    elements.searchInput?.addEventListener(
      "input",
      debounce(filterPurchases, 300),
    );
    elements.startDate?.addEventListener("change", filterPurchases);
    elements.endDate?.addEventListener("change", filterPurchases);
    elements.sortSelect?.addEventListener("change", filterPurchases);

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

    elements.openNewPurchaseBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      resetPurchaseForm();
      // Reset Modal Title and Button for "New" mode
      document.querySelector("#newPurchaseModal .modal-title").innerHTML =
        `<i class="fa-solid fa-plus-circle me-2"></i>New Purchase Order`;
      document.querySelector(
        '#newPurchaseModal button[type="submit"]',
      ).innerText = "Create Purchase Order";
      delete elements.newPurchaseForm.dataset.editId;
      modalInstance.show();
    });

    elements.addItemBtn?.addEventListener("click", () => addNewItemRow());
    elements.newPurchaseForm?.addEventListener("submit", handlePurchaseSubmit);

    // Quick Add Product listeners
    document
      .getElementById("quickAddProductForm")
      ?.addEventListener("submit", handleQuickProductSubmit);
    document
      .getElementById("newProductModal")
      ?.addEventListener("show.bs.modal", loadCategoriesForQuickAdd);

    elements.exportBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      exportPurchases();
    });

    // Delegated actions
    elements.purchasesTableBody?.addEventListener("click", handleTableActions);
    elements.itemsTableBody?.addEventListener("click", handleItemRowActions);
    elements.itemsTableBody?.addEventListener("input", handleItemInput);
  }

  // ==================== VIEW & EDIT LOGIC ====================
  function handleTableActions(e) {
    const actionBtn = e.target.closest(".action-btn");
    if (!actionBtn) return;
    e.preventDefault();
    const action = actionBtn.dataset.action;
    const id = actionBtn.dataset.id;

    if (action === "view") viewPurchaseDetails(id);
    else if (action === "edit") editPurchase(id);
  }

  function viewPurchaseDetails(id) {
    const purchase = allPurchases.find((p) => p._id === id);
    if (!purchase) return Swal.fire("Error", "Purchase not found", "error");

    document.getElementById("viewModalTitle").innerText =
      `Details: ${purchase.id}`;
    elements.vSupplier.innerText = purchase.supplierName;
    elements.vDate.innerText = formatDate(purchase.purchaseDate);
    elements.vGrandTotal.innerText = `₹${formatCurrency(purchase.totalAmount)}`;

    elements.vItemsBody.innerHTML = purchase.items
      .map(
        (item) => `
      <tr>
        <td><div class="fw-semibold">${escapeHtml(item.productName)}</div></td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-end">₹${formatCurrency(item.unitPrice)}</td>
        <td class="text-end fw-bold">₹${formatCurrency(item.total)}</td>
      </tr>
    `,
      )
      .join("");

    document.getElementById("editInModalBtn").onclick = () => {
      viewModal.hide();
      editPurchase(id);
    };
    viewModal.show();
  }

  function editPurchase(id) {
    const purchase = allPurchases.find((p) => p._id === id);
    if (!purchase) return;

    resetPurchaseForm();
    elements.newPurchaseForm.dataset.editId = purchase._id;
    document.getElementById("supplierName").value = purchase.supplierName;
    document.getElementById("purchaseDate").value = new Date(
      purchase.purchaseDate,
    )
      .toISOString()
      .split("T")[0];

    purchase.items.forEach((item) => {
      addNewItemRow({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
    });

    document.querySelector("#newPurchaseModal .modal-title").innerHTML =
      `<i class="fa-solid fa-pen-to-square me-2"></i>Edit Purchase Order`;
    document.querySelector(
      '#newPurchaseModal button[type="submit"]',
    ).innerText = "Update Purchase Order";
    modalInstance.show();
  }

  // ==================== API & DATA ====================
  async function fetchPurchases() {
    try {
      const response = await fetch(`${API_BASE}/admin/purchase/report`);
      const result = await response.json();
      allPurchases = result.success ? result.reports : [];
      filteredPurchases = [...allPurchases];
      updateSummaryCards();
      renderTable();
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  }

  async function handlePurchaseSubmit(e) {
    e.preventDefault();
    const editId = elements.newPurchaseForm.dataset.editId;
    const items = [];
    document.querySelectorAll("#itemsTableBody tr").forEach((row) => {
      const productName = row.querySelector('[name="productName"]')?.value;
      const quantity =
        parseInt(row.querySelector('[name="quantity"]')?.value) || 0;
      const unitPrice =
        parseFloat(row.querySelector('[name="unitPrice"]')?.value) || 0;
      if (productName && quantity > 0) {
        items.push({
          productName,
          quantity,
          unitPrice,
          total: quantity * unitPrice,
        });
      }
    });

    if (items.length === 0)
      return Swal.fire("Warning", "Add at least one item", "warning");

    const purchaseData = {
      supplierName: document.getElementById("supplierName").value,
      purchaseDate: document.getElementById("purchaseDate").value,
      items,
      totalAmount: items.reduce((s, i) => s + i.total, 0),
      totalQuantity: items.reduce((s, i) => s + i.quantity, 0),
    };

    try {
      const url = editId
        ? `${API_BASE}/admin/purchase/update/${editId}`
        : `${API_BASE}/admin/purchase/add`;
      const response = await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purchaseData),
      });
      const result = await response.json();
      if (result.success) {
        Swal.fire(
          "Success!",
          editId ? "Order Updated" : "Order Created",
          "success",
        );
        modalInstance.hide();
        fetchPurchases();
      }
    } catch (error) {
      Swal.fire("Error", "Action failed", "error");
    }
  }

  // ==================== DYNAMIC ROW LOGIC ====================
  function addNewItemRow(data = {}) {
    elements.emptyItemsMsg.style.display = "none";
    const rowId = Date.now() + Math.random().toString(36).substr(2, 5);
    const row = document.createElement("tr");
    row.dataset.rowId = rowId;
    row.className = "item-row";

    let options = '<option value="">Select a Product</option>';
    allProductsList.forEach((p) => {
      const sel = p.name === data.productName ? "selected" : "";
      options += `<option value="${escapeHtml(p.name)}" ${sel}>${escapeHtml(p.name)}</option>`;
    });

    row.innerHTML = `
      <td><select class="form-select form-select-sm product-select" name="productName" required>${options}</select></td>
      <td><input type="number" class="form-control form-control-sm item-qty" name="quantity" min="1" value="${data.quantity || 1}" required /></td>
      <td><input type="number" class="form-control form-control-sm item-price" name="unitPrice" step="0.01" value="${data.unitPrice || ""}" required /></td>
      <td><strong class="item-total">₹0.00</strong></td>
      <td><button type="button" class="remove-item-btn" data-row-id="${rowId}"><i class="fa-solid fa-trash"></i></button></td>
    `;
    elements.itemsTableBody.appendChild(row);
    updateRowTotal(row);
    updateGrandTotal();
  }

  // ==================== UTILS & RENDERING ====================
  function renderTable() {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageData = filteredPurchases.slice(start, start + ITEMS_PER_PAGE);

    elements.purchasesTableBody.innerHTML = pageData.length
      ? pageData
        .map(
          (p) => `
      <tr>
        <td><strong>${escapeHtml(p.id)}</strong></td>
        <td><div><strong>${escapeHtml(p.supplierName)}</strong></div><small class="text-muted">${escapeHtml(p.items[0]?.productName)}${p.items.length > 1 ? "..." : ""}</small></td>
        <td>${formatDate(p.purchaseDate)}</td>
        <td>${p.totalQuantity}</td>
        <td><strong>₹${formatCurrency(p.totalAmount)}</strong></td>
        <td class="text-end">
          <a href="#" class="action-btn" data-action="view" data-id="${p._id}"><i class="fa-solid fa-eye"></i></a>
          <a href="#" class="action-btn" data-action="edit" data-id="${p._id}"><i class="fa-solid fa-pen"></i></a>
        </td>
      </tr>
    `,
        )
        .join("")
      : '<tr><td colspan="6" class="text-center py-4">No records found</td></tr>';
    updatePagination(filteredPurchases.length);
  }

  function updateRowTotal(row) {
    const q = parseFloat(row.querySelector(".item-qty").value) || 0;
    const p = parseFloat(row.querySelector(".item-price").value) || 0;
    row.querySelector(".item-total").textContent = `₹${formatCurrency(q * p)}`;
  }

  function updateGrandTotal() {
    let total = 0;
    document.querySelectorAll(".item-row").forEach((row) => {
      total +=
        (parseFloat(row.querySelector(".item-qty").value) || 0) *
        (parseFloat(row.querySelector(".item-price").value) || 0);
    });
    elements.grandTotal.textContent = `₹${formatCurrency(total)}`;
  }

  function handleItemRowActions(e) {
    if (e.target.closest(".remove-item-btn")) {
      e.target.closest("tr").remove();
      if (!elements.itemsTableBody.children.length)
        elements.emptyItemsMsg.style.display = "block";
      updateGrandTotal();
    }
  }

  function handleItemInput(e) {
    if (e.target.matches(".item-qty, .item-price")) {
      updateRowTotal(e.target.closest("tr"));
      updateGrandTotal();
    }
  }

  // --- BOILERPLATE UTILS ---
  function debounce(f, w) {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => f(...a), w);
    };
  }
  function escapeHtml(t) {
    return t
      ? String(t).replace(
        /[&<>"']/g,
        (m) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
          })[m],
      )
      : "";
  }
  function formatCurrency(n) {
    return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(
      n,
    );
  }
  function formatDate(d) {
    return d
      ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      : "-";
  }
  function setDefaultDate() {
    if (elements.purchaseDate) elements.purchaseDate.valueAsDate = new Date();
  }
  function resetPurchaseForm() {
    elements.newPurchaseForm.reset();
    elements.itemsTableBody.innerHTML = "";
    elements.emptyItemsMsg.style.display = "block";
    elements.grandTotal.textContent = "₹0.00";
    setDefaultDate();
  }

  async function loadProductsForSuggestions() {
    try {
      const r = await fetch(`${API_BASE}/admin/products?limit=1000`);
      const d = await r.json();
      allProductsList = d.formatted || [];
      updateAllProductDropdowns();
    } catch (e) { }
  }
  function updateSummaryCards() {
  }
  function filterPurchases() {
  }
  function updatePagination(t) {
  }
  function exportPurchases() {
  }
  async function loadCategoriesForQuickAdd() {
  }
  async function handleQuickProductSubmit(e) {
  }

  init();
});
