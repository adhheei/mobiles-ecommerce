document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const couponId = urlParams.get('id');

    if (!couponId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No coupon ID provided',
        }).then(() => {
            window.location.href = './adminCoupons.html';
        });
        return;
    }

    fetchCouponDetails(couponId);

    // Attach event listeners
    document.querySelector('.btn-submit').addEventListener('click', () => updateCoupon(couponId));
});

async function fetchCouponDetails(id) {
    try {
        const response = await fetch(`/api/admin/coupons/${id}`);
        const data = await response.json();

        if (response.ok && data.success) {
            const coupon = data.data;

            // Populate Form
            document.getElementById('couponCode').value = coupon.code;
            document.getElementById('discountType').value = coupon.discountType;
            document.getElementById('discountValue').value = coupon.value;

            // Format Dates (YYYY-MM-DD)
            document.getElementById('startDate').value = new Date(coupon.startDate).toISOString().split('T')[0];
            document.getElementById('endDate').value = new Date(coupon.endDate).toISOString().split('T')[0];

            // Optional Fields
            document.getElementById('minPurchase').value = coupon.minPurchase || 0;
            document.getElementById('maxDiscount').value = coupon.maxDiscount || '';
            document.getElementById('usageLimit').value = coupon.totalLimit || '';
            document.getElementById('limitPerUser').value = coupon.perUserLimit || 1;

        } else {
            Swal.fire('Error', 'Failed to fetch coupon details', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'Network error', 'error');
    }
}

function generateCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById("couponCode").value = code;
}

async function updateCoupon(id) {
    const code = document.getElementById("couponCode").value.toUpperCase();
    const discountType = document.getElementById("discountType").value;
    const value = parseFloat(document.getElementById("discountValue").value);
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    // Conditions & Limits
    const minPurchase = parseFloat(document.getElementById("minPurchase").value) || 0;
    const maxDiscountVal = document.getElementById("maxDiscount").value;
    const maxDiscount = maxDiscountVal ? parseFloat(maxDiscountVal) : null;

    const usageLimitVal = document.getElementById("usageLimit").value;
    const totalLimit = usageLimitVal ? parseInt(usageLimitVal) : null;

    const perUserLimit = parseInt(document.getElementById("limitPerUser").value) || 1;

    // Validation
    if (!code || !value || !endDate) {
        return Swal.fire({
            icon: "error",
            title: "Missing Information",
            text: "Please fill in Coupon Code, Value, and End Date.",
            confirmButtonColor: "#1a1a1a",
        });
    }

    if (new Date(endDate) <= new Date(startDate)) {
        return Swal.fire({
            icon: 'error',
            title: 'Invalid Dates',
            text: 'End date must be after start date.'
        });
    }

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

        const response = await fetch(`/api/admin/coupons/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            Swal.fire({
                title: "Updated!",
                text: "Coupon updated successfully.",
                icon: "success",
                confirmButtonColor: "#1a1a1a",
                confirmButtonText: "Go to Coupon List",
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = "./adminCoupons.html";
                }
            });
        } else {
            if (response.status === 409) {
                Swal.fire('Error', data.message || 'Coupon code already exists', 'warning');
            } else {
                Swal.fire('Error', data.message || 'Failed to update coupon', 'error');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'Network error', 'error');
    }
}

async function deleteCoupon(id) {
    // Assuming id is passed or available from URL context if this button is present on edit page
    // If the button calls deleteCoupon() without args, we need to get ID from URL
    if (!id) {
        const urlParams = new URLSearchParams(window.location.search);
        id = urlParams.get('id');
    }

    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#1a1a1a',
        confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    Swal.fire('Deleted!', 'Coupon has been deleted.', 'success').then(() => {
                        window.location.href = "./adminCoupons.html";
                    });
                } else {
                    Swal.fire('Error', 'Failed to delete coupon', 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'Network error', 'error');
            }
        }
    });
}
