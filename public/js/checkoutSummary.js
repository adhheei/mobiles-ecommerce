// public/js/checkoutSummary.js

// Function to fetch cart and render summary
// Function to fetch cart and render summary
async function fetchOrderSummary() {
  const summaryContainer = document.querySelector('.order-summary');
  if (!summaryContainer) return;

  // Show Loader
  summaryContainer.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> Loading Summary...</div>';

  try {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    // --- DETERMINE CHECKOUT FLOW ---
    // --- DETERMINE CHECKOUT FLOW ---
    const checkoutType = sessionStorage.getItem("checkoutType");
    const buyNowData = sessionStorage.getItem("buyNowItem");

    if (checkoutType === "cart") {
      // --- CART FLOW (Explicit) ---
      await fetchCartAndRender(token);
    }
    else if (checkoutType === "buyNow" && buyNowData) {
      // --- BUY IT NOW FLOW ---
      const { productId, qty } = JSON.parse(buyNowData);

      // Fetch Single Product Details
      const res = await fetch(`/api/admin/products/${productId}`);
      const data = await res.json();

      if (!data.success || !data.product) throw new Error("Product not found");

      const product = data.product;
      const price = product.offerPrice || product.price || 0;
      const total = price * qty;

      // Mock Cart Structure for Renderer
      const mockCart = {
        items: [{
          productId: product._id, // Keep consistent
          name: product.name,
          price: price,
          quantity: qty,
          image: product.mainImage,
          stock: product.stock
        }],
        subtotal: total,
        totalMrp: (product.actualPrice || price) * qty,
        totalAmount: total
      };

      // Render
      renderOrderSummary(mockCart);
    }
    else {
      // --- FALLBACK TO CART FLOW ---
      await fetchCartAndRender(token);
    }

  } catch (error) {
    console.error("Summary error:", error);
    summaryContainer.innerHTML = '<div class="alert alert-danger">Failed to load order summary.</div>';
  }
}

// Helper to fetch cart
async function fetchCartAndRender(token) {
  const res = await fetch('/api/cart', {
    headers: { "Authorization": "Bearer " + token }
  });

  if (!res.ok) throw new Error("Failed to fetch cart");
  const data = await res.json();
  renderOrderSummary(data);
}



function formatMoney(amount) {
  return "Rs. " + Number(amount).toLocaleString("en-IN") + ".00";
}

function renderOrderSummary(cartData) {
  const summaryContainer = document.querySelector('.order-summary');
  if (!summaryContainer) return;

  if (!cartData || !cartData.items || cartData.items.length === 0) {
    summaryContainer.innerHTML = '<div class="alert alert-warning">Your cart is empty. <a href="/index.html">Shop Now</a></div>';
    return;
  }

  // Calculations
  const subtotal = cartData.subtotal || 0;
  const totalMrp = cartData.totalMrp || subtotal;
  const discount = totalMrp - subtotal;
  const finalTotal = cartData.totalAmount || subtotal;

  // 1. Render Items List
  let itemsHtml = '<div class="checkout-items mb-3" style="max-height: 300px; overflow-y: auto;">';
  cartData.items.forEach(item => {
    // Image Handling
    let imgSrc = "https://placehold.co/100x120/f0f0f0/333?text=No+Image";
    if (item.image) {
      if (item.image.startsWith("http")) {
        imgSrc = item.image;
      } else {
        imgSrc = item.image.startsWith("/") ? item.image : "/" + item.image;
        imgSrc = imgSrc.replace(/\\/g, "/");
        if (!imgSrc.includes("/")) imgSrc = "/uploads/products/" + imgSrc;
      }
    }

    itemsHtml += `
          <div class="summary-item d-flex gap-3 mb-3 pb-3 border-bottom">
            <img src="${imgSrc}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; background: #f1f1f1;" alt="${item.name}" onerror="this.src='https://placehold.co/100x100/f0f0f0/333?text=No+Image'"/>
            <div class="summary-details flex-grow-1">
              <h6 class="mb-1 text-truncate" style="max-width: 150px; font-size: 0.9rem; font-weight: 600;" title="${item.name}">${item.name}</h6>
              <div class="d-flex justify-content-between align-items-center">
                  <small class="text-muted">Qty: ${item.quantity}</small>
                  <span class="fw-bold" style="font-size: 0.9rem;">${formatMoney(item.price * item.quantity)}</span>
              </div>
            </div>
          </div>
        `;
  });
  itemsHtml += '</div>';

  // 2. Render Totals (Cart Bill Style)
  const summaryHtml = `
          <h5 class="mb-3">Order Summary</h5>
          
          ${itemsHtml}
          
          <a href="./couponPage.html" class="promo-row text-decoration-none text-dark d-flex justify-content-between align-items-center mb-3 p-2 border rounded">
            <span><i class="fa-solid fa-tag me-2"></i> Apply Voucher</span>
            <i class="fa-solid fa-chevron-right small"></i>
          </a>

          <div class="summary-row d-flex justify-content-between mb-2">
            <span>Total MRP</span>
            <span class="text-muted text-decoration-line-through">${formatMoney(totalMrp)}</span>
          </div>

          <div class="summary-row d-flex justify-content-between mb-2 text-success">
            <span>Discount on MRP</span>
            <span>-${formatMoney(discount)}</span>
          </div>

          <div class="summary-row d-flex justify-content-between mb-2">
            <span>Subtotal</span>
            <span>${formatMoney(subtotal)}</span>
          </div>

          <div class="summary-row d-flex justify-content-between mb-2">
            <span>Shipping</span>
            <span class="text-success fw-bold">Free</span>
          </div>


          <hr>

          <!-- Wallet Section -->
          <div class="wallet-section mb-3 p-2 border rounded bg-light" id="wallet-section" style="display:none;">
             <div class="form-check d-flex justify-content-between align-items-center mb-0">
               <div>
                 <input class="form-check-input" type="checkbox" id="useWalletCheckbox">
                 <label class="form-check-label small fw-bold" for="useWalletCheckbox">
                   Use Wallet Balance
                 </label>
                 <div class="text-muted small" style="font-size: 0.75rem;">
                   Available: <span id="wallet-balance-display">Rs. 0.00</span>
                 </div>
               </div>
               <span class="text-success small fw-bold" id="wallet-applied-text" style="display:none;">-Rs. 0.00</span>
             </div>
          </div>

          <div class="summary-total d-flex justify-content-between fw-bold fs-5 mt-2">
            <span>Total Amount</span>
            <span id="final-total-display">${formatMoney(finalTotal)}</span>
          </div>
    `;

  summaryContainer.innerHTML = summaryHtml;

  // Initialize Wallet Logic
  initWallet(finalTotal);
}

