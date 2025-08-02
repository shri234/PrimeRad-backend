// controllers/module.controller.js
const Module = require("../models/module.model");
const Pathology = require("../models/pathology.model"); // <-- Import Pathology model
const logger = require("../config/logger");

async function getModules(req, res) {
  try {
    let getModules = await Module.find({}, { moduleName: 1 });
    if (!getModules) {
      logger.info("Couldn't find any modules");
      res.status(404).json({ message: "Not Found" });
    }
    res
      .status(200)
      .json({ message: "Got Modules Successfully", data: getModules });
  } catch (err) {
    logger.error(`Error Modules Not Found message: ${err}`);
    res.status(404).json({ message: "Not Found" });
  }
}

async function getModulesWithPathologyCount(req, res) {
  try {
    const modules = await Module.aggregate([
      {
        $lookup: {
          from: "pathologies",
          localField: "_id",
          foreignField: "moduleId",
          as: "pathologies",
        },
      },
      {
        $addFields: {
          totalPathologiesCount: { $size: "$pathologies" },
          pathologyNames: "$pathologies.pathologyName",
        },
      },

      {
        $project: {
          moduleName: 1,
          totalPathologiesCount: 1,
          randomPathologyNames: {
            $let: {
              vars: {
                randomIndex: {
                  $floor: {
                    $multiply: [{ $size: "$pathologyNames" }, { $rand: {} }],
                  },
                },
              },
              in: {
                $slice: ["$pathologyNames", "$$randomIndex", 3],
              },
            },
          },
        },
      },
    ]);

    console.log(modules);

    if (!modules || modules.length === 0) {
      logger.info("Couldn't find any modules to count pathologies for.");
      return res.status(200).json({ message: "No modules found", data: [] });
    }

    logger.info(
      "Got Modules with Pathology Count and Sample Pathologies Successfully"
    );
    res.status(200).json({
      message:
        "Got Modules with Pathology Count and Sample Pathologies Successfully",
      data: modules,
    });
  } catch (err) {
    logger.error(
      `Error getting modules with pathology count and sample pathologies: ${err.message}`
    );
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
}

async function createModules(req, res) {
  try {
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    let getModules = await Module.create({
      moduleName: req.body?.moduleName,
      description: req.body?.description,
      imageUrl: imagePath,
    });

    await getModules.save();

    if (!getModules) {
      logger.info("Input fields are not all required");
      return res.status(400).json({ message: "Bad Request" });
    }

    logger.info("Modules created successfully");
    console.log(getModules);

    return res.status(200).json({
      message: "Modules Created Successfully",
      data: getModules,
    });
  } catch (err) {
    console.log(err);
    logger.error(`Error internal server error message: ${err}`);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message }); // Changed 404 to 500 for server error
  }
}

async function updateModules(req, res) {
  try {
    const { id } = req.query;
    if (!id) {
      return res
        .status(400)
        .json({ message: "Module ID is required for update." });
    }

    const updatedData = {
      moduleName: req.body?.moduleName,
      description: req.body?.description,
    };

    const updatedModule = await Module.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    if (!updatedModule) {
      logger.info(`Module with ID ${id} not found for update.`);
      return res.status(404).json({ message: "Module not found to update" });
    }

    logger.info("Modules Updated Successfully");
    res.status(200).json({
      message: "Modules Updated Successfully",
      data: updatedModule,
    });
  } catch (err) {
    logger.error(`Error in updating module: ${err.message}`);
    res
      .status(500)
      .json({ message: "Error in updating module", error: err.message }); // Use 500 for server errors
  }
}

module.exports = {
  getModules,
  getModulesWithPathologyCount, // <-- Export the new function
  createModules,
  updateModules,
  // deleteModules (if you have one)
};
