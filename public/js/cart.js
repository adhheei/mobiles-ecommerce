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
                "Authorization": "Bearer " + (localStorage.getItem("token") || sessionStorage.getItem("token"))
            }
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

    // Handle empty cart
    if (!cartData || !cartData.items || cartData.items.length === 0) {
        if (mainCartRow) mainCartRow.classList.add("d-none");
        if (emptyCartView) emptyCartView.classList.remove("d-none");
        // Also clear summary if hidden
        return;
    }

    // Show cart
    if (mainCartRow) mainCartRow.classList.remove("d-none");
    if (emptyCartView) emptyCartView.classList.add("d-none");

    // Clear existing items
    container.innerHTML = "";

    // Summary Container
    const summaryContainer = document.getElementById("summary-items-container");
    if (summaryContainer) summaryContainer.innerHTML = "";

    // Collect IDs for suggestions
    const productIds = [];

    // Render Items
    cartData.items.forEach(item => {
        productIds.push(item.productId);

        let imgSrc = "https://placehold.co/100x120/f0f0f0/333?text=No+Image";
        if (item.image) {
            if (item.image.startsWith("http")) {
                imgSrc = item.image;
            } else {
                // Ensure we don't double slash if already present, but uploads usually need /
                imgSrc = item.image.startsWith("/") ? item.image : "/" + item.image;
                // Fix windows backslashes just in case
                imgSrc = imgSrc.replace(/\\/g, "/");
                // If it's just a filename (no path), assume /uploads/products/
                if (!imgSrc.includes("/")) imgSrc = "/uploads/products/" + imgSrc;
                // Actually cartController returns full path or relative? 
                // Controller says: `image = product.productImages[0]` or placeholder.
                // Ideally controller should return full web path. 
                // Let's assume controller sends relative path `uploads/products/file.jpg` or `file.jpg`.
                // Adjust based on observation if needed. 
                // For now, if it looks like a filename, prepend /uploads/products/
            }
        }

        // Final fallback onerror
        const fallback = "https://placehold.co/100x120/f0f0f0/333?text=No+Image";

        // Main List HTML
        const html = `
      <div class="cart-item-row" id="item-${item.productId}" 
           data-price="${item.price}" 
           data-mrp="${item.mrp}">
          <div class="cart-img-wrapper">
            <a href="/User/singleProductPage.html?id=${item.productId}">
                <img src="${imgSrc}" alt="${item.name}" onerror="this.src='${fallback}'" />
            </a>
          </div>
          <div class="item-details">
            <div class="d-flex justify-content-between">
              <div>
                <a href="/User/singleProductPage.html?id=${item.productId}" class="text-decoration-none text-dark">
                    <div class="item-name">${item.name}</div>
                </a>
                <div class="item-meta">Color: ${item.color || 'N/A'}</div>
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
              <div class="fw-bold item-total">${formatMoney(item.lineTotal || (item.price * item.quantity))}</div>
            </div>
          </div>
        </div>
    `;
        container.innerHTML += html;

        // Summary List HTML
        if (summaryContainer) {
            const summaryHtml = `
              <div class="upsell-mini mb-2">
                 <img src="${imgSrc}" alt="${item.name}" onerror="this.src='${fallback}'" />
                 <div class="upsell-text" style="flex: 1; min-width: 0;">
                   <h6 class="text-truncate" title="${item.name}">${item.name}</h6>
                   <p class="small text-muted">Qty: ${item.quantity}</p>
                 </div>
                 <div class="upsell-price ms-2">${formatMoney(item.lineTotal || (item.price * item.quantity))}</div>
               </div>
            `;
            summaryContainer.innerHTML += summaryHtml;
        }
    });

    // Calculate totals
    updateTotals();

    // Fetch Suggestions
    fetchSuggestions(productIds);
}

