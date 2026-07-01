import { Router } from "express";
import multer from "multer";
import { authorize, protect } from "../middlewares/auth.js";
import { createApplication, getApplicationByNumber, listApplications } from "../controllers/application.controller.js";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      return callback(new Error("Uploaded files must be JPG, PNG, or WEBP"));
    }
    callback(null, true);
  }
});

function handleApplicationUpload(req, res, next) {
  upload.fields([{ name: "passportPhoto", maxCount: 1 }, { name: "fayadaDigitalId", maxCount: 1 }])(req, res, (error) => {
    if (!error) return next();

    error.statusCode = 400;
    if (error.code === "LIMIT_FILE_SIZE") {
      error.message = "Each compressed image must be 2 MB or smaller.";
    }
    return next(error);
  });
}

const router = Router();

router.get("/", protect, authorize("ADMIN"), listApplications);
router.post("/", handleApplicationUpload, createApplication);
router.get("/:applicationNumber", getApplicationByNumber);

export default router;