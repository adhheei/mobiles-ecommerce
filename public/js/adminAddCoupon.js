document.addEventListener('DOMContentLoaded', () => {
    // Set default dates
    const today = new Date().toISOString().split("T")[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split("T")[0];

    document.getElementById("startDate").value = today;
    document.getElementById("endDate").value = nextMonthStr;

    // Attach event listeners
    document.querySelector('.btn-submit').addEventListener('click', createCoupon);
});

function generateCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById("couponCode").value = code;
}

async function createCoupon() {
    // 1. Extract Values
    const code = document.getElementById("couponCode").value.toUpperCase();
    const discountType = document.getElementById("discountType").value;
    const value = parseFloat(document.getElementById("discountValue").value);
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    // Conditions & Limits
    const minPurchase = parseFloat(document.getElementById("minPurchase").value) || 0;
    const maxDiscount = parseFloat(document.getElementById("maxDiscount").value) || null; // null if empty/0
    const totalLimit = parseInt(document.getElementById("usageLimit").value) || null;
    const perUserLimit = parseInt(document.getElementById("limitPerUser").value) || 1;

    // 2. Client-side Validation
    if (!code || !value || !endDate) {
        return Swal.fire({
            icon: "error",
            title: "Missing Information",
            text: "Please fill in Coupon Code, Value, and End Date.",
            confirmButtonColor: "#1a1a1a",
        });
    }

    if (value <= 0) {
        return Swal.fire({
            icon: 'error',
            title: 'Invalid Value',
            text: 'Discount value must be greater than 0.'
        });
    }

    if (discountType === 'percentage' && value > 100) {
        return Swal.fire({
            icon: 'error',
            title: 'Invalid Percentage',
            text: 'Percentage cannot exceed 100%.'
        });
    }

    if (new Date(endDate) <= new Date(startDate)) {
        return Swal.fire({
            icon: 'error',
            title: 'Invalid Dates',
            text: 'End date must be after start date.'
        });
    }

    // 3. API Call
    try {
        const payload = {
            code,
            discountType,
            value,
            startDate,
            endDate,
            minPurchase,
            maxDiscount,
            totalLimit,
            perUserLimit
        };

        const response = await fetch('/api/admin/coupons', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            Swal.fire({
                title: "Success!",
                text: "Coupon created successfully.",
                icon: "success",
                confirmButtonColor: "#1a1a1a",
                confirmButtonText: "Go to Coupon List",
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = "./adminCoupons.html";
                }
            });
        } else {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: data.message || "Failed to create coupon",
                confirmButtonColor: "#1a1a1a",
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: "error",
            title: "Network Error",
            text: "Something went wrong. Please try again later.",
            confirmButtonColor: "#1a1a1a",
        });
    }
}
