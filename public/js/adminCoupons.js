// Section 3: Coupon Page Script

document.addEventListener('DOMContentLoaded', () => {
    // Placeholders
    const API_BASE_URL = '/api/admin/coupons'; // Adjust if needed

    const couponForm = document.getElementById('couponForm'); // Should match your HTML form ID

    if (couponForm) {
        couponForm.addEventListener('submit', handleCouponSubmit);
    }

    async function handleCouponSubmit(e) {
        e.preventDefault();

        // 1. Extract Values
        const code = document.getElementById('couponCode').value.trim();
        const discountType = document.getElementById('discountType').value;
        const value = parseFloat(document.getElementById('couponValue').value);
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const minPurchase = parseFloat(document.getElementById('minPurchase').value) || 0;
        const maxDiscount = parseFloat(document.getElementById('maxDiscount').value) || null;
        const totalLimit = parseInt(document.getElementById('totalLimit').value) || null;
        const perUserLimit = parseInt(document.getElementById('perUserLimit').value) || 1;

        // 2. Client-side Validation (INR references implied in logic)

        // Empty check
        if (!code || !discountType || isNaN(value) || !endDate) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Fields',
                text: 'Please fill in all required fields (Code, Type, Value, End Date).'
            });
            return;
        }

        // Value check
        if (value <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Value',
                text: 'Discount value must be greater than 0.'
            });
            return;
        }

        // Percentage check
        if (discountType === 'percentage' && value > 100) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Percentage',
                text: 'Percentage cannot exceed 100%.'
            });
            return;
        }

        // Date check
        if (startDate && endDate) {
            if (new Date(endDate) <= new Date(startDate)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Date Range',
                    text: 'End date must be after start date.'
                });
                return;
            }
        }

        // Construct Payload
        const payload = {
            code,
            discountType,
            value,
            startDate,
            endDate,
            minPurchase, // INR
            maxDiscount, // INR
            totalLimit,
            perUserLimit
        };

        try {
            // 3. API Call
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': 'Bearer ' + token // Placeholder for auth token if needed
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                // Success
                Swal.fire({
                    icon: 'success',
                    title: 'Coupon Created!',
                    text: `Coupon ${data.data.code} has been created successfully.`,
                    confirmButtonColor: '#3085d6',
                }).then(() => {
                    // Reset form or redirect
                    couponForm.reset();
                    // Optional: reload list
                    // loadCoupons();
                });
            } else {
                // Server Validation Error (e.g., 400 Bad Request, 409 Conflict)
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.message || 'Failed to create coupon.'
                });
            }

        } catch (error) {
            console.error('Network Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Network Error',
                text: 'Something went wrong. Please try again later.'
            });
        }
    }
});
