// userAddAddress.js

document.addEventListener("DOMContentLoaded", () => {
    // Attach event listener only if form exists
    const saveButton = document.querySelector(".btn-save");
    if (saveButton) {
        saveButton.addEventListener("click", saveAddress);
    }
});

async function saveAddress() {
    const fullName = document.getElementById("fullName").value;
    const phone = document.getElementById("phone").value;
    const street = document.getElementById("street").value;
    const city = document.getElementById("city").value;
    const state = document.getElementById("state").value;
    const pincode = document.getElementById("pincode").value;
    const country = document.getElementById("country").value;
    const addressType = document.getElementById("addressType").value;
    const isDefault = document.getElementById("isDefault").checked;

    if (!fullName || !phone || !street || !city || !state || !pincode || !country) {
        Swal.fire("Error", "Please fill all required fields", "warning");
        return;
    }

    const payload = {
        fullName,
        phone,
        street,
        city,
        state,
        pincode,
        country,
        addressType,
        isDefault
    };

    try {
        const res = await fetch("/api/addresses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            Swal.fire({
                title: "Address Saved!",
                text: "Your new address has been added successfully.",
                icon: "success",
                confirmButtonColor: "#1a1a1a",
                confirmButtonText: "OK",
            }).then(() => {
                window.location.href = "./userAddressPage.html";
            });
        } else {
            Swal.fire("Error", data.message || "Failed to save address", "error");
        }
    } catch (error) {
        console.error("Save Address Error:", error);
        Swal.fire("Error", "Server error while saving address", "error");
    }
}
