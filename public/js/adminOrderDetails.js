document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (!orderId) {
        Swal.fire('Error', 'No Order ID provided', 'error');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/Admin/adminLogin.html';
        return;
    }

    try {
        const res = await fetch(`/api/admin/orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.success) {
            if (res.status === 401 || res.status === 403) {
                window.location.href = '/Admin/adminLogin.html';
                return;
            }
            throw new Error(data.message || 'Failed to fetch order');
        }

        const order = data.order;
        renderOrderDetails(order);

    } catch (error) {
        console.error(error);
        Swal.fire('Error', error.message, 'error');
    }
});

function renderOrderDetails(order) {
    // 1. Header Info
    document.querySelector('.order-title').textContent = `Order #${order.orderId}`;
    document.querySelector('.order-meta').textContent = `Placed on ${new Date(order.createdAt).toLocaleString()}`;

    // Status Badge
    const statusBadge = document.querySelector('.badge-custom');
    statusBadge.className = `badge-custom status-${order.orderStatus.toLowerCase()}`;
    statusBadge.textContent = order.orderStatus;

    // Set Select Dropdown
    const statusSelect = document.getElementById('statusSelect');
    // Ensure lowercase value matches options
    statusSelect.value = order.orderStatus.toLowerCase();

    // 2. Items
    const itemsContainer = document.querySelector('.card-custom .item-row').parentNode;
    // Clear existing static items (keep the header title)
    // Finding all item-row elements and removing them
    const existingItems = itemsContainer.querySelectorAll('.item-row');
    existingItems.forEach(el => el.remove());

    const itemsTitle = itemsContainer.querySelector('.card-title-sm'); // keep this
    // Insert new items after title
    let itemsHtml = '';
    order.items.forEach(item => {
        let returnActions = '';
        let returnInfo = '';

        if (item.returnStatus && item.returnStatus !== 'None') {
            returnInfo = `<div class="mt-1 small"><span class="fw-bold">Return Status:</span> ${item.returnStatus}</div>`;
            if (item.returnReason) {
                returnInfo += `<div class="small text-muted">Reason: ${item.returnReason}</div>`;
            }
        }

        if (item.returnStatus === 'Requested') {
            returnActions = `
                <div class="mt-2">
                    <button class="btn btn-sm btn-success me-2" onclick="handleAdminReturnAction('${order._id}', '${item._id}', 'Approved')">Approve Return</button>
                    <button class="btn btn-sm btn-danger" onclick="handleAdminReturnAction('${order._id}', '${item._id}', 'Rejected')">Reject Return</button>
                </div>
            `;
        }

        itemsHtml += `
            <div class="item-row">
              <img src="${item.image ? '/' + item.image.replace(/\\/g, '/').replace('public/', '') : '/images/product-placeholder.jpg'}" class="item-img" alt="${item.name}" onerror="this.src='/images/product-placeholder.jpg'" />
              <div class="item-details" style="flex: 1">
                <h6>${item.name}</h6>
                <span class="item-meta">Qty: ${item.quantity} | Status: ${item.status}</span>
                ${returnInfo}
                ${returnActions}
              </div>
              <div class="item-total">₹${item.price.toLocaleString()}</div>
            </div>
        `;
    });

    // Create a temporary div to append (or just insert adjacent HTML)
    itemsTitle.insertAdjacentHTML('afterend', itemsHtml);
    itemsTitle.querySelector('.badge').textContent = order.items.length;


    // 3. Totals
    const summaryContainer = document.querySelector('.mt-4.pt-3.border-top');
    summaryContainer.innerHTML = `
        <div class="summary-row">
            <span>Subtotal</span>
            <span>₹${order.totals.subtotal.toLocaleString()}</span>
        </div>
        <div class="summary-row">
            <span>Shipping</span>
            <span>₹${order.totals.shipping.toLocaleString()}</span>
        </div>
        <div class="summary-row">
            <span>Discount</span>
            <span>-₹${order.totals.couponDiscount.toLocaleString()}</span>
        </div>
        <div class="summary-row total">
            <span>Total</span>
            <span>₹${order.totals.totalAmount.toLocaleString()}</span>
        </div>
    `;

    // 4. Payment Info
    // Assuming paymentMethod and paymentStatus
    const paymentCard = document.querySelectorAll('.card-custom')[1]; // 2nd card in col-8
    paymentCard.querySelector('h6').textContent = `${order.paymentMethod} - ${order.paymentStatus}`;
    paymentCard.querySelector('.small.text-muted').textContent = `ID: ${order._id}`; // or transaction ID
    const payBadge = paymentCard.querySelector('.badge');
    payBadge.textContent = order.paymentStatus;
    payBadge.className = `badge ${order.paymentStatus === 'Paid' ? 'bg-success' : 'bg-warning'} bg-opacity-10 text-${order.paymentStatus === 'Paid' ? 'success' : 'dark'} border border-${order.paymentStatus === 'Paid' ? 'success' : 'warning'}`;


    // 5. Customer Info
    const customerCard = document.querySelectorAll('.col-lg-4 .card-custom')[0];
    const viewProfileLink = customerCard.querySelector('a'); // Select the View Profile link

    // Reset defaults
    viewProfileLink.href = 'javascript:void(0)';
    viewProfileLink.onclick = null;

    if (order.userId) {
        const c_firstName = order.userId.firstName || '';
        const c_lastName = order.userId.lastName || '';
        const c_name = `${c_firstName} ${c_lastName}`.trim() || 'Guest';
        const c_email = order.userId.email || 'N/A';
        const c_mobile = order.userId.phone || 'N/A';

        customerCard.querySelector('.admin-avatar').textContent = (c_firstName.charAt(0) || '?').toUpperCase();
        customerCard.querySelector('h6').textContent = c_name;
        customerCard.querySelector('.info-group .info-value:nth-child(2)').textContent = c_email;
        customerCard.querySelector('.info-group .info-value:nth-child(3)').textContent = c_mobile;

        // Attach Click Event for Modal
        viewProfileLink.onclick = () => showUserProfileModal(order.userId);
    } else {
        customerCard.querySelector('.admin-avatar').textContent = '?';
        customerCard.querySelector('h6').textContent = 'Guest / Unknown';
        customerCard.querySelector('.info-group .info-value:nth-child(2)').textContent = 'N/A';
        customerCard.querySelector('.info-group .info-value:nth-child(3)').textContent = 'N/A';

        // Show empty modal or alert
        viewProfileLink.onclick = () => Swal.fire('Info', 'No user profile data available (Guest Checkout)', 'info');
    }

    // 6. Shipping Address
    const shippingCard = document.querySelectorAll('.col-lg-4 .card-custom')[1];
    const addr = order.shippingAddress;
    shippingCard.querySelector('.info-group').innerHTML = `
        <div class="info-value">${addr.fullName}</div>
        <div class="info-sub">${addr.street}, ${addr.city}</div>
        <div class="info-sub">${addr.state}, ${addr.pincode}</div>
        <div class="info-sub">${addr.country}</div>
        <div class="info-sub">Phone: ${addr.phone}</div>
    `;

    window.currentOrderId = order._id;
}


async function updateStatus() {
    const newStatus = document.getElementById('statusSelect').value;
    // Map dropdown values to Schema Enums if needed (e.g. lowercase to capitalized)
    const statusMap = {
        'pending': 'Pending',
        'processing': 'Processing',
        'shipped': 'Shipped',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled',
        'returned': 'Returned'
    };

    const statusEnum = statusMap[newStatus];
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '/Admin/adminLogin.html';
        return;
    }

    Swal.fire({
        title: "Update Status?",
        text: `Change order status to ${statusEnum}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#000",
        confirmButtonText: "Yes, update it!"
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/admin/orders/${window.currentOrderId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: statusEnum })
                });
                const data = await res.json();
                if (data.success) {
                    Swal.fire("Updated!", "Order status updated.", "success")
                        .then(() => location.reload());
                } else {
                    if (res.status === 401 || res.status === 403) {
                        window.location.href = '/Admin/adminLogin.html';
                        return;
                    }
                    throw new Error(data.message);
                }
            } catch (e) {
                console.error(e);
                Swal.fire("Error", e.message, "error");
            }
        }
    });
}

function showUserProfileModal(user) {
    // 1. Basic Info
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Guest';
    document.getElementById('modalUserName').textContent = fullName;
    document.getElementById('modalUserId').textContent = user._id || 'N/A';
    document.getElementById('modalUserEmail').textContent = user.email || 'N/A';
    document.getElementById('modalUserMobile').textContent = user.mobile || 'N/A';

    // 2. Status Badge
    const statusEl = document.getElementById('modalUserStatus');
    const isBlocked = user.isBlocked; // true/false
    if (isBlocked) {
        statusEl.textContent = 'Blocked';
        statusEl.className = 'badge bg-danger bg-opacity-10 text-danger rounded-pill px-3';
    } else {
        statusEl.textContent = 'Active';
        statusEl.className = 'badge bg-success bg-opacity-10 text-success rounded-pill px-3';
    }

    // 3. Registered Date
    if (user.createdAt) {
        const date = new Date(user.createdAt);
        // Format: 1/27/2026
        document.getElementById('modalUserJoined').textContent = date.toLocaleDateString('en-US');
    } else {
        document.getElementById('modalUserJoined').textContent = 'N/A';
    }

    // 4. Orders Count (Optional: If we don't have it, keep 0 or N/A)
    // We didn't populate ordersCount, so leaving as 0 or static for now as per design
    document.getElementById('modalUserOrders').textContent = '0';

    // 5. Image
    const imgEl = document.getElementById('modalUserImage');
    // If backend sends profileImage, use it, else placeholder
    // imgEl.src = user.profileImage ? `/uploads/profiles/${user.profileImage}` : 'https://placehold.co/150/6610f2/ffffff?text=' + fullName.charAt(0).toUpperCase();
    // Using placeholder for now as seen in requirements
    imgEl.src = 'https://placehold.co/150/6610f2/ffffff?text=' + (fullName.charAt(0).toUpperCase() || 'U');

    const myModal = new bootstrap.Modal(document.getElementById('userProfileModal'));
    myModal.show();
}

async function handleAdminReturnAction(orderId, itemId, status) {
    const result = await Swal.fire({
        title: `${status} Return?`,
        text: `Are you sure you want to mark this return as ${status}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: `Yes, ${status}`,
        confirmButtonColor: status === 'Approved' ? '#28a745' : '#dc3545'
    });

    if (result.isConfirmed) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/admin/orders/${orderId}/return/${itemId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            const data = await res.json();
            if (res.ok) {
                Swal.fire("Success", data.message, "success").then(() => location.reload());
            } else {
                Swal.fire("Error", data.message, "error");
            }
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Network Error", "error");
        }
    }
}
