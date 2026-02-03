document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (!orderId) {
        Swal.fire('Error', 'No Order ID provided', 'error');
        return;
    }

    try {
        const res = await fetch(`/api/admin/orders/${orderId}`);
        const data = await res.json();

        if (!data.success) {
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
    statusSelect.value = order.orderStatus.toLowerCase(); // match with options value

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
        itemsHtml += `
            <div class="item-row">
              <img src="${item.image || 'https://placehold.co/100'}" class="item-img" alt="${item.name}" />
              <div class="item-details">
                <h6>${item.name}</h6>
                <span class="item-meta">Qty: ${item.quantity} | Status: ${item.status}</span>
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
    customerCard.querySelector('.admin-avatar').textContent = order.userId.firstName.charAt(0);
    customerCard.querySelector('h6').textContent = `${order.userId.firstName} ${order.userId.lastName}`;
    customerCard.querySelector('.info-group .info-value:nth-child(2)').textContent = order.userId.email;
    customerCard.querySelector('.info-group .info-value:nth-child(3)').textContent = order.userId.mobile || 'N/A';

    // 6. Shipping Address
    const shippingCard = document.querySelectorAll('.col-lg-4 .card-custom')[1];
    const addr = order.shippingAddress;
    shippingCard.querySelector('.info-group').innerHTML = `
        <div class="info-value">${addr.fullName}</div>
        <div class="info-sub">${addr.streetAddress}, ${addr.city}</div>
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
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: statusEnum })
                });
                const data = await res.json();
                if (data.success) {
                    Swal.fire("Updated!", "Order status updated.", "success")
                        .then(() => location.reload());
                } else {
                    throw new Error(data.message);
                }
            } catch (e) {
                console.error(e);
                Swal.fire("Error", e.message, "error");
            }
        }
    });
}
