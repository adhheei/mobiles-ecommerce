// Global variables
let currentOrderId = null;
let currentOrder = null; // Store full order object

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("id");
  const token = localStorage.getItem("token");

  if (!orderId) {
    Swal.fire("Error", "Invalid Order ID", "error").then(() => {
      window.location.href = "/user/userOrdersPage.html";
    });
    return;
  }

  try {
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`/api/orders/${orderId}`, { headers });
    const data = await res.json();

    if (res.ok && data.success) {
      const order = data.order;
      currentOrder = order; // Store globally
      currentOrderId = order._id;

      // --- 1. HEADER INFO ---
      document.getElementById("order-id-display").innerText =
        `Order #${order.orderId}`;

      const orderDate = new Date(order.createdAt);
      document.getElementById("order-date-display").innerText =
        orderDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

      // Status Badge
      const statusEl = document.getElementById("order-status-badge");
      statusEl.innerText = order.orderStatus;
      statusEl.className = `badge ${getStatusColor(order.orderStatus)}`;

      // --- FIXED: Expected Delivery Logic (Hidden for Cancelled/Returned) ---
      const estDeliveryEl = document.getElementById("estimated-delivery");

      if (
        order.orderStatus === "Cancelled" ||
        order.orderStatus === "Returned"
      ) {
        // Hide delivery text if order is no longer active
        estDeliveryEl.innerText = "";
      } else if (order.orderStatus === "Delivered") {
        estDeliveryEl.innerText = `| Delivered on ${new Date(order.updatedAt).toLocaleDateString()}`;
        estDeliveryEl.className = "text-primary fw-bold";
      } else {
        const deliveryStart = new Date(orderDate);
        deliveryStart.setDate(deliveryStart.getDate() + 6);
        const deliveryEnd = new Date(orderDate);
        deliveryEnd.setDate(deliveryEnd.getDate() + 7);

        estDeliveryEl.innerText = `| Est. Delivery: ${deliveryStart.toLocaleDateString()} - ${deliveryEnd.toLocaleDateString()}`;
        estDeliveryEl.className = "text-success fw-bold";
      }

      // --- 2. ITEMS TABLE ---
      const itemsList = document.getElementById("order-items-list");
      itemsList.innerHTML = order.items
        .map((item, index) => {
          const imgSrc = formatImageUrl(item.image);
          return `
            <tr>
                <td class="ps-4 py-3">
                    <div class="d-flex align-items-center gap-3">
                        <img src="${imgSrc}" alt="${item.name}" 
                             style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #eee;"
                             onerror="this.src='https://placehold.co/100x120?text=No+Image'">
                        <div>
                            <h6 class="mb-0 fw-bold small text-truncate" style="max-width: 200px;">${item.name}</h6>
                            <span class="badge border text-dark fw-normal" style="font-size: 0.7rem;">${item.status}</span>
                        </div>
                    </div>
                </td>
                <td class="py-3 text-muted">${item.quantity}</td>
                <td class="py-3 text-muted">₹${item.price.toLocaleString()}</td>
                <td class="py-3 fw-bold">₹${(item.price * item.quantity).toLocaleString()}</td>
                <td class="pe-4 py-3 text-end">
                    ${getActionButton(order, item, index)}
                </td>
            </tr>`;
        })
        .join("");

      // --- 3. RETURN BANNER ---
      const returnSection = document.getElementById("return-section");
      if (returnSection) {
        returnSection.style.display =
          order.orderStatus === "Delivered" ? "block" : "none";
      }

      // --- 4. SHIPPING ADDRESS ---
      const addr = order.shippingAddress;
      const addrContainer = document.getElementById("shipping-address");
      if (addr && addrContainer) {
        addrContainer.innerHTML = `
            <p class="mb-1 fw-bold text-dark">${addr.fullName}</p>
            <p class="mb-0">${addr.street}</p>
            <p class="mb-0">${addr.city}, ${addr.state} ${addr.pincode}</p>
            <p class="mb-0 mt-2"><i class="fa-solid fa-phone me-1 text-muted"></i> ${addr.phone}</p>`;
      }

      // --- Updated Section 5: PAYMENT INFO (Complete Fix) ---
      const paymentMethodDisplay = document.getElementById("payment-method");
      const payStatusEl = document.getElementById("payment-status");

      if (paymentMethodDisplay && payStatusEl) {
        paymentMethodDisplay.innerText = order.paymentMethod;

        const isCancelled = order.orderStatus === "Cancelled";
        const isReturned = order.orderStatus === "Returned";

        if (order.paymentMethod === "WALLET") {
          if (isCancelled) {
            payStatusEl.innerText = "Status: Refunded to Wallet";
            payStatusEl.className = "text-warning fw-bold";
          } else if (isReturned) {
            payStatusEl.innerText = "Status: Returned to Wallet";
            payStatusEl.className = "text-warning fw-bold";
          } else {
            payStatusEl.innerText = `Status: ${order.paymentStatus}`;
            payStatusEl.className =
              order.paymentStatus === "Paid"
                ? "text-success fw-bold"
                : "text-warning fw-bold";
          }
        } else if (order.paymentMethod === "COD") {
          if (isCancelled || isReturned) {
            payStatusEl.innerText = "Status: Voided";
            payStatusEl.className = "text-muted fw-bold";
          } else {
            payStatusEl.innerText = `Status: ${order.paymentStatus}`;
            payStatusEl.className = "text-warning fw-bold";
          }
        } else {
          // For other online payment methods (Razorpay, etc.)
          if (isCancelled || isReturned) {
            payStatusEl.innerText = "Status: Refunded";
            payStatusEl.className = "text-warning fw-bold";
          } else {
            payStatusEl.innerText = `Status: ${order.paymentStatus}`;
            payStatusEl.className =
              order.paymentStatus === "Paid"
                ? "text-success fw-bold"
                : "text-warning fw-bold";
          }
        }
      }

      // --- 6. ORDER SUMMARY ---
      const totals = order.totals || {};
      document.getElementById("summary-subtotal").innerText =
        `₹${(totals.subtotal || 0).toLocaleString()}`;
      document.getElementById("summary-shipping").innerText =
        totals.shipping === 0 ? "Free" : `₹${totals.shipping}`;
      document.getElementById("summary-discount").innerText =
        `- ₹${(totals.couponDiscount || 0).toLocaleString()}`;

      const walletContainer = document.getElementById("summary-wallet-container");
      const walletSpan = document.getElementById("summary-wallet");
      if (totals.walletAmount && totals.walletAmount > 0) {
        walletContainer.style.setProperty("display", "flex", "important");
        walletSpan.innerText = `- ₹${totals.walletAmount.toLocaleString()}`;
      } else {
        walletContainer.style.setProperty("display", "none", "important");
      }

      document.getElementById("summary-total").innerText =
        `₹${(totals.totalAmount || 0).toLocaleString()}`;

      // --- 7. MAIN ACTION BUTTON ---
      const actionContainer = document.getElementById(
        "main-action-btn-container",
      );
      if (actionContainer) {
        if (
          order.orderStatus === "Processing" ||
          order.orderStatus === "Shipped"
        ) {
          actionContainer.innerHTML = `
            <button class="btn btn-outline-danger w-100" onclick="cancelOrder(null)">
                Cancel Entire Order
            </button>`;
        } else {
          actionContainer.innerHTML = "";
        }
      }
    } else {
      Swal.fire(
        "Error",
        data.message || "Failed to load order details",
        "error",
      );
    }
  } catch (error) {
    console.error("Fetch Error:", error);
    Swal.fire("Error", "Network Error occurred", "error");
  }
});

