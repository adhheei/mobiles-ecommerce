document.addEventListener("DOMContentLoaded", () => {
  // Common sidebar logic is now handled in adminCommon.js

  const mainUploadArea = document.getElementById("mainUploadArea");
  const mainImageInput = document.getElementById("mainImageInput");
  const mainImagePreview = document.getElementById("mainImagePreview");
  const mainImageSrc = document.getElementById("mainImageSrc");
  const removeMainBtn = document.getElementById("removeMainBtn");

  const galleryUploadArea = document.getElementById("galleryUploadArea");
  const galleryInput = document.getElementById("galleryInput");
  const galleryContainer = document.getElementById("galleryContainer");

  const categorySelect = document.getElementById("categorySelect");

  // Load categories for dropdown
  async function loadCategories() {
    try {
      const res = await window.adminFetch("/api/admin/products/categories");
      const data = await res.json();

      if (data.success) {
        const select = document.getElementById("categorySelect");
        select.innerHTML = '<option value="">Select Category</option>';

        data.categories.forEach((cat) => {
          const option = document.createElement("option");
          option.value = cat._id;
          option.textContent = cat.name;
          select.appendChild(option);
        });
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }

  // Main image preview
  mainUploadArea.addEventListener("click", () => mainImageInput.click());
  mainImageInput.addEventListener("change", (e) => {
    if (e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        mainImageSrc.src = ev.target.result;
        mainImagePreview.style.display = "block";
        mainUploadArea.style.display = "none";
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });
  removeMainBtn.addEventListener("click", () => {
    mainImageInput.value = "";
    mainImagePreview.style.display = "none";
    mainUploadArea.style.display = "block";
  });

  // Gallery images
  galleryUploadArea.addEventListener("click", () => galleryInput.click());
  galleryInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const div = document.createElement("div");
          div.className = "thumbnail-item";
          div.innerHTML = `
            <img src="${ev.target.result}" alt="Gallery Image">
            <button type="button" class="remove-btn">×</button>
          `;
          galleryContainer.appendChild(div);
          div
            .querySelector(".remove-btn")
            .addEventListener("click", () => div.remove());
        };
        reader.readAsDataURL(file);
      });
    }
  });

  // Cancel button
  document.getElementById("cancelBtn").addEventListener("click", () => {
    window.location.href = "./adminProducts.html";
  });

  // Submit product
  document
    .getElementById("submitProductBtn")
    .addEventListener("click", async () => {
      const name = document.getElementById("productName").value.trim();
      const description = document
        .getElementById("productDescription")
        .value.trim();
      const sku = document.getElementById("productSku").value.trim();

      // Capture the single price field
      const price = document.getElementById("productPrice").value;

      const stock = document.getElementById("stockQuantity").value;
      const status = document.getElementById("productStatus").value;
      const visibility = document.getElementById("productVisibility").value;
      const publishDate = document.getElementById("publishDate").value;
      const brand = document.getElementById("productBrand").value.trim();
      const category = categorySelect.value;

      // Validation check
      if (!name) {
        Swal.fire("Error", "Product name is required", "error");
        return;
      }

      if (isNaN(price) || price <= 0) {
        Swal.fire("Error", "Please enter a valid positive price", "error");
        return;
      }

      if (isNaN(stock) || stock < 0 || stock === "") {
        Swal.fire("Error", "Please enter a valid stock quantity (0 or more)", "error");
        return;
      }

      if (!category) {
        Swal.fire("Error", "Please select a category", "error");
        return;
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      if (sku) formData.append("sku", sku);

      // Sync both price fields for backend compatibility
      formData.append("price", price);
      formData.append("actualPrice", price);
      formData.append("offerPrice", price);

      formData.append("stock", stock);
      formData.append("status", status);
      formData.append("visibility", visibility);
      if (publishDate) formData.append("publishDate", publishDate);
      if (brand) formData.append("brand", brand);
      formData.append("category", category);

      if (mainImageInput.files[0]) {
        formData.append("mainImage", mainImageInput.files[0]);
      }

      Array.from(galleryInput.files).forEach((file) => {
        formData.append("gallery", file);
      });

      try {
        const res = await window.adminFetch("/api/admin/products", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.success) {
          Swal.fire("Success!", "Product added successfully.", "success").then(
            () => {
              window.location.href = "./adminProducts.html";
            },
          );
        } else {
          throw new Error(data.error || "Failed to add product");
        }
      } catch (err) {
        console.error("Submit error:", err);
        Swal.fire("Error!", err.message, "error");
      }
    });

  // Initialize
  loadCategories();
});
