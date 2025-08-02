const Pathology = require("../models/pathology.model");
const Module = require("../models/module.model");
const logger = require("../config/logger");
const path = require("path");
const fs = require("fs");

// get Pathologies
async function getPathologies(req, res) {
  try {
    let getPathologies = await Pathology.find({});
    if (!getPathologies) {
      logger.info("Pathologies Not found");
      res.status(404).json({ message: "Not Found" });
    }

    logger.info("Got Pathologies Successfully");
    res.status(200).json({
      message: "Got Pathologies Successfully",
      data: getPathologies,
    });
  } catch (err) {
    logger.error(`Error Internal Server Error message: ${err}`);
    res.status(404).json({ message: "Not Found" });
  }
}

async function getPathologyImages(req, res) {
  try {
    const getPathologies = await Pathology.findById(req?.query?.pathologyId);

    if (!getPathologies) {
      logger.info("Image for Pathology not found");
      return res.status(404).json({ message: "Pathology Not Found" });
    }

    const imagePath = path.join(__dirname, "..", getPathologies.imageUrl);

    if (!fs.existsSync(imagePath)) {
      logger.info("Image not found in the upload folder");
      return res.status(404).json({ message: "Image Not Found" });
    }

    res.set("Content-Type", "image/jpeg");
    res.sendFile(imagePath);
  } catch (err) {
    logger.error(`Error Internal Server Error message: ${err}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
}

async function createPathologies(req, res) {
  try {
    let getModules = await Module.findById(req.query?.moduleId.trim());
    const imagePath = req.file ? `/uploads/${req.file?.filename}` : null;

    let getPathologies = await Pathology.create({
      pathologyName: req.body?.pathologyName,
      description: req.body?.description,
      moduleId: getModules?._id,
      imageUrl: imagePath,
    });

    await getPathologies.save();

    if (!getPathologies) {
      logger.info(
        "Couldn't create Pathology due to bad field data type request"
      );
      res.status(400).json({ message: "Bad Request" });
    }

    logger.info("Pathology created successfully");
    res.status(200).json({
      message: "Pathologies Created Successfully",
      data: getPathologies,
    });
  } catch (err) {
    logger.error(`Error Internal Server Error message: ${err}`);
    res.status(404).json({ message: "Not Found", error: err });
  }
}

async function updatePathologies(req, res) {
  try {
    let updateModules = await Module.findByIdAndUpdate(req.query?.id, {
      moduleName: req.body?.moduleName,
      description: req.body?.description,
    });
    // await getModules.save();
    if (!getModules) {
      res.status(400).json({ message: "Bad Request" });
    }

    res.status(200).json({
      message: "Modules Updated Successfully",
      data: getModules,
    });
  } catch (err) {
    res.status(500).json({ message: "Not Found to update modules" });
  }
}
async function getPathologiesByModule(req, res) {
  try {
    const { moduleId } = req.query;
    if (!moduleId) {
      return res.status(400).json({ message: "Module ID is required" });
    }
    const pathologies = await Pathology.find({ moduleId });
    if (!pathologies || pathologies.length === 0) {
      logger.info(`No pathologies found for module ID: ${moduleId}`);
      return res
        .status(404)
        .json({ message: "No pathologies found for this module" });
    }
    logger.info(
      `Successfully retrieved pathologies for module ID: ${moduleId}`
    );
    res.status(200).json({
      message: "Got Pathologies for module Successfully",
      data: pathologies,
    });
  } catch (err) {
    logger.error(`Error getting pathologies by module: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
}

module.exports = {
  getPathologies,
  createPathologies,
  updatePathologies,
  getPathologyImages,
  getPathologiesByModule,
};
