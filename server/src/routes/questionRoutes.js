import { Router } from "express";

import { createSubmission, listMySubmissions } from "../controllers/questionController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { createSubmissionSchema } from "../validators/questionSchemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const questionRouter = Router();

questionRouter.post("/submissions", authenticate, validate(createSubmissionSchema), asyncHandler(createSubmission));
questionRouter.get("/submissions/me", authenticate, asyncHandler(listMySubmissions));

export default questionRouter;
