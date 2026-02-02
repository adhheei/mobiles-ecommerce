// public/js/singleProductPage.js

let currentProduct = null;

// Get product ID from URL
function getProductId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

// Fetch product details from backend
async function fetchProductDetails(productId) {
  try {
    const response = await fetch(`/api/admin/products/${productId}`);
    const data = await response.json();

    if (data.success && data.product) {
      return data.product;
    } else {
      throw new Error('Product not found');
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

// Fetch related products
async function fetchRelatedProducts(categoryId, currentProductId) {
  try {
    const response = await fetch(`/api/admin/products/public?category=${categoryId}&limit=5`);
    const data = await response.json();

    if (data.success && data.products) {
      // Filter out current product
      return data.products.filter(p => p.id !== currentProductId);
    }
    return [];
  } catch (error) {
    console.error('Error fetching related products:', error);
    return [];
  }
}

// Render product details
function renderProductDetails(product) {
  currentProduct = product;

  // Basic info
  document.getElementById('mainImage').src = product.mainImage || '/images/logo.jpg';
  document.getElementById('mainImage').alt = product.name;
  document.getElementById('vendorText').textContent = product.brand || product.categoryName || 'Generic';
  document.getElementById('productTitle').textContent = product.name;

  // Price
  const currentPriceEl = document.getElementById('currentPrice');
  const oldPriceEl = document.getElementById('oldPrice');

  if (product.offerPrice < product.actualPrice) {
    currentPriceEl.textContent = `Rs. ${product.offerPrice}`;
    oldPriceEl.textContent = `Rs. ${product.actualPrice}`;
    oldPriceEl.style.display = 'inline';
  } else {
    currentPriceEl.textContent = `Rs. ${product.offerPrice}`;
    oldPriceEl.style.display = 'none';
  }

  // Stock status logic
  const stockBadge = document.getElementById('stockBadge');
  const stockStatus = document.getElementById('stockStatus');
  const addToCartBtn = document.getElementById('addToCartBtn');
  const buyNowBtn = document.getElementById('buyNowBtn');

  if (product.stock === 0 || product.status === 'outofstock') {
    stockBadge.className = 'stock-badge out-of-stock';
    stockStatus.innerHTML = '<i class="fa-solid fa-times-circle me-1"></i> Out of stock';
    addToCartBtn.disabled = true;
    if (buyNowBtn) {
      buyNowBtn.classList.add('disabled');
      buyNowBtn.style.pointerEvents = 'none';
      buyNowBtn.style.opacity = '0.6';
    }
    // Visually disable wishlist button (but keep clickable for alert)
    const wishlistBtn = document.getElementById('wishlistBtn');
    if (wishlistBtn) {
      wishlistBtn.style.opacity = '0.6';
      wishlistBtn.style.cursor = 'not-allowed';
    }
  } else if (product.stock < 10) {
    stockBadge.className = 'stock-badge low-stock';
    stockStatus.innerHTML = `<i class="fa-solid fa-exclamation-circle me-1"></i> Only ${product.stock} left in stock!`;
    addToCartBtn.disabled = false;
    if (buyNowBtn) {
      buyNowBtn.classList.remove('disabled');
      buyNowBtn.style.pointerEvents = 'auto';
      buyNowBtn.style.opacity = '1';
    }
    const wishlistBtn = document.getElementById('wishlistBtn');
    if (wishlistBtn) {
      wishlistBtn.style.opacity = '1';
      wishlistBtn.style.cursor = 'pointer';
    }
  } else {
    stockBadge.className = 'stock-badge';
    stockStatus.innerHTML = '<i class="fa-solid fa-check-circle me-1"></i> In stock, ready to ship';
    addToCartBtn.disabled = false;
    // Existing Stock Logic...
    if (buyNowBtn) {
      buyNowBtn.classList.remove('disabled');
      buyNowBtn.style.pointerEvents = 'auto';
      buyNowBtn.style.opacity = '1';
    }
    const wishlistBtn = document.getElementById('wishlistBtn');
    if (wishlistBtn) {
      wishlistBtn.style.opacity = '1';
      wishlistBtn.style.cursor = 'pointer';
    }
  }

  // Category display (no more "Uncategorized")
  document.getElementById('vendorText').textContent = product.categoryName || 'General';

  // Description
  document.getElementById('descriptionBody').innerHTML = product.description || '<p>No description available.</p>';

  // Tech specs
  let techSpecs = '';
  techSpecs += `
    <div class="row mb-2">
      <div class="col-4 fw-bold">SKU</div>
      <div class="col-8 text-muted">${product.sku || 'N/A'}</div>
    </div>
    <div class="row mb-2">
      <div class="col-4 fw-bold">Category</div>
      <div class="col-8 text-muted">${product.categoryName || 'General'}</div>
    </div>
    <div class="row mb-0">
      <div class="col-4 fw-bold">Stock</div>
      <div class="col-8 text-muted">${product.stock > 0 ? product.stock + ' units' : 'Out of Stock'}</div>
    </div>
  `;

  document.getElementById('techSpecsBody').innerHTML = techSpecs;

  // Gallery thumbnails
  const thumbnailContainer = document.getElementById('thumbnailContainer');
  thumbnailContainer.innerHTML = '';

  // Main image as first thumbnail
  const mainThumb = document.createElement('div');
  mainThumb.className = 'thumbnail active';
  mainThumb.innerHTML = `<img src="${product.mainImage || '/images/logo.jpg'}" alt="Main" />`;
  mainThumb.onclick = () => changeImage(mainThumb, product.mainImage || '/images/logo.jpg');
  thumbnailContainer.appendChild(mainThumb);

  // Gallery images
  if (product.gallery && product.gallery.length > 0) {
    product.gallery.forEach((img, index) => {
      const thumb = document.createElement('div');
      thumb.className = 'thumbnail';
      thumb.innerHTML = `<img src="${img}" alt="Gallery ${index + 1}" />`;
      thumb.onclick = () => changeImage(thumb, img);
      thumbnailContainer.appendChild(thumb);
    });
  }

  // Color swatches (mock implementation - you can enhance this)
  const swatchGroup = document.getElementById('swatchGroup');
  swatchGroup.innerHTML = `
    <div class="swatch-circle active" style="background: #000" onclick="selectColor(this, 'Black')"></div>
    <div class="swatch-circle" style="background: #ffb74d" onclick="selectColor(this, 'Orange')"></div>
    <div class="swatch-circle" style="background: #f8bbd0" onclick="selectColor(this, 'Pink')"></div>
    <div class="swatch-circle" style="background: #e1bee7" onclick="selectColor(this, 'Purple')"></div>
  `;
}

// Render related products
function renderRelatedProducts(products) {
  const slider = document.getElementById('relatedSlider');
  slider.innerHTML = '';

  if (products.length === 0) {
    slider.innerHTML = '<div class="col-12 text-center py-4">No related products found.</div>';
    return;
  }

  products.forEach(product => {
    const col = document.createElement('div');
    col.className = 'col-10 col-md-3';
    col.innerHTML = `
      <a href="./singleProductPage.html?id=${product.id}" class="product-card-link">
        <div class="product-card h-100">
          <img src="${product.mainImage || '/images/logo.jpg'}" class="card-img-top" alt="${product.name}" />
          <div class="card-body">
            <div class="related-vendor">${product.categoryName}</div>
            <div class="related-name">${product.name}</div>
            <div class="related-price">Rs. ${product.offerPrice}</div>
          </div>
        </div>
      </a>
    `;
    slider.appendChild(col);
  });
}

// Change main image
function changeImage(thumbElement, srcUrl) {
  document.getElementById("mainImage").src = srcUrl;
  const thumbnails = document.querySelectorAll(".thumbnail");
  thumbnails.forEach((t) => t.classList.remove("active"));
  thumbElement.classList.add("active");
}

// Quantity selector
// Quantity selector
function updateQty(change) {
  if (!currentProduct) return;

  const input = document.getElementById("qtyInput");
  let val = parseInt(input.value);
  const stock = currentProduct.stock || 0;

  // Prevent changes if essentially out of stock (though buttons should be disabled)
  if (stock <= 0) return;

  const newQuantity = val + change;

  if (newQuantity < 1) {
    // Minimum limit
    input.value = 1;
  } else if (newQuantity > stock) {
    // Maximum limit (Stock)
    input.value = stock; // Ensure we stick to max available

    // Show warning if trying to increase beyond stock
    if (change > 0) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Stock Limit Reached',
        text: `Only ${stock} units available`,
        showConfirmButton: false,
        timer: 1500
      });
    }
  } else {
    // Valid range
    input.value = newQuantity;
  }
}

