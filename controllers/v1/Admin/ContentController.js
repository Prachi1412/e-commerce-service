const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const Helper = require("../../../config/helper");
const youtubeThumbnail = require("youtube-thumbnail");
const contentModel = require("../../../models/ContentModel");
const videoModel = require("../../../models/VideoModel");
const AchievementModel = require("../../../models/AchievementModel");
const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const videoGallery = Helper.upload_space("videoGallery").single("video");
module.exports = {
  contentList: async (req, res) => {
    try {
      const contentData = await contentModel
        .find({}, { title: 1, slug: 1, description: 1 })
        .exec();
      if (!contentData || contentData.length === 0) {
        return Helper.response(res, 404, "No data found");
      } else {
        var resData = { contentList: contentData };
        return Helper.response(res, 200, "Successfully fetched.", resData);
      }
    } catch (error) {
      console.error(error, "error1");
      return Helper.response(res, 500, "Something went wrong");
    }
  },
  editContent: async (req, res) => {
    try {
      const { title, description } = req.body;
      const contentData = await contentModel.findOne(
        { _id: req.query.contentId },
        { _id: 1, title: 1, description: 1, status: 1, updatedDate: 1 }
      );
      if (!contentData) {
        return Helper.response(res, 404, "Not found");
      }

      contentData.title = title;
      contentData.description = description;
      const updatedData = await contentData.save();

      const resData = { contentData: updatedData };
      return Helper.response(res, 200, "Updated successfully");
    } catch (error) {
      console.error(error);
      return Helper.response(res, 500, "Something went wrong");
    }
  },
  termsConditions: async (req, res) => {
    try {
      const contentData = await contentModel.findOne(
        { slug: "terms-condition" },
        { title: 1, slug: 1, description: 1 }
      );
      if (!contentData) {
        return Helper.response(res, 404, "No data found");
      }
      var resData = { contentList: contentData };
      return Helper.response(
        res,
        200,
        "Terms & Condition fetched successfully",
        resData
      );
    } catch (error) {
      console.error(error);
      return Helper.response(res, 500, "Something went wrong");
    }
  },
  privacyPolicy: async (req, res) => {
    try {
      const contentData = await contentModel.findOne(
        { slug: "privacy-policy" },
        { title: 1, slug: 1, description: 1 }
      );
      if (!contentData) {
        return Helper.response(res, 404, "No data found");
      }
      var resData = { contentList: contentData };
      return Helper.response(
        res,
        200,
        "Privacy & Policy fetched successfully",
        resData
      );
    } catch (error) {
      console.error(error);
      return Helper.response(res, 500, "Something went wrong");
    }
  },
  aboutUs: async (req, res) => {
    try {
      const contentData = await contentModel.findOne(
        { slug: "about-us" },
        { title: 1, slug: 1, description: 1 }
      );
      if (!contentData) {
        return Helper.response(res, 404, "No data found");
      }
      var resData = { contentList: contentData };
      return Helper.response(
        res,
        200,
        "About Us fetched successfully",
        resData
      );
    } catch (error) {
      console.error(error);
      return Helper.response(res, 500, "Something went wrong");
    }
  },
  videoUpload: async (req, res) => {
    try {
      const { videoTitle, videoDescription, videoName } = req.body;
      const insertObj = {
        videoTitle,
        videoDescription,
        videoName: videoName,
      };

      const video = new videoModel(insertObj);
      const savedVideo = await video.save();

      if (savedVideo) {
        return Helper.response(
          res,
          CODES.STATUS_CODES.OK,
          "Video uploaded successfully"
        );
      } else {
        return Helper.response(
          res,
          CODES.STATUS_CODES.Internal_Server_Error,
          MSG.api.fail[LOCALE]
        );
      }
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, MSG.api.fail[LOCALE || "en"]);
    }
  },
  videoList: async (req, res) => {
    try {
      const contentData = await videoModel.find({ status: "Active" }).lean();

      if (!contentData) {
        return Helper.response(res, 404, "not found");
      }
      var resArr = [];
      await Promise.all(
        contentData.map(async (item) => {
          const thumbnailUrl = youtubeThumbnail(item.videoName);
          item.thumbnail = thumbnailUrl.high.url;
          resArr.push(item);
        })
      );
      return Helper.response(res, 200, "video fetched successfully", {
        video: resArr,
      });
    } catch (error) {
      console.log(error);
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.api.fail[LOCALE || "en"]
      );
    }
  },
  videoDelete: async (req, res) => {
    try {
      const videoId = req.params.id;
      const videoData = await videoModel.findById({
        _id: new mongoose.Types.ObjectId(videoId),
      });
      if (videoData) {
        await videoModel.findByIdAndUpdate(
          { _id: videoId },
          { $set: { status: "Delete" } },
          { new: true }
        );
        return Helper.response(
          res,
          CODES.STATUS_CODES.OK,
          "Video deleted successfully"
        );
      } else {
        return Helper.response(res, 404, "No data found");
      }
    } catch (error) {
      console.log(error, "error");
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.api.fail[LOCALE || "en"]
      );
    }
  },
  addUpdateAchievement: async (req, res) => {
    try {
      const {
        states,
        innovationsListed,
        achievementId,
        providers,
        sales,
        status,
      } = req.body;
      const obj = {
        states: states,
        innovationsListed: innovationsListed,
        providers: providers,
        sales: sales,
        status: status,
      };

      if (achievementId !== undefined && achievementId !== "") {
        const result = await AchievementModel.findByIdAndUpdate(
          new ObjectId(achievementId),
          { $set: obj },
          { new: true }
        );

        if (result) {
          return Helper.response(
            res,
            CODES.STATUS_CODES.OK,
            "Achievement updated successfully."
          );
        }
      } else {
        const achievements = new AchievementModel(obj);
        const savedData = await achievements.save();

        if (savedData) {
          return Helper.response(
            res,
            CODES.STATUS_CODES.OK,
            "Achievement added successfully."
          );
        } else {
          return Helper.response(
            res,
            CODES.STATUS_CODES.Internal_Server_Error,
            MSG.api.fail[LOCALE]
          );
        }
      }
    } catch (error) {
      logger.error(error);
      console.log(error);
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.api.fail[LOCALE]
      );
    }
  },
  getAllAchievement: (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 25;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const query = { status: { $ne: "Delete" } };
    if (req.query.search) {
      let searchObject = {
        $or: [{ states: { $regex: req.query.search, $options: "i" } }],
      };
      Object.assign(query, searchObject);
    }

    const col = {
      _id: 1,
      achievementId: "$_id",
      states: 1,
      innovationsListed: 1,
      sales: 1,
      providers: 1,
      status: 1,
      createdAt: 1,
      uodatedAt: 1,
    }; //,'updatedDate': -1
    AchievementModel.paginate(query, {
      page: page,
      sort: { createdAt: -1 },
      limit: limit,
      select: col,
    })
      .then((result) => {
        let achievementList = result.docs;
        let totalResult = result.total;

        if (achievementList.length > 0) {
          let resData = {
            achievementList: achievementList,
            totalResult: totalResult,
            limit: limit,
          };
          return Helper.response(
            res,
            CODES.STATUS_CODES.OK,
            "Acheivement fetched successfully",
            resData
          );
        } else {
          return Helper.response(res, 404, "No data found", {
            achievementList: [],
          });
        }
      })
      .catch((err) => {
        console.log(err);
        Helper.response(
          res,
          CODES.STATUS_CODES.Internal_Server_Error,
          MSG.api.fail[LOCALE || "en"]
        );
      });
  },
  deleteAchievement: async (req, res) => {
    try {
      const achievementId = req.params.id;
      const achievementData = await AchievementModel.findById({
        _id: new mongoose.Types.ObjectId(achievementId),
      });
      if (achievementData) {
        await AchievementModel.findByIdAndUpdate(
          { _id: achievementId },
          { $set: { status: "Delete" } },
          { new: true }
        );
        return Helper.response(
          res,
          CODES.STATUS_CODES.OK,
          "Achievement deleted successfully"
        );
      } else {
        return Helper.response(res, 404, "No data found");
      }
    } catch (error) {
      console.log(error, "error");
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.api.fail[LOCALE || "en"]
      );
    }
  },
};
