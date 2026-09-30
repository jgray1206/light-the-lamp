// Profile pics are shown at most ~150px wide, so shrink uploads to a small JPEG in the browser.
// This keeps uploads well under the server's 1MB limit, whatever size photo someone picks.
const MAX_DIMENSION = 512;
const JPEG_QUALITY = 0.85;
// If a photo can't be processed at all, it can still be sent as-is when it's under the server limit
const MAX_UPLOAD_BYTES = 900 * 1024;

// Load via onload rather than img.decode(): iOS Safari's decode() rejects some photos it can display fine.
// Browsers apply the photo's EXIF rotation when drawing an <img>, so portraits stay upright.
function loadWithImg(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ source: img, width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("img failed to load"));
        };
        img.src = url;
    });
}

async function loadWithBitmap(file) {
    if (typeof createImageBitmap !== "function") throw new Error("createImageBitmap unsupported");
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return { source: bitmap, width: bitmap.width, height: bitmap.height };
}

async function loadImage(file) {
    const errors = [];
    for (const load of [loadWithImg, loadWithBitmap]) {
        try {
            const image = await load(file);
            if (image.width > 0 && image.height > 0) return image;
            errors.push(`${load.name}: empty image`);
        } catch (err) {
            errors.push(`${load.name}: ${err?.message ?? err}`);
        }
    }
    throw new Error(errors.join("; "));
}

export async function resizeImage(file) {
    let image;
    try {
        image = await loadImage(file);
    } catch (err) {
        console.warn("Couldn't read image", file.type, file.size, err);
        if (file.type.startsWith("image/") && file.size <= MAX_UPLOAD_BYTES) return file;
        throw new Error(`Couldn't read that image. Try a JPEG or PNG. (${file.type || "unknown type"}: ${err.message})`);
    }

    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; // JPEG has no transparency
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image.source, 0, 0, canvas.width, canvas.height);
    image.source.close?.(); // free the ImageBitmap's memory

    const blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process that image."))), "image/jpeg", JPEG_QUALITY)
    );
    return new File([blob], "profile.jpg", { type: "image/jpeg" });
}