// Color selection
function selectColor(swatchElement, colorName) {
  document.getElementById("selectedColorName").innerText = colorName;
  const swatches = document.querySelectorAll(".swatch-circle");
  swatches.forEach((s) => s.classList.remove("active"));
  swatchElement.classList.add("active");
}

// Add to cart functionality
async function addToCart() {
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  if (!user || !token) {
    Swal.fire({
      title: 'Login Required',
      text: 'Please login to add products to your cart.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Login Now',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = '/User/userLogin.html?redirect=' + encodeURIComponent(window.location.pathname);
      }
    });
    return;
  }

  if (!currentProduct) return;
  const productId = currentProduct.id || currentProduct._id;
  const quantity = parseInt(document.getElementById('qtyInput').value) || 1;

  try {
    const res = await fetch('/api/cart/add', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ productId, quantity })
    });

    const data = await res.json();

    if (res.ok) {
      Swal.fire({
        title: 'Added to Cart!',
        text: 'Product added successfully',
        icon: 'success',
        confirmButtonColor: '#1a1a1a',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false
      }).then(() => {
        // Refresh page as requested
        window.location.reload();
      });
    } else {
      throw new Error(data.message || "Failed to add to cart");
    }

  } catch (error) {
    console.error("Add to cart error:", error);
    Swal.fire({
      icon: 'error',
      title: 'Action Failed',
      text: error.message || 'Something went wrong!',
      confirmButtonColor: '#1a1a1a'
    });
  }
}

