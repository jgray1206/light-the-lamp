// Profile pics are shown at most ~150px wide, so shrink uploads to a small JPEG in the browser.
// This keeps uploads well under the server's 1MB limit, whatever size photo someone picks.
const MAX_DIMENSION = 512;
const JPEG_QUALITY = 0.85;

export async function resizeImage(file) {
    const url = URL.createObjectURL(file);
    try {
        const img = new Image();
        img.src = url;
        try {
            await img.decode();
        } catch {
            throw new Error("Couldn't read that image. Try a JPEG or PNG.");
        }

        // Browsers apply the photo's EXIF rotation when drawing, so portraits stay upright
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff"; // JPEG has no transparency
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise((resolve, reject) =>
            canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process that image."))), "image/jpeg", JPEG_QUALITY)
        );
        return new File([blob], "profile.jpg", { type: "image/jpeg" });
    } finally {
        URL.revokeObjectURL(url);
    }
}
