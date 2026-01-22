// Token check removed as requested by user
// const token = localStorage.getItem('token'); ...

// public/js/adminAddCategory.js
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');

  // Sidebar toggle
  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');
    });
  }

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  });

  // Upload area
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('catImageInput');
  const previewImage = document.getElementById('previewImage');
  const uploadContent = document.getElementById('uploadContent');

  if (uploadArea && fileInput) {
    uploadArea.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      if (e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          previewImage.src = ev.target.result;
          previewImage.style.display = 'inline-block';
          uploadContent.style.display = 'none';
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    });
  }

  // Status toggle
  const statusToggle = document.getElementById('statusToggle');
  const activeLabel = document.getElementById('activeLabel');
  const inactiveLabel = document.querySelector('.toggle-label:first-child');

  if (statusToggle) {
    statusToggle.addEventListener('change', () => {
      if (statusToggle.checked) {
        activeLabel.classList.add('active-text');
        inactiveLabel.classList.remove('active-text');
      } else {
        activeLabel.classList.remove('active-text');
        inactiveLabel.classList.add('active-text');
      }
    });
  }

  // Cancel button
  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      window.location.href = './adminCategories.html';
    });
  }

  // Create category
  const createBtn = document.getElementById('createCategoryBtn');
  if (createBtn) {
    createBtn.addEventListener('click', async () => {
      const name = document.getElementById('categoryName').value.trim();
      const description = document.getElementById('categoryDesc').value.trim();
      const isActive = document.getElementById('statusToggle').checked;
      const imageInput = document.getElementById('catImageInput');

      if (!name) {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: 'Category name is required!',
          confirmButtonColor: '#1a1a1a'
        });
        return;
      }

      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('isActive', isActive);
      if (imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
      }

      try {
        Swal.fire({
          title: 'Creating...',
          text: 'Please wait while we save your category.',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();

        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Category Created!',
            text: 'Your new category has been saved successfully.',
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            window.location.href = './adminCategories.html';
          });
        } else {
          throw new Error(data.error || 'Failed to create category');
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: err.message || 'Something went wrong. Please try again.'
        });
      }
    });
  }

  // Mobile sidebar close
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 991 &&
      sidebar.classList.contains('active') &&
      !e.target.closest('.sidebar') &&
      !e.target.closest('.mobile-nav button')) {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    }
  });
});