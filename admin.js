const firebaseConfig = {
  apiKey: "AIzaSyAwqSchQXSj-9q3PCOY0o8vrq7tKMuCYAs",
  authDomain: "r-n-r-38dc8.firebaseapp.com",
  projectId: "r-n-r-38dc8",
  storageBucket: "r-n-r-38dc8.appspot.com",
  messagingSenderId: "425320845657",
  appId: "1:425320845657:web:8746d14fa263f924953c48",
  measurementId: "G-N42FBSYVHF"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const CLOUD_NAME = 'dlpriivm2';
const UPLOAD_PRESET = 'web_preset';

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const price = parseFloat(document.getElementById("price").value);
  const description = document.getElementById("description").value.trim();
  const category = document.getElementById("category").value;
  const file = document.getElementById("imageInput").files[0];

  if (!name || isNaN(price) || !category || !file) {
    alert("Please fill all required fields and choose an image.");
    return;
  }

  try {
    const compressedBlob = await compressImage(file, 0.6);
    const formData = new FormData();
    formData.append("file", compressedBlob);
    formData.append("upload_preset", UPLOAD_PRESET);

    const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData
    });

    const data = await cloudinaryRes.json();

    if (data.error || !data.secure_url) {
      return alert("Image upload failed. Please try again.");
    }

    await db.collection("shopItems").add({
      name,
      price,
      description,
      category,
      imageUrl: data.secure_url,
      publicId: data.public_id,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("Item uploaded successfully!");
    e.target.reset();
    document.getElementById("preview").innerHTML = "";

  } catch (err) {
    console.error("Upload failed:", err);
    alert("Something went wrong. Please try again.");
  }
});

async function compressImage(file, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 1024;
        const scaleSize = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
      };
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.getElementById("imageInput").addEventListener("change", function () {
  const file = this.files[0];
  const preview = document.getElementById("preview");
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.innerHTML = `<img src="${e.target.result}" width="150" style="margin-top:10px;border-radius:8px;" />`;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = "";
  }
});

const productList = document.getElementById("productList");
const searchInput = document.getElementById("searchInput");

db.collection("shopItems").orderBy("createdAt", "desc").onSnapshot(snapshot => {
  renderProducts(snapshot.docs);
});

function renderProducts(docs) {
  productList.innerHTML = "";
  const searchValue = searchInput.value.toLowerCase();

  docs.forEach(doc => {
    const item = doc.data();
    const id = doc.id;

    if (
      item.name.toLowerCase().includes(searchValue) ||
      (item.category && item.category.toLowerCase().includes(searchValue))
    ) {
      const div = document.createElement("div");
      div.className = "product-card";
      div.innerHTML = `
        <strong>Name:</strong> <span contenteditable="true" data-field="name">${item.name}</span><br>
        <strong>Price:</strong> ₹<span contenteditable="true" data-field="price">${item.price}</span><br>
        <strong>Category:</strong> <span contenteditable="true" data-field="category">${item.category}</span><br>
        <strong>Description:</strong> <span contenteditable="true" data-field="description">${item.description || ""}</span><br>
        <img src="${item.imageUrl}" /><br>
        <button onclick="updateItem('${id}', this)">Update</button>
        <button onclick="deleteItem('${id}')">Delete</button>
      `;
      productList.appendChild(div);
    }
  });
}

async function deleteItem(id) {
  if (confirm("Are you sure you want to delete this item?")) {
    try {
      await db.collection("shopItems").doc(id).delete();
      alert("Item deleted successfully.");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete item.");
    }
  }
}

async function updateItem(id, btn) {
  const card = btn.parentElement;
  const updatedData = {};
  const fields = card.querySelectorAll("[contenteditable]");

  fields.forEach(field => {
    const key = field.dataset.field;
    let value = field.innerText.trim();
    if (key === "price") value = parseFloat(value);
    updatedData[key] = value;
  });

  try {
    await db.collection("shopItems").doc(id).update(updatedData);
    alert("Item updated successfully.");
  } catch (err) {
    console.error("Update failed:", err);
    alert("Failed to update item.");
  }
}

searchInput.addEventListener("input", async () => {
  const snapshot = await db.collection("shopItems").orderBy("createdAt", "desc").get();
  renderProducts(snapshot.docs);
});
