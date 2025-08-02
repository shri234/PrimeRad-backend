const express = require("express");
const router = express.Router();
const {
  createFaculty,
  getAllFaculty,
  getFacultyById,
  updateFaculty,
  deleteFaculty,
} = require("../controllers/faculty.controller");
const { upload } = require("../config/uploadImage");

// Create a new faculty member
router.post("/create", upload.single("image"), createFaculty);

// Get all faculty members
router.get("/get", getAllFaculty);

// Get a single faculty member by ID
router.get("/get/:id", getFacultyById);

// Update a faculty member
router.put("/update/:id", upload.single("image"), updateFaculty);

// Delete a faculty member
router.delete("/delete/:id", deleteFaculty);

module.exports = router;