/** Helper Functions **/

function formatImageUrl(path) {
  if (!path) return "https://placehold.co/100x120?text=No+Image";
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  let cleanPath = path.replace(/\\/g, "/").replace(/^public\//, "").replace(/^User\//, "").replace(/^\//, "");
  return "/" + cleanPath;
}

function getActionButton(order, item, index) {
  if (order.orderStatus === "Cancelled" || item.status === "Cancelled")
    return '<span class="text-danger small">Cancelled</span>';

  if (item.returnStatus === "Requested")
    return '<span class="badge bg-warning text-dark">Return Requested</span>';
  if (item.returnStatus === "Approved")
    return '<span class="badge bg-success">Return Approved</span>';
  if (item.status === "Returned")
    return '<span class="text-warning small fw-bold">Returned</span>';

  if (item.status === "Delivered") {
    return `<button class="btn btn-sm btn-outline-warning" onclick="returnOrder(${index})">Return</button>`;
  }

  if (order.orderStatus === "Processing" || order.orderStatus === "Shipped") {
    return `<button class="btn btn-sm btn-outline-danger" onclick="cancelOrder(${index})">Cancel</button>`;
  }
  return "-";
}

function getStatusColor(status) {
  const colors = {
    Delivered: "bg-success",
    Cancelled: "bg-danger",
    Returned: "bg-warning text-dark",
    Shipped: "bg-primary",
    Processing: "bg-info text-dark",
  };
  return colors[status] || "bg-secondary";
}

async function cancelOrder(itemIndex) {
  handleOrderAction(itemIndex, "cancel");
}

async function returnOrder(itemIndex) {
  const item = currentOrder.items[itemIndex];
  const { value: reason } = await Swal.fire({
    title: "Return Product",
    input: "textarea",
    inputLabel: "Reason for return",
    inputPlaceholder: "Explain why you are returning this item...",
    inputValidator: (value) => !value && "Reason is required!",
    showCancelButton: true,
  });

  if (reason) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/orders/${currentOrder._id}/return/${item._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        },
      );
      if (res.ok)
        Swal.fire("Success", "Return request submitted.", "success").then(() =>
          location.reload(),
        );
    } catch (error) {
      Swal.fire("Error", "Request failed", "error");
    }
  }
}

async function handleOrderAction(itemIndex, actionType) {
  const isItem = itemIndex !== null && itemIndex !== undefined;
  const result = await Swal.fire({
    title: isItem ? "Cancel this item?" : "Cancel entire order?",
    text: "This action cannot be undone!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
  });

  if (result.isConfirmed) {
    try {
      const token = localStorage.getItem("token");
      const body = { action: actionType };
      if (isItem) body.itemId = currentOrder.items[itemIndex]._id;

      const res = await fetch(`/api/orders/${currentOrder._id}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok)
        Swal.fire("Updated!", "Order status updated.", "success").then(() =>
          location.reload(),
        );
    } catch (error) {
      Swal.fire("Error", "Network error", "error");
    }
  }
}

async function downloadPDFReceipt() {
  const token = localStorage.getItem("token");

  // Show a loading state (optional)
  Swal.fire({
    title: "Generating PDF...",
    didOpen: () => {
      Swal.showLoading();
    },
  });

  try {
    const response = await fetch(
      `/api/orders/download-invoice/${currentOrderId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_${currentOrderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      Swal.close();
    } else {
      throw new Error("Failed to download");
    }
  } catch (error) {
    Swal.fire("Error", "Could not generate PDF receipt", "error");
  }
}
