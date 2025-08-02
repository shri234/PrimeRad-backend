const Masterylevel = require("../models/masterylevels.model");

// get Mastery Levels
async function getMasteryLevels(req, res) {
  try {
    let getMasteryLevels = await Masterylevel.find({});
    if (!getMasteryLevels) {
      res.status(404).json({ message: "Not Found" });
    }
    res
      .status(200)
      .json({ message: "Got levels Successfully", data: getMasteryLevels });
  } catch (err) {
    res.status(404).json({ message: "Not Found" });
  }
}

async function createMasteryLevels(req, res) {
  try {
    let getMasteryLevels = await Masterylevel.create({
      levelName: req.body?.levelName,
      description: req.body?.description,
      points: req?.body?.points,
    });

    await getMasteryLevels.save();
    if (!getMasteryLevels) {
      res.status(400).json({ message: "Bad Request" });
    }
    res.status(200).json({
      message: "Mastery Level Created Successfully",
      data: getMasteryLevels,
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "Not Found" });
  }
}

async function updateCategories(req, res) {
  try {
    let updateCategories = await Category.findByIdAndUpdate(req.query.id, {
      categoryName: req.body?.categoryName,
      description: req.body?.description,
    });
    // await getCategories.save();
    if (!getCategories) {
      res.status(400).json({ message: "Bad Request" });
    }
    res.status(200).json({
      message: "Categories Updated Successfully",
      data: getCategories,
    });
  } catch (err) {
    res.status(500).json({ message: "Not Found to update categories" });
  }
}

module.exports = {
  getMasteryLevels,
  createMasteryLevels,
};
