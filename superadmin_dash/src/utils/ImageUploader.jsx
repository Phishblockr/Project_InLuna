import React, { useState } from "react";
import { toast } from "sonner";

const ImageUploader = ({ onUploadSuccess }) => {

    const apiUrl = import.meta.env.VITE_API_URL;

    const [file, setFile] = useState(null);
    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file to upload.");
            return;
        }

        const formData = new FormData();
        formData.append("image", file);

        try {
            const res = await fetch(`${apiUrl}/upload/upload-image`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                onUploadSuccess(data.imageUrl);
                toast.success("Image uploaded successfully");
            } else {
                toast.error(data.message || "Error uploading image");
            }
        } catch (error) {
            toast.error("Erro uploading image: ", error)
        }
    };
    return (
        <div>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <button onClick={handleUpload} style={{ padding: "5px 10px", marginLeft: "10px" }}>
                Upload Image
            </button>
        </div>
    );
};

export default ImageUploader;