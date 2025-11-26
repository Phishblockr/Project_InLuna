import asyncHandler from "../../middlewares/asyncHandler.js";
import { getQuizModel } from "../../models/trainingPlatform/quizModel.js";
import mongoose, { set } from "mongoose";

// Helper to clone quiz without answers
function sanitizeQuizForClient(quizDoc) {
  if (!quizDoc) return null;
  const q = quizDoc.toObject
    ? quizDoc.toObject()
    : JSON.parse(JSON.stringify(quizDoc));
  if (Array.isArray(q.questions)) {
    q.questions = q.questions.map((qq) => {
      const { correct, explanation, ...rest } = qq;
      // also remove per-option explanations and weights if you prefer; keep options text/media
      const options = (rest.options || []).map((opt) => ({
        text: opt.text,
        media: opt.media,
      }));
      return { ...rest, options };
    });
  }
  return q;
}

// Helper function to normalize JSON into Quiz payload
function buildQuizPayloadFromJson(json, userId) {
  const {
    title,
    description,
    department,
    questions,
    totalPoints,
    difficulty,
    tags,
    timeLimit,
    shuffleQuestions,
    published,
    settings,
    archived,
  } = json;

  if (!title) {
    throw new Error("Quiz title is required");
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Quiz must contain at least one question");
  }

  return {
    title,
    description,
    department,
    questions,
    totalPoints,
    difficulty,
    tags,
    timeLimit,
    shuffleQuestions,
    published,
    settings,
    archived,
    createdBy: userId,
  };
}

export const createQuiz = asyncHandler(async (req, res) => {
  const Quiz = await getQuizModel();
  const payload = req.body || {};
  // ensure createdBy from token
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  payload.createdBy = req.user.userId;

  if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Quiz must contain at least one question",
    });
  }

  const quiz = new Quiz(payload);
  await quiz.save();
  res.status(201).json({ success: true, quiz });
});

export const getQuiz = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid quiz id" });
  }
  const Quiz = await getQuizModel();
  const quiz = await Quiz.findById(id);
  if (!quiz)
    return res.status(404).json({ success: false, message: "Quiz not found" });

  // sanitize: do not send correct answers
  const sanitized = sanitizeQuizForClient(quiz);
  res.status(200).json({ success: true, quiz: sanitized });
});

export const getQuizAdm = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid quiz id" });
  }
  const Quiz = await getQuizModel();
  const quiz = await Quiz.findById(id);
  if (!quiz)
    return res.status(404).json({ success: false, message: "Quiz not found" });

  // sanitize: do not send correct answers
  res.status(200).json({ success: true, quiz });
});

// Public endpoint: list quizzes in select-friendly shape for all users
export const listQuizzesForSelect = asyncHandler(async (req, res) => {
  const Quiz = await getQuizModel();

  // Return full quiz documents
  const docs = await Quiz.find(
    { published: true, archived: false } // no projection => returns all fields
  )
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, data: docs });
});

export const fetchAllQuizes = asyncHandler(async (req, res) => {
  const Quiz = await getQuizModel();

  // Fetch ALL quizzes — no filters
  const docs = await Quiz.find({}).sort({ createdAt: -1 }).lean();

  return res.status(200).json({ success: true, data: docs });
});

// POST /check/:quizId
// body: { answers: [{ questionId, selected }] }
export const checkAnswers = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const { answers } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(quizId)) {
    return res.status(400).json({ success: false, message: "Invalid quiz id" });
  }

  const Quiz = await getQuizModel();
  const quiz = await Quiz.findById(quizId);
  if (!quiz)
    return res.status(404).json({ success: false, message: "Quiz not found" });

  const qMap = new Map();
  quiz.questions.forEach((q) => qMap.set(String(q._id), q));

  const submitted = Array.isArray(answers) ? answers : [];
  const detail = [];
  let totalScore = 0;
  // compute totalPoints
  const totalPoints =
    quiz.totalPoints || quiz.questions.reduce((s, q) => s + (q.points || 0), 0);

  for (const question of quiz.questions) {
    const qid = String(question._id);
    const submittedAns = submitted.find((a) => String(a.questionId) === qid);
    const qPoints = Number(question.points || 0);
    let qScore = 0;
    let status = "unanswered";
    let manual = false;

    const qType = question.type || "multiple-choice";

    if (
      !submittedAns ||
      submittedAns.selected === undefined ||
      submittedAns.selected === null
    ) {
      // unanswered
      detail.push({ questionId: qid, score: 0, points: qPoints, status });
      continue;
    }

    const selected = submittedAns.selected;

    if (qType === "open-ended") {
      // can't auto-grade
      manual = true;
      status = "manual_review";
      detail.push({
        questionId: qid,
        score: null,
        points: qPoints,
        status,
        manual: true,
      });
      continue;
    }

    if (qType === "multiple-choice" || qType === "true-false") {
      const correct = question.correct; // expected number
      const correctIndex = Array.isArray(correct) ? correct[0] : correct;
      if (String(correctIndex) === String(selected)) {
        qScore = qPoints;
        status = "correct";
      } else {
        qScore = 0;
        status = "incorrect";
      }
    } else if (qType === "multi-select") {
      // correct may be array of indices
      const correctArr = Array.isArray(question.correct)
        ? question.correct.map(String)
        : [String(question.correct)];
      // build weights
      const optionWeights = (question.options || []).map((o) =>
        Number(o.weight || 1)
      );
      const totalCorrectWeight =
        correctArr.reduce((acc, idxStr) => {
          const idx = Number(idxStr);
          return acc + (optionWeights[idx] || 0);
        }, 0) || 0;

      const selectedArr = Array.isArray(selected)
        ? selected.map(String)
        : [String(selected)];
      let selectedCorrectWeight = 0;
      for (const s of selectedArr) {
        if (correctArr.includes(s)) {
          const idx = Number(s);
          selectedCorrectWeight += optionWeights[idx] || 0;
        }
      }

      // score proportionally to correctly selected weight. Do not penalize incorrect selections here.
      if (totalCorrectWeight > 0) {
        qScore = qPoints * (selectedCorrectWeight / totalCorrectWeight);
      } else {
        qScore = 0;
      }
      status =
        qScore >= qPoints ? "correct" : qScore > 0 ? "partial" : "incorrect";
      // round
      qScore = Math.round(qScore * 100) / 100;
    }

    totalScore += qScore;
    detail.push({ questionId: qid, score: qScore, points: qPoints, status });
  }

  // round totalScore
  totalScore = Math.round(totalScore * 100) / 100;

  res.status(200).json({ success: true, totalScore, totalPoints, detail });
});

export const deleteQuiz = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid quiz id" });
  }
  const Quiz = await getQuizModel();
  const dq = await Quiz.findByIdAndDelete(id);
  if (!dq)
    return res.status(404).json({ success: false, message: "Quiz not found" });
  res.status(200).json({ success: true, message: "Quiz deleted" });
});

export const addQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params; // quiz id
  const payload = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid quiz id" });
  }

  const Quiz = await getQuizModel();
  const quiz = await Quiz.findById(id);
  if (!quiz)
    return res.status(404).json({ success: false, message: "Quiz not found" });

  // push the question; rely on mongoose validation
  quiz.questions.push(payload);
  await quiz.save();

  const added = quiz.questions[quiz.questions.length - 1];
  res.status(201).json({ success: true, question: added });
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  const { id, questionId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(id) ||
    !mongoose.Types.ObjectId.isValid(questionId)
  ) {
    return res.status(400).json({ success: false, message: "Invalid id" });
  }

  const Quiz = await getQuizModel();
  const quiz = await Quiz.findById(id);
  if (!quiz)
    return res.status(404).json({ success: false, message: "Quiz not found" });

  const idx = quiz.questions.findIndex(
    (q) => String(q._id) === String(questionId)
  );
  if (idx < 0)
    return res
      .status(404)
      .json({ success: false, message: "Question not found" });

  quiz.questions.splice(idx, 1);
  await quiz.save();

  res.status(200).json({ success: true, message: "Question removed" });
});

export const importQuizfromJsonText = asyncHandler(async (req, res) => {
  const Quiz = await getQuizModel();

  if (!req.user || !req.user.userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const raw = req.body;

  try {
    const payload = buildQuizPayloadFromJson(raw, req.user.userId);
    const quiz = new Quiz(payload);
    await quiz.save();
    return res.status(201).json({ success: true, quiz });
  } catch (err) {
    return res
      .status(400)
      .json({ success: false, message: err.message || "Invalid quiz JSON" });
  }
});

export const importQuizfromFile = asyncHandler(async (req, res) => {
  const Quiz = await getQuizModel();

  if (!req.user || !req.user.userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }

  let parsed;

  try {
    const text = req.file.buffer.toString("utf8");
    parsed = JSON.parse(text);
  } catch (err) {
    return res
      .status(400)
      .json({ success: false, message: "Uploaded file is not valid JSON" });
  }

  try {
    const payload = buildQuizPayloadFromJson(parsed, req.user.userId);
    const quiz = new Quiz(payload);
    await quiz.save();
    return res.status(201).json({ success: true, quiz });
  } catch (err) {
    return res
      .status(400)
      .json({ success: false, message: err.message || "Invalid quiz JSON" });
  }
});

export const updateQuiz = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid quiz id" });
  }

  const Quiz = await getQuizModel();
  const quiz = await Quiz.findById(id);
  if (!quiz) {
    return res.status(404).json({ success: false, message: "Quiz not found" });
  }

  const payload = req.body || {};

  const updatableFields = [
    "title",
    "description",
    "department",
    "difficulty",
    "tags",
    "published",
    "questions",
    "shuffleQuestions",
    "timeLimit",
    "archived",
    "settings",
  ];

  updatableFields.forEach((field) => {
    if (payload[field] !== undefined) {
      quiz[field] = payload[field];
    }
  });

  await quiz.save();

  return res.status(200).json({ success: true, quiz });
});
