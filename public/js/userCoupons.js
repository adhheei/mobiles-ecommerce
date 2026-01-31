document.addEventListener("DOMContentLoaded", () => {
    fetchUserCoupons();
});

async function fetchUserCoupons() {
    try {
        const res = await fetch("/api/user/coupons", {
            headers: {
                'Cache-Control': 'no-cache'
            }
        });

        if (res.status === 401) {
            // Optional: check if authGuard handles this already
            window.location.href = "/User/userLogin.html";
            return;
        }

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to load coupons");
        }

        renderCoupons(data.data || []);

    } catch (err) {
        console.error(err);
        // Silent error or small toast, don't block UI
    }
}

function renderCoupons(coupons) {
    const activeContainer = document.getElementById("active-coupons");
    const usedContainer = document.getElementById("used-coupons");

    activeContainer.innerHTML = "";
    usedContainer.innerHTML = "";

    let hasActive = false;
    let hasUsed = false;

    coupons.forEach(coupon => {
        // Backend now returns isUsed and isExpired logic
        // But double check expiry here just in case logic matches
        const isExpired = new Date(coupon.endDate) < new Date();
        const isUsed = coupon.isUsed; // Set by backend

        // Logic:
        // Active Tab: Not Expired AND Not Used
        // Used/Expired Tab: Expired OR Used

        const showInUsedParams = isExpired || isUsed;

        const valueText =
            coupon.discountType === "percentage"
                ? `${coupon.value}%`
                : `₹${coupon.value}`;

        const card = `
        <div class="coupon-card ${showInUsedParams ? "used" : ""}">
            <div class="coupon-left">
                <span class="coupon-value">${valueText}</span>
                <span class="coupon-type">
                    ${coupon.discountType === "percentage" ? "OFF" : "FLAT"}
                </span>
            </div>

            <div class="coupon-middle">
                <div class="coupon-title">${coupon.code}</div>
                <div class="coupon-desc">${coupon.description || "Special offer"}</div>
                <div class="coupon-expiry">
                    <i class="fa-regular fa-clock me-1"></i>
                    ${showInUsedParams
                ? (isUsed ? "Redeemed" : "Expired: " + new Date(coupon.endDate).toDateString())
                : `Expires: ${new Date(coupon.endDate).toDateString()}`
            }
                </div>
            </div>

            <div class="coupon-right">
                ${showInUsedParams
                ? `<span class="badge-used">${isUsed ? "REDEEMED" : "EXPIRED"}</span>`
                : `<button class="btn-copy" onclick="copyCoupon('${coupon.code}')">Copy Code</button>`
            }
            </div>
        </div>
        `;

        if (showInUsedParams) {
            hasUsed = true;
            usedContainer.innerHTML += card;
        } else {
            hasActive = true;
            activeContainer.innerHTML += card;
        }
    });

    if (!hasActive) {
        activeContainer.innerHTML =
            `<div class="text-center py-5">
                <i class="fa-solid fa-ticket fa-3x text-muted mb-3"></i>
                <p class="text-muted fw-medium">No available coupons at the moment.</p>
            </div>`;
    }

    if (!hasUsed) {
        usedContainer.innerHTML =
            `<div class="text-center py-5">
                <p class="text-muted">No used or expired coupons.</p>
            </div>`;
    }
}

function copyCoupon(code) {
    if (!navigator.clipboard) {
        // Fallback for http
        const textArea = document.createElement("textarea");
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            Swal.fire({
                icon: "success",
                title: "Copied!",
                text: `Coupon code ${code} copied`,
                timer: 1500,
                showConfirmButton: false,
                width: 300,
            });
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
        document.body.removeChild(textArea);
        return;
    }

    navigator.clipboard.writeText(code).then(() => {
        Swal.fire({
            icon: "success",
            title: "Copied!",
            text: `Coupon code ${code} copied`,
            timer: 1500,
            showConfirmButton: false,
            width: 300,
        });
    });
}

function switchTab(tabName) {
    const activeTabBtn = document.querySelector('.tab-btn[onclick="switchTab(\'active\')"]');
    const usedTabBtn = document.querySelector('.tab-btn[onclick="switchTab(\'used\')"]');
    const activeContent = document.getElementById('active-coupons');
    const usedContent = document.getElementById('used-coupons');

    if (tabName === 'active') {
        activeTabBtn.classList.add('active');
        usedTabBtn.classList.remove('active');
        activeContent.classList.remove('d-none');
        usedContent.classList.add('d-none');
    } else {
        activeTabBtn.classList.remove('active');
        usedTabBtn.classList.add('active');
        activeContent.classList.add('d-none');
        usedContent.classList.remove('d-none');
    }
}
