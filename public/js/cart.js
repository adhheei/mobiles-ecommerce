const API = "/api/cart";

// Helper to format currency
function formatMoney(amount) {
  return "Rs. " + Number(amount).toLocaleString("en-IN") + ".00";
}

// Parse price helper
function parsePrice(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/[^0-9.]/g, "")) || 0;
}

// Function to fetch cart data from API
async function fetchCart() {
  try {
    const res = await fetch(API, {
      method: "GET",
      headers: {
        Authorization:
          "Bearer " +
          (localStorage.getItem("token") || sessionStorage.getItem("token")),
      },
    });

    if (res.status === 401) {
      window.location.href = "/User/userLogin.html";
      return;
    }

    if (!res.ok) throw new Error("Failed to fetch cart");

    const data = await res.json();
    renderCart(data);
  } catch (err) {
    console.error("Cart fetch error:", err);
  }
}

// Function to render cart items
function renderCart(cartData) {
  const container = document.getElementById("cart-items-container");
  const mainCartRow = document.getElementById("main-cart-row");
  const emptyCartView = document.getElementById("empty-cart-view");
  const summaryContainer = document.getElementById("summary-items-container");

  // Handle empty cart
  if (!cartData || !cartData.items || cartData.items.length === 0) {
    if (mainCartRow) mainCartRow.classList.add("d-none");
    if (emptyCartView) emptyCartView.classList.remove("d-none");
    return;
  }

  // Show cart UI
  if (mainCartRow) mainCartRow.classList.remove("d-none");
  if (emptyCartView) emptyCartView.classList.add("d-none");

  let mainHtml = "";
  let summaryHtml = "";
  const productIds = [];

  cartData.items.forEach((item) => {
    productIds.push(item.productId);

    // Use your helper function for ALL images
    const imgSrc = formatImageUrl(item.image);
    const fallback = "https://placehold.co/100x120/f0f0f0/333?text=No+Image";

    mainHtml += `
      <div class="cart-item-row" id="item-${item.productId}" 
           data-price="${item.price}" data-mrp="${item.mrp}"
           data-stock="${item.stock || 0}">
          <div class="cart-img-wrapper">
            <a href="/User/singleProductPage.html?id=${item.productId}">
                <img src="${imgSrc}" alt="${item.name}" onerror="this.src='${fallback}'" />
            </a>
          </div>
          <div class="item-details">
            <div class="d-flex justify-content-between">
              <div>
                <div class="item-name">${item.name}</div>
                <div class="item-meta">Color: ${item.color || "N/A"}</div>
                <div class="item-price">
                  Rs. ${item.price} 
                  <span class="item-price-original">Rs. ${item.mrp}</span>
                </div>
              </div>
              <div class="remove-btn" onclick="removeItem('${item.productId}')">
                <i class="fa-regular fa-trash-can"></i>
              </div>
            </div>
            <div class="d-flex justify-content-between align-items-end mt-3">
              <div class="qty-control">
                <button class="qty-btn" onclick="updateQty('${item.productId}', -1)">-</button>
                <input type="text" value="${item.quantity}" class="qty-value" readonly />
                <button class="qty-btn" onclick="updateQty('${item.productId}', 1)">+</button>
              </div>
              <div class="fw-bold item-total">${formatMoney(item.lineTotal || item.price * item.quantity)}</div>
            </div>
          </div>
      </div>`;

    if (summaryContainer) {
      summaryHtml += `
        <div class="upsell-mini mb-2">
           <img src="${imgSrc}" alt="${item.name}" onerror="this.src='${fallback}'" />
           <div class="upsell-text" style="flex: 1; min-width: 0;">
             <h6 class="text-truncate">${item.name}</h6>
             <p class="small text-muted">Qty: ${item.quantity}</p>
           </div>
           <div class="upsell-price ms-2">${formatMoney(item.lineTotal || item.price * item.quantity)}</div>
        </div>`;
    }
  });

  // Bulk update DOM once for performance
  container.innerHTML = mainHtml;
  if (summaryContainer) summaryContainer.innerHTML = summaryHtml;

  updateTotals();
  fetchSuggestions(productIds);
}

