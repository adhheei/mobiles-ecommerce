// public/js/adminCategories.js
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");

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

  let categories = [];

  // Load categories
  async function loadCategories() {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();

      if (data.success) {
        categories = data.data;
        renderTable(categories);
      } else {
        throw new Error(data.error || "Failed to load categories");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: err.message || "Failed to load categories.",
      });
    }
  }

  // Render table
  function renderTable(data = categories) {
    const tbody = document.getElementById("categoryTableBody");
    tbody.innerHTML = "";

    if (data.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="text-center py-4 text-muted">No categories found.</td></tr>';
      return;
    }

    data.forEach((cat) => {
      const row = `
        <tr>
          <td>
            <div class="category-cell">
              <img src="${cat.img}" class="cat-img" alt="${cat.name}">
              <span class="cat-name">${cat.name}</span>
            </div>
          </td>
          <td><div class="cat-desc">${cat.desc}</div></td>
          <td>${cat.products} items</td>
          <td class="text-end">
            <a href="./adminEditCategory.html?id=${cat.id}" class="action-btn" title="Edit"><i class="fa-solid fa-pen"></i></a>
            <button class="action-btn btn-delete" data-id="${cat.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>
      `;
      tbody.innerHTML += row;
    });

    // Attach delete handlers
    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        deleteCategory(id);
      });
    });
  }

  // Search
  function filterCategories() {
    const term = document.getElementById("searchInput").value.toLowerCase();
    const filtered = categories.filter((c) =>
      c.name.toLowerCase().includes(term)
    );
    renderTable(filtered);
  }

  // Delete category (permanent)
  async function deleteCategory(id) {
    const result = await Swal.fire({
      title: "Are you sure?",
      html: "<strong>This action cannot be undone!</strong><br>All products in this category will lose their category link.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#1a1a1a",
      confirmButtonText: "Yes, delete permanently!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: "Deleting...",
          text: "Removing category permanently.",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const res = await fetch(`/api/categories/${id}`, {
          method: "DELETE",
        });

        const data = await res.json();

        if (data.success) {
          // Remove from local array
          categories = categories.filter((cat) => cat.id !== id);
          renderTable(); // Refresh UI

          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Category has been permanently removed.",
            timer: 2000,
            showConfirmButton: false,
          });
        } else {
          throw new Error(data.error || "Failed to delete category");
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: err.message || "Something went wrong.",
        });
      }
    }
  }

  // Initialize
  loadCategories();
  document
    .getElementById("searchInput")
    ?.addEventListener("keyup", filterCategories);
});