// Global variable to store wallet state
window.walletState = {
  balance: 0,
  isApplied: false,
  appliedAmount: 0,
  originalTotal: 0
};

async function initWallet(totalAmount) {
  window.walletState.originalTotal = totalAmount;
  const walletSection = document.getElementById('wallet-section');
  const balanceDisplay = document.getElementById('wallet-balance-display');
  const checkbox = document.getElementById('useWalletCheckbox');

  // Fetch Wallet Balance
  try {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const res = await fetch('/api/user/wallet', {
      headers: { "Authorization": "Bearer " + token }
    });
    const data = await res.json();

    if (data.success && data.balance > 0) {
      window.walletState.balance = data.balance;
      balanceDisplay.innerText = formatMoney(data.balance);
      walletSection.style.display = 'block';

      // Add Event Listener
      checkbox.addEventListener('change', function () {
        toggleWalletUsage(this.checked);
      });
    }
  } catch (err) {
    console.error("Wallet fetch error", err);
  }
}

async function toggleWalletUsage(isChecked) {
  const appliedText = document.getElementById('wallet-applied-text');
  const finalTotalDisplay = document.getElementById('final-total-display');
  const checkbox = document.getElementById('useWalletCheckbox');

  if (!isChecked) {
    // Reset
    window.walletState.isApplied = false;
    window.walletState.appliedAmount = 0;
    appliedText.style.display = 'none';
    finalTotalDisplay.innerText = formatMoney(window.walletState.originalTotal);
    // Important: Update payment method selection logic if needed (e.g. re-enable other methods if disabled)
    return;
  }

  // Apply Wallet
  try {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const res = await fetch('/api/user/wallet/apply', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ totalAmount: window.walletState.originalTotal })
    });
    const data = await res.json();

    if (data.success) {
      window.walletState.isApplied = true;
      window.walletState.appliedAmount = data.walletUsable;

      // UI Updates
      appliedText.innerText = `-${formatMoney(data.walletUsable)}`;
      appliedText.style.display = 'block';
      finalTotalDisplay.innerText = formatMoney(data.payableAmount);

      Swal.fire({
        icon: 'success',
        title: 'Wallet Applied',
        text: `${formatMoney(data.walletUsable)} deducted from your wallet balance.`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });

      // If full amount covered
      if (data.payableAmount === 0) {
        Swal.fire({
          icon: 'success',
          title: 'Full Payment via Wallet',
          text: 'Your entire order amount is covered by your wallet balance.',
          confirmButtonText: 'Great!'
        });
        // Logic to auto-select Wallet payment method can be added here if access to paymentPage DOM exists
        // For now, simpler to leave it to the user or handle at checkout submission
      }

    } else {
      checkbox.checked = false;
      Swal.fire("Error", "Could not apply wallet", "error");
    }
  } catch (err) {
    console.error("Wallet apply error", err);
    checkbox.checked = false;
  }
}

// Auto init
document.addEventListener("DOMContentLoaded", fetchOrderSummary);
