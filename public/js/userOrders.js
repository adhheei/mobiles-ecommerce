document.addEventListener("DOMContentLoaded", async () => {
    const ordersContainer = document.getElementById("orders-container");
    const token = localStorage.getItem("token");

    // Cookie fallback
    // if (!token) { window.location.href = "userLogin.html"; return; }

    try {
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch("/api/orders", { headers });

        const data = await res.json();

        if (res.ok && data.success) {
            if (data.orders.length === 0) {
                ordersContainer.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fa-solid fa-box-open fa-3x text-muted mb-3"></i>
                        <h5>No Orders Found</h5>
                        <p class="text-muted">Looks like you haven't placed any orders yet.</p>
                        <a href="index.html" class="btn btn-dark mt-3">Start Shopping</a>
                    </div>
                `;
                return;
            }

            const ordersHtml = data.orders.map(order => {
                const date = new Date(order.date).toLocaleDateString("en-US", {
                    year: 'numeric', month: 'short', day: 'numeric'
                });

                // Status Badge Color
                let badgeClass = "bg-secondary";
                if (order.status === 'Delivered') badgeClass = "bg-success";
                else if (order.status === 'Cancelled') badgeClass = "bg-danger";
                else if (order.status === 'Shipped') badgeClass = "bg-primary";
                else if (order.status === 'Processing') badgeClass = "bg-info text-dark";

                return `
                <div class="card mb-3 border-0 shadow-sm order-card" onclick="window.location.href='userOrderDetails.html?id=${order._id}'" style="cursor: pointer; transition: transform 0.2s;">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="fw-bold mb-0">Order #${order.orderId}</h6>
                            <span class="badge ${badgeClass}">${order.status}</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center text-muted small">
                            <span>Date: ${date}</span>
                            <span>Items: ${order.itemsCount}</span>
                        </div>
                        <hr class="my-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="fw-bold">Total: ₹${parseFloat(order.totalAmount).toLocaleString()}</span>
                            <span class="text-primary small fw-bold">View Details <i class="fa-solid fa-chevron-right ms-1"></i></span>
                        </div>
                    </div>
                </div>
                `;
            }).join('');

            ordersContainer.innerHTML = ordersHtml;
        } else {
            ordersContainer.innerHTML = `<div class="alert alert-danger">Failed to load orders: ${data.message}</div>`;
        }

    } catch (error) {
        console.error("Error fetching orders:", error);
        ordersContainer.innerHTML = `<div class="alert alert-danger">An error occurred while loading orders.</div>`;
    }
});
