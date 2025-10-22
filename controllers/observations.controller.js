const Observation = require("../models/observations.model");
const UserVideoObservation = require("../models/uservideoobservation.model");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const DicomCases = require("../models/dicomcase.model");
const mongoose = require("mongoose");
const RecordedLectures = require("../models/recordedlecture.model");
const logger = require("../config/logger");

async function getObservations(req, res) {
  try {
    let getObservations = await Observation.find({
      resource_id: req?.query?.videoId,
    });
    if (!getObservations) {
      res.status(404).json({ message: "Not Found" });
    }
    res.status(200).json({
      message: "Got Observations Successfully",
      data: getObservations,
    });
  } catch (err) {
    res.status(404).json({ message: "Not Found" });
  }
}

async function createObservations(req, res) {
  try {
    const { observations, Module, sessionName, sessionId } = req.body;
    let createObservations = await Observation.create({
      observations,
      Module,
      sessionName,
      sessionId,
    });

    await createObservations.save();

    if (!createObservations) {
      res.status(400).json({ message: "Bad Request" });
    }

    res.status(200).json({
      message: "Observation Created Successfully",
      data: createObservations,
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "Not Found" });
  }
}

async function submitAnswers(req, res) {
  try {
    const token =
      req?.cookies?.jwt || req?.headers["authorization"]?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded?._id);
    let totalCorrectObservations = 0;

    req?.body?.answers.find(async (item) => {
      let checkAnswers = await Observation.findById(item?._id);

      if (checkAnswers?.correctAnswer == item?.answer) {
        totalCorrectObservations += checkAnswers?.points;
      }
    });
    if (!mongoose.Types.ObjectId.isValid(req?.query?.videoId)) {
      return res.status(400).json({ message: "Invalid videoId format" });
    }

    let findUserVideoObservation = await UserVideoObservation.findOne({
      userId: user?._id,
      videoId: new mongoose.Types.ObjectId(req?.query?.videoId),
    });

    if (findUserVideoObservation) {
      await UserVideoObservation.findOneAndUpdate(
        {
          userId: user._id,
          videoId: req?.query?.videoId,
        },
        {
          totalCorrect:
            totalCorrectObservations + findUserVideoObservation?.totalCorrect,
          totalAttempts: findUserVideoObservation?.totalAttempts + 1,
          score: findUserVideoObservation?.score + totalCorrectObservations,
        }
      );
    } else {
      let updateCategories = await UserVideoObservation.create({
        videoId: req?.query?.videoId,
        userId: user._id,
        totalCorrect: totalCorrectObservations,
        totalAttempts: 1,
        score: totalCorrectObservations,
      });

      await updateCategories.save();
    }
    // await getCategories.save();

    res.status(200).json({
      message: "Answers submitted Successfully. Please check score now!",
      //   data:,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Not Found to update Answers" });
  }
}

async function getScoreForAllResources(req, res) {
  try {
    let getObservations;
    if (req?.query?.sessionType === "Dicomcases") {
      getObservations = await DicomCases.aggregate([
        {
          $match: {
            difficulty: req?.query?.difficulty,
          },
        },
        {
          $lookup: {
            from: "uservideoobservations",
            localField: "_id",
            foreignField: "videoId",
            as: "scores",
          },
        },
        {
          $addFields: {
            totalScore: {
              $sum: "$scores.score",
            },
          },
        },
      ]);
    } else if (req?.query?.sessionType === "All") {
      const [getDicomCases, getRecordedLectures] = await Promise.all([
        DicomCases.aggregate([
          {
            $match: {
              difficulty: req?.query?.difficulty,
            },
          },
          {
            $lookup: {
              from: "uservideoobservations",
              localField: "_id",
              foreignField: "videoId",
              as: "scores",
            },
          },
          {
            $addFields: {
              totalScore: {
                $sum: "$scores.score",
              },
            },
          },
        ]),
        RecordedLectures.aggregate([
          {
            $match: {
              difficulty: req?.query?.difficulty,
            },
          },
          {
            $lookup: {
              from: "uservideoobservations",
              localField: "_id",
              foreignField: "videoId",
              as: "scores",
            },
          },
          {
            $addFields: {
              totalScore: {
                $sum: "$scores.score",
              },
            },
          },
        ]),
      ]);

      getObservations = [...getDicomCases, ...getRecordedLectures];
    }
    if (!getObservations) {
      res.status(404).json({ message: "Not Found" });
    }
    res.status(200).json({
      message: "Got Observations Successfully",
      data: getObservations,
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "Not Found" });
  }
}

module.exports = {
  getObservations,
  createObservations,
  submitAnswers,
  getScoreForAllResources,
};
