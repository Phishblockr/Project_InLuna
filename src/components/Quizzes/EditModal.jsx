import React, { useEffect, useState } from "react";
import { getQuiz, listDepartments, updateQuiz } from "../../utils/quizApi";
import { useAuth } from "../../utils/AuthProvider";
import { toast } from "sonner";

const blankOption = () => ({ text: "", media: "", correct: false });
const blankQuestion = () => ({
    question: "",
    type: "multiple-choice",
    options: [blankOption(), blankOption()],
    points: 10,
    hint: "",
    shuffleOptions: false,
    timeLimit: null,
});

const deepClone = (v) => JSON.parse(JSON.stringify(v));

const setByPath = (obj, path, value) => {
    const parts = path.split(".");
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        const nextIsIndex = !isNaN(Number(parts[i + 1]));
        if (cur[p] == null) cur[p] = nextIsIndex ? [] : {};
        cur = cur[p];
    }
    cur[parts[parts.length - 1]] = value;
};

const EditModal = ({ isOpen, quizId, onClose, onUpdated }) => {
    const { getToken } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [loadingQuiz, setLoadingQuiz] = useState(false);
    const [form, setForm] = useState({
        title: "",
        description: "",
        department: "",
        difficulty: "easy",
        tags: "",
        published: false,
        questions: [blankQuestion()],
    });
    const [departments, setDepartments] = useState([]);
    const [deptLoading, setDeptLoading] = useState(false);

    // Load departments
    useEffect(() => {
        if (!isOpen) return;
        const load = async () => {
            setDeptLoading(true);
            try {
                const token = getToken();
                const data = await listDepartments(token);
                const raw = Array.isArray(data) ? data : [];
                const normalized = raw
                    .map((item) => {
                        if (typeof item === "string") return item.trim();
                        if (!item || typeof item !== "object") return "";
                        return (
                            item.value ||
                            item.label ||
                            item.name ||
                            item.department ||
                            item.title ||
                            ""
                        )
                            .toString()
                            .trim();
                    })
                    .filter(Boolean);
                const unique = [...new Set(normalized)].sort((a, b) =>
                    a.localeCompare(b),
                );
                setDepartments(unique);
            } catch (err) {
                console.error("Failed to load departments", err);
                toast.error("Failed to load departments");
            } finally {
                setDeptLoading(false);
            }
        };
        load();
    }, [isOpen, getToken]);

    // Load quiz data
    useEffect(() => {
        if (!isOpen || !quizId) return;

        const loadQuiz = async () => {
            setLoadingQuiz(true);
            try {
                const token = getToken();
                const data = await getQuiz(quizId, token); // returns { success, quiz } or quiz
                const q = data.quiz || data;

                const tags =
                    Array.isArray(q.tags) && q.tags.length
                        ? q.tags.join(", ")
                        : typeof q.tags === "string"
                          ? q.tags
                          : "";

                const questions = (q.questions || []).map((qq) => {
                    const base = {
                        question: qq.question || "",
                        type: qq.type || "multiple-choice",
                        points: qq.points ?? 10,
                        hint: qq.hint || "",
                        shuffleOptions: !!qq.shuffleOptions,
                        timeLimit: qq.timeLimit ?? null,
                    };

                    let options = (qq.options || []).map((opt) => ({
                        text: opt.text || "",
                        media: opt.media || "",
                        correct: false,
                    }));

                    if (options.length < 2) {
                        while (options.length < 2) options.push(blankOption());
                    }

                    // Map correct index / indices to boolean flags
                    const correct = qq.correct;
                    if (Array.isArray(correct)) {
                        correct.forEach((idx) => {
                            if (options[idx]) options[idx].correct = true;
                        });
                    } else if (
                        typeof correct === "number" &&
                        correct >= 0 &&
                        correct < options.length
                    ) {
                        options = options.map((o, idx) => ({
                            ...o,
                            correct: idx === correct,
                        }));
                    }

                    return { ...base, options };
                });

                setForm({
                    title: q.title || "",
                    description: q.description || "",
                    department: q.department || "",
                    difficulty: q.difficulty || "easy",
                    tags,
                    published: !!q.published,
                    questions: questions.length ? questions : [blankQuestion()],
                });
            } catch (err) {
                console.error("Failed to load quiz", err);
                toast.error("Failed to load quiz for editing");
            } finally {
                setLoadingQuiz(false);
            }
        };

        loadQuiz();
    }, [isOpen, quizId, getToken]);

    if (!isOpen) return null;

    const update = (path, value) => {
        setForm((f) => {
            const copy = deepClone(f);
            try {
                setByPath(copy, path, value);
            } catch (err) {
                console.error("update failed", err, path, value);
            }
            return copy;
        });
    };

    const addQuestion = () =>
        setForm((f) => ({
            ...deepClone(f),
            questions: [...deepClone(f.questions), blankQuestion()],
        }));

    const removeQuestion = (idx) =>
        setForm((f) => {
            const next = deepClone(f);
            next.questions.splice(idx, 1);
            return next;
        });

    const addOption = (qIdx) => {
        setForm((f) => {
            const next = deepClone(f);
            const q = next.questions[qIdx];
            q.options = [...(q.options || []), blankOption()];
            return next;
        });
    };

    const removeOption = (qIdx, oIdx) => {
        setForm((f) => {
            const next = deepClone(f);
            const q = next.questions[qIdx];
            q.options = q.options.filter((_, i) => i !== oIdx);
            if (
                (q.type === "multiple-choice" || q.type === "true-false") &&
                q.options.length
            ) {
                if (!q.options.some((o) => !!o.correct))
                    q.options[0].correct = true;
            }
            return next;
        });
    };

    const setSingleCorrect = (qIdx, oIdx) => {
        setForm((f) => {
            const next = deepClone(f);
            const q = next.questions[qIdx];
            q.options = q.options.map((o, i) => ({
                ...o,
                correct: i === oIdx,
            }));
            return next;
        });
    };

    const changeQuestionType = (qIdx, type) => {
        setForm((f) => {
            const next = deepClone(f);
            const q = next.questions[qIdx];
            q.type = type;
            if (type === "true-false") {
                const prev = q.options && q.options[0] ? q.options[0] : null;
                q.options = [
                    {
                        text: "True",
                        media: "",
                        correct: prev ? !!prev.correct : true,
                    },
                    {
                        text: "False",
                        media: "",
                        correct: prev ? !prev.correct : false,
                    },
                ];
            } else if (type === "open-ended") {
                q.options = [];
            } else {
                if (!q.options || q.options.length < 2) {
                    q.options = [blankOption(), blankOption()];
                }
            }
            return next;
        });
    };

    const validate = () => {
        if (!form.title.trim()) return "Title is required";
        for (let i = 0; i < form.questions.length; i++) {
            const q = form.questions[i];
            if (!q.question || !q.question.trim())
                return `Question ${i + 1} text required`;
            if (
                q.type === "multiple-choice" ||
                q.type === "multi-select" ||
                q.type === "true-false"
            ) {
                if (!q.options || q.options.length < 2)
                    return `Question ${i + 1} needs at least 2 options`;
                const hasCorrect = q.options.some((o) => !!o.correct);
                if (!hasCorrect)
                    return `Question ${i + 1} needs at least one correct option`;
            }
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validate();
        if (err) return toast.error(err);

        const payload = {
            title: form.title,
            description: form.description,
            department: form.department,
            difficulty: form.difficulty,
            tags: form.tags
                ? form.tags
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                : [],
            published: !!form.published,
            questions: form.questions.map((q) => {
                const options = (q.options || []).map((o) => ({
                    text: o.text,
                    media: o.media || null,
                }));

                let correct;
                if (q.type === "multi-select") {
                    correct = (q.options || [])
                        .map((o, idx) => (o.correct ? idx : -1))
                        .filter((n) => n > -1);
                } else if (
                    q.type === "multiple-choice" ||
                    q.type === "true-false"
                ) {
                    const idx = (q.options || []).findIndex((o) => !!o.correct);
                    correct = idx === -1 ? null : idx;
                } else {
                    correct = null;
                }

                return {
                    question: q.question,
                    options,
                    correct,
                    type: q.type,
                    points: q.points || 10,
                    hint: q.hint || undefined,
                    shuffleOptions: !!q.shuffleOptions,
                    timeLimit: q.timeLimit || undefined,
                };
            }),
        };

        try {
            setSubmitting(true);
            const token = getToken();
            await updateQuiz(quizId, payload, token);
            toast.success("Quiz updated");
            onUpdated && onUpdated();
        } catch (err) {
            console.error("Update quiz error:", err);
            const serverMsg =
                err &&
                err.body &&
                (err.body.message || err.body.error || err.body);
            const message =
                serverMsg ||
                (err && err.status && `Server ${err.status}`) ||
                "Failed to update quiz";
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (submitting) return;
        onClose && onClose();
    };

    return (
        <div
            aria-modal="true"
            role="dialog"
            className="fixed inset-0 z-50 flex items-start justify-center p-4"
        >
            <div
                className="fixed inset-0 bg-black/40"
                onClick={handleClose}
                aria-hidden
            />

            {/* Scoped minimal scrollbar for edit modal */}
            <style>{`
        /* Firefox */
        #edit-modal { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.12) transparent; }
        :root .dark #edit-modal { scrollbar-color: rgba(255,255,255,0.18) transparent; }

        /* WebKit */
        #edit-modal::-webkit-scrollbar { width: 10px; height: 10px; }
        #edit-modal::-webkit-scrollbar-track { background: transparent; }
        #edit-modal::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box; }
        :root .dark #edit-modal::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); }

        /* smaller inner lists */
        #edit-modal .space-y-4, #edit-modal .space-y-2 { scrollbar-width: thin; }
      `}</style>

            <form
                id="edit-modal"
                onSubmit={handleSubmit}
                className="relative bg-white w-full max-w-3xl rounded shadow-lg p-6 overflow-auto max-h-[90vh] dark:bg-[#002451] dark:text-gray-100 border border-gray-200 dark:border-[#001c40]"
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold dark:text-gray-100">
                        {loadingQuiz ? "Loading..." : "Edit Quiz"}
                    </h3>
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Close"
                        className="text-gray-600 dark:text-gray-300"
                    >
                        ✕
                    </button>
                </div>

                {loadingQuiz ? (
                    <div>Loading quiz...</div>
                ) : (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm dark:text-gray-200">
                                Title
                            </label>
                            <input
                                value={form.title}
                                onChange={(e) =>
                                    update("title", e.target.value)
                                }
                                className="w-full border rounded p-2 bg-white text-gray-900 dark:bg-[#001c40] dark:text-gray-100 border-gray-300 dark:border-[#001c40] outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-sky-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm dark:text-gray-200">
                                Description
                            </label>
                            <textarea
                                value={form.description}
                                onChange={(e) =>
                                    update("description", e.target.value)
                                }
                                className="w-full border rounded p-2 h-20 bg-white text-gray-900 dark:bg-[#001c40] dark:text-gray-100 border-gray-300 dark:border-[#001c40] outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-sky-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm dark:text-gray-200">
                                Department
                            </label>
                            <select
                                value={form.department}
                                onChange={(e) =>
                                    update("department", e.target.value)
                                }
                                className="w-full border rounded p-2 bg-white text-gray-900 dark:bg-[#001c40] dark:text-gray-100 border-gray-300 dark:border-[#001c40] outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-sky-500"
                            >
                                <option value="">Select department</option>
                                {departments.map((d) => (
                                    <option
                                        key={d}
                                        value={d}
                                        className="bg-white dark:bg-[#001c40] text-gray-900 dark:text-gray-100"
                                    >
                                        {d}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm dark:text-gray-200">
                                    Difficulty
                                </label>
                                <select
                                    value={form.difficulty}
                                    onChange={(e) =>
                                        update("difficulty", e.target.value)
                                    }
                                    className="w-full border rounded p-2 bg-white text-gray-900 dark:bg-[#001c40] dark:text-gray-100 border-gray-300 dark:border-[#001c40] outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-sky-500"
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm dark:text-gray-200">
                                    Tags (comma separated)
                                </label>
                                <input
                                    value={form.tags}
                                    onChange={(e) =>
                                        update("tags", e.target.value)
                                    }
                                    className="w-full border rounded p-2 bg-white text-gray-900 dark:bg-[#001c40] dark:text-gray-100 border-gray-300 dark:border-[#001c40] outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-sky-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 dark:text-gray-200">
                            <input
                                type="checkbox"
                                checked={!!form.published}
                                onChange={(e) =>
                                    update("published", e.target.checked)
                                }
                                className="accent-blue-600 dark:accent-sky-300"
                            />
                            <label>Published</label>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium dark:text-gray-100">
                                    Questions
                                </h4>
                                <button
                                    type="button"
                                    onClick={addQuestion}
                                    className="text-sm text-blue-600 dark:text-sky-300"
                                >
                                    Add question
                                </button>
                            </div>
                            <div className="space-y-4 mt-3">
                                {form.questions.map((q, qi) => (
                                    <div
                                        key={qi}
                                        className="border p-3 rounded bg-white dark:bg-[#002451] border-gray-300 dark:border-[#001c40]"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <strong className="dark:text-gray-100">
                                                Question {qi + 1}
                                            </strong>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeQuestion(qi)
                                                }
                                                className="text-red-600 dark:text-red-400 mr-2"
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            <input
                                                placeholder="Question text"
                                                value={q.question}
                                                onChange={(e) =>
                                                    update(
                                                        `questions.${qi}.question`,
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full border rounded p-2 bg-white text-gray-900 dark:bg-[#001c40] dark:text-gray-100 border-gray-300 dark:border-[#001c40] outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-sky-500"
                                            />

                                            <div className="grid grid-cols-2 gap-2">
                                                <select
                                                    value={q.type}
                                                    onChange={(e) =>
                                                        changeQuestionType(
                                                            qi,
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="border rounded p-2 bg-white text-gray-900 dark:bg-[#001c40] dark:text-gray-100 border-gray-300 dark:border-[#001c40] outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-sky-500"
                                                >
                                                    <option value="multiple-choice">
                                                        Multiple choice
                                                    </option>
                                                    <option value="multi-select">
                                                        Multi-select
                                                    </option>
                                                    <option value="true-false">
                                                        True / False
                                                    </option>
                                                    <option value="open-ended">
                                                        Open ended
                                                    </option>
                                                </select>
                                                <input
                                                    type="number"
                                                    value={q.points}
                                                    onChange={(e) =>
                                                        update(
                                                            `questions.${qi}.points`,
                                                            Number(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                    className="border rounded p-2 bg-white text-gray-900 dark:bg-[#001c40] dark:text-gray-100 border-gray-300 dark:border-[#001c40] outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-sky-500"
                                                />
                                            </div>

                                            {(q.type === "multiple-choice" ||
                                                q.type === "multi-select" ||
                                                q.type === "true-false") && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <strong className="dark:text-gray-100">
                                                            Options
                                                        </strong>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                addOption(qi)
                                                            }
                                                            className="text-sm text-blue-600 dark:text-sky-300"
                                                        >
                                                            Add option
                                                        </button>
                                                    </div>

                                                    <div className="space-y-2 max-h-80 overflow-auto">
                                                        {q.options.map(
                                                            (opt, oi) => (
                                                                <div
                                                                    key={oi}
                                                                    className="flex items-start gap-2 border rounded p-2 bg-white dark:bg-[#002451] border-gray-300 dark:border-[#001c40]"
                                                                >
                                                                    {q.type ===
                                                                        "multiple-choice" ||
                                                                    q.type ===
                                                                        "true-false" ? (
                                                                        <input
                                                                            type="radio"
                                                                            name={`correct-${qi}`}
                                                                            checked={
                                                                                !!opt.correct
                                                                            }
                                                                            onChange={() =>
                                                                                setSingleCorrect(
                                                                                    qi,
                                                                                    oi,
                                                                                )
                                                                            }
                                                                            aria-label={`Mark option ${oi + 1} correct`}
                                                                            className="accent-blue-600 dark:accent-sky-300 mt-1"
                                                                        />
                                                                    ) : (
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={
                                                                                !!opt.correct
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                update(
                                                                                    `questions.${qi}.options.${oi}.correct`,
                                                                                    e
                                                                                        .target
                                                                                        .checked,
                                                                                )
                                                                            }
                                                                            aria-label={`Toggle option ${oi + 1} correct`}
                                                                            className="accent-blue-600 dark:accent-sky-300 mt-1"
                                                                        />
                                                                    )}

                                                                    <input
                                                                        value={
                                                                            opt.text
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            update(
                                                                                `questions.${qi}.options.${oi}.text`,
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className="flex-1 border rounded p-2 bg-white text-gray-900 dark:bg-[#001c40] dark:text-gray-100 border-gray-300 dark:border-[#001c40] outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-sky-500"
                                                                        placeholder={`Option ${oi + 1}`}
                                                                        disabled={
                                                                            q.type ===
                                                                            "true-false"
                                                                        }
                                                                    />

                                                                    <div className="flex flex-col items-end gap-1">
                                                                        {opt.correct && (
                                                                            <span className="text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 px-2 py-1 rounded">
                                                                                Correct
                                                                            </span>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                removeOption(
                                                                                    qi,
                                                                                    oi,
                                                                                )
                                                                            }
                                                                            className="text-red-600 dark:text-red-400"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-sm dark:text-gray-200">
                                                    Hint (optional)
                                                </label>
                                                <input
                                                    value={q.hint}
                                                    onChange={(e) =>
                                                        update(
                                                            `questions.${qi}.hint`,
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full border rounded p-2 bg-white text-gray-900 dark:bg-[#001c40] dark:text-gray-100 border-gray-300 dark:border-[#001c40] outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-sky-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 border rounded bg-white dark:bg-transparent border-gray-300 dark:border-[#001c40] text-gray-800 dark:text-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60 dark:bg-blue-500"
                            >
                                {submitting ? "Saving..." : "Save changes"}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default EditModal;