// Scroll related products
function scrollRelated(direction) {
  const slider = document.getElementById("relatedSlider");
  const scrollAmount = 300;
  if (direction === "left") {
    slider.scrollLeft -= scrollAmount;
  } else {
    slider.scrollLeft += scrollAmount;
  }
}

// Initialize page
async function initPage() {
  const loading = document.getElementById('loading');
  const errorState = document.getElementById('errorState');
  const productContent = document.getElementById('productContent');

  // Show loading
  loading.style.display = 'block';

  try {
    const productId = getProductId();
    if (!productId) {
      throw new Error('No product ID provided');
    }

    // Fetch product and wishlist parallel
    const [product, _] = await Promise.all([
      fetchProductDetails(productId),
      loadUserWishlist()
    ]);

    // Render product
    renderProductDetails(product);

    // Update Wishlist Button State
    if (isUserLoggedIn && userWishlistIds.has(product.id || product._id)) {
      const btn = document.getElementById('wishlistBtn');
      if (btn) {
        btn.classList.add('active'); // Ensure button is active (red)
        const icon = btn.querySelector('i');
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
      }
    }

    // Fetch and render related products
    const relatedProducts = await fetchRelatedProducts(product.category, productId);
    renderRelatedProducts(relatedProducts);

    // Hide loading, show content
    loading.style.display = 'none';
    productContent.style.display = 'block';

    // Initialize animations
    initAnimations();

  } catch (error) {
    console.error('Failed to load product:', error);
    loading.style.display = 'none';
    errorState.style.display = 'block';
  }
}

// Animation initialization
function initAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const animatedElements = document.querySelectorAll(".reveal-up");
  animatedElements.forEach((el) => observer.observe(el));
}

// --- Wishlist Logic ---
let userWishlistIds = new Set();
let isUserLoggedIn = false;

// Fetch user wishlist IDs
async function loadUserWishlist() {
  try {
    const res = await fetch('/api/user/wishlist');
    if (res.status === 401) {
      isUserLoggedIn = false;
      userWishlistIds.clear();
      return;
    }
    const data = await res.json();
    if (data.success) {
      isUserLoggedIn = true;
      userWishlistIds = new Set(data.wishlist.map(item => item._id || item));
    }
  } catch (err) {
    console.error('Error loading wishlist:', err);
  }
}

window.toggleWishlist = async function () {
  if (!currentProduct) return;
  const productId = currentProduct.id || currentProduct._id;

  if (!isUserLoggedIn) {
    Swal.fire({
      title: 'Login Required',
      text: 'Please login to add products to your wishlist.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Login Now',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = '/User/userLogin.html?redirect=' + encodeURIComponent(window.location.pathname);
      }
    });
    return;
  }

  // Check stock before adding
  if (currentProduct && (currentProduct.stock <= 0 || currentProduct.status === 'outofstock')) {
    Swal.fire({
      icon: 'warning',
      title: 'Out of Stock',
      text: 'This product is currently out of stock and cannot be added to the wishlist.',
      confirmButtonColor: '#1a1a1a'
    });
    return;
  }

  const btn = document.getElementById('wishlistBtn');
  const icon = btn.querySelector('i');

  // Determine if adding or removing based on current icon class
  const isAdding = icon.classList.contains('fa-regular');

  // Optimistic UI Update
  btn.classList.toggle('active'); // Toggle active class for color change

  if (isAdding) {
    icon.classList.remove('fa-regular');
    icon.classList.add('fa-solid');
  } else {
    icon.classList.remove('fa-solid');
    icon.classList.add('fa-regular');
  }

  try {
    const url = isAdding ? '/api/user/wishlist' : `/api/user/wishlist/${productId}`;
    const method = isAdding ? 'POST' : 'DELETE';
    const body = isAdding ? JSON.stringify({ productId }) : null;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body
    });

    if (res.status === 401) {
      window.location.href = '/User/userLogin.html';
      return;
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to update wishlist');
    }

    // Update local set
    if (isAdding) userWishlistIds.add(productId);
    else userWishlistIds.delete(productId);

    // Show toast
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true
    })

    Toast.fire({
      icon: 'success',
      title: isAdding ? 'Product added to wishlist ❤️' : 'Product removed from wishlist'
    })

  } catch (error) {
    console.error('Error updating wishlist:', error);
    // Revert UI
    btn.classList.toggle('active'); // Revert color change
    if (isAdding) {
      icon.classList.remove('fa-solid');
      icon.classList.add('fa-regular');
    } else {
      icon.classList.remove('fa-regular');
      icon.classList.add('fa-solid');
    }

    // Show warning details
    Swal.fire({
      icon: 'warning',
      title: 'Action Failed',
      text: error.message || 'Something went wrong!',
      confirmButtonColor: '#1a1a1a',
    })
  }
};

