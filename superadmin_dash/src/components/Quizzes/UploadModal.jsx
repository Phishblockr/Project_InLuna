import React, { useState } from "react";
import { useAuth } from "../../utils/AuthProvider";
import { importQuizFromFile, importQuizFromJson } from "../../utils/quizApi";

// Reusable Requirements block with dark mode styles
const Requirements = () => (
    <div className="space-y-2 text-xs text-gray-700 dark:text-gray-200">
        <p className="font-semibold">Required JSON structure</p>
        <ul className="list-disc ml-4 space-y-0.5">
            <li>
                <span className="font-semibold">Top-level (quiz):</span>{" "}
                <code className="bg-gray-100 px-1 rounded dark:bg-[#001c40]">
                    title
                </code>{" "}
                (string, required),{" "}
                <code className="bg-gray-100 px-1 rounded dark:bg-[#001c40]">
                    questions
                </code>{" "}
                (array, at least 1). Optional:{" "}
                <code className="bg-gray-100 px-1 rounded dark:bg-[#001c40]">
                    description
                </code>
                ,{" "}
                <code className="bg-gray-100 px-1 rounded dark:bg-[#001c40]">
                    difficulty
                </code>{" "}
                ("easy" | "medium" | "hard"),{" "}
                <code className="bg-gray-100 px-1 rounded dark:bg-[#001c40]">
                    tags
                </code>
                ,{" "}
                <code className="bg-gray-100 px-1 rounded dark:bg-[#001c40]">
                    timeLimit
                </code>
                ,{" "}
                <code className="bg-gray-100 px-1 rounded dark:bg-[#001c40]">
                    shuffleQuestions
                </code>
                ,{" "}
                <code className="bg-gray-100 px-1 rounded dark:bg-[#001c40]">
                    published
                </code>
                .
            </li>
            <li>
                <span className="font-semibold">Each question:</span>{" "}
                <code className="bg-gray-100 px-1 rounded dark:bg-[#001c40]">
                    question
                </code>{" "}
                (string, required),{" "}
                <code className="bg-gray-100 px-1 rounded dark:bg-[#001c40]">
                    options
                </code>{" "}
                (array of ≥ 2 with{" "}
                <code className="bg-gray-100 px-1 rounded dark:bg-[#001c40]">
                    text
                </code>
                ),{" "}
                <code className="bg-gray-100 px-1 rounded dark:bg-[#001c40]">
                    correct
                </code>{" "}
                (index number or array of indices). Optional:{" "}
                <code className="bg-gray-100 px-1 rounded dark:bg-[#001c40]">
                    type
                </code>
                ,{" "}
                <code className="bg-gray-100 px-1 rounded dark:bg-[#001c40]">
                    points
                </code>
                ,{" "}
                <code className="bg-gray-100 px-1 rounded dark:bg-[#001c40]">
                    hint
                </code>
                ,{" "}
                <code className="bg-gray-100 px-1 rounded dark:bg-[#001c40]">
                    shuffleOptions
                </code>
                ,{" "}
                <code className="bg-gray-100 px-1 rounded dark:bg-[#001c40]">
                    explanation
                </code>
                .
            </li>
            <li>
                <span className="font-semibold">Indices:</span>{" "}
                <code className="bg-gray-100 px-1 rounded dark:bg-[#001c40]">
                    correct
                </code>{" "}
                uses <strong>0-based</strong> indices.
            </li>
        </ul>

        <details className="mt-1 bg-gray-50 border border-gray-200 rounded p-2 dark:bg-[#001c40] dark:border-[#001c40]">
            <summary className="cursor-pointer font-semibold dark:text-gray-100">
                Example JSON + AI Prompt
            </summary>

            <div className="mt-2 space-y-1">
                <p className="font-semibold dark:text-gray-100">
                    Example JSON:
                </p>
                <pre className="whitespace-pre-wrap text-[11px] bg-white border rounded p-2 overflow-x-auto dark:bg-[#001c40] dark:text-gray-100 dark:border-[#001c40]">
                    {`{
  "title": "Basic Math Quiz",
  "description": "Simple arithmetic questions",
  "difficulty": "easy",
  "tags": ["math", "arithmetic"],
  "timeLimit": 600,
  "shuffleQuestions": true,
  "questions": [
    {
      "question": "What is 2 + 2?",
      "type": "multiple-choice",
      "points": 5,
      "options": [
        { "text": "3" },
        { "text": "4" },
        { "text": "5" }
      ],
      "correct": 1,
      "hint": "Add 2 and 2.",
      "shuffleOptions": true,
      "explanation": "2 + 2 = 4."
    }
  ]
}`}
                </pre>

                <p className="font-semibold pt-1 dark:text-gray-100">
                    Prompt for Gen AI:
                </p>
                <pre className="whitespace-pre-wrap text-[11px] bg-white border rounded p-2 dark:bg-[#001c40] dark:text-gray-100 dark:border-[#001c40]">
                    {`Create a valid quiz JSON with:
- "title": string (required)
- "questions": array of at least 1 question (required)
Each question:
- "question": string (required)
- "options": array of 2+ objects each with "text": string
- "correct": number OR array of numbers (0-based index)
Optional fields allowed: description, difficulty ("easy"/"medium"/"hard"), tags, points, hints, explanations.`}
                </pre>
            </div>
        </details>
    </div>
);

