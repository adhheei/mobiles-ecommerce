// public/js/adminCategories.js
document.addEventListener('DOMContentLoaded', () => {
  // Initialize categories as empty array
  let categories = [];

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
  async function loadCategories() {
    try {
      const res = await fetch('/api/admin/categories');
      
      // Check if response is OK
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      // Validate response structure
      if (data.success && Array.isArray(data.data)) {
        categories = data.data;
      } else {
        console.warn('Unexpected API response:', data);
        categories = [];
      }

      renderTable(categories);
    } catch (err) {
      console.error('Failed to load categories:', err);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Failed to load categories. Please try again later.',
        confirmButtonColor: '#1a1a1a'
      });
      categories = [];
      renderTable(categories);
    }
  }

  // Render category table
  function renderTable(data = categories) {
    const tbody = document.getElementById('categoryTableBody');
    
    // Safety check
    if (!Array.isArray(data)) {
      console.error('Expected array but got:', typeof data);
      data = [];
    }

    if (data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4 text-muted">
            No categories found. <a href="./adminAddCategory.html" class="text-primary">Add one now</a>.
          </td>
        </tr>
      `;
      return;
    }

    // Build table rows
    let html = '';
    data.forEach(cat => {
      // Ensure all fields exist
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

    // Attach delete event listeners
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (id) {
          deleteCategory(id);
        }
      });
    });
  }

  // Search/filter categories
  function filterCategories() {
    const term = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filtered = categories.filter(cat => 
      cat.name?.toLowerCase().includes(term)
    );
    renderTable(filtered);
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
        const res = await fetch(`/api/admin/categories/${id}`, {
          method: 'DELETE'
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        if (data.success) {
          // Remove from local array
          categories = categories.filter(cat => cat.id !== id);
          renderTable();
          Swal.fire('Deleted!', 'Category has been removed.', 'success');
        } else {
          throw new Error(data.error || 'Delete failed');
        }
      } catch (err) {
        console.error('Delete error:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: err.message || 'Failed to delete category.'
        });
      }
    }
  }

  // Initialize
  loadCategories();
  
  // Setup search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keyup', filterCategories);
  }
});