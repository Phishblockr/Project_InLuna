import React, { useEffect, useState } from "react";
import { getQuiz } from "../../utils/quizApi";
import { useAuth } from "../../utils/AuthProvider";

const Badge = ({ children, className = "" }) => (
    <span
        className={`text-xs px-2 py-0.5 rounded-full inline-block ${className}`}
    >
        {children}
    </span>
);

const OptionRow = ({ idx, opt, isCorrect, qType }) => {
    return (
        <div className="flex items-start gap-3 p-2 rounded border bg-white dark:bg-[#002451] dark:border-[#001c40]">
            <div className="pt-1">
                {qType === "multi-select" ? (
                    <input
                        type="checkbox"
                        checked={!!isCorrect}
                        readOnly
                        className="accent-blue-600 dark:accent-sky-300"
                    />
                ) : (
                    <input
                        type="radio"
                        checked={!!isCorrect}
                        readOnly
                        className="accent-blue-600 dark:accent-sky-300"
                    />
                )}
            </div>

            <div className="flex-1">
                <div className="break-words text-gray-800 dark:text-gray-100">
                    {opt?.text || "(no text)"}
                </div>
                {opt?.media && (
                    <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                        Media: {opt.media}
                    </div>
                )}
            </div>

            <div className="flex flex-col items-end gap-1">
                {isCorrect ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                        Correct
                    </Badge>
                ) : null}
            </div>
        </div>
    );
};

