let coupons = [];
let currentFilters = {
  status: "all",
  type: "all",
  searchTerm: "",
};

document.addEventListener("DOMContentLoaded", () => {
  fetchCoupons();

  document.getElementById("searchInput").addEventListener("input", function () {
    currentFilters.searchTerm = this.value;
    applyFilters();
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".filter-btn")) {
      document
        .querySelectorAll(".filter-menu")
        .forEach((menu) => menu.classList.remove("show"));
    }
  });
});

async function fetchCoupons() {
  try {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      Swal.fire("Unauthorized", "Please login again", "error");
      window.location.href = "/Admin/adminLogin.html";
      return;
    }

    const response = await fetch("/api/admin/coupons", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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

  renderTable(filtered);
}

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
                <td>
                    <span class="coupon-code">
                        ${c.code}
                        <i class="fa-regular fa-copy copy-icon"
                           onclick="copyCode('${c.code}')"></i>
                    </span>
                </td>
                <td>${discount}</td>
                <td>${c.used} / ${c.limit}</td>
                <td>${c.expiry}</td>
                <td>
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
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
  document.getElementById("sidebarOverlay").classList.toggle("active");
}
