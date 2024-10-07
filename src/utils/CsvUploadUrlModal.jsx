import React, { useState, useCallback } from 'react';
import { useDropzone } from "react-dropzone";
import { RiCloseLine } from "react-icons/ri";

const CsvUploadUrlModal = ({ isOpen, onClose, onFileSubmit }) => {
    const [file, setFile] = useState(null);
    const [urlHeader, setUrlHeader] = useState("");
    const [categoryHeader, setCategoryHeader] = useState("");
    const [status, setStatus] = useState("blacklisted");
    const [isPhishing, setIsPhishing] = useState("true");
    const [isVerified, setIsVerified] = useState("true");

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: ".csv",
    });

    const handleSubmit = () => {
        if (!file) {
            alert("Please upload a CSV file.");
            return;
        }

        if (!urlHeader.trim()) {
            alert("URL header name is required.");
            return;
        }

        // Prepare data to be submitted
        const formData = {
            file,
            urlHeader,
            categoryHeader,
            status,
            isPhishing,
            isVerified
        };

        onFileSubmit(formData);
        closeModal();
    };

    const closeModal = () => {
        setFile(null);
        setUrlHeader("");
        setCategoryHeader("");
        setStatus("blacklisted");
        setIsPhishing("true");
        setIsVerified("true");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white relative p-6 rounded-lg shadow-lg w-96 dark:bg-[#002451] dark:text-[#f4f4f4]">
                <button className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    onClick={closeModal}>
                    <RiCloseLine size={24} />
                </button>
                <h2>Upload CSV</h2>
                <span className="text-red-600 dark:text-red-500">Please provide required information.</span>

                {/* File Upload Section */}
                <div
                    {...getRootProps()}
                    className="border-2 border-dashed border-gray-300 p-6 rounded-lg cursor-pointer text-center dark:border-gray-600"
                >
                    <input {...getInputProps()} />
                    {file ? (
                        <p className="text-gray-600 dark:text-gray-300">{file.name}</p>
                    ) : isDragActive ? (
                        <p className="text-gray-600 dark:text-gray-300">Drop the file here...</p>
                    ) : (
                        <p className="text-gray-400 dark:text-gray-500">Drag and drop a file here, or click to select a file</p>
                    )}
                </div>

                {/* Header Name Inputs */}
                <div className="mt-4">
                    <label className="block mb-1">URL Header Name (required):</label>
                    <input
                        type="text"
                        value={urlHeader}
                        onChange={(e) => setUrlHeader(e.target.value)}
                        className="w-full p-2 border rounded-lg dark:bg-[#001C40] dark:border-gray-600"
                    />
                </div>

                <div className="mt-4">
                    <label className="block mb-1">Category Header Name (optional):</label>
                    <input
                        type="text"
                        value={categoryHeader}
                        onChange={(e) => setCategoryHeader(e.target.value)}
                        className="w-full p-2 border rounded-lg dark:bg-[#001C40] dark:border-gray-600"
                    />
                </div>

                {/* Advanced Settings */}
                <div className="mt-4">
                    <label className="block mb-1">Status:</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full p-2 border rounded-lg dark:bg-[#001C40] dark:border-gray-600"
                    >
                        <option value="blacklisted">Blacklisted</option>
                        <option value="whitelisted">Whitelisted</option>
                    </select>
                </div>

                <div className="mt-4">
                    <label className="block mb-1">Is Phishing?</label>
                    <select
                        value={isPhishing}
                        onChange={(e) => setIsPhishing(e.target.value)}
                        className="w-full p-2 border rounded-lg dark:bg-[#001C40] dark:border-gray-600"
                    >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                    </select>
                </div>

                <div className="mt-4">
                    <label className="block mb-1">Verified by Human?</label>
                    <select
                        value={isVerified}
                        onChange={(e) => setIsVerified(e.target.value)}
                        className="w-full p-2 border rounded-lg dark:bg-[#001C40] dark:border-gray-600"
                    >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                    </select>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    className="mt-4 w-full bg-[#0364BD] hover:bg-[#003A70] transition-colors text-[#f4f4f4] py-2 rounded-lg"
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

export default CsvUploadUrlModal;
