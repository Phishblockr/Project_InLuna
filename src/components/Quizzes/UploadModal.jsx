import React, { useState } from "react";
import { useAuth } from "../../utils/AuthProvider";
import { importQuizFromFile, importQuizFromJson } from "../../utils/quizApi";

// 🔹 NEW: Extracted reuseable JSON requirements block
const Requirements = () => (
  <div className="space-y-2 text-[11px] text-gray-700">
    <p className="font-semibold">Required JSON structure</p>
    <ul className="list-disc ml-4 space-y-0.5">
      <li>
        <span className="font-semibold">Top-level (quiz):</span>{" "}
        <code>title</code> (string, required), <code>questions</code> (array, at
        least 1). Optional: <code>description</code>, <code>difficulty</code>{" "}
        ("easy" | "medium" | "hard"),
        <code>tags</code>, <code>timeLimit</code>, <code>shuffleQuestions</code>
        , <code>published</code>.
      </li>
      <li>
        <span className="font-semibold">Each question:</span>{" "}
        <code>question</code> (string, required),
        <code>options</code> (array of ≥ 2 with <code>text</code>),
        <code>correct</code> (index number or array of indices). Optional:{" "}
        <code>type</code>, <code>points</code>, <code>hint</code>,{" "}
        <code>shuffleOptions</code>, <code>explanation</code>.
      </li>
      <li>
        <span className="font-semibold">Indices:</span>
        <code>correct</code> uses <strong>0-based</strong> indices.
      </li>
    </ul>

    <details className="mt-1 bg-gray-50 border border-gray-200 rounded p-2">
      <summary className="cursor-pointer font-semibold">
        Example JSON + AI Prompt
      </summary>

      <div className="mt-2 space-y-1">
        <p className="font-semibold">Example JSON:</p>
        <pre className="whitespace-pre-wrap text-[10px] bg-white border rounded p-2 overflow-x-auto">
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

        <p className="font-semibold pt-1">Prompt for Gen AI:</p>
        <pre className="whitespace-pre-wrap text-[10px] bg-white border rounded p-2">
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
        if (!jsonText.trim()) throw new Error("Paste valid JSON first.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {/* 🔹 ADD SCROLL + HEIGHT CONSTRAINT */}
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">Import Quiz</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700"
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
                    : "bg-white text-gray-700 border-gray-300"
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
                    : "bg-white text-gray-700 border-gray-300"
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
                <label className="block text-sm font-medium text-gray-700">
                  Quiz JSON
                </label>

                <textarea
                  className="w-full h-52 border rounded px-3 py-2 text-sm font-mono resize-none focus:ring-blue-500"
                  placeholder='{"title": "My Quiz", "questions": [...]}'
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  disabled={loading}
                />

                {/* 🔹 REUSE REQUIREMENTS */}
                <Requirements />
              </div>
            ) : (
              // FILE Mode
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  JSON File
                </label>

                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => setFile(e.target.files[0])}
                  disabled={loading}
                  className="w-full text-sm"
                />

                {file && (
                  <p className="text-xs text-gray-600">
                    Selected file: <strong>{file.name}</strong>
                  </p>
                )}

                <p className="text-xs text-gray-500">
                  Upload a .json file containing your quiz.
                </p>

                {/* 🔹 SAME REQUIREMENTS SHOWN HERE */}
                <Requirements />
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 px-4 py-3 border-t">
            <button
              onClick={handleClose}
              type="button"
              className="px-4 py-2 border rounded text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {loading ? "Importing..." : "Import"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
