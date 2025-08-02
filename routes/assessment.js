const express = require("express");
const router = express.Router();
const {
  createAssessment,
  getAllAssessments,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
  submitAnswer,
  getAssessmentByModule,
  getTopUsers,
  getUserPoints,
} = require("../controllers/assessment.controller");
const { upload } = require("../config/uploadImage");

router.post("/create", upload.single("image"), createAssessment);
router.get("/get", getAllAssessments);
router.get("/get/:id", getAssessmentById);
router.get("/getTopUsers", getTopUsers);
router.get("/getUserPoints", getUserPoints);
router.get("/getByModule", getAssessmentByModule);
router.put("/update/:id", upload.single("image"), updateAssessment);
router.delete("/delete/:id", deleteAssessment);
// router.delete("/delete/:id", deleteAssessment);

router.post("/answer", submitAnswer); // User submits answer
// router.get("/progress/:userId", getUserProgress); // Get points & progress

module.exports = router;