export const UploadModal = ({ isOpen, onClose, onCreated }) => {
    const { getToken } = useAuth();
    const [mode, setMode] = useState("json");
    const [jsonText, setJsonText] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const token = getToken();

    if (!isOpen) return null;

    const resetState = () => {
        setJsonText("");
        setFile(null);
        setError("");
        setMode("json");
    };

    const handleClose = () => {
        if (!loading) {
            resetState();
            onClose && onClose();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            let result;

            if (mode === "json") {
                if (!jsonText.trim())
                    throw new Error("Paste valid JSON first.");
                const parsed = JSON.parse(jsonText);
                result = await importQuizFromJson(parsed, token);
            } else {
                if (!file) throw new Error("Please upload a .json file.");
                result = await importQuizFromFile(file, token);
            }

            const quiz = result.quiz || result.data || result;
            onCreated && onCreated(quiz);
            handleClose();
        } catch (err) {
            const msg =
                err?.body?.message || err?.message || "Failed to import quiz.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            {/* Panel with dark theme and scoped scrollbar */}
            <div
                id="upload-modal"
                className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 dark:bg-[#002451] dark:border-[#001c40] dark:text-gray-100"
            >
                {/* Scoped minimal scrollbar styles (WebKit + Firefox) */}
                <style>{`
          /* Firefox */
          #upload-modal { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.12) transparent; }
          :root .dark #upload-modal { scrollbar-color: rgba(255,255,255,0.18) transparent; }

          /* WebKit */
          #upload-modal::-webkit-scrollbar { width: 10px; height: 10px; }
          #upload-modal::-webkit-scrollbar-track { background: transparent; }
          #upload-modal::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box; }
          :root .dark #upload-modal::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); }

          /* Smaller inner scrollers */
          #upload-modal .overflow-y-auto, #upload-modal pre, #upload-modal textarea { scrollbar-width: thin; }
        `}</style>

                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#001c40]">
                    <h2 className="text-lg font-semibold dark:text-gray-100">
                        Import Quiz
                    </h2>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                        aria-label="Close import modal"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="px-4 py-3 space-y-4">
                        {/* Mode toggle */}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className={`flex-1 px-3 py-2 text-sm rounded border ${
                                    mode === "json"
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-gray-700 border-gray-300 dark:bg-[#001c40] dark:text-gray-100 dark:border-[#001c40]"
                                }`}
                                onClick={() => setMode("json")}
                                disabled={loading}
                            >
                                Paste JSON
                            </button>

                            <button
                                type="button"
                                className={`flex-1 px-3 py-2 text-sm rounded border ${
                                    mode === "file"
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-gray-700 border-gray-300 dark:bg-[#001c40] dark:text-gray-100 dark:border-[#001c40]"
                                }`}
                                onClick={() => setMode("file")}
                                disabled={loading}
                            >
                                Upload File
                            </button>
                        </div>

                        {/* JSON Mode */}
                        {mode === "json" ? (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Quiz JSON
                                </label>

                                <textarea
                                    className="w-full h-52 border rounded px-3 py-2 text-sm font-mono resize-none focus:ring-blue-500 bg-white text-gray-900 border-gray-300 dark:bg-[#001c40] dark:text-gray-100 dark:border-[#001c40] dark:focus:ring-sky-500"
                                    placeholder='{"title": "My Quiz", "questions": [...]}'
                                    value={jsonText}
                                    onChange={(e) =>
                                        setJsonText(e.target.value)
                                    }
                                    disabled={loading}
                                />

                                <Requirements />
                            </div>
                        ) : (
                            // FILE Mode
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                    JSON File
                                </label>

                                <input
                                    type="file"
                                    accept=".json,application/json"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    disabled={loading}
                                    className="w-full text-sm bg-white text-gray-900 dark:bg-[#001c40] dark:text-gray-100"
                                />

                                {file && (
                                    <p className="text-xs text-gray-600 dark:text-gray-300">
                                        Selected file:{" "}
                                        <strong className="dark:text-gray-100">
                                            {file.name}
                                        </strong>
                                    </p>
                                )}

                                <p className="text-xs text-gray-500 dark:text-gray-300">
                                    Upload a .json file containing your quiz.
                                </p>

                                <Requirements />
                            </div>
                        )}

                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 dark:bg-[#420000] dark:text-red-200 dark:border-[#5a1e1e]">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-[#001c40]">
                        <button
                            onClick={handleClose}
                            type="button"
                            className="px-4 py-2 border rounded text-gray-700 bg-white dark:bg-transparent dark:text-gray-100 border-gray-300 dark:border-[#001c40]"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
                        >
                            {loading ? "Importing..." : "Import"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
