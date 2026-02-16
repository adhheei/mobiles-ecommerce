// Global variables
let currentOrderId = null;
let currentOrder = null; // Store full order object

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("id");
  const token = localStorage.getItem("token");

  if (!orderId) {
    Swal.fire("Error", "Invalid Order ID", "error").then(() => {
      window.location.href = "userOrdersPage.html";
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

      // Expected Delivery Logic
      const deliveryStart = new Date(orderDate);
      deliveryStart.setDate(deliveryStart.getDate() + 6);
      const deliveryEnd = new Date(orderDate);
      deliveryEnd.setDate(deliveryEnd.getDate() + 7);

      const deliveryText =
        order.orderStatus === "Delivered"
          ? `Delivered on ${new Date(order.updatedAt).toLocaleDateString()}`
          : `Est. Delivery: ${deliveryStart.toLocaleDateString()} - ${deliveryEnd.toLocaleDateString()}`;
      document.getElementById("estimated-delivery").innerText = deliveryText;

      // --- 2. ITEMS TABLE WITH FIXED IMAGES ---
      const itemsList = document.getElementById("order-items-list");
      itemsList.innerHTML = order.items
        .map((item, index) => {
          // Use fixed helper for image paths
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
            </tr>
          `;
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
            <p class="mb-0 mt-2"><i class="fa-solid fa-phone me-1 text-muted"></i> ${addr.phone}</p>
        `;
      }

      // --- 5. PAYMENT INFO ---
      document.getElementById("payment-method").innerText = order.paymentMethod;
      const payStatusEl = document.getElementById("payment-status");
      payStatusEl.innerText = `Status: ${order.paymentStatus}`;
      payStatusEl.className =
        order.paymentStatus === "Paid"
          ? "text-success fw-bold"
          : "text-warning fw-bold";

      // --- 6. ORDER SUMMARY ---
      // Ensure totals exist before rendering
      const totals = order.totals || {};
      document.getElementById("summary-subtotal").innerText =
        `₹${(totals.subtotal || 0).toLocaleString()}`;
      document.getElementById("summary-shipping").innerText =
        totals.shipping === 0 ? "Free" : `₹${totals.shipping}`;
      document.getElementById("summary-discount").innerText =
        `- ₹${(totals.couponDiscount || 0).toLocaleString()}`;
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
    Swal.fire("Error", "Network Error occurred while fetching order", "error");
  }
});

/**
 * Normalizes image paths for frontend display
 */
function formatImageUrl(path) {
  if (!path) return "https://placehold.co/100x120?text=No+Image";
  if (path.startsWith("http")) return path;

  // Remove 'public/' and fix slashes
  let cleanPath = path.replace(/^public\//, "").replace(/\\/g, "/");
  if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;
  return cleanPath;
}

function getActionButton(order, item, index) {
  if (order.orderStatus === "Cancelled" || item.status === "Cancelled")
    return '<span class="text-danger small">Cancelled</span>';

  // Return Statuses
  if (item.returnStatus === "Requested")
    return '<span class="badge bg-warning text-dark">Return Requested</span>';
  if (item.returnStatus === "Approved")
    return '<span class="badge bg-success">Return Approved</span>';
  if (item.returnStatus === "Rejected")
    return '<span class="badge bg-danger">Return Rejected</span>';
  if (item.status === "Returned")
    return '<span class="text-warning small fw-bold">Returned</span>';

  // Available Actions
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
  if (!item || !item._id) {
    Swal.fire("Error", "Item information missing. Please refresh.", "error");
    return;
  }

  const { value: reason } = await Swal.fire({
    title: "Return Product",
    input: "textarea",
    inputLabel: "Reason for return",
    inputPlaceholder: "Explain why you are returning this item...",
    inputValidator: (value) => !value && "Reason is required!",
    showCancelButton: true,
    confirmButtonText: "Submit Return",
    confirmButtonColor: "#f0ad4e",
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

      if (res.ok) {
        Swal.fire(
          "Success",
          "Return request submitted successfully.",
          "success",
        ).then(() => location.reload());
      } else {
        const data = await res.json();
        Swal.fire("Error", data.message || "Failed to submit return", "error");
      }
    } catch (error) {
      Swal.fire("Error", "Network connection failed", "error");
    }
  }
}

async function handleOrderAction(itemIndex, actionType) {
  const isItem = itemIndex !== null && itemIndex !== undefined;
  let itemId = isItem ? currentOrder.items[itemIndex]._id : null;

  const result = await Swal.fire({
    title: isItem ? "Cancel this item?" : "Cancel entire order?",
    text: "This action cannot be undone!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, Cancel it!",
  });

  if (result.isConfirmed) {
    try {
      const token = localStorage.getItem("token");
      const body = { action: actionType };
      if (itemId) body.itemId = itemId;

      const res = await fetch(`/api/orders/${currentOrder._id}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        Swal.fire("Cancelled!", data.message, "success").then(() =>
          location.reload(),
        );
      } else {
        Swal.fire("Failed", data.message, "error");
      }
    } catch (error) {
      Swal.fire("Error", "Network error occurred", "error");
    }
  }
}
