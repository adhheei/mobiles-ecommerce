document.addEventListener("DOMContentLoaded", async () => {
    const firstNameEl = document.getElementById("firstName");
    const lastNameEl = document.getElementById("lastName");
    const emailEl = document.getElementById("email");
    const mobileEl = document.getElementById("mobile");

    // Function to fetch user profile
    const fetchProfile = async () => {
        try {
            // Check for token (handled by authGuard but double check doesn't hurt)
            // The authGuard.js usually ensures we're logged in before this script runs

            const response = await fetch("/api/user/profile", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    // 'Authorization': 'Bearer ' + token // If storing in localStorage
                },
            });

            if (response.status === 401) {
                // Unauthorized - redirect to login
                window.location.href = "/User/userLogin.html";
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to fetch profile");
            }

            const data = await response.json();

            if (data.success) {
                // Populate fields
                firstNameEl.innerText = data.user.firstName || "";
                lastNameEl.innerText = data.user.lastName || "";
                emailEl.innerText = data.user.email || "";
                mobileEl.innerText = data.user.phone || ""; // Mapping phone -> mobile

                // Update profile image if exists
                if (data.user.profileImage) {
                    let imgSrc = data.user.profileImage;

                    // Normalize relative paths
                    if (!imgSrc.startsWith('http') && !imgSrc.startsWith('/')) {
                        imgSrc = '/' + imgSrc;
                    }

                    // Append cache buster to prevent stale image on reload
                    // only for local images that might have changed
                    if (!imgSrc.startsWith('http')) {
                        const timestamp = new Date().getTime();
                        imgSrc += `?t=${timestamp}`;
                    }

                    document.getElementById("profileImage").src = imgSrc;
                }
            } else {
                console.error("Failed to load profile:", data.message);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            // Optionally show an error message on UI
        }
    };

    fetchProfile();

    // Expose toggleEdit to global scope so HTML onclick can access it
    window.toggleEdit = async (elementId, btn) => {
        const textElement = document.getElementById(elementId);
        // Don't edit email if not supported by backend yet, or handle specifically
        if (elementId === 'email') {
            alert("Email update is not currently supported.");
            return;
        }

        if (btn.innerText === "Edit") {
            // Switch to Edit Mode
            const currentValue = textElement.innerText;
            const input = document.createElement("input");
            input.type = "text";
            input.value = currentValue;
            input.className = "form-control form-control-sm";
            input.style.maxWidth = "300px";

            textElement.innerHTML = "";
            textElement.appendChild(input);
            input.focus();

            btn.innerText = "Save";
            btn.classList.add("text-success");
        } else {
            // Switch to View Mode (Save)
            const input = textElement.querySelector("input");
            const newValue = input.value.trim();

            if (!newValue) {
                alert("Field cannot be empty");
                return;
            }

            // Optimistic UI update (or wait for API) - let's wait for API
            try {
                // Show Loading
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

                const fieldMap = {
                    'firstName': 'firstName',
                    'lastName': 'lastName',
                    'mobile': 'phone'
                };
                const payload = {};
                payload[fieldMap[elementId]] = newValue;

                const response = await fetch("/api/user/profile", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (data.success) {
                    window.location.reload();
                } else {
                    alert(data.message || "Update failed");
                    btn.innerText = "Save"; // Reset button text on error
                }
            } catch (err) {
                console.error("Update error:", err);
                alert("Failed to update profile");
                btn.innerText = "Save"; // Reset button text on error
            } finally {
                // Remove Loading State
                btn.disabled = false;
            }
        }
    };

    // ==========================================
    // Profile Picture Upload & Cropping Logic
    // ==========================================
    const avatarInput = document.getElementById('avatarInput');
    const imageToCrop = document.getElementById('imageToCrop');
    const cropModalElement = document.getElementById('cropModal');
    const cropAndSaveBtn = document.getElementById('cropAndSave');
    const profileImage = document.getElementById('profileImage');
    let cropper = null;

    // 1. Handle File Selection
    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    imageToCrop.src = event.target.result;
                    // Show Modal
                    const cropModal = new bootstrap.Modal(cropModalElement);
                    cropModal.show();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // 2. Initialize Cropper when Modal opens
    if (cropModalElement) {
        cropModalElement.addEventListener('shown.bs.modal', () => {
            cropper = new Cropper(imageToCrop, {
                aspectRatio: 1, // Square
                viewMode: 1,    // Restrict crop box to image size
                dragMode: 'move', // Move image logic
                autoCropArea: 1,
                responsive: true,
            });
        });

        // 3. Destroy Cropper when Modal closes
        cropModalElement.addEventListener('hidden.bs.modal', () => {
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
            avatarInput.value = ''; // Reset input
        });
    }

    // 4. Handle "Crop & Save"
    if (cropAndSaveBtn) {
        cropAndSaveBtn.addEventListener('click', () => {
            if (!cropper) return;

            // Show Loading State
            const originalText = cropAndSaveBtn.innerText;
            cropAndSaveBtn.disabled = true;
            cropAndSaveBtn.innerText = 'Uploading...';

            // Get cropped canvas
            const canvas = cropper.getCroppedCanvas({
                width: 300,
                height: 300, // Optimize size
            });

            // Convert to Blob and Upload
            canvas.toBlob(async (blob) => {
                const formData = new FormData();
                formData.append('image', blob, 'avatar.jpg');

                try {
                    const response = await fetch('/api/user/avatar', {
                        method: 'PUT',
                        body: formData // No Content-Type header needed (browser sets boundary)
                    });

                    if (response.status === 401) {
                        window.location.href = "/User/userLogin.html";
                        return;
                    }

                    const data = await response.json();

                    if (data.success) {
                        // Close Modal first to avoid UI glitch
                        const modalInstance = bootstrap.Modal.getInstance(cropModalElement);
                        modalInstance.hide();

                        // Update Profile Image immediately with Cache Busting
                        // Ensure path starts with / if relative
                        let newSrc = data.imagePath;
                        if (!newSrc.startsWith('http') && !newSrc.startsWith('/')) {
                            newSrc = '/' + newSrc;
                        }

                        // Append robust unique timestamp
                        const timestamp = new Date().getTime();
                        if (!newSrc.includes('?')) {
                            newSrc += `?t=${timestamp}`;
                        } else {
                            newSrc += `&t=${timestamp}`;
                        }

                        // Force DOM update
                        profileImage.src = newSrc;

                    } else {
                        alert(data.message || 'Upload failed');
                    }
                } catch (error) {
                    console.error('Upload error:', error);
                    alert('An error occurred during upload.');
                } finally {
                    cropAndSaveBtn.disabled = false;
                    cropAndSaveBtn.innerText = originalText;
                }
            }, 'image/jpeg', 0.8); // 80% quality JPEG
        });
    }
});
