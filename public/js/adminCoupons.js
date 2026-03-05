let coupons = [];
let currentFilters = {
  status: "all",
  type: "all",
  searchTerm: "",
};
let currentPage = 1;
const rowsPerPage = 8;

document.addEventListener("DOMContentLoaded", () => {
  fetchCoupons();

  document.getElementById("searchInput").addEventListener("input", function () {
    currentFilters.searchTerm = this.value;
    currentPage = 1;
    applyFilters();
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".filter-btn")) {
      document
        .querySelectorAll(".filter-menu")
        .forEach((menu) => menu.classList.remove("show"));
      document
        .querySelectorAll(".filter-btn")
        .forEach((btn) => btn.classList.remove("open"));
    }
  });
});

window.toggleFilter = function (type) {
  const menu = document.getElementById(`${type}Menu`);
  const btn = menu.parentElement;

  // Close other menus
  document.querySelectorAll(".filter-menu").forEach(m => {
    if (m !== menu) m.classList.remove("show");
  });
  document.querySelectorAll(".filter-btn").forEach(b => {
    if (b !== btn) b.classList.remove("open");
  });

  menu.classList.toggle("show");
  btn.classList.toggle("open");
};

window.setFilter = function (type, value) {
  currentFilters[type] = value;

  // Update Labels
  if (type === 'status') {
    document.getElementById('statusLabel').textContent = value.charAt(0).toUpperCase() + value.slice(1);
  } else if (type === 'type') {
    const typeText = value === 'all' ? 'All' : (value === 'fixed' ? 'Fixed Amount' : 'Percentage');
    document.getElementById('typeLabel').textContent = typeText;
  }

  currentPage = 1;
  applyFilters();

  // Close menu
  document.querySelectorAll(".filter-menu").forEach(m => m.classList.remove("show"));
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("open"));
};

async function fetchCoupons() {
  try {
    const response = await window.adminFetch("/api/admin/coupons");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch coupons");
    }

    coupons = data.data.map((c) => {
      let status = "Active";
      if (!c.isActive) status = "Inactive";
      if (new Date(c.endDate) < new Date()) status = "Expired";

      return {
        id: c._id,
        code: c.code,
        type: c.discountType,
        value: c.value,
        limit: c.totalLimit || "∞",
        used: c.totalUsed || 0,
        expiry: new Date(c.endDate).toLocaleDateString(),
        status,
      };
    });

    applyFilters();
  } catch (error) {
    console.error(error);
    Swal.fire("Error", error.message, "error");
  }
}

function applyFilters() {
  const { status, type, searchTerm } = currentFilters;

  const filtered = coupons.filter((c) => {
    const matchSearch = c.code.toUpperCase().includes(searchTerm.toUpperCase());
    const matchStatus = status === "all" || c.status === status;
    const matchType = type === "all" || c.type === type;
    return matchSearch && matchStatus && matchType;
  });

  const totalCoupons = filtered.length;
  const totalPages = Math.ceil(totalCoupons / rowsPerPage) || 1;

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filtered.slice(startIndex, startIndex + rowsPerPage);

  renderTable(paginatedData);
  updatePaginationUI(startIndex, paginatedData.length, totalCoupons, totalPages);
}

function updatePaginationUI(startIndex, currentCount, totalEntries, totalPages) {
  const wrapper = document.getElementById("paginationWrapper");
  if (!wrapper) return;

  if (totalEntries === 0) {
    wrapper.innerHTML = `<span class="text-muted small">Showing 0 entries</span>`;
    return;
  }

  const endCount = startIndex + currentCount;
  wrapper.innerHTML = `
    <span class="text-muted small">Showing ${startIndex + 1} to ${endCount} of ${totalEntries} entries</span>
    <div class="d-flex align-items-center gap-2">
      <button class="page-nav-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}><i class="fa-solid fa-chevron-left"></i></button>
      <span class="fw-bold px-2 small">${currentPage}</span>
      <button class="page-nav-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""}><i class="fa-solid fa-chevron-right"></i></button>
    </div>
  `;
}

window.changePage = function (newPage) {
  currentPage = newPage;
  applyFilters();
};

function renderTable(data) {
  const tbody = document.getElementById("couponTableBody");
  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    No coupons found
                </td>
            </tr>`;
    return;
  }

  data.forEach((c) => {
    let statusClass = "status-active";
    if (c.status === "Expired") statusClass = "status-expired";
    if (c.status === "Inactive") statusClass = "status-inactive";

    const discount =
      c.type === "percentage" ? `${c.value}% Off` : `₹${c.value} Off`;

    tbody.innerHTML += `
            <tr>
                <td data-label="Code">
                    <span class="coupon-code">
                        ${c.code}
                        <i class="fa-regular fa-copy copy-icon"
                           onclick="copyCode('${c.code}')"></i>
                    </span>
                </td>
                <td data-label="Discount">${discount}</td>
                <td data-label="Usage Limit">${c.used} / ${c.limit}</td>
                <td data-label="Expiry Date">${c.expiry}</td>
                <td data-label="Status">
                    <span class="badge-custom ${statusClass}">
                        ${c.status}
                    </span>
                </td>
                <td class="text-end">

                    <!-- ✏️ EDIT -->
                    <button class="action-btn"
                        title="Edit"
                        onclick="editCoupon('${c.id}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>

                    <!-- 🗑️ DELETE -->
                    <button class="action-btn btn-delete"
                        title="Delete"
                        onclick="deleteCoupon('${c.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </td>
            </tr>
        `;
  });
}

function editCoupon(id) {
  window.location.href = `/Admin/adminEditCoupon.html?id=${id}`;
}

async function deleteCoupon(id) {
  const token = localStorage.getItem("adminToken");

  Swal.fire({
    title: "Are you sure?",
    text: "This coupon will be deleted permanently",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    confirmButtonText: "Yes, delete it!",
  }).then(async (result) => {
    if (!result.isConfirmed) return;

    try {
      const res = await window.adminFetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      Swal.fire("Deleted!", "Coupon removed", "success");
      fetchCoupons();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  });
}

function copyCode(code) {
  navigator.clipboard.writeText(code);
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: "Code copied!",
    showConfirmButton: false,
    timer: 1000,
  });
}

// Sidebar toggle is now handled by adminCommon.js
