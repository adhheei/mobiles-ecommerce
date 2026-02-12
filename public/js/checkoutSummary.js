document.addEventListener("DOMContentLoaded", async () => {
  const summaryContainer = document.querySelector(".order-summary");
  if (!summaryContainer) return;

  // Show loading state
  summaryContainer.innerHTML =
    '<div class="text-center py-5"><div class="spinner-border text-dark" role="status"><span class="visually-hidden">Loading...</span></div></div>';

  try {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // --- 1. GATHER DATA ---
    let items = [];
    let subtotal = 0;
    let totalMrp = 0;
    let discount = 0;

    const checkoutType = sessionStorage.getItem("checkoutType");

    if (checkoutType === "buyNow") {
      const buyNowItemStr = sessionStorage.getItem("buyNowItem");
      if (buyNowItemStr) {
        const buyNowItem = JSON.parse(buyNowItemStr);
        const res = await fetch(
          `/api/admin/products/${buyNowItem.productId || buyNowItem._id}`,
        );
        if (res.ok) {
          const data = await res.json();
          const p = data.product;
          const qty = parseInt(buyNowItem.qty) || 1;
          const price = p.offerPrice || p.price || 0;
          const mrp = p.actualPrice || p.price || 0;

          items.push({
            name: p.name,
            image: formatImage(
              p.mainImage || (p.productImages && p.productImages[0]),
            ),
            price: price,
            mrp: mrp,
            qty: qty,
          });

          subtotal = price * qty;
          totalMrp = mrp * qty; // Total MRP
          discount = (mrp - price) * qty; // Product level discount
        }
      }
    } else {
      const res = await fetch("/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const cartData = await res.json();
        items = (cartData.items || []).map((item) => ({
          name: item.name,
          image: item.image,
          price: item.price,
          mrp: item.mrp || item.price, // Ensure mrp is passed from cart controller or defaults to price
          qty: item.quantity,
        }));
        subtotal = cartData.subtotal || 0;
        totalMrp = cartData.totalMrp || subtotal;
        discount = cartData.discount || totalMrp - subtotal;
      }
    }

    if (items.length === 0) {
      console.warn("⚠️ Checkout Summary: No items found to display.");
      summaryContainer.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="fa-solid fa-cart-shopping mb-2" style="font-size: 1.5rem;"></i>
                    <p>No items in summary</p>
                    <button class="btn btn-sm btn-outline-dark" onclick="window.location.reload()">Refresh</button>
                </div>`;
      return;
    }

    // --- 2. COUPON & TOTAL CALC ---
    let appliedCouponCode = null;
    const storedCoupon = localStorage.getItem("selectedCoupon");
    if (storedCoupon) {
      try {
        const parsed = JSON.parse(storedCoupon);
        if (parsed && parsed.code) appliedCouponCode = parsed.code;
      } catch (e) {
        console.error("Invalid coupon in storage");
        localStorage.removeItem("selectedCoupon");
      }
    }

    let couponDiscount = 0;
    let appliedCoupon = null;

    if (appliedCouponCode) {
      try {
        const cRes = await fetch("/api/user/coupons/apply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            couponCode: appliedCouponCode,
            cartTotal: subtotal,
          }),
        });
        const cData = await cRes.json();
        if (cData.success) {
          couponDiscount = cData.discountAmount;
          appliedCoupon = appliedCouponCode;

          localStorage.setItem(
            "selectedCoupon",
            JSON.stringify({
              code: cData.code,
              discount: cData.discountAmount,
              finalTotal: cData.finalTotal,
            }),
          );
        } else {
          console.warn("Coupon re-validation failed:", cData.message);
          localStorage.removeItem("selectedCoupon");
        }
      } catch (e) {
        console.error("Coupon re-check failed", e);
      }
    }

    const deliveryCharge = 0;
    const finalAmount = Math.max(0, subtotal - couponDiscount + deliveryCharge);

    // --- 3. RENDER UI ---

    const itemsHtml = items
      .map(
        (item) => `
            <div class="d-flex gap-3 mb-3 border-bottom pb-3">
                <div style="width: 60px; height: 60px; flex-shrink: 0; background: #f9f9f9; border-radius: 8px; overflow: hidden;">
                    <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: contain;">
                </div>
                <div class="flex-grow-1">
                    <h6 class="mb-1" style="font-size: 0.9rem; font-weight: 600;">${item.name}</h6>
                    <div class="small text-muted">Qty: ${item.qty}</div>
                    <div class="d-flex align-items-center gap-2 mt-1">
                        <span class="fw-bold">Rs. ${(item.price * item.qty).toLocaleString()}</span>
                        ${item.mrp > item.price ? `<span class="text-decoration-line-through text-muted small">Rs. ${(item.mrp * item.qty).toLocaleString()}</span>` : ""}
                        ${item.mrp > item.price ? `<span class="text-success small fw-bold">${Math.round(((item.mrp - item.price) / item.mrp) * 100)}% Off</span>` : ""}
                    </div>
                </div>
            </div>
        `,
      )
      .join("");

    const couponHtml = appliedCoupon
      ? `
            <div class="d-flex justify-content-between align-items-center p-3 mb-3 bg-light border border-success rounded">
                <div class="text-success">
                    <i class="fa-solid fa-tag me-2"></i>
                    <span class="fw-bold">Code: ${appliedCoupon}</span>
                </div>
                <button class="btn btn-sm btn-outline-danger border-0" onclick="removeCoupon()">Remove</button>
            </div>
        `
      : `
            <div class="coupon-card mb-3 p-3 bg-white border rounded d-flex justify-content-between align-items-center" 
                 style="cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.02);" 
                 onclick="openCouponModal(${subtotal})">
                <div class="d-flex align-items-center gap-2">
                    <i class="fa-solid fa-tag text-dark"></i>
                    <span class="fw-bold" style="font-size: 0.95rem;">Apply Coupon</span>
                </div>
                <i class="fa-solid fa-chevron-right text-muted"></i>
            </div>
        `;

    summaryContainer.innerHTML = `
            <h5 class="mb-4 fw-bold">Order Details</h5>
            
            <div class="summary-items" style="max-height: 300px; overflow-y: auto;">
                ${itemsHtml}
            </div>

            ${couponHtml}

            <div class="summary-calc pt-3 border-top">
                 <div class="d-flex justify-content-between mb-2 small text-muted">
                    <span>Price (${items.length} items)</span>
                    <span>₹${totalMrp.toLocaleString()}</span>
                </div>
                
                ${
                  discount > 0
                    ? `
                <div class="d-flex justify-content-between mb-2 small text-success">
                    <span>Discount</span>
                    <span>- ₹${discount.toLocaleString()}</span>
                </div>`
                    : ""
                }

                <div class="d-flex justify-content-between mb-2 small">
                    <span>Subtotal</span>
                    <span>₹${subtotal.toLocaleString()}</span>
                </div>

                ${
                  couponDiscount > 0
                    ? `
                <div class="d-flex justify-content-between mb-2 small text-success fw-bold">
                    <span>Coupon Discount</span>
                    <span>- ₹${couponDiscount.toLocaleString()}</span>
                </div>`
                    : ""
                }

                <div class="d-flex justify-content-between mb-3 small">
                    <span>Delivery Charges</span>
                    <span class="${deliveryCharge === 0 ? "text-success fw-bold" : ""}">
                        ${deliveryCharge === 0 ? "Free Shipping" : "₹" + deliveryCharge}
                    </span>
                </div>

                <div class="d-flex justify-content-between py-3 border-top border-bottom mb-3 calc-row total">
                    <span class="fw-bold" style="font-size: 1.1rem;">Total Amount</span>
                    <span class="fw-bold total-amount" id="final-amount-val" style="font-size: 1.1rem;">₹${finalAmount.toLocaleString()}</span>
                </div>
                
                <p class="text-success small mb-0"><i class="fa-solid fa-check-circle me-1"></i> You will save ₹${(discount + couponDiscount).toLocaleString()} on this order</p>
            </div>
        `;
  } catch (error) {
    console.error("Summary Render Error:", error);
    summaryContainer.innerHTML =
      '<div class="alert alert-danger">Error loading summary</div>';
  }
});

// --- HELPER FUNCTIONS ---

function formatImage(path) {
  if (!path) return "https://placehold.co/60x60?text=No+Img";
  if (path.startsWith("http")) return path;
  return (
    "/" +
    path
      .replace(/^public/, "")
      .replace(/\\/g, "/")
      .replace(/^\//, "")
  );
}

async function openCouponModal(cartTotal) {
  let coupons = [];
  try {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    const res = await fetch("/api/user/coupons", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      coupons = data.data || [];
    }
  } catch (e) {
    console.error(e);
  }

  const couponsHtml =
    coupons.length > 0
      ? coupons
          .map(
            (c) => `
        <div class="text-start border rounded p-2 mb-2 ${c.isExpired || c.isUsed ? "bg-light text-muted" : "border-success"}" 
              style="cursor: ${c.isExpired || c.isUsed ? "not-allowed" : "pointer"}"
              onclick="${!c.isExpired && !c.isUsed ? `selectCoupon('${c.code}')` : ""}">
            <div class="d-flex justify-content-between">
                <strong>${c.code}</strong>
                <small>${c.discountType === "percentage" ? c.value + "% OFF" : "₹" + c.value + " OFF"}</small>
            </div>
            <div style="font-size: 0.75rem;">Min Order: ₹${c.minPurchase}</div>
            ${c.isExpired ? '<div class="text-danger small">Expired</div>' : ""}
        </div>
    `,
          )
          .join("")
      : '<div class="text-muted small">No coupons available</div>';

  Swal.fire({
    title: "Apply Coupon",
    html: `
            <input type="text" id="swal-coupon-code" class="form-control mb-3" placeholder="Enter Coupon Code">
            <div class="text-start mb-2 fw-bold small">Available Coupons:</div>
            <div style="max-height: 150px; overflow-y: auto;">
                ${couponsHtml}
            </div>
        `,
    showCancelButton: true,
    confirmButtonText: "Apply",
    confirmButtonColor: "#1a1a1a",
    preConfirm: () => {
      const code = document.getElementById("swal-coupon-code").value;
      if (!code) Swal.showValidationMessage("Please enter a code");
      return code;
    },
  }).then(async (result) => {
    if (result.isConfirmed) {
      applyCoupon(result.value, cartTotal);
    }
  });
}

function selectCoupon(code) {
  const input = document.getElementById("swal-coupon-code");
  if (input) input.value = code;
}

async function applyCoupon(code, cartTotal) {
  try {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    const res = await fetch("/api/user/coupons/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ couponCode: code, cartTotal: cartTotal }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      localStorage.setItem(
        "selectedCoupon",
        JSON.stringify({
          code: data.code,
          discount: data.discountAmount,
          finalTotal: data.finalTotal,
        }),
      );
      Swal.fire({
        icon: "success",
        title: "Coupon Applied!",
        text: `You saved ₹${data.discountAmount}`,
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        location.reload();
      });
    } else {
      Swal.fire("Invalid Coupon", data.message, "error");
    }
  } catch (e) {
    console.error(e);
    Swal.fire("Error", "Failed to apply coupon", "error");
  }
}

function removeCoupon() {
  localStorage.removeItem("selectedCoupon");
  location.reload();
}
