import React, { useState, useEffect } from "react";
import { RiDeleteBinLine, RiEyeLine } from "react-icons/ri";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const EmailList = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch(`${apiUrl}/emailTemplate/getAll`);
            const data = await res.json();

            if (res.ok) {
                setTemplates(data.templates);
            } else {
                toast.error(data.message || "Error fetching templates");
            }
        } catch (error) {
            toast.error("Error fetching templates:", error.message)
        }
    }
    console.log(templates)


    return (
        <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] min-h-[calc(100vh-65px)] flex flex-col justify-between relative left-[16rem] right-0 bottom-0 p-4 gap-4">
            <div>

                <div className="bg-white p-4 flex justify-between items-center rounded-xl shadow-xl dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                    <div>
                        <h1 className="text-2xl font-medium tracking-tight">Email Templates</h1>
                    </div>
                    <div className="flex items-center gap-x-3">
                        <input
                            type="text"
                            placeholder="Search User..."
                            className="rounded-lg border-gray-300 border-2 text-gray-600 p-2 focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:text-gray-400 dark:border-0"
                        // onChange={(e) => handleSearch(e.target.value)}
                        />
                        <select
                            name="filters"
                            id="filters"
                            className="rounded-lg border-gray-300 border-2 text-gray-600 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:text-gray-400 dark:border-0"
                        // onChange={(e) => handleStatus(e.target.value)}
                        >
                            <option value="all">Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                        <select
                            name="perPageRec"
                            id="perPageRec"
                            className="rounded-lg border-gray-300 border-2 text-gray-600 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:text-gray-400 dark:border-0"
                            // onChange={(e) => handleSetPerPageRec(e.target.value)}
                            // value={perPageRec}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                        <button className="flex justify-center items-center gap-3 px-4 p-[10px] rounded-lg cursor-pointer bg-gray-100 hover:bg-gray-300 dark:dark:bg-[#001733] dark:hover:bg-[#001733] dark:text-gray-400 transition"
                        // onClick={() => setIsModalOpen(true)}
                        >
                            Add Templates via CSV
                        </button>
                        <Link
                            to={"/emails/emailCreator"}
                            className="flex justify-center items-center gap-3 px-4 p-[10px] rounded-lg text-[#f4f4f4] cursor-pointer bg-[#0364BD] hover:bg-[#003A70] transition-colors"
                        >
                            <span>
                                Add Template
                            </span>
                        </Link>
                    </div>
                </div>
                {templates.length === 0 ? (
                    <p>No templates found.</p>
                ) : (
                    <div>
                        <table className="w-full dark:text-[#F4F4F4]">
                            <thead className="border-separate">
                                <tr>
                                    <th className="py-3 text-left">Title</th>
                                    <th className="py-3 text-left">Phishing</th>
                                    <th className="py-3 text-left">Group</th>
                                    <th className="py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templates.map((template) => (
                                    <tr
                                        key={template._id}
                                        className="odd:bg-white even:bg-gray-100 dark:odd:bg-[#002451] dark:even:bg-[#001C40]"
                                    >
                                        <td className="py-2 pl-2">
                                            <Link
                                                to={`/emails/emailEditor/${template._id}`}
                                                title="Click to view details"
                                            >
                                                <span className="font-medium">{template.title}</span>
                                            </Link>
                                        </td>
                                        <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                                            {template.isPhishing.toString()}
                                        </td>
                                        <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                                            {template.group}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => navigate(`/emails/emailEditor/${template._id}`)}
                                                title="Click to view details"
                                            ><RiEyeLine size={24} className="hover:text-[#0364BD] transition-colors" /></button>
                                            {/* <button onClick={() => handlePasswordModalOpen(template._id, "delete")}>
                                                <RiDeleteBinLine className="w-6 h-6 text-red-500 hover:text-red-700 transition-colors" />
                                            </button> */}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default EmailList;