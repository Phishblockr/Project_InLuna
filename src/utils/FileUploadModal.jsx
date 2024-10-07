import React, { useState, useCallback } from 'react';
import { useDropzone } from "react-dropzone";
import { RiCloseLine } from "react-icons/ri";

const FileUploadModal = ({ isOpen, onClose, onFileSubmit, FileMsg, FileType }) => {

    const [file, setFile] = useState(null);

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: FileType === "csv" ? ".csv" : "*",
    });

    const handleSubmit = () => {
        if (file) {
            onFileSubmit(file)
        }
        closeModal();
    }

    const closeModal = () => {
        setFile(null)
        onClose();
    }
    if (!isOpen) return null;

    let acceptedFileType = '*';
    if (FileType === "csv") {
        acceptedFileType = ".csv";
    }
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white relative p-6 rounded-lg shadow-lg w-96 dark:bg-[#002451] dark:text-[#f4f4f4]">
                <button className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    onClick={closeModal}> <RiCloseLine size={24} /></button>
                <h2>Upload {FileType}</h2>
                <span className="text-red-600 dark:text-red-500">{FileMsg}</span>
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
                <button
                    onClick={handleSubmit}
                    className="mt-4 w-full bg-[#0364BD] hover:bg-[#003A70] transition-colors text-[#f4f4f4] py-2 rounded-lg"
                >
                    Submit
                </button>
            </div>
        </div>
    )
}

export default FileUploadModal