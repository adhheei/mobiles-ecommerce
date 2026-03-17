// public/js/adminAddCategory.js
document.addEventListener("DOMContentLoaded", () => {
  // Common sidebar logic is now handled in adminCommon.js

  // Upload area
  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("catImageInput");
  const previewImage = document.getElementById("previewImage");
  const uploadContent = document.getElementById("uploadContent");

  if (uploadArea && fileInput) {
    uploadArea.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
      if (e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          previewImage.src = ev.target.result;
          previewImage.style.display = "inline-block";
          uploadContent.style.display = "none";
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    });
  }

  // Status toggle
  const statusToggle = document.getElementById("statusToggle");
  const activeLabel = document.getElementById("activeLabel");
  const inactiveLabel = document.querySelector(".toggle-label:first-child");

  if (statusToggle) {
    statusToggle.addEventListener("change", () => {
      if (statusToggle.checked) {
        activeLabel.classList.add("active-text");
        inactiveLabel.classList.remove("active-text");
      } else {
        activeLabel.classList.remove("active-text");
        inactiveLabel.classList.add("active-text");
      }
    });
  }

  // Cancel button
  const cancelBtn = document.getElementById("cancelBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      window.location.href = "./adminCategories.html";
    });
  }

  // Create category
  const createBtn = document.getElementById("createCategoryBtn");
  if (createBtn) {
    createBtn.addEventListener("click", async () => {
      const name = document.getElementById("categoryName").value.trim();
      const description = document.getElementById("categoryDesc").value.trim();
      const isActive = document.getElementById("statusToggle").checked;
      const imageInput = document.getElementById("catImageInput");

      if (!name || name.trim().length < 2) {
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: "Category name must be at least 2 characters long!",
          confirmButtonColor: "#1a1a1a",
        });
        return;
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("isActive", isActive);
      if (imageInput.files[0]) {
        formData.append("image", imageInput.files[0]);
      }

      try {
        const res = await window.adminFetch("/api/admin/categories", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (data.success) {
          Swal.fire({
            icon: "success",
            title: "Category Created!",
            text: "Your new category has been saved successfully.",
            timer: 2000,
            showConfirmButton: false,
          }).then(() => {
            window.location.href = "./adminCategories.html";
          });
        } else {
          throw new Error(data.error || "Failed to create category");
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: err.message || "Something went wrong. Please try again.",
        });
      }
    });
  }
});