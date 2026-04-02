import { Router } from "express";

import {
	createSubmission,
	listMySubmissions,
	uploadResumeAndExtractSkills,
} from "../controllers/questionController.js";
import { authenticate } from "../middleware/authenticate.js";
import { handleUploadResume } from "../middleware/uploadResume.js";
import { validate } from "../middleware/validate.js";
import { createSubmissionSchema } from "../validators/questionSchemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const questionRouter = Router();

questionRouter.post("/submissions", authenticate, validate(createSubmissionSchema), asyncHandler(createSubmission));
questionRouter.get("/submissions/me", authenticate, asyncHandler(listMySubmissions));
questionRouter.post(
	"/resume/skills",
	authenticate,
	handleUploadResume,
	asyncHandler(uploadResumeAndExtractSkills),
);

export default questionRouter;
