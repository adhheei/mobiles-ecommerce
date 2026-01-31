// userAddress.js

document.addEventListener("DOMContentLoaded", async () => {
    const addressList = document.getElementById("address-list");
    const emptyState = document.getElementById("emptyState");

    // Fetch and Render Addresses
    const fetchAddresses = async () => {
        try {
            const res = await fetch("/api/addresses", {
                headers: {
                    "Content-Type": "application/json"
                    // Credentials are handled by cookie (include logic in authGuard or fetch wrapper if needed, but standard fetch sends cookies to same origin)
                }
            });

            if (!res.ok) throw new Error("Failed to fetch addresses");

            const data = await res.json();
            const addresses = data.addresses;

            renderAddresses(addresses);
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Could not load addresses", "error");
        }
    };

    const renderAddresses = (addresses) => {
        addressList.innerHTML = "";

        if (!addresses || addresses.length === 0) {
            emptyState.classList.remove("d-none");
            return;
        }

        emptyState.classList.add("d-none");

        addresses.forEach(addr => {
            const card = document.createElement("div");
            card.className = "address-card";
            if (addr.isDefault) card.classList.add("border-dark"); // Highlight default

            const defaultBtn = addr.isDefault
                ? `<button class="btn-set-default bg-secondary" disabled>Default</button>`
                : `<button class="btn-set-default" onclick="setDefault('${addr._id}')">Set as Default</button>`;

            card.innerHTML = `
                <div class="address-details">
                    <div class="address-label">
                        ${addr.addressType} ${addr.isDefault ? '<span class="badge bg-dark ms-2" style="font-size:0.6rem">Default</span>' : ''}
                    </div>
                    <p class="address-text">
                        <strong>${addr.fullName}</strong><br>
                        ${addr.phone}<br>
                        ${addr.street}<br>
                        ${addr.city}, ${addr.state} ${addr.pincode}<br>
                        ${addr.country}
                    </p>
                </div>
                <div class="action-column">
                    <div class="top-actions">
                        <a href="./userEditAddress.html?id=${addr._id}" class="action-item" style="text-decoration: none;">
                            <i class="fa-regular fa-pen-to-square"></i> Edit
                        </a>
                        <span class="action-item delete" onclick="deleteAddress('${addr._id}')">
                            <i class="fa-regular fa-trash-can"></i> Delete
                        </span>
                    </div>
                    ${defaultBtn}
                </div>
            `;
            addressList.appendChild(card);
        });
    };

    // Make functions global for inline onclick handlers
    window.deleteAddress = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Address?',
            text: "Are you sure you want to delete this address?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#1a1a1a',
            cancelButtonColor: '#dc3545',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/addresses/${id}`, {
                    method: "DELETE"
                });

                if (res.ok) {
                    Swal.fire("Deleted!", "Address has been deleted.", "success");
                    fetchAddresses();
                } else {
                    Swal.fire("Error", "Failed to delete address", "error");
                }
            } catch (err) {
                console.error(err);
                Swal.fire("Error", "Server error", "error");
            }
        }
    };

    window.setDefault = async (id) => {
        try {
            const res = await fetch(`/api/addresses/${id}/default`, {
                method: "PATCH"
            });

            if (res.ok) {
                // Swal.fire("Success", "Default address updated", "success");
                fetchAddresses(); // Reload to update UI
            } else {
                Swal.fire("Error", "Failed to update default address", "error");
            }
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Server error", "error");
        }
    };

    // Initial Fetch
    fetchAddresses();
});
