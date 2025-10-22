const Faculty = require("../models/faculty.model");
const upload = require("../config/uploadImage");

async function createFaculty(req, res) {
  try {
    const { name, location, country, email, description } = req.body;
    const image = req.file ? req.file.path : null;
    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }
    const newFaculty = new Faculty({
      name,
      location,
      country,
      email,
      description,
      image,
    });

    await newFaculty.save();
    res
      .status(201)
      .json({ message: "Faculty created successfully", data: newFaculty });
  } catch (err) {
    res.status(500).json({ message: "Failed to create faculty", error: err });
  }
}

// Get all faculty members
async function getAllFaculty(req, res) {
  try {
    const faculty = await Faculty.find();
    res.status(200).json({ data: faculty });
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve faculty", error: err });
  }
}

// Get a single faculty member by ID
async function getFacultyById(req, res) {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }
    res.status(200).json({ data: faculty });
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve faculty", error: err });
  }
}

async function updateFaculty(req, res) {
  try {
    const { name, location, country, email, description } = req.body;
    const image = req.file ? req.file.path : req.body.image;

    const updatedFaculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      { name, location, country, email, description, image },
      { new: true }
    );

    if (!updatedFaculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }
    res
      .status(200)
      .json({ message: "Faculty updated successfully", data: updatedFaculty });
  } catch (err) {
    res.status(500).json({ message: "Failed to update faculty", error: err });
  }
}

// Delete a faculty member
async function deleteFaculty(req, res) {
  try {
    const deletedFaculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!deletedFaculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }
    res.status(200).json({ message: "Faculty deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete faculty", error: err });
  }
}

module.exports = {
  createFaculty,
  getAllFaculty,
  getFacultyById,
  updateFaculty,
  deleteFaculty,
};
