import React, { useState, useRef, useMemo, useEffect } from "react";
import { toast } from "sonner";
import "react-quill/dist/quill.snow.css";
import ReactQuill, { Quill } from "react-quill";
import DOMPurify from "dompurify";
// import ImageResize from "quill-image-resize-module";


// TypeError: can't access property "imports", window.Quill is undefined
// Quill.register("modules/imageResize", ImageResize);

// Define and register PhishingBlot outside the component to avoid re-registration
const Inline = Quill.import("blots/inline");
class PhishingBlot extends Inline {
    static create(value) {
        const node = super.create();
        node.setAttribute("data-phishing", value || true);
        node.style.color = "red";
        node.style.fontWeight = "bold";
        return node;
    }

    static formats(node) {
        return node.getAttribute("data-phishing");
    }
}
PhishingBlot.blotName = "phishing";
PhishingBlot.tagName = "span";
Quill.register(PhishingBlot);

const EmailEditor = () => {
    const apiUrl = import.meta.env.VITE_API_URL; // Replace with your API URL

    const [title, setTitle] = useState("");
    const [htmlContent, setHtmlContent] = useState("");
    const quillRef = useRef(null); // Ref for ReactQuill

    // Function to add phishing marker
    const addPhishingMarker = () => {
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        if (range && range.index >= 0 && range.length > 0) {
            quill.format("phishing", true); // Apply phishing format
        } else {
            toast.error("Please select some text to mark as phishing.");
        }
    };

    // Memoized toolbar configuration
    const modules = useMemo(() => ({
        toolbar: {
            container: [
                ["bold", "italic", "underline"], // Basic formatting
                [{ list: "ordered" }, { list: "bullet" }], // Lists
                ["link", "image"], // Links and images
            ],
        },
        // imageResize: {},
    }), []);

    // Add the "Mark as Phishing" button after editor initialization
    useEffect(() => {
        const toolbar = quillRef.current?.getEditor()?.getModule("toolbar");
        if (toolbar) {
            // Check if the button already exists
            const existingButton = toolbar.container.querySelector(".ql-phishing");
            if (!existingButton) {
                // Create the custom button
                const setAsPhishButton = document.createElement("button");
                setAsPhishButton.className = "ql-phishing";
                setAsPhishButton.title = "Set as Phishing";
                setAsPhishButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.382 3C12.7607 3 13.107 3.214 13.2764 3.55279L14 5H20C20.5523 5 21 5.44772 21 6V17C21 17.5523 20.5523 18 20 18H13.618C13.2393 18 12.893 17.786 12.7236 17.4472L12 16H5V22H3V3H12.382ZM11.7639 5H5V14H13.2361L14.2361 16H19V7H12.7639L11.7639 5Z"></path></svg>`; // Add button text
                setAsPhishButton.onclick = addPhishingMarker; // Attach handler
                setAsPhishButton.type = "button";

                // Append to the toolbar
                const customButtonGroup = document.createElement("span");
                customButtonGroup.className = "ql-formats";
                customButtonGroup.appendChild(setAsPhishButton);

                toolbar.container.appendChild(customButtonGroup);

            }
        }

    }, [quillRef]);

    const formats = useMemo(() => ["bold", "italic", "underline", "list", "bullet", "link", "image", "phishing"], []);

    const handleTextInput = (value) => {
        // Sanitize the input value using DOMPurify
        const sanitizedContent = DOMPurify.sanitize(value);
        setHtmlContent(sanitizedContent);
        console.log(htmlContent)
    }
    // Function to save the email template
    const saveTemplate = async () => {
        try {
            const res = await fetch(`${apiUrl}/emailTemplate/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    htmlContent,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Template added successfully");
            } else {
                toast.error(data.message || "Error saving template");
            }
        } catch (error) {
            toast.error(`Error saving template: ${error.message}`);
        }
    };

    return (
        <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] min-h-[calc(100vh-65px)] flex flex-col justify-between relative left-[16rem] right-0 bottom-0 p-4 gap-4">
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
                ref={quillRef}
                value={htmlContent}
                onChange={handleTextInput}
                modules={modules}
                formats={formats}
                style={{ height: "300px", marginBottom: "20px" }}
            />

            {/* Preview Section */}
            <div
                style={{
                    border: "1px solid #ccc",
                    padding: "10px",
                    marginTop: "20px",
                    backgroundColor: "#f9f9f9",
                    overflowX: "auto",
                }}
            >
                <h3>Preview:</h3>
                {/* Render sanitized HTML */}
                <div
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
                    style={{ wordWrap: "break-word" }}
                />
            </div>

            {/* Save Button */}
            <button onClick={saveTemplate} style={{ padding: "10px 20px", marginTop: "10px" }}>
                Save Template
            </button>
        </div>
    );
};

export default EmailEditor;


                // <ul>
                //     {templates.map((template) => (
                //         <li key={template._id}>
                //             <h3>{template.title}</h3>
                //             <div dangerouslySetInnerHTML={{ __html: template.htmlContent }} />
                //         </li>
                //     ))}
                // </ul>