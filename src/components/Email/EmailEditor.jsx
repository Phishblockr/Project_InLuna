import React from 'react'
import { toast } from "sonner";
import ImageUploader from '../../utils/ImageUploader';

const EmailEditor = () => {
    const apiUrl = import.meta.env.VITE_API_URL;

    const [title, setTitle] = useState("");
    const [htmlContent, setHtmlContent] = useState("");
    const [phishingMarkers, setPhishingMarkers] = useState([]);
    const [images, setImages] = useState([]);

    const saveTemplate = async () => {
        try {
            const res = await fetch(`${apiUrl}/emailTemplate/create`, {
                method: "POST",
                headers: { "Content-Tupe": "application/json" },
                body: JSON.stringify({
                    title,
                    htmlContent,
                    phishingMarkers,
                    images,
                }),
            });

            const data = await res.json();
            if (Response.ok) {
                toast.success("Template Added successfully");
            } else {
                toast.error(data.message || "Error saving template");
            }
        } catch (error) {
            toast.error("Error saving template: ", error.message)
        }
    };
    const addImageToEditor = (imageUrl) => {
        setHtmlContent((prev) => `${prev}<img src="${imageUrl}" alt=""/>`);
        setImages((prev) => [...prev, { url: imageUrl, altText: "" }]);
    };
    return (
        <div>
            <h1>Email Template Editor</h1>

            {/* Title Input */}
            <input
                type="text"
                placeholder="Enter template title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
            />

            {/* HTML Content Editor */}
            <ReactQuill
                value={htmlContent}
                onChange={setHtmlContent}
                modules={{
                    toolbar: [
                        ["bold", "italic", "underline"],
                        [{ list: "ordered" }, { list: "bullet" }],
                        ["link", "image"],
                    ],
                }}
                style={{ height: "300px", marginBottom: "10px" }}
            />

            {/* Image Uploader */}
            <ImageUploader onUploadSuccess={addImageToEditor} />

            {/* Save Button */}
            <button onClick={saveTemplate} style={{ padding: "10px 20px", marginTop: "10px" }}>
                Save Template
            </button>

            {/* Preview */}
            <div
                style={{
                    border: "1px solid #ccc",
                    padding: "10px",
                    marginTop: "20px",
                }}
            >
                <h3>Preview:</h3>
                <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
        </div>
    );
};

export default EmailEditor