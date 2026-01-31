// userEditAddress.js

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const addressId = urlParams.get("id");

    if (!addressId) {
        Swal.fire("Error", "No address specified", "error").then(() => {
            window.location.href = "./userAddressPage.html";
        });
        return;
    }

    // Populate Fields
    try {
        const res = await fetch(`/api/addresses/${addressId}`);
        const data = await res.json();

        if (res.ok) {
            const addr = data.address;
            document.getElementById("fullName").value = addr.fullName;
            document.getElementById("phone").value = addr.phone;
            document.getElementById("street").value = addr.street;
            document.getElementById("city").value = addr.city;
            document.getElementById("state").value = addr.state;
            document.getElementById("pincode").value = addr.pincode;
            document.getElementById("country").value = addr.country;
            document.getElementById("addressType").value = addr.addressType;
            document.getElementById("isDefault").checked = addr.isDefault;
        } else {
            Swal.fire("Error", "Failed to fetch address details", "error");
        }
    } catch (err) {
        console.error(err);
        Swal.fire("Error", "Server error loading address", "error");
    }

    // Handle Form Submit
    document.getElementById("editAddressForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = {
            fullName: document.getElementById("fullName").value,
            phone: document.getElementById("phone").value,
            street: document.getElementById("street").value,
            city: document.getElementById("city").value,
            state: document.getElementById("state").value,
            pincode: document.getElementById("pincode").value,
            country: document.getElementById("country").value,
            addressType: document.getElementById("addressType").value,
            isDefault: document.getElementById("isDefault").checked
        };

        try {
            const res = await fetch(`/api/addresses/${addressId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                Swal.fire("Success", "Address updated successfully", "success").then(() => {
                    window.location.href = "./userAddressPage.html";
                });
            } else {
                Swal.fire("Error", data.message || "Failed to update address", "error");
            }
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Server error updating address", "error");
        }
    });

    // Handle Delete
    document.getElementById("deleteBtn").addEventListener("click", () => {
        Swal.fire({
            title: 'Delete Address?',
            text: "Are you sure you want to delete this address?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#1a1a1a',
            cancelButtonColor: '#dc3545',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`/api/addresses/${addressId}`, {
                        method: "DELETE"
                    });

                    if (res.ok) {
                        Swal.fire("Deleted!", "Address has been deleted.", "success").then(() => {
                            window.location.href = "./userAddressPage.html";
                        });
                    } else {
                        Swal.fire("Error", "Failed to delete address", "error");
                    }
                } catch (err) {
                    console.error(err);
                    Swal.fire("Error", "Server error", "error");
                }
            }
        });
    });
});
