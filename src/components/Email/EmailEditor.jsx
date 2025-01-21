import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import DOMPurify from "dompurify";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import LoadingOverlay from "../../utils/LoadingOverlay";
import { useAuth } from "../../utils/AuthProvider";

const EmailCreator = () => {
    const { id } = useParams();
    const apiUrl = import.meta.env.VITE_API_URL;

    const { getToken } = useAuth();
    const token = getToken();

    const [title, setTitle] = useState("");
    const [htmlContent, setHtmlContent] = useState("");
    const [isPhishing, setIsPhishing] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(""); // Track selected value
    const [updatedDate, setUpdatedDate] = useState("");
    const [createdDate, setCreatedDate] = useState("");

    // dynamic select
    const [groupOptions, setGroupOptions] = useState([]); // Store options fetched from the backend
    const [otherValue, setOtherValue] = useState(""); // Track input for "Other" value

    const [loading, setLoading] = useState(true);

    const editorRef = React.useRef(null);

    const fetchTemplate = async () => {
        try {
            const res = await fetch(`${apiUrl}/emailTemplate/get/${id}`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();

            if (res.ok) {
                setTitle(data.template.title);
                setHtmlContent(data.template.htmlContent);
                setSelectedGroup(data.template.group);
                setIsPhishing(data.template.isPhishing);
                setUpdatedDate(data.template.updatedAt);
                setCreatedDate(data.template.createdDate);
            } else {
                toast.error(data.message || "Error fetching templates");
            }
        } catch (error) {
            toast.error("Error fetching templates:", error.message)
        }
    }

    const fetchOptions = async () => {
        try {
            const response = await fetch(`${apiUrl}/emailTemplate/getGroups` , {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }); // Backend endpoint
            const data = await response.json();
            setGroupOptions(data);
        } catch (error) {
            console.error("Error fetching options:", error);
        }
    };

    const handleEditorChange = (value) => {
        const sanitizedContent = DOMPurify.sanitize(value);
        setHtmlContent(sanitizedContent);
    };

    const handleEditorMount = (editor) => {
        editorRef.current = editor;
        if (htmlContent) {
            editor.setValue(htmlContent);
        }
    };

    const saveTemplate = async () => {
        try {

            const finalGroup = selectedGroup === "other" ? otherValue : selectedGroup;

            const res = await fetch(`${apiUrl}/emailTemplate/update/${id}`, {
                method: "PUT",
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({
                    title,
                    htmlContent,
                    group: finalGroup,
                    isPhishing
                }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Template updated successfully");
            } else {
                toast.error(data.message || "Error updating template.");
            }
        } catch (error) {
            toast.error(`Error updating template: ${error.message}`);
        }
    };

    // Handle Set as Phishing functionality
    const markAsPhishing = () => {
        if (!editorRef.current) return;

        const editor = editorRef.current;
        const selection = editor.getSelection();

        if (selection && !selection.isEmpty()) {
            const range = editor.getModel().getValueInRange(selection);
            const markedText = `<span style="color: red; font-weight: bold;" data-phishing="true">${range}</span>`;

            // Replace the selected text with marked text
            editor.executeEdits(null, [
                {
                    range: selection,
                    text: markedText,
                    forceMoveMarkers: true,
                },
            ]);
        } else {
            toast.error("Please select some text to set as phishing.");
        }
    };

    // Handle Set Placeholder Name functionality
    const setPlaceholderName = () => {
        if (!editorRef.current) return;

        const editor = editorRef.current;
        const selection = editor.getSelection();

        if (selection && !selection.isEmpty()) {
            const range = editor.getModel().getValueInRange(selection);
            const placeholderText = `<span style="color: blue; data-placeholder="name">${range}</span>`;

            // Replace the selected text with the placeholder
            editor.executeEdits(null, [
                {
                    range: selection,
                    text: placeholderText,
                    forceMoveMarkers: true,
                },
            ]);
        } else {
            toast.error("Please select some text to set as placeholder for Name.");
        }
    };

    // Handle Set Placeholder Email functionality
    const setPlaceholderEmail = () => {
        if (!editorRef.current) return;

        const editor = editorRef.current;
        const selection = editor.getSelection();

        if (selection && !selection.isEmpty()) {
            const range = editor.getModel().getValueInRange(selection);
            const placeholderText = `<span style="color: blue; data-placeholder="email">${range}</span>`;

            // Replace the selected text with the placeholder
            editor.executeEdits(null, [
                {
                    range: selection,
                    text: placeholderText,
                    forceMoveMarkers: true,
                },
            ]);
        } else {
            toast.error("Please select some text to set as placeholder for Email.");
        }
    };


    useEffect(() => {
        setLoading(true); // Start loading
        fetchTemplate();
        fetchOptions();
        setLoading(false); // Stop loading
    }, [id])

    return (
        <div className="z-1 min-h-[calc(100vh-65px)] flex flex-col justify-between relative right-0 bottom-0 p-4 gap-4">
            {loading && <LoadingOverlay loading={loading} />}
            <h1>Edit Template</h1>
            <label htmlFor="title"> Title</label>
            <input
                type="text"
                name="title"
                placeholder="Enter template title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 mb-4 border border-gray-300 rounded"
            />

            <label htmlFor="selectField" className="block text-lg font-medium mb-2">
                Template Group
            </label>
            <select
                id="selectField"
                className="bg-white w-full p-2 border border-gray-300 rounded mb-4"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
            >
                {groupOptions.map((groupOption, index) => (
                    <option key={index} value={groupOption}>
                        {groupOption}
                    </option>
                ))}
                <option value="other">Other</option>
            </select>

            {selectedGroup === "other" && (
                <div>
                    <label htmlFor="otherField" className="block text-lg font-medium mb-2">
                        Enter Other Value
                    </label>
                    <input
                        id="otherField"
                        type="text"
                        className="w-full p-2 mb-4 border border-gray-300 rounded"
                        value={otherValue}
                        onChange={(e) => setOtherValue(e.target.value)}
                        placeholder="Enter custom value"
                    />
                </div>
            )}

            <label htmlFor="selectField" className="block text-lg font-medium mb-2">
                Is this template phishing template?
            </label>
            <select
                id="selectField"
                className="bg-white w-full p-2 border border-gray-300 rounded mb-4"
                value={isPhishing}
                onChange={(e) => setIsPhishing(e.target.value)}
            >
                <option value="true">True</option>
                <option value="false">False</option>

            </select>

            <div className="border-2 border-gray-200 rounded-lg">
                {/* Custom Toolbar */}
                <div className="flex flex-row gap-2 m-2">
                    <button
                        onClick={markAsPhishing}
                        className="px-4 p-[10px] rounded-lg cursor-pointer bg-white hover:bg-gray-300 dark:dark:bg-[#001733] dark:hover:bg-[#001733] dark:text-gray-400 transition"
                    >
                        Set as Phishing
                    </button>
                    <button
                        onClick={setPlaceholderName}
                        className="px-4 p-[10px] rounded-lg cursor-pointer bg-white hover:bg-gray-300 dark:dark:bg-[#001733] dark:hover:bg-[#001733] dark:text-gray-400 transition"
                    >
                        Set Placeholder: Name
                    </button>
                    <button
                        onClick={setPlaceholderEmail}
                        className="px-4 p-[10px] rounded-lg cursor-pointer bg-white hover:bg-gray-300 dark:dark:bg-[#001733] dark:hover:bg-[#001733] dark:text-gray-400 transition"
                    >
                        Set Placeholder: Email
                    </button>
                </div>

                <span>Please add images as svg code. Later upload image will be available when s3 is configured</span>

                <div className="flex flex-col lg:flex-row lg:gap-4">
                    {/* Editor */}
                    <div className="flex-1 border border-gray-300 bg-gray-100">
                        <Editor
                            className="h-full min-h-[500px]"
                            defaultLanguage="html"
                            value={htmlContent}
                            onChange={handleEditorChange}
                            onMount={handleEditorMount}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                wordWrap: "on",
                                automaticLayout: true,
                            }}
                        />
                    </div>

                    {/* Preview */}
                    <div className="flex-1 border border-gray-300 bg-white p-4">
                        <h3 className="mb-2 text-lg font-semibold">Preview:</h3>
                        <div
                            dangerouslySetInnerHTML={{ __html: htmlContent }}
                            className="border border-gray-200 p-4 bg-gray-50 rounded"
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={saveTemplate}
                className="px-4 p-[10px] rounded-lg text-[#f4f4f4] cursor-pointer bg-[#0364BD] hover:bg-[#003A70] transition-colors"
            >
                Save Template
            </button>


        </div>
    )
}

export default EmailCreator