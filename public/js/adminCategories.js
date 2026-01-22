// public/js/adminCategories.js
document.addEventListener('DOMContentLoaded', () => {
  let currentPage = 1;
  let currentSearch = '';
  const limit = 10;

  // Sidebar toggle
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  }

  // Load categories from API
  async function loadCategories(page = 1, search = '') {
    try {
      currentPage = page;
      currentSearch = search;

      const res = await fetch(`/api/admin/categories?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();

      if (data.success) {
        renderTable(data.data);
        renderPagination(data.pagination);
      } else {
        renderTable([]);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Failed to load categories.',
        confirmButtonColor: '#1a1a1a'
      });
      renderTable([]);
    }
  }

  // Render category table
  function renderTable(data) {
    const tbody = document.getElementById('categoryTableBody');

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4 text-muted">
            No categories found. <a href="./adminAddCategory.html" class="text-primary">Add one now</a>.
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    data.forEach(cat => {
      const name = cat.name || 'Unnamed';
      const desc = cat.desc || '';
      const products = cat.products || 0;
      const img = cat.img || '/images/logo.jpg';
      const id = cat.id || '';

      html += `
        <tr>
          <td>
            <div class="category-cell">
              <img src="${img}" class="cat-img" alt="${name}" onerror="this.src='/images/logo.jpg'">
              <span class="cat-name">${name}</span>
            </div>
          </td>
          <td><div class="cat-desc">${desc}</div></td>
          <td>${products} items</td>
          <td class="text-end">
            <a href="./adminEditCategory.html?id=${id}" class="action-btn" title="Edit">
              <i class="fa-solid fa-pen"></i>
            </a>
            <button class="action-btn btn-delete" data-id="${id}" title="Delete">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;

    // Attach delete listeners
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (id) deleteCategory(id);
      });
    });
  }

  // Render Pagination Buttons
  function renderPagination(pagination) {
    const container = document.getElementById('paginationContainer');
    if (!pagination || pagination.pages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '';
    const { page, pages } = pagination;

    // Prev
    html += `
      <li class="page-item ${page === 1 ? 'disabled' : ''}">
        <button class="page-link" onclick="window.changePage(${page - 1})">Previous</button>
      </li>
    `;

    // Pages
    for (let i = 1; i <= pages; i++) {
      html += `
          <li class="page-item ${i === page ? 'active' : ''}">
            <button class="page-link" onclick="window.changePage(${i})">${i}</button>
          </li>
        `;
    }

    // Next
    html += `
      <li class="page-item ${page === pages ? 'disabled' : ''}">
        <button class="page-link" onclick="window.changePage(${page + 1})">Next</button>
      </li>
    `;

    container.innerHTML = html;
  }

  // Global function for pagination buttons
  window.changePage = (page) => {
    if (page >= 1) {
      loadCategories(page, currentSearch);
    }
  };

  // Search logic (debounced)
  const searchInput = document.getElementById('searchInput');
  let timeout = null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        loadCategories(1, e.target.value.trim());
      }, 500);
    });
  }

  // Delete category
  async function deleteCategory(id) {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This category will be permanently deleted!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#1a1a1a',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
        const data = await res.json();

        if (data.success) {
          Swal.fire('Deleted!', 'Category has been removed.', 'success');
          loadCategories(currentPage, currentSearch); // Reload current page
        } else {
          throw new Error(data.error || 'Delete failed');
        }
      } catch (err) {
        console.error('Delete error:', err);
        Swal.fire('Error!', err.message, 'error');
      }
    }
  }

  // Initial load
  loadCategories();
});