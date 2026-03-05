// public/js/adminCategories.js
document.addEventListener('DOMContentLoaded', () => {
  let currentPage = 1;
  let currentSearch = '';
  let currentSort = 'newest';
  const limit = 5; // Reduced limit to trigger pagination more easily

  // Load categories from API
  async function loadCategories(page = 1, search = '', sort = 'newest') {
    try {
      currentPage = page;
      currentSearch = search;
      currentSort = sort;

      const res = await window.adminFetch(
        `/api/admin/categories?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&sort=${sort}`
      );

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      console.log("[AdminCategories] Loaded data:", data);

      if (data.success) {
        renderTable(data.data);
        renderPagination(data.pagination);
        updateEntryCount(data.pagination);
        window.paginationData = data.pagination; // Store globally for button clicks
      } else {
        renderTable([]);
        renderPagination(null);
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

  function updateEntryCount(pagination) {
    const parent = document.querySelector('.page-header');
    if (!parent) return;
    let countSpan = document.getElementById('categoryCountDisplay');
    if (!countSpan) {
      countSpan = document.createElement('span');
      countSpan.id = 'categoryCountDisplay';
      countSpan.className = 'badge bg-dark ms-2';
      countSpan.style.fontSize = '0.9rem';
      const title = parent.querySelector('.page-title');
      if (title) title.appendChild(countSpan);
    }
    if (pagination) countSpan.textContent = `Total: ${pagination.total}`;
  }

  // Render Pagination Buttons
  function renderPagination(pagination) {
    const infoText = document.getElementById('pageInfoText');
    const pageNum = document.getElementById('pageNumberDisplay');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (!pagination || pagination.total === 0) {
      if (infoText) infoText.textContent = 'No categories found';
      if (pageNum) pageNum.textContent = '0';
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      return;
    }

    const { page, pages, total, limit } = pagination;
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    if (infoText) infoText.textContent = `Showing ${start} to ${end} of ${total} categories`;
    if (pageNum) pageNum.textContent = page;

    if (prevBtn) prevBtn.disabled = (page <= 1);
    if (nextBtn) nextBtn.disabled = (page >= pages);
  }

  // Global function for pagination buttons
  window.changePage = (page) => {
    if (page >= 1) {
      loadCategories(page, currentSearch, currentSort);
    }
  };

  // Search logic (debounced)
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');

  let timeout = null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        loadCategories(1, e.target.value.trim(), currentSort);
      }, 500);
    });
  }

  // Sort logic
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      loadCategories(1, currentSearch, e.target.value);
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
        const res = await window.adminFetch(`/api/admin/categories/${id}`, {
          method: "DELETE",
        });
        const data = await res.json();

        if (data.success) {
          Swal.fire('Deleted!', 'Category has been removed.', 'success');
          loadCategories(currentPage, currentSearch, currentSort); // Reload current page
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