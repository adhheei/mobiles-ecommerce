// public/js/adminEditProduct.js
document.addEventListener('DOMContentLoaded', () => {
  // Get product ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    Swal.fire('Error', 'No Product ID found in URL', 'error').then(() => {
      window.location.href = './adminProducts.html';
    });
    return;
  }

  // Elements
  const mainUploadArea = document.getElementById('mainUploadArea');
  const mainImageInput = document.getElementById('mainImageInput');
  const mainImagePreview = document.getElementById('mainImagePreview');
  const mainImageSrc = document.getElementById('mainImageSrc');
  const removeMainBtn = document.getElementById('removeMainBtn');
  
  const galleryUploadArea = document.getElementById('galleryUploadArea');
  const galleryInput = document.getElementById('galleryInput');
  const galleryContainer = document.getElementById('galleryContainer');
  
  const categorySelect = document.getElementById('categorySelect');

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

  // Load categories
  async function loadCategories() {
    try {
      const res = await fetch('/api/admin/products/categories');
      const data = await res.json();
      
      if (data.success) {
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        data.categories.forEach(cat => {
          const option = document.createElement('option');
          option.value = cat._id;
          option.textContent = cat.name;
          categorySelect.appendChild(option);
        });
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }

  // Load product data
  async function loadProduct() {
    try {
      const res = await fetch(`/api/admin/products/${productId}`);
      const data = await res.json();

      if (data.success && data.product) {
        const p = data.product;
        
        // Basic info
        document.getElementById('productName').value = p.name || '';
        document.getElementById('productDescription').value = p.description || '';
        document.getElementById('productSku').value = p.sku || '';
        document.getElementById('stockQuantity').value = p.stock || '';
        document.getElementById('actualPrice').value = p.actualPrice || '';
        document.getElementById('offerPrice').value = p.offerPrice || '';
        
        // Status
        document.getElementById('productStatus').value = p.status || 'active';
        document.getElementById('productVisibility').value = p.visibility || 'public';
        if (p.publishDate) {
          document.getElementById('publishDate').valueAsDate = new Date(p.publishDate);
        }
        
        // Tags
        document.getElementById('productTags').value = Array.isArray(p.tags) ? p.tags.join(', ') : '';
        
        // Category
        document.getElementById('categorySelect').value = p.category || '';
        
        // Main image
        if (p.mainImage) {
          mainImageSrc.src = p.mainImage;
          mainImagePreview.style.display = 'block';
          mainUploadArea.style.display = 'none';
        }
        
        // Gallery images
        if (Array.isArray(p.gallery) && p.gallery.length > 0) {
          p.gallery.forEach(imgUrl => {
            const div = document.createElement('div');
            div.className = 'thumbnail-item';
            div.innerHTML = `
              <img src="${imgUrl}" alt="Gallery Image">
              <button type="button" class="remove-btn">×</button>
            `;
            galleryContainer.appendChild(div);
            
            div.querySelector('.remove-btn').addEventListener('click', () => {
              div.remove();
            });
          });
        }
      } else {
        throw new Error(data.error || 'Product not found');
      }
    } catch (err) {
      console.error('Load Error:', err);
      Swal.fire('Error', 'Failed to load product: ' + err.message, 'error').then(() => {
        window.location.href = './adminProducts.html';
      });
    }
  }

  // Main image preview
  mainUploadArea.addEventListener('click', () => mainImageInput.click());
  mainImageInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = ev => {
        mainImageSrc.src = ev.target.result;
        mainImagePreview.style.display = 'block';
        mainUploadArea.style.display = 'none';
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });
  removeMainBtn.addEventListener('click', () => {
    mainImageInput.value = '';
    mainImagePreview.style.display = 'none';
    mainUploadArea.style.display = 'block';
  });

  // Gallery images
  galleryUploadArea.addEventListener('click', () => galleryInput.click());
  galleryInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = ev => {
          const div = document.createElement('div');
          div.className = 'thumbnail-item';
          div.innerHTML = `
            <img src="${ev.target.result}" alt="Gallery Image">
            <button type="button" class="remove-btn">×</button>
          `;
          galleryContainer.appendChild(div);
          div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
        };
        reader.readAsDataURL(file);
      });
    }
  });

  // Cancel button
  document.getElementById('cancelBtn').addEventListener('click', () => {
    window.location.href = './adminProducts.html';
  });

  // Update product
  document.getElementById('updateProductBtn').addEventListener('click', async () => {
    const name = document.getElementById('productName').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const sku = document.getElementById('productSku').value.trim();
    const actualPrice = document.getElementById('actualPrice').value;
    const offerPrice = document.getElementById('offerPrice').value;
    const stock = document.getElementById('stockQuantity').value;
    const status = document.getElementById('productStatus').value;
    const visibility = document.getElementById('productVisibility').value;
    const publishDate = document.getElementById('publishDate').value;
    const tags = document.getElementById('productTags').value.trim();
    const category = categorySelect.value;

    if (!name || !actualPrice || !offerPrice || !stock || !category) {
      Swal.fire('Error', 'Please fill all required fields', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    if (sku) formData.append('sku', sku);
    formData.append('actualPrice', actualPrice);
    formData.append('offerPrice', offerPrice);
    formData.append('stock', stock);
    formData.append('status', status);
    formData.append('visibility', visibility);
    if (publishDate) formData.append('publishDate', publishDate);
    if (tags) formData.append('tags', tags);
    formData.append('category', category);

    if (mainImageInput.files[0]) {
      formData.append('mainImage', mainImageInput.files[0]);
    }

    Array.from(galleryInput.files).forEach(file => {
      formData.append('gallery', file);
    });

    try {
      Swal.fire({
        title: 'Updating Product...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        Swal.fire('Success!', 'Product updated successfully.', 'success').then(() => {
          window.location.href = './adminProducts.html';
        });
      } else {
        throw new Error(data.error || 'Failed to update product');
      }
    } catch (err) {
      console.error('Update Error:', err);
      Swal.fire('Error!', err.message, 'error');
    }
  });

  // Delete product
  document.getElementById('deleteProductBtn').addEventListener('click', async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete the product!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/admin/products/${productId}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        if ( data.success ) {
          Swal.fire('Deleted!', 'Product has been deleted.', 'success').then(() => {
            window.location.href = './adminProducts.html';
          });
        } else {
          throw new Error(data.error || 'Deletion failed');
        }
      } catch (err) {
        Swal.fire('Error', err.message || 'Failed to delete product', 'error');
      }
    }
  });

  // Initialize
  loadCategories();
  loadProduct();
});