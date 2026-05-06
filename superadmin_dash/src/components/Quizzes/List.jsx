import React, { useEffect, useState } from "react";
import { useAuth } from "../../utils/AuthProvider.jsx";
import { listQuizzes, deleteQuiz } from "../../utils/quizApi.js";
import CreateModal from "./CreateModal.jsx";
import ViewModal from "./ViewModal.jsx";
import { toast } from "sonner";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { UploadModal } from "./UploadModal.jsx";
import EditModal from "./EditModal.jsx";

const List = () => {
    const { getToken } = useAuth();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [editQuizId, setEditQuizId] = useState(null);
    const [viewQuizId, setViewQuizId] = useState(null);

    const fetchList = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const data = await listQuizzes(token);
            setQuizzes(Array.isArray(data.data) ? data.data : []);
            console.log(data.data);
        } catch (err) {
            console.error(err);
            toast.error(err?.body?.message || "Failed to load quizzes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, []);

    const handleDelete = async (id) => {
        const ok = window.confirm(
            "Delete this quiz? This action cannot be undone.",
        );
        if (!ok) return;
        try {
            const token = getToken();
            await deleteQuiz(id, token);
            toast.success("Quiz deleted");
            setQuizzes((s) => s.filter((q) => q._id !== id && q.id !== id));
        } catch (err) {
            console.error(err);
            toast.error(err?.body?.message || "Failed to delete quiz");
        }
    };

    return (
        <div className="p-6 dark:text-white">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Quizzes</h2>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowUpload(true)}
                        className="bg-blue-600 text-white py-2 px-4 rounded"
                    >
                        Create Via JSON
                    </button>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="bg-blue-600 text-white py-2 px-4 rounded"
                    >
                        Create Quiz
                    </button>
                </div>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="overflow-x-auto rounded shadow bg-white dark:bg-[#002451] border border-gray-200 dark:border-[#001c40]">
                    <table className="min-w-full text-left divide-y divide-gray-100 dark:divide-[#001c40]">
                        <thead className="bg-gray-100 dark:bg-[#001c40]">
                            <tr>
                                <th className="p-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Title
                                </th>
                                <th className="p-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Department
                                </th>
                                <th className="p-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Difficulty
                                </th>
                                <th className="p-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Created At
                                </th>
                                <th className="p-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Published
                                </th>
                                <th className="p-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-[#002451]">
                            {quizzes.length === 0 && (
                                <tr>
                                    <td
                                        className="p-4 text-gray-600 dark:text-gray-400"
                                        colSpan={6}
                                    >
                                        No quizzes found.
                                    </td>
                                </tr>
                            )}
                            {quizzes.map((q) => (
                                <tr
                                    key={q._id || q.id}
                                    className="border-t border-gray-200 dark:border-[#001c40] hover:bg-gray-50 dark:hover:bg-[#001c40] transition"
                                >
                                    <td className="p-3 text-gray-700 dark:text-gray-200">
                                        {q.title}
                                    </td>
                                    <td className="p-3 text-gray-700 dark:text-gray-200">
                                        {q.department ||
                                            q.departmentId ||
                                            q.department?.name ||
                                            "-"}
                                    </td>
                                    <td className="p-3 text-gray-700 dark:text-gray-200">
                                        {q.difficulty || "-"}
                                    </td>
                                    <td className="p-3 text-gray-700 dark:text-gray-200">
                                        {new Date(
                                            q.createdAt || q.created,
                                        ).toLocaleString()}
                                    </td>
                                    <td className="p-3 text-gray-700 dark:text-gray-200">
                                        {q.published ? "Yes" : "No"}
                                    </td>
                                    <td className="p-3 text-gray-700 dark:text-gray-200">
                                        <button
                                            onClick={() =>
                                                setViewQuizId(q._id || q.id)
                                            }
                                            className="mr-2 p-1 rounded text-sky-400 hover:bg-[#001c40]/20"
                                        >
                                            <Eye />
                                        </button>
                                        <button
                                            onClick={() =>
                                                setEditQuizId(q._id || q.id)
                                            }
                                            className="mr-2 p-1 rounded text-green-400 hover:bg-[#001c40]/20"
                                        >
                                            <Pencil />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDelete(q._id || q.id)
                                            }
                                            className="p-1 rounded text-red-400 hover:bg-[#001c40]/20"
                                        >
                                            <Trash2 />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <CreateModal
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                onCreated={() => {
                    setShowCreate(false);
                    fetchList();
                }}
            />

            <UploadModal
                isOpen={showUpload}
                onClose={() => setShowUpload(false)}
                onCreated={() => {
                    setShowUpload(false);
                    fetchList();
                }}
            />

            <ViewModal
                isOpen={!!viewQuizId}
                quizId={viewQuizId}
                onClose={() => setViewQuizId(null)}
            />

            <EditModal
                isOpen={!!editQuizId}
                quizId={editQuizId}
                onClose={() => setEditQuizId(null)}
                onUpdated={() => {
                    setEditQuizId(null);
                    fetchList();
                }}
            />
        </div>
    );
};

export default List;