// Function to calculate and update totals from DOM
function updateTotals() { // ... kept as is largely, but renderCart handles initial load }
    // ... existing impl ...
    let subtotal = 0;
    let totalMrp = 0;
    let visibleCount = 0;

    const rows = document.querySelectorAll(".cart-item-row");

    rows.forEach((row) => {
        if (row.style.display === "none") return;

        visibleCount++;

        // Get Quantity
        const qtyInput = row.querySelector(".qty-value");
        const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;

        // Get Prices (Try dataset first, then DOM text)
        let unitPrice = parseFloat(row.dataset.price);
        let unitMrp = parseFloat(row.dataset.mrp);

        if (isNaN(unitPrice)) {
            const priceEl = row.querySelector(".item-price");
            // Parse text (complex logic might be needed if structure varies)
            unitPrice = parsePrice(priceEl ? priceEl.innerText : "0");
        }
        if (isNaN(unitMrp)) {
            const mrpEl = row.querySelector(".item-price-original");
            unitMrp = mrpEl ? parsePrice(mrpEl.innerText) : unitPrice;
        }

        // Line Total
        const lineTotal = qty * unitPrice;
        subtotal += lineTotal;
        totalMrp += qty * unitMrp;

        // Update Line Total UI
        const lineTotalEl = row.querySelector(".item-total");
        if (lineTotalEl) {
            lineTotalEl.innerText = formatMoney(lineTotal);
        }
    });

    // Toggle Empty View if all removed
    const mainCartRow = document.getElementById("main-cart-row");
    const emptyCartView = document.getElementById("empty-cart-view");

    if (visibleCount === 0) {
        if (mainCartRow) mainCartRow.classList.add("d-none");
        if (emptyCartView) emptyCartView.classList.remove("d-none");
    } else {
        if (mainCartRow) mainCartRow.classList.remove("d-none");
        if (emptyCartView) emptyCartView.classList.add("d-none");
    }

    const discount = totalMrp - subtotal;

    // Update Summary
    // Note: If shipping is separate, logic needs addition. Converting 0 to "Free" if needed.
    const subtotalEl = document.getElementById("subtotal");
    const grandTotalEl = document.getElementById("grand-total");
    const totalMrpEl = document.getElementById("total-mrp");
    const totalDiscountEl = document.getElementById("total-discount");

    if (subtotalEl) subtotalEl.innerText = formatMoney(subtotal);
    if (grandTotalEl) grandTotalEl.innerText = formatMoney(subtotal); // Default
    if (totalMrpEl) totalMrpEl.innerText = formatMoney(totalMrp);
    if (totalDiscountEl) totalDiscountEl.innerText = "-" + formatMoney(discount);

    // Re-apply coupon if exists (debounced ideally, but here direct)
    if (typeof currentCoupon !== 'undefined' && currentCoupon && typeof applyCoupon === 'function') {
        applyCoupon(currentCoupon.code, true, subtotal);
    }
}

// Function to Update Quantity
async function updateQty(productId, change) {
    const input = document.querySelector(`#item-${productId} .qty-value`);
    if (!input) return;

    let currentQty = parseInt(input.value) || 1;
    let newQty = currentQty + change;

    // Constraint: Min 1
    if (newQty < 1) {
        Swal.fire({
            icon: 'warning',
            title: 'Minimum Quantity',
            text: 'Minimum quantity is 1',
            timer: 2000,
            showConfirmButton: false
        });
        return;
    }

    // Determine max? (Optional, not requested)

    // Update input immediately (Optimistic)
    input.value = newQty;
    updateTotals(); // Recalc totals immediately

    try {
        const res = await fetch(API + "/update", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + (localStorage.getItem("token") || sessionStorage.getItem("token"))
            },
            body: JSON.stringify({ productId, quantity: newQty })
        });

        const data = await res.json();
        if (data.cart) {
            // Re-render to sort out any server-side logic adjustments
            // Or just keep optimistic state. 
            // Re-rendering is safer for price sync but might interrupt user.
            // Re-rendering is safer for price sync but might interrupt user.
            renderCart(data.cart); // Re-enabled to sync summary items!
            window.updateCartBadge(); // Update badge
        } else {
            // Revert on error
            input.value = currentQty;
            updateTotals();
            Swal.fire('Error', data.message || "Failed to update", 'error');
        }
    } catch (e) {
        console.error(e);
        input.value = currentQty;
        updateTotals();
        Swal.fire('Error', "Server connection error", 'error');
    }
}

// Function to Remove Item
async function removeItem(productId) {
    console.log("Removing item with ID:", productId);
    const result = await Swal.fire({
        title: 'Remove item?',
        text: "Do you want to remove this product from cart?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, remove it!'
    });

    if (result.isConfirmed) {
        const row = document.getElementById(`item-${productId}`);
        if (row) row.style.display = 'none'; // Hide immediately
        updateTotals(); // Recalc

        try {
            const res = await fetch(`${API}/remove/${productId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": "Bearer " + (localStorage.getItem("token") || sessionStorage.getItem("token"))
                }
            });

            const data = await res.json();
            if (data.cart) {
                Swal.fire({
                    icon: 'success',
                    title: 'Removed!',
                    text: 'Item has been removed from cart.',
                    timer: 1500,
                    showConfirmButton: false
                });
                renderCart(data.cart); // Finalize sync
                window.updateCartBadge(); // Update badge
            } else {
                // If empty or error
                fetchCart();
            }
        } catch (e) {
            console.error(e);
            if (row) row.style.display = 'flex'; // Revert
            updateTotals();
            Swal.fire('Error', "Failed to remove item", 'error');
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
            title: 'Remove Coupon?',
            text: `Current coupon: ${currentCoupon.code}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Remove',
            confirmButtonColor: '#d33'
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
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
            Swal.fire({
                icon: 'warning',
                title: 'Login Required',
                text: 'Please login to view coupons',
                showConfirmButton: true
            }).then(() => {
                window.location.href = "/User/userLogin.html";
            });
            return;
        }

        const res = await fetch("/api/user/coupons", {
            headers: { "Authorization": "Bearer " + token }
        });
        const data = await res.json();

        if (!data.success || !data.data || data.data.length === 0) {
            Swal.fire('No Coupons', 'There are no coupons available for you right now.', 'info');
            return;
        }

        // Filter valid coupons (checked server side too, but visual filter)
        const validCoupons = data.data.filter(c => !c.isExpired && !c.isUsed);

        if (validCoupons.length === 0) {
            Swal.fire('No Coupons', 'There are no active coupons available.', 'info');
            return;
        }

        // Generate HTML list
        let htmlList = '<div class="list-group text-start">';
        validCoupons.forEach(c => {
            let discountDesc = c.discountType === 'percentage' ? `${c.value}% OFF` : `₹${c.value} FLAT OFF`;
            if (c.maxDiscount) discountDesc += ` (Max ₹${c.maxDiscount})`;

            htmlList += `
                <a href="#" class="list-group-item list-group-item-action" onclick="selectCoupon('${c.code}', '${c.description || ''}')">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1 fw-bold text-primary">${c.code}</h6>
                        <small class="text-success fw-bold">${discountDesc}</small>
                    </div>
                    <p class="mb-1 small">${c.description || 'Save on your order!'}</p>
                    ${c.minPurchase ? `<small class="text-muted">Min Order: ₹${c.minPurchase}</small>` : ''}
                </a>
            `;
        });
        htmlList += '</div>';

        Swal.fire({
            title: 'Available Coupons',
            html: htmlList,
            showCloseButton: true,
            showConfirmButton: false, // Selection via click
            width: '600px'
        });

    } catch (error) {
        console.error("Fetch available coupons error:", error);
        Swal.fire('Error', 'Failed to load coupons', 'error');
    }
}

// Global function for onclick in SweetAlert
window.selectCoupon = function (code) {
    Swal.close();
    applyCoupon(code);
};

async function applyCoupon(code, isRestore = false, amountOverride = null) {
    let subtotal;
    if (amountOverride !== null) {
        subtotal = amountOverride;
    } else {
        const subtotalText = document.getElementById("subtotal").innerText;
        subtotal = parsePrice(subtotalText);
    }

    // Safety check just in case
    if (isNaN(subtotal)) subtotal = 0;

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!subtotal || subtotal <= 0) {
        if (!isRestore) Swal.fire('Error', 'Cart is empty', 'warning');
        return;
    }

    try {
        const res = await fetch("/api/user/coupons/apply", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                couponCode: code,
                cartTotal: Number(subtotal) // Ensure number
            })
        });

        const data = await res.json();

        if (data.success) {
            // Success
            currentCoupon = {
                code: data.code,
                discount: data.discountAmount,
                finalTotal: data.finalTotal
            };

            // Save persistence
            localStorage.setItem("selectedCoupon", JSON.stringify(currentCoupon));

            // Update UI
            updateCouponUI(true);

            if (!isRestore) {
                Swal.fire({
                    icon: 'success',
                    title: 'Coupon Applied!',
                    text: `You saved ₹${data.discountAmount}`,
                    timer: 2000,
                    showConfirmButton: false
                });
            }

        } else {
            // Clear state on failure (validity lost)
            currentCoupon = null;
            updateCouponUI(false);

            if (!isRestore) {
                Swal.fire({
                    icon: 'error',
                    title: 'Cannot Apply Coupon',
                    text: data.message
                });
            } else {
                // If restore failed (e.g. min purchase lost), remove it
                localStorage.removeItem("selectedCoupon");
            }
        }

    } catch (error) {
        console.error("Apply Coupon API Error:", error);
        if (!isRestore) Swal.fire('Error', 'Failed to apply coupon', 'error');
    }
}

function removeCoupon() {
    currentCoupon = null;
    localStorage.removeItem("selectedCoupon");
    updateCouponUI(false);
    Swal.fire({
        icon: 'info',
        title: 'Coupon Removed',
        timer: 1500,
        showConfirmButton: false
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
                discountRow.insertAdjacentElement('afterend', couponRow);
            }
        }

        // 2. Set Values
        couponRow.style.display = "flex";
        document.getElementById("coupon-amount").innerText = "-Rs. " + currentCoupon.discount.toFixed(2);

        // 3. Update Grand Total
        if (grandTotalEl) grandTotalEl.innerText = "Rs. " + currentCoupon.finalTotal.toFixed(2);

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

// Initial Load
document.addEventListener("DOMContentLoaded", () => {
    fetchCart();
    initCouponLogic();
});
