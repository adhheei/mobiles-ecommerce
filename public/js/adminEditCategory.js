// public/js/adminEditCategory.js
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get("id");

  if (!categoryId) {
    Swal.fire("Error", "No category ID provided!", "error").then(() => {
      window.location.href = "./adminCategories.html";
    });
    return;
  }

  // Elements
  const form = document.getElementById("editCategoryForm");
  const categoryIdInput = document.getElementById("categoryId");
  const nameInput = document.getElementById("categoryName");
  const descInput = document.getElementById("categoryDesc");
  const statusToggle = document.getElementById("statusToggle");
  const previewImage = document.getElementById("previewImage");
  const uploadContent = document.getElementById("uploadContent");
  const currentImageInfo = document.getElementById("currentImageInfo");
  const fileInput = document.getElementById("catImageInput");

  // Sidebar toggle
  const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
      overlay.classList.toggle("active");
    });
  }
  if (overlay) {
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
    });
  }

  // Load category data
  async function loadCategory() {
    try {
      const res = await fetch(`/api/categories/${categoryId}`);
      const data = await res.json();

      if (data.success) {
        const cat = data.data;
        categoryIdInput.value = cat._id;
        nameInput.value = cat.name;
        descInput.value = cat.description || "";
        statusToggle.checked = cat.isActive;

        // ✅ Show current image preview
        if (cat.image) {
          previewImage.src = cat.image; // e.g., "/uploads/categories/cat-123.jpg"
          previewImage.style.display = "inline-block";
          uploadContent.style.display = "none";
          currentImageInfo.textContent =
            "Current image shown below. Upload a new one to replace it.";
        } else {
          previewImage.style.display = "none";
          uploadContent.style.display = "block";
          currentImageInfo.textContent = "No image set.";
        }

        toggleStatusLabel();
      } else {
        throw new Error(data.error || "Failed to load category");
      }
    } catch (err) {
      Swal.fire("Error", err.message, "error").then(() => {
        window.location.href = "./adminCategories.html";
      });
    }
  }

  function toggleStatusLabel() {
    const isChecked = statusToggle.checked;
    const activeLabel = document.getElementById("activeLabel");
    const inactiveLabel = document.querySelector(".toggle-label:first-child");

    if (isChecked) {
      activeLabel.classList.add("active-text");
      inactiveLabel.classList.remove("active-text");
    } else {
      activeLabel.classList.remove("active-text");
      inactiveLabel.classList.add("active-text");
    }
  }

  // Image preview
  fileInput.addEventListener("change", (e) => {
    if (e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        previewImage.src = ev.target.result;
        previewImage.style.display = "inline-block";
        uploadContent.style.display = "none";
        currentImageInfo.textContent = "New image selected.";
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });

  // Upload area click
  document.getElementById("uploadArea").addEventListener("click", () => {
    fileInput.click();
  });

  // Status toggle
  statusToggle.addEventListener("change", toggleStatusLabel);

  // Cancel
  document.getElementById("cancelBtn").addEventListener("click", () => {
    window.location.href = "./adminCategories.html";
  });

  // Update
  document
    .getElementById("updateCategoryBtn")
    .addEventListener("click", async () => {
      const name = nameInput.value.trim();
      const description = descInput.value.trim();
      const isActive = statusToggle.checked;

      if (!name) {
        Swal.fire("Error", "Category name is required!", "error");
        return;
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("isActive", isActive);

      if (fileInput.files[0]) {
        formData.append("image", fileInput.files[0]);
      }

      try {
        Swal.fire({
          title: "Updating...",
          text: "Please wait while we save your changes.",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const res = await fetch(`/api/categories/${categoryId}`, {
          method: "PUT",
          body: formData,
        });

        const data = await res.json();

        if (data.success) {
          Swal.fire("Success", "Category updated!", "success").then(() => {
            window.location.href = "./adminCategories.html";
          });
        } else {
          throw new Error(data.error || "Update failed");
        }
      } catch (err) {
        Swal.fire("Error", err.message, "error");
      }
    });

  // Initialize
  loadCategory();
});
