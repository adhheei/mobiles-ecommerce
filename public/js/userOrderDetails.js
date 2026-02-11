// Global variable
let currentOrderId = null;
let currentOrder = null; // Store full order object

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
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
        const order = data.order;

        currentOrder = order; // Store globally
        currentOrderId = order._id;
        console.log("DEBUG: Order Data:", order);

        if (res.ok && data.success) {
            // --- HEADER ---
            document.getElementById("order-id-display").innerText = `Order #${order.orderId}`;

            const orderDate = new Date(order.createdAt);
            document.getElementById("order-date-display").innerText = orderDate.toLocaleDateString("en-US", {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            // Status Badge
            const statusEl = document.getElementById("order-status-badge");
            statusEl.innerText = order.orderStatus;
            statusEl.className = `badge ${getStatusColor(order.orderStatus)}`;

            // Expected Delivery
            const deliveryStart = new Date(orderDate);
            deliveryStart.setDate(deliveryStart.getDate() + 6);
            const deliveryEnd = new Date(orderDate);
            deliveryEnd.setDate(deliveryEnd.getDate() + 7);

            const deliveryText = order.orderStatus === 'Delivered'
                ? `Delivered on ${new Date(order.updatedAt).toLocaleDateString()}`
                : `Est. Delivery: ${deliveryStart.toLocaleDateString()} - ${deliveryEnd.toLocaleDateString()}`;
            document.getElementById("estimated-delivery").innerText = deliveryText;


            // --- ITEMS TABLE ---
            const itemsList = document.getElementById("order-items-list");
            itemsList.innerHTML = order.items.map((item, index) => `
                <tr>
                    <td class="ps-4 py-3">
                        <div class="d-flex align-items-center gap-3">
                            <img src="${item.image ? '/' + item.image.replace(/\\/g, '/').replace('public/', '') : '/images/product-placeholder.jpg'}" alt="${item.name}" 
                                 style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #eee;"
                                 onerror="this.src='/images/product-placeholder.jpg'">
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
            `).join('');


            // --- RETURN BANNER VISIBILITY ---
            const returnSection = document.getElementById("return-section");
            if (order.orderStatus === 'Delivered') {
                returnSection.style.display = 'block';
            } else {
                returnSection.style.display = 'none';
            }

            // --- SHIPPING ADDRESS ---
            const addr = order.shippingAddress;
            if (addr) {
                document.getElementById("shipping-address").innerHTML = `
                    <p class="mb-1 fw-bold text-dark">${addr.fullName}</p>
                    <p class="mb-0">${addr.street}</p>
                    <p class="mb-0">${addr.city}, ${addr.state} ${addr.pincode}</p>
                    <p class="mb-0 mt-2"><i class="fa-solid fa-phone me-1 text-muted"></i> ${addr.phone}</p>
                `;
            } else {
                document.getElementById("shipping-address").innerText = "Address details not available.";
            }

            // --- PAYMENT INFO ---
            document.getElementById("payment-method").innerText = order.paymentMethod;
            const payStatusEl = document.getElementById("payment-status");
            payStatusEl.innerText = `Status: ${order.paymentStatus}`;
            payStatusEl.className = order.paymentStatus === 'Paid' ? 'text-success fw-bold' : 'text-warning fw-bold';

            // --- ORDER SUMMARY ---
            document.getElementById("summary-subtotal").innerText = `₹${order.totals.subtotal.toLocaleString()}`;
            document.getElementById("summary-shipping").innerText = order.totals.shipping === 0 ? "Free" : `₹${order.totals.shipping}`;
            document.getElementById("summary-discount").innerText = `- ₹${(order.totals.couponDiscount || 0).toLocaleString()}`;
            document.getElementById("summary-total").innerText = `₹${order.totals.totalAmount.toLocaleString()}`;

            // --- BOTTOM CANCEL BUTTON ---
            const actionContainer = document.getElementById("main-action-btn-container");
            if (order.orderStatus === 'Processing' || order.orderStatus === 'Shipped') {
                actionContainer.innerHTML = `
                    <button class="btn btn-outline-danger w-100" onclick="cancelOrder(null)">
                        Cancel Entire Order
                    </button>`;
            } else {
                actionContainer.innerHTML = '';
            }

        } else {
            Swal.fire("Error", "Failed to load order details", "error");
        }
    } catch (error) {
        console.error(error);
        Swal.fire("Error", "Network Error", "error");
    }
});

function getActionButton(order, item, index) {
    if (order.orderStatus === 'Cancelled') return '<span class="text-muted small">Order Cancelled</span>';

    // Check Return Status First
    if (item.returnStatus === 'Requested') return '<span class="badge bg-warning text-dark">Return Requested</span>';
    if (item.returnStatus === 'Approved') return '<span class="badge bg-success">Return Approved</span>';
    if (item.returnStatus === 'Rejected') return '<span class="badge bg-danger">Return Rejected</span>';

    if (item.status === 'Cancelled') return '<span class="text-danger small">Item Cancelled</span>';
    if (item.status === 'Returned') return '<span class="text-warning small fw-bold">Returned</span>';

    // Pass index instead of IDs to avoid issues
    if (item.status === 'Delivered') {
        return `<button class="btn btn-sm btn-outline-warning" onclick="returnOrder(${index})">Return</button>`;
    }

    if (order.orderStatus === 'Processing' || order.orderStatus === 'Shipped') {
        return `<button class="btn btn-sm btn-outline-danger" onclick="cancelOrder(${index})">Cancel</button>`;
    }

    return '-';
}

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

async function cancelOrder(itemIndex) {
    handleOrderAction(itemIndex, 'cancel');
}

async function returnOrder(itemIndex) {
    // Lookup item details from global order object
    const item = currentOrder.items[itemIndex];
    if (!item || !item._id) {
        Swal.fire("Error", "Item ID not found. Please refresh.", "error");
        return;
    }

    // Original Return Logic
    const { value: reason } = await Swal.fire({
        title: "Return Product",
        input: "textarea",
        inputLabel: "Reason for return",
        inputPlaceholder: "Enter your reason...",
        inputValidator: (value) => {
            if (!value) {
                return "Reason is required!";
            }
        },
        showCancelButton: true,
        confirmButtonText: "Submit Return",
        confirmButtonColor: "#f0ad4e"
    });

    if (reason) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/orders/${currentOrder._id}/return/${item._id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ reason })
            });

            const data = await res.json();

            if (res.ok) {
                Swal.fire({
                    icon: "success",
                    title: "Return Requested",
                    text: "Your return request has been submitted."
                }).then(() => location.reload());
            } else {
                Swal.fire("Error", data.message || "Failed to submit return request", "error");
            }
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Network error", "error");
        }
    }
}

async function handleOrderAction(itemIndex, actionType) {
    // Only handles Cancel now
    const isItem = itemIndex !== null && itemIndex !== undefined;

    let itemId = null;
    if (isItem) {
        const item = currentOrder.items[itemIndex];
        if (item) itemId = item._id;
    }

    const title = isItem ? "Cancel this item?" : "Cancel entire order?";
    const text = "This action cannot be undone!";
    const confirmBtnText = "Yes, Cancel it!";
    const confirmBtnColor = "#d33";

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
            const body = { action: actionType };
            if (itemId) body.itemId = itemId;

            const res = await fetch(`/api/orders/${currentOrder._id}/cancel`, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (res.ok) {
                Swal.fire("Cancelled!", data.message, "success").then(() => {
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