// Function to calculate and update totals from DOM
function updateTotals() {
  let subtotal = 0;
  let totalMrp = 0;
  let visibleCount = 0;

  const rows = document.querySelectorAll(".cart-item-row");

  rows.forEach((row) => {
    if (row.style.display === "none") return;
    visibleCount++;

    const qtyInput = row.querySelector(".qty-value");
    const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;

    let unitPrice = parseFloat(row.dataset.price);
    let unitMrp = parseFloat(row.dataset.mrp);

    // ... existing parsing logic ...

    subtotal += qty * unitPrice;
    totalMrp += qty * unitMrp;
  });

  const discount = totalMrp - subtotal;

  // --- FIX: Dynamic Strikethrough Logic ---
  const totalMrpEl = document.getElementById("total-mrp");
  if (totalMrpEl) {
    totalMrpEl.innerText = formatMoney(totalMrp);

    // If discount is 0, remove strikethrough and muted color
    if (discount <= 0) {
      totalMrpEl.classList.remove("text-decoration-line-through", "text-muted");
      // Also hide the "Discount on MRP" row if you want
      const discountRow = document
        .getElementById("total-discount")
        ?.closest(".summary-row");
      if (discountRow) discountRow.style.display = "none";
    } else {
      // If there is a discount, ensure strikethrough is visible
      totalMrpEl.classList.add("text-decoration-line-through", "text-muted");
      const discountRow = document
        .getElementById("total-discount")
        ?.closest(".summary-row");
      if (discountRow) discountRow.style.display = "flex";
    }
  }

  // Update other fields
  if (document.getElementById("subtotal"))
    document.getElementById("subtotal").innerText = formatMoney(subtotal);
  if (document.getElementById("grand-total"))
    document.getElementById("grand-total").innerText = formatMoney(subtotal);
  if (document.getElementById("total-discount"))
    document.getElementById("total-discount").innerText =
      "-" + formatMoney(discount);
}

// Function to Update Quantity
async function updateQty(productId, change) {
  const row = document.getElementById(`item-${productId}`);
  const input = row?.querySelector(".qty-value");
  if (!input || !row) return;

  let currentQty = parseInt(input.value) || 1;
  let newQty = currentQty + change;

  // 1. Min Constraint
  if (newQty < 1) {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "warning",
      title: "Minimum 1 required",
      showConfirmButton: false,
      timer: 1500,
    });
    return;
  }

  // 2. Stock Constraint - Read directly from the dataset attribute
  let stock = parseInt(row.dataset.stock);

  // If stock is NaN or missing, we allow the update and let the server validate
  if (!isNaN(stock) && newQty > stock) {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "warning",
      title: "Stock Limit Reached",
      text: `Only ${stock} units available`,
      timer: 2000,
      showConfirmButton: false,
    });
    return;
  }

  // 3. Optimistic UI Update
  input.value = newQty;
  updateTotals();

  try {
    const res = await fetch(API + "/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer " +
          (localStorage.getItem("token") || sessionStorage.getItem("token")),
      },
      body: JSON.stringify({ productId, quantity: newQty }),
    });

    const data = await res.json();

    if (res.ok && data.cart) {
      // Re-render to sync potential price changes or server-side corrections
      renderCart(data.cart);
      if (window.updateCartBadge) window.updateCartBadge();
    } else {
      // Revert UI on server error
      input.value = currentQty;
      updateTotals();
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: data.message || "Could not update quantity",
      });
    }
  } catch (e) {
    console.error("Qty update error:", e);
    input.value = currentQty;
    updateTotals();
    Swal.fire("Error", "Server connection error", "error");
  }
}

// Function to Remove Item
async function removeItem(productId) {
  console.log("Removing item with ID:", productId);
  const result = await Swal.fire({
    title: "Remove item?",
    text: "Do you want to remove this product from cart?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, remove it!",
  });

  if (result.isConfirmed) {
    const row = document.getElementById(`item-${productId}`);
    if (row) row.style.display = "none"; // Hide immediately
    updateTotals(); // Recalc

    try {
      const res = await fetch(`${API}/remove/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization:
            "Bearer " +
            (localStorage.getItem("token") || sessionStorage.getItem("token")),
        },
      });

      const data = await res.json();
      if (data.cart) {
        Swal.fire({
          icon: "success",
          title: "Removed!",
          text: "Item has been removed from cart.",
          timer: 1500,
          showConfirmButton: false,
        });
        renderCart(data.cart); // Finalize sync
        window.updateCartBadge(); // Update badge
      } else {
        // If empty or error
        fetchCart();
      }
    } catch (e) {
      console.error(e);
      if (row) row.style.display = "flex"; // Revert
      updateTotals();
      Swal.fire("Error", "Failed to remove item", "error");
    }
  }
}

// Initial Load
// --- Coupon Logic ---
let currentCoupon = null;

function initCouponLogic() {
  const btn = document.getElementById("apply-coupon-btn");
  if (btn) {
    btn.addEventListener("click", handleCouponClick);
  }

  // Check Local Storage on Load
  const savedCoupon = localStorage.getItem("selectedCoupon");
  if (savedCoupon) {
    // Re-apply after a short delay to ensure cart totals are calculated
    setTimeout(() => {
      const couponData = JSON.parse(savedCoupon);
      // Verify if still valid by calling API or just apply securely
      applyCoupon(couponData.code, true); // true = silent/restore mode
    }, 500);
  }
}

function handleCouponClick() {
  if (currentCoupon) {
    // If already applied, ask to remove
    Swal.fire({
      title: "Remove Coupon?",
      text: `Current coupon: ${currentCoupon.code}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Remove",
      confirmButtonColor: "#d33",
    }).then((result) => {
      if (result.isConfirmed) {
        removeCoupon();
      }
    });
  } else {
    // Show list
    fetchCouponsAndShowModal();
  }
}

async function fetchCouponsAndShowModal() {
  try {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "Login Required",
        text: "Please login to view coupons",
        showConfirmButton: true,
      }).then(() => {
        window.location.href = "/User/userLogin.html";
      });
      return;
    }

    const res = await fetch("/api/user/coupons", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();

    if (!data.success || !data.data || data.data.length === 0) {
      Swal.fire(
        "No Coupons",
        "There are no coupons available for you right now.",
        "info",
      );
      return;
    }

    // Filter valid coupons (checked server side too, but visual filter)
    const validCoupons = data.data.filter((c) => !c.isExpired && !c.isUsed);

    if (validCoupons.length === 0) {
      Swal.fire("No Coupons", "There are no active coupons available.", "info");
      return;
    }

    // Generate HTML list
    let htmlList = '<div class="list-group text-start">';
    validCoupons.forEach((c) => {
      let discountDesc =
        c.discountType === "percentage"
          ? `${c.value}% OFF`
          : `₹${c.value} FLAT OFF`;
      if (c.maxDiscount) discountDesc += ` (Max ₹${c.maxDiscount})`;

      htmlList += `
                <a href="#" class="list-group-item list-group-item-action" onclick="selectCoupon('${c.code}', '${c.description || ""}')">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1 fw-bold text-primary">${c.code}</h6>
                        <small class="text-success fw-bold">${discountDesc}</small>
                    </div>
                    <p class="mb-1 small">${c.description || "Save on your order!"}</p>
                    ${c.minPurchase ? `<small class="text-muted">Min Order: ₹${c.minPurchase}</small>` : ""}
                </a>
            `;
    });
    htmlList += "</div>";

    Swal.fire({
      title: "Available Coupons",
      html: htmlList,
      showCloseButton: true,
      showConfirmButton: false, // Selection via click
      width: "600px",
    });
  } catch (error) {
    console.error("Fetch available coupons error:", error);
    Swal.fire("Error", "Failed to load coupons", "error");
  }
}

// Global function for onclick in SweetAlert
window.selectCoupon = function (code) {
  Swal.close();
  applyCoupon(code);
};

function formatImageUrl(path) {
  if (!path) return "https://placehold.co/100x120?text=No+Image";

  // If it's already a full URL, return it
  if (path.startsWith("http")) return path;

  // FIX: Remove 'public' from the start and fix backslashes
  // This turns "public/uploads/products/img.jpg" into "/uploads/products/img.jpg"
  let cleanPath = path.replace(/^public/, "").replace(/\\/g, "/");

  // Ensure it starts with a single leading slash
  if (!cleanPath.startsWith("/")) {
    cleanPath = "/" + cleanPath;
  }

  return cleanPath;
}

async function applyCoupon(code, silent = false) {
  const subtotalText = document.getElementById("subtotal").innerText;
  const cleanTotal = parseFloat(subtotalText.replace(/[^\d.]/g, ""));

  try {
    const res = await fetch("/api/user/coupons/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({
        couponCode: code.toUpperCase(),
        cartTotal: cleanTotal, // Backend ignores this now, but kept for compat
      }),
    });

    const data = await res.json();

    // If silent and error, just log and return (don't alert on auto-apply fail)
    if (!res.ok) {
      if (silent) {
        console.warn("Auto-apply coupon failed:", data.message);
        localStorage.removeItem("selectedCoupon"); // Clear invalid coupon
        return;
      }
      throw new Error(data.message);
    }

    // Success
    currentCoupon = {
      code: data.code,
      discount: data.discountAmount,
      finalTotal: data.finalTotal,
    };

    // Save to storage
    localStorage.setItem("selectedCoupon", JSON.stringify(currentCoupon));

    // Update UI
    updateCouponUI(true);

    if (!silent) {
      Swal.fire({
        icon: "success",
        title: "Coupon Applied!",
        text: `You saved Rs. ${data.discountAmount}`,
        timer: 1500,
        showConfirmButton: false,
      });
    }
  } catch (error) {
    if (!silent) Swal.fire("Coupon Error", error.message, "error");
  }
}

function removeCoupon() {
  currentCoupon = null;
  localStorage.removeItem("selectedCoupon");
  updateCouponUI(false);
  Swal.fire({
    icon: "info",
    title: "Coupon Removed",
    timer: 1500,
    showConfirmButton: false,
  });
}

function updateCouponUI(isApplied) {
  const btnText = document.getElementById("coupon-text");
  const totalDiscountEl = document.getElementById("total-discount");
  const grandTotalEl = document.getElementById("grand-total");
  const arrow = document.getElementById("coupon-arrow");

  // Existing discount from products (MRP diff)
  // We need to fetch the BASE discount displayed to add ON TOP or display separately.
  // However, the current "Disclaimer: Discount on MRP" is Product Discount.
  // We should Add a NEW ROW for Coupon Discount.

  // Check if Coupon Row exists
  let couponRow = document.getElementById("coupon-discount-row");

  if (isApplied && currentCoupon) {
    // Update Button
    if (btnText) {
      btnText.innerHTML = `<i class="fa-solid fa-check-circle text-success me-2"></i> ${currentCoupon.code} Applied`;
      btnText.classList.add("fw-bold", "text-success");
    }
    if (arrow) arrow.className = "fa-solid fa-times text-danger"; // Change arrow to X

    // Update Totals
    // 1. Create Coupon Row if missing
    if (!couponRow) {
      const discountRow = document.querySelector(".summary-row.text-success"); // Identify Insert Point
      couponRow = document.createElement("div");
      couponRow.id = "coupon-discount-row";
      couponRow.className = "summary-row text-primary fw-bold";
      couponRow.innerHTML = `<span>Coupon Discount</span><span id="coupon-amount"></span>`;
      if (discountRow) {
        discountRow.insertAdjacentElement("afterend", couponRow);
      }
    }

    // 2. Set Values
    couponRow.style.display = "flex";
    document.getElementById("coupon-amount").innerText =
      "-Rs. " + currentCoupon.discount.toFixed(2);

    // 3. Update Grand Total
    if (grandTotalEl)
      grandTotalEl.innerText = "Rs. " + currentCoupon.finalTotal.toFixed(2);
  } else {
    // Reset
    if (btnText) {
      btnText.innerHTML = `<i class="fa-solid fa-tag me-2"></i> Apply Coupon`;
      btnText.classList.remove("fw-bold", "text-success");
    }
    if (arrow) arrow.className = "fa-solid fa-chevron-right small";

    // Remove Coupon Row
    if (couponRow) couponRow.style.display = "none";

    // Restore Total from Subtotal (Assuming free shipping)
    const subtotalText = document.getElementById("subtotal").innerText;
    if (grandTotalEl) grandTotalEl.innerText = subtotalText;
  }
}

// Function to fetch and render suggestions
async function fetchSuggestions(productIds) {
  const container = document.querySelector(".scrolling-wrapper");
  if (!container) return;

  // Use current productIds if not passed (though renderCart passes them)
  // If empty cart, maybe show popular items? The backend handles empty list logic.

  try {
    const res = await fetch("/api/admin/products/suggestions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cartProductIds: productIds || [] }),
    });

    const data = await res.json();
    if (data.success && data.products.length > 0) {
      container.innerHTML = ""; // Clear placeholders

      data.products.forEach((p) => {
        const imgUrl =
          p.image || "https://placehold.co/100x100/f0f0f0/333?text=No+Image";

        const html = `
                <a href="/User/singleProductPage.html?id=${p.id}" class="rec-card-link">
                  <div class="mini-rec-card">
                    <img src="${imgUrl}" alt="${p.name}" onerror="this.src='https://placehold.co/100x100/f0f0f0/333?text=No+Image'" />
                    <div>
                      <div style="font-size: 0.8rem; font-weight: 600" class="text-truncate" style="max-width: 120px;">${p.name}</div>
                      <div style="font-size: 0.75rem">Rs. ${p.offerPrice || p.actualPrice}</div>
                    </div>
                    <button class="btn-add-mini" onclick="event.preventDefault(); addToCart('${p.id}')">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                  </div>
                </a>
                `;
        container.innerHTML += html;
      });
    } else {
      // If no suggestions, maybe hide the section?
      // container.closest('.mb-4').style.display = 'none';
    }
  } catch (e) {
    console.error("Failed to load suggestions:", e);
  }
}

// Add this to your index page or a shared JS file
async function addToCart(productId) {
  // 1. Validation to prevent 'undefined' errors
  if (!productId || productId === "undefined") {
    console.error("Cart Error: Product ID is missing");
    return;
  }

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) {
    Swal.fire({
      title: "Login Required",
      text: "Please login to add items to your cart",
      icon: "warning",
      confirmButtonText: "Login",
    }).then(() => (window.location.href = "/User/userLogin.html"));
    return;
  }

  try {
    const res = await fetch("/api/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, quantity: 1 }),
    });

    const data = await res.json();
    if (res.ok) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Added to cart",
        showConfirmButton: false,
        timer: 1500,
      });
      // Update the cart badge in the navbar if the function exists
      if (typeof window.updateCartBadge === "function")
        window.updateCartBadge();
    } else {
      Swal.fire("Wait!", data.message || "Failed to add item", "warning");
    }
  } catch (err) {
    console.error("Add to cart error:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchCart();
  initCouponLogic();
});

// --- CHECKOUT LOGIC ---
function proceedToCheckout(e) {
  if (e) e.preventDefault();

  // Set Checkout Type
  sessionStorage.setItem("checkoutType", "cart");

  // Remove old BuyNow data to prevent conflicts
  sessionStorage.removeItem("buyNowItem");

  // Redirect
  window.location.href = "/User/address.html";
}
