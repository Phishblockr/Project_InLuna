import mongoose from "mongoose";
import { getDb } from "../../admindb.js";
const { Schema } = mongoose;

const OptionSchema = new Schema({
  text: { type: String, required: true },
  media: {
    url: String,
    type: String, // 'image' | 'video' | 'audio'
  },
  // optional per-option weight (useful for partial credit)
  weight: { type: Number, default: 1 },
  explanation: { type: String }, // optional per-option feedback
});

const QuestionSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    options: {
      type: [OptionSchema],
      required: true,
      validate: (v) => v && v.length >= 2,
    },
    // allow multiple correct answers (array) or single (number)
    correct: {
      type: Schema.Types.Mixed,
      required: true,
      validate: function (val) {
        if (Array.isArray(val)) return val.length > 0;
        return typeof val === "number";
      },
    },
    type: {
      type: String,
      enum: ["multiple-choice", "multi-select", "true-false", "open-ended"],
      default: "multiple-choice",
    },
    points: { type: Number, default: 10 },
    hint: { type: String },
    shuffleOptions: { type: Boolean, default: false },
    timeLimit: { type: Number }, // seconds for this question (optional)
    explanation: { type: String }, // overall explanation
  },
  { _id: true }
);

const QuizSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" }, // optional relation
    department: { type: String }, // or ObjectId ref if you have a Dept model
    questions: {
      type: [QuestionSchema],
      required: true,
      validate: (q) => q && q.length > 0,
    },
    totalPoints: { type: Number }, // optional: compute on save
    difficulty: { type: String, enum: ["easy", "medium", "hard"] },
    tags: { type: [String], default: [] },
    timeLimit: { type: Number }, // total quiz time (seconds)
    shuffleQuestions: { type: Boolean, default: false },
    published: { type: Boolean, default: false },
    settings: { type: Schema.Types.Mixed, default: {} },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// helper: compute totalPoints on save
QuizSchema.pre("save", function (next) {
  if (!this.totalPoints && Array.isArray(this.questions)) {
    this.totalPoints = this.questions.reduce(
      (acc, q) => acc + (q.points || 0),
      0
    );
  }
  next();
});

// export schema so other modules can reuse if needed
export default QuizSchema;

export const getQuizModel = async () => {
  const adminDb = await getDb();
  return adminDb.models.Quiz || adminDb.model("Quiz", QuizSchema);
};
