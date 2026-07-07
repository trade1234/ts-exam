import { Course } from "../models/Course.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeTraining(value = "") {
  return String(value).trim().replace(/\s+/g, " ").toLowerCase();
}

export function courseMatchesStudentTraining(course, user) {
  if (user?.role !== "STUDENT") return true;
  return normalizeTraining(course?.courseName) === normalizeTraining(user.trainingTaken);
}

export async function courseIdsForStudentTraining(user) {
  const trainingTaken = String(user?.trainingTaken || "").trim();
  if (!trainingTaken) return [];

  const courses = await Course.find({
    courseName: new RegExp(`^${escapeRegex(trainingTaken)}$`, "i")
  }).select("_id");

  return courses.map((course) => course._id);
}