// Start everything when DOM is ready
document.addEventListener('DOMContentLoaded', (() => {
  initPage();

  // --- SHARE FUNCTIONALITY ---
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const product = window.currentProduct || {}; // Access global product object set in fetch
      const shareData = {
        title: product.name || document.title,
        text: `Check out ${product.name} on Jinsa Mobiles!`,
        url: window.location.href
      };

      // 1. Try Web Share API (Mobile Native)
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          console.log('Error sharing:', err);
        }
      } else {
        // 2. Fallback: SweetAlert2 Custom Options
        const socialUrl = encodeURIComponent(window.location.href);
        const socialText = encodeURIComponent(shareData.text);

        Swal.fire({
          title: 'Share Product',
          html: `
                        <div class="d-flex justify-content-center gap-3 mt-2">
                            <a href="https://api.whatsapp.com/send?text=${socialText}%20${socialUrl}" target="_blank" class="btn btn-success rounded-circle d-flex align-items-center justify-content-center" style="width: 50px; height: 50px; font-size: 1.5rem; text-decoration: none;">
                                <i class="fa-brands fa-whatsapp"></i>
                            </a>
                            <a href="https://www.facebook.com/sharer/sharer.php?u=${socialUrl}" target="_blank" class="btn btn-primary rounded-circle d-flex align-items-center justify-content-center" style="width: 50px; height: 50px; font-size: 1.5rem; text-decoration: none;">
                                <i class="fa-brands fa-facebook-f"></i>
                            </a>
                            <a href="https://twitter.com/intent/tweet?text=${socialText}&url=${socialUrl}" target="_blank" class="btn btn-dark rounded-circle d-flex align-items-center justify-content-center" style="width: 50px; height: 50px; font-size: 1.5rem; background: black; text-decoration: none;">
                               <i class="fa-brands fa-x-twitter"></i>
                            </a>
                            <button id="copyLinkBtn" class="btn btn-secondary rounded-circle d-flex align-items-center justify-content-center" style="width: 50px; height: 50px; font-size: 1.5rem;">
                                <i class="fa-solid fa-link"></i>
                            </button>
                        </div>
                    `,
          showConfirmButton: false,
          showCloseButton: true,
          didOpen: () => {
            // Attach copy event
            const copyBtn = Swal.getHtmlContainer().querySelector('#copyLinkBtn');
            if (copyBtn) {
              copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(window.location.href).then(() => {
                  Swal.close(); // Close share modal
                  // Show success toast
                  const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                  });
                  Toast.fire({
                    icon: 'success',
                    title: 'Link copied to clipboard!'
                  });
                }).catch(err => {
                  console.error('Failed to copy: ', err);
                });
              });
            }
          }
        });
      }
    });
  }


  // --- BUY NOW CLICK HANDLER ---
  const buyNowBtn = document.getElementById('buyNowBtn');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', (e) => {
      e.preventDefault();

      const user = localStorage.getItem('user');
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      // Check Login
      if (!user || !token) {
        Swal.fire({
          title: 'Login Required',
          text: 'Please login to buy products.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Login Now',
          cancelButtonText: 'Cancel'
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = '/User/userLogin.html?redirect=' + encodeURIComponent(window.location.pathname);
          }
        });
        return;
      }

      if (!currentProduct) return;

      // Get Data
      const productId = currentProduct.id || currentProduct._id;
      const quantity = parseInt(document.getElementById('qtyInput').value) || 1;

      // Store in SessionStorage
      sessionStorage.setItem("checkoutType", "buyNow");
      sessionStorage.setItem("buyNowItem", JSON.stringify({
        productId: productId,
        qty: quantity
      }));

      // Redirect
      window.location.href = "/User/address.html";
    });
  }
}));