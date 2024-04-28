const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const Helper = require("../../../config/helper");
const bannerImg = Helper.upload_space("bannerManagement").single("bannerImg");
const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const bannerModel = require("../../../models/BannerModel");

module.exports = {
  addBanner: async (req, res) => {
    try {
      bannerImg(req, res, async function (err, result) {
        if (err) {
          console.log(err, "err");
          return Helper.response(res, 422, "Something went wrong");
        } else {
          const adminId = req.admin._id;
          const bannerImgArr = req.file.location.split("bannerManagement/");
          let bannerObject = {
            adminId: adminId,
            title: req.body.title,
            description: req.body.description,
            isPrimary: req.body.isPrimary,
            bannerImgName: bannerImgArr[1],
          };
          const banner = new bannerModel(bannerObject);
          const savedBanner = await banner.save();
          if (savedBanner) {
            return Helper.response(res, "200", "Banner saved successfully");
          }
        }
      });
    } catch (error) {
      return Helper.response(res, 500, "Something went wrong.");
    }
  },

  updateBanner: async (req, res) => {
    try {
      const bannerPrimaryId = req.params.id;
      bannerImg(req, res, async function (err, result) {
        if (err) {
          return Helper.response(res, 422, "Something went wrong");
        } else {
          const adminId = req.admin._id;
          const { title, description, isPrimary, status } = req.body;
          if (req.file === undefined) {
            var bannerObject = {
              adminId: adminId,
              title: title,
              status: status ? status : "Active",
              description: description,
              isPrimary: isPrimary,
            };
          } else {
            const bannerImgArr = req.file.location.split("bannerManagement/");
            var bannerObject = {
              adminId: adminId,
              title: title,
              status: status ? status : "Active",
              description: description,
              isPrimary: isPrimary,
              bannerS3Key: "bannerManagement/" + bannerImgArr[1],
              bannerImgName: bannerImgArr[1],
            };
          }
          const updatedBanner = await bannerModel.findByIdAndUpdate(
            new ObjectId(bannerPrimaryId),
            { $set: bannerObject },
            { new: true }
          );
           if (updatedBanner) {
             return Helper.response(
               res,
               CODES.STATUS_CODES.OK,
               "Banner updated successfully"
             );
           }
        }
      });
    } catch (error) {
      Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
  deleteBanner: async (req, res) => {
    try {
      const bannerId = req.params.id;
      const bannerData = await bannerModel.findById({
        _id: new mongoose.Types.ObjectId(bannerId),
      });
      if (bannerData) {
        await bannerModel.findByIdAndUpdate(
          { _id: bannerId },
          { $set: { status: "Delete" } },
          { new: true }
        );
        return Helper.response(
          res,
          CODES.STATUS_CODES.OK,
          "Banner Deleted Successfully."
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
  listBanner: async (req, res) => {
    try {
      const result = await bannerModel
        .find(
          { status: { $ne: "Delete" } },
          {
            isPrimary: 1,
            status: 1,
            adminId: 1,
            title: 1,
            description: 1,
            bannerImgName: 1,
          }
        )
        .sort({ createdAt: -1 })
        // .sort({ isPrimary: -1 })
        .lean();
      if (result.length > 0) {
        await Promise.all(
          result.map(async (item) => {
            item.imgUrl =
              process.env.IMAGE_URL + "bannerManagement/" + item.bannerImgName;
          })
        );

        return Helper.response(res, "200", "List fetched successfully", {
          bannerList: result,
        });
      } else {
        return Helper.response(res, "404", "Not found", { bannerList: [] });
      }
    } catch (error) {
      console.error(error);
      Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
};
