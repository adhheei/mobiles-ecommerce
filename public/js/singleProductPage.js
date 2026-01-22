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
  } else if (product.stock < 10) {
    stockBadge.className = 'stock-badge low-stock';
    stockStatus.innerHTML = `<i class="fa-solid fa-exclamation-circle me-1"></i> Only ${product.stock} left in stock!`;
    addToCartBtn.disabled = false;
    if (buyNowBtn) {
      buyNowBtn.classList.remove('disabled');
      buyNowBtn.style.pointerEvents = 'auto';
      buyNowBtn.style.opacity = '1';
    }
  } else {
    stockBadge.className = 'stock-badge';
    stockStatus.innerHTML = '<i class="fa-solid fa-check-circle me-1"></i> In stock, ready to ship';
    addToCartBtn.disabled = false;
    if (buyNowBtn) {
      buyNowBtn.classList.remove('disabled');
      buyNowBtn.style.pointerEvents = 'auto';
      buyNowBtn.style.opacity = '1';
    }
  }

  // Category display (no more "Uncategorized")
  document.getElementById('vendorText').textContent = product.categoryName || 'General';

  // Description
  document.getElementById('descriptionBody').innerHTML = product.description || '<p>No description available.</p>';

  // Tech specs
  let techSpecs = '';
  if (product.sku) {
    techSpecs += `<p class="mb-1"><strong>SKU:</strong> ${product.sku}</p>`;
  }
  techSpecs += `<p class="mb-1"><strong>Category:</strong> ${product.categoryName}</p>`;
  techSpecs += `<p class="mb-0"><strong>Stock:</strong> ${product.stock} units</p>`;

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
function updateQty(change) {
  const input = document.getElementById("qtyInput");
  let val = parseInt(input.value);
  val += change;
  if (val < 1) val = 1;
  // You can add max quantity based on stock later
  input.value = val;
}

// Color selection
function selectColor(swatchElement, colorName) {
  document.getElementById("selectedColorName").innerText = colorName;
  const swatches = document.querySelectorAll(".swatch-circle");
  swatches.forEach((s) => s.classList.remove("active"));
  swatchElement.classList.add("active");
}

// Add to cart functionality
function addToCart() {
  if (!currentProduct) return;

  const quantity = parseInt(document.getElementById('qtyInput').value);

  // Simple cart implementation (you can enhance this)
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');

  // Check if product already in cart
  const existingItem = cart.find(item => item.id === currentProduct.id);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: currentProduct.id,
      name: currentProduct.name,
      price: currentProduct.offerPrice,
      image: currentProduct.mainImage,
      quantity: quantity
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));

  // Show success message
  alert('Product added to cart!');
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

    // Fetch product details
    const product = await fetchProductDetails(productId);

    // Render product
    renderProductDetails(product);

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

// Start everything when DOM is ready
document.addEventListener('DOMContentLoaded', initPage);