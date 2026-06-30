import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { extname, join } from "node:path";
import { Router } from "express";
import multer from "multer";
import { authorize, protect } from "../middlewares/auth.js";
import { createApplication, getApplicationByNumber, listApplications } from "../controllers/application.controller.js";

const uploadDirectory = join(process.cwd(), "uploads", "applications");
if (!existsSync(uploadDirectory)) {
  mkdirSync(uploadDirectory, { recursive: true });
}

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => {
    const extension = extname(file.originalname).toLowerCase() || ".jpg";
    callback(null, `${Date.now()}-${randomUUID()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      return callback(new Error("Uploaded files must be JPG, PNG, or WEBP"));
    }
    callback(null, true);
  }
});

const router = Router();

router.get("/", protect, authorize("ADMIN"), listApplications);
router.post("/", upload.fields([{ name: "passportPhoto", maxCount: 1 }, { name: "fayadaDigitalId", maxCount: 1 }]), createApplication);
router.get("/:applicationNumber", getApplicationByNumber);

export default router;

