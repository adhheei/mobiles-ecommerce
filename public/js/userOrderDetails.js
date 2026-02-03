document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "userLogin.html";
        return;
    }

    if (!orderId) {
        Swal.fire("Error", "Invalid Order ID", "error").then(() => {
            window.location.href = "userOrdersPage.html";
        });
        return;
    }

    const container = document.getElementById("order-details-container");

    try {
        const res = await fetch(`/api/orders/${orderId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await res.json();
        const order = data.order;

        if (res.ok && data.success) {
            // Render Order Data
            document.getElementById("order-id-display").innerText = `Order #${order.orderId}`;

            const date = new Date(order.createdAt).toLocaleDateString("en-US", {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            document.getElementById("order-date-display").innerText = date;

            // Status Badge
            const statusEl = document.getElementById("order-status-badge");
            statusEl.innerText = order.orderStatus;
            statusEl.className = `badge rounded-pill ${getStatusColor(order.orderStatus)}`;

            // Shipping Address
            const addr = order.shippingAddress;
            document.getElementById("shipping-address").innerHTML = `
                <strong>${addr.fullName}</strong><br>
                ${addr.street}, ${addr.city}<br>
                ${addr.state} - ${addr.pincode}<br>
                Phone: ${addr.phone}
            `;

            // Payment
            document.getElementById("payment-method").innerText = order.paymentMethod;

            // Items
            const itemsList = document.getElementById("order-items-list");
            itemsList.innerHTML = order.items.map(item => `
                <div class="d-flex gap-3 mb-4 border-bottom pb-4">
                    <img src="${item.image}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: contain; border-radius: 8px; background: #f8f9fa;">
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between">
                            <h6 class="fw-bold mb-1">${item.name}</h6>
                            <span class="fw-bold">₹${(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                        <div class="text-muted small mb-2">
                             Qty: ${item.quantity} | Price: ₹${item.price.toLocaleString()}
                        </div>
                         
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="badge bg-light text-dark border">${item.status}</span>
                            
                            ${(item.status !== 'Cancelled' && item.status !== 'Delivered' && item.status !== 'Returned' && order.orderStatus !== 'Cancelled') ?
                    `<button class="btn btn-sm btn-outline-danger" onclick="cancelOrder('${order._id}', '${item._id}')">Cancel Item</button>` : ''}
                            ${(item.status === 'Delivered') ?
                    `<button class="btn btn-sm btn-outline-warning" onclick="returnOrder('${order._id}', '${item._id}')">Return Item</button>` : ''}
                        </div>
                    </div>
                </div>
            `).join('');

            // Summary
            document.getElementById("summary-subtotal").innerText = `₹${order.totals.subtotal.toLocaleString()}`;
            document.getElementById("summary-shipping").innerText = order.totals.shipping === 0 ? "Free" : `₹${order.totals.shipping}`;
            document.getElementById("summary-discount").innerText = `- ₹${(order.totals.couponDiscount || 0).toLocaleString()}`;
            document.getElementById("summary-total").innerText = `₹${order.totals.totalAmount.toLocaleString()}`;

            // Main Action Button
            const mainActionBtn = document.getElementById("main-action-btn");
            if (order.orderStatus === 'Processing' || order.orderStatus === 'Shipped') {
                mainActionBtn.innerHTML = `<button class="btn btn-danger w-100" onclick="cancelOrder('${order._id}', null)">Cancel Entire Order</button>`;
            } else if (order.orderStatus === 'Delivered') {
                mainActionBtn.innerHTML = `<button class="btn btn-warning w-100" onclick="returnOrder('${order._id}', null)">Return Filter Order</button>`;
            } else {
                mainActionBtn.innerHTML = '';
            }

        } else {
            Swal.fire("Error", "Failed to load order details", "error");
        }
    } catch (error) {
        console.error(error);
        Swal.fire("Error", "Network Error", "error");
    }
});

function getStatusColor(status) {
    switch (status) {
        case 'Delivered': return 'bg-success';
        case 'Cancelled': return 'bg-danger';
        case 'Returned': return 'bg-warning text-dark';
        case 'Shipped': return 'bg-primary';
        case 'Processing': return 'bg-info text-dark';
        default: return 'bg-secondary';
    }
}

async function cancelOrder(orderId, itemId) {
    handleOrderAction(orderId, itemId, 'cancel');
}

async function returnOrder(orderId, itemId) {
    handleOrderAction(orderId, itemId, 'return');
}

async function handleOrderAction(orderId, itemId, actionType) {
    const isItem = !!itemId;
    const isReturn = actionType === 'return';

    const title = isReturn
        ? (isItem ? "Return this item?" : "Return entire order?")
        : (isItem ? "Cancel this item?" : "Cancel entire order?");

    const text = isReturn
        ? "This will initiate a return request."
        : "This action cannot be undone!";

    const confirmBtnText = isReturn ? "Yes, Return it!" : "Yes, Cancel it!";
    const confirmBtnColor = isReturn ? "#f0ad4e" : "#d33";

    const result = await Swal.fire({
        title: title,
        text: text,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: confirmBtnColor,
        cancelButtonColor: "#3085d6",
        confirmButtonText: confirmBtnText
    });

    if (result.isConfirmed) {
        try {
            const token = localStorage.getItem("token");
            const body = { action: actionType }; // Send action type
            if (itemId) body.itemId = itemId;

            // Re-using cancel endpoint or create new? 
            // Let's use the same endpoint but handle action type or use a new 'status-update' endpoint?
            // Existing cancel endpoint: PUT /api/orders/:id/cancel
            // Let's modify the cancel endpoint to support 'return' action or create a new route.
            // For simplicity, let's call the same endpoint and send 'action': 'return' in body.

            const res = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (res.ok) {
                Swal.fire(isReturn ? "Returned!" : "Cancelled!", data.message, "success").then(() => {
                    location.reload();
                });
            } else {
                Swal.fire("Failed", data.message, "error");
            }
        } catch (error) {
            Swal.fire("Error", "Network error", "error");
        }
    }
}