const ViewModal = ({ isOpen, quizId, onClose }) => {
    const { getToken } = useAuth();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !quizId) return;
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const token = getToken();
                const data = await getQuiz(quizId, token);
                if (mounted) setQuiz(data.quiz || data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();
        return () => (mounted = false);
    }, [isOpen, quizId, getToken]);

    if (!isOpen) return null;

    return (
        <div
            aria-modal="true"
            role="dialog"
            className="fixed inset-0 z-50 flex items-start justify-center p-4"
        >
            <div
                className="fixed inset-0 bg-black/40"
                onClick={onClose}
                aria-hidden
            />

            {/* Scoped scrollbar styles for the view modal */}
            <style>{`
        /* Firefox */
        #view-modal { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.12) transparent; }
        :root .dark #view-modal { scrollbar-color: rgba(255,255,255,0.18) transparent; }

        /* WebKit */
        #view-modal::-webkit-scrollbar { width: 10px; height: 10px; }
        #view-modal::-webkit-scrollbar-track { background: transparent; }
        #view-modal::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box; }
        :root .dark #view-modal::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); }

        /* smaller inner scrollers */
        #view-modal .space-y-4, #view-modal pre, #view-modal .overflow-y-auto { scrollbar-width: thin; }
      `}</style>

            <div
                id="view-modal"
                className="relative bg-white w-full max-w-4xl rounded shadow-lg p-6 overflow-auto max-h-[90vh] border border-gray-200 dark:bg-[#002451] dark:border-[#001c40] dark:text-gray-100"
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        View Quiz
                    </h3>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="text-gray-600 dark:text-gray-300"
                    >
                        ✕
                    </button>
                </div>

                {loading ? (
                    <div className="text-gray-800 dark:text-gray-100">
                        Loading...
                    </div>
                ) : !quiz ? (
                    <div className="text-gray-700 dark:text-gray-300">
                        No quiz data
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Header info */}
                        <div className="p-4 rounded border bg-gray-50 dark:bg-[#001c40] border-gray-200 dark:border-[#001c40]">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h4 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                        {quiz.title}
                                    </h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                        {quiz.description}
                                    </p>
                                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                                        <span className="mr-3">
                                            Difficulty:{" "}
                                            <strong className="text-gray-800 dark:text-gray-100">
                                                {quiz.difficulty}
                                            </strong>
                                        </span>
                                        <span className="mr-3">
                                            Published:{" "}
                                            <strong className="text-gray-800 dark:text-gray-100">
                                                {quiz.published ? "Yes" : "No"}
                                            </strong>
                                        </span>
                                        <span className="mr-3">
                                            Department:{" "}
                                            <strong className="text-gray-800 dark:text-gray-100">
                                                {quiz.department || "—"}
                                            </strong>
                                        </span>
                                        <span className="mr-3">
                                            Total Points:{" "}
                                            <strong className="text-gray-800 dark:text-gray-100">
                                                {quiz.totalPoints ?? "—"}
                                            </strong>
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right text-sm text-gray-500 dark:text-gray-300">
                                    <div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Created:
                                        </div>
                                        <div className="text-gray-800 dark:text-gray-100">
                                            {quiz.createdAt
                                                ? new Date(
                                                      quiz.createdAt,
                                                  ).toLocaleString()
                                                : "—"}
                                        </div>
                                    </div>

                                    <div className="mt-2">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Updated:
                                        </div>
                                        <div className="text-gray-800 dark:text-gray-100">
                                            {quiz.updatedAt
                                                ? new Date(
                                                      quiz.updatedAt,
                                                  ).toLocaleString()
                                                : "—"}
                                        </div>
                                    </div>

                                    <div className="mt-2">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Tags:
                                        </div>
                                        <div className="text-gray-800 dark:text-gray-100 mt-1">
                                            {(quiz.tags || []).length
                                                ? (quiz.tags || []).join(", ")
                                                : "—"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Questions */}
                        <div className="space-y-3">
                            {(quiz.questions || []).map((q, i) => {
                                const normalizeCorrect = (c) => {
                                    const s = new Set();
                                    if (Array.isArray(c)) {
                                        c.forEach((it) => {
                                            const n = Number(it);
                                            if (!Number.isNaN(n)) s.add(n);
                                        });
                                    } else if (
                                        c !== null &&
                                        c !== undefined &&
                                        c !== ""
                                    ) {
                                        const n = Number(c);
                                        if (!Number.isNaN(n)) s.add(n);
                                    }
                                    return s;
                                };

                                const correctSet = normalizeCorrect(q.correct);

                                return (
                                    <div
                                        key={i}
                                        className="p-3 border rounded bg-white dark:bg-[#002451] border-gray-200 dark:border-[#001c40]"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="font-medium text-lg text-gray-900 dark:text-gray-100">
                                                    {i + 1}. {q.question}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                                                    Type:{" "}
                                                    <strong className="text-gray-800 dark:text-gray-100">
                                                        {q.type}
                                                    </strong>{" "}
                                                    • Points:{" "}
                                                    <strong className="text-gray-800 dark:text-gray-100">
                                                        {q.points ?? 0}
                                                    </strong>{" "}
                                                    • Shuffle:{" "}
                                                    <strong className="dark:text-gray-100">
                                                        {q.shuffleOptions
                                                            ? "Yes"
                                                            : "No"}
                                                    </strong>
                                                </div>
                                                {q.hint && (
                                                    <div className="text-xs mt-2 text-gray-600 dark:text-gray-300">
                                                        Hint: {q.hint}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right text-sm text-gray-500 dark:text-gray-300">
                                                <div>Question ID:</div>
                                                <div className="text-gray-800 dark:text-gray-100 mt-1">
                                                    {q._id || "—"}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Options block (if any) */}
                                        {q.options && q.options.length > 0 ? (
                                            <div className="mt-3 grid gap-2">
                                                {q.options.map((opt, oi) => (
                                                    <OptionRow
                                                        key={oi}
                                                        idx={oi}
                                                        opt={opt}
                                                        qType={q.type}
                                                        isCorrect={correctSet.has(
                                                            oi,
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 italic">
                                                No options (open-ended question)
                                            </div>
                                        )}

                                        {/* summary about correct answer(s) */}
                                        <div className="mt-3 text-sm text-gray-800 dark:text-gray-100">
                                            <strong>
                                                Correct Answer
                                                {correctSet.size > 1 ? "s" : ""}
                                                :
                                            </strong>{" "}
                                            {correctSet.size === 0 ? (
                                                <span className="text-gray-600 dark:text-gray-300">
                                                    None marked
                                                </span>
                                            ) : (
                                                Array.from(correctSet)
                                                    .map((ci) =>
                                                        q.options &&
                                                        q.options[ci]
                                                            ? q.options[ci].text
                                                            : `#${ci}`,
                                                    )
                                                    .join(", ")
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* raw JSON preview toggle */}
                        <details className="mt-4 p-3 border rounded bg-gray-50 dark:bg-[#001c40] border-gray-200 dark:border-[#001c40]">
                            <summary className="cursor-pointer text-gray-700 dark:text-gray-200">
                                Show raw quiz JSON
                            </summary>
                            <pre className="whitespace-pre-wrap text-xs mt-2 bg-white dark:bg-[#001c40] border border-gray-200 dark:border-[#001c40] rounded p-3 overflow-auto">
                                {JSON.stringify(quiz, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewModal;
