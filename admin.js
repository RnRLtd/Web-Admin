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
    // Compress the image
    const compressedBlob = await compressImage(file, 0.6); // 60% quality
    const formData = new FormData();
    formData.append("file", compressedBlob);
    formData.append("upload_preset", UPLOAD_PRESET);

    const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData
    });

    const data = await cloudinaryRes.json();

    if (data.error) {
      console.error("Cloudinary error:", data.error.message);
      return alert("Image upload failed: " + data.error.message);
    }

    if (!data.secure_url) {
      console.error("Upload failed. Full response:", data);
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

// Compress image using canvas
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
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          'image/jpeg',
          quality
        );
      };
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Optional preview
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
