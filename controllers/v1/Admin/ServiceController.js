const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const bcrypt = require("bcrypt");
const { logger } = require("../../../logger/winston");
const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const serviceModel = require("../../../models/ServiceModel");

const util = require("util");

const Helper = require("../../../config/helper");
const supplierModel = require("../../../models/SupplierModel");

module.exports = {
  serviceListing: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 25;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      var query = {
        status: {
          $ne: "Delete",
        },
      };
      // const col = { createdAt: 0, updatedAt: 0, __v: 0 };
      let status = req.query.status ? req.query.status : null;
      if (status) {
        let statusArray = status.split(",");
        console.log(statusArray, "statusArray");
        query.status = { $in: statusArray };
      }
      if (req.query.isRead == "true" || req.query.isRead == true) {
        query.isRead = true;
      } else if (req.query.isRead == "false" || req.query.isRead == false) {
        query.isRead = false;
      }
      if (req.query.search) {
        const searchObject = {
          $or: [
            {
              serviceName: {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              serviceUniqId: {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              supplierName: {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              supplierContact: {
                $regex: req.query.search,
                $options: "i",
              },
            },
          ],
        };
        Object.assign(query, searchObject);
      }
      let supplierId = req.query.supplierId ? req.query.supplierId : null;
      if (supplierId) {
        let supplierIdArray = supplierId.split(",");
        let objectIdIdArray = supplierIdArray.map((id) => new ObjectId(id));
        query.supplierId = {
          $in: objectIdIdArray,
        };
      }
      var startsDate = req.query.startDate ? req.query.startDate : null;
      let endsDate = req.query.endDate ? req.query.endDate : null;
      endsDate = Helper.modifyDate(endsDate, 1);

      if (startsDate && endsDate) {
        var dateFilter = {
          createdAt: {
            $gte: new Date(startsDate),
            $lte: new Date(endsDate),
          },
        };
        Object.assign(query, dateFilter);
      }
      let orConditions = [];
      if (req.query.productCategoryIds) {
        let productCategoryIds = req.query.productCategoryIds;
        var productCatId = productCategoryIds.split(",");
        var arrayCatId = [];
        productCatId.forEach((id) => {
          arrayCatId.push(new ObjectId(id));
        });
        orConditions.push({
          productCategoryId: {
            $in: arrayCatId,
          },
        });
        // query.productCategoryId = { $in: arrayCatId };
      }
      if (req.query.productSubCategoryIds) {
        let subCategoryIds = req.query.productSubCategoryIds;
        var productSubCatId = subCategoryIds.split(",");
        var arraySubCatId = [];
        productSubCatId.forEach((id) => {
          arraySubCatId.push(new ObjectId(id));
        });
        orConditions.push({
          productSubCategoryId: {
            $in: arraySubCatId,
          },
        });
        // query.productSubCategoryId = { $in: arraySubCatId };
      }
      if (orConditions.length > 0) {
        query.$and = orConditions;
      }
      const agg = [
        {
          $lookup: {
            from: "Supplier",
            localField: "supplierId",
            foreignField: "_id",
            as: "supplier_details",
          },
        },
        {
          $unwind: {
            path: "$supplier_details",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "ProductCategory",
            localField: "productCategoryId",
            foreignField: "_id",
            as: "product_details",
          },
        },
        {
          $lookup: {
            from: "ProductSubCategory",
            localField: "productSubCategoryId",
            foreignField: "_id",
            as: "productSubCategory_details",
          },
        },
        // {
        //   $unwind: {
        //     path: "$product_details",
        //     preserveNullAndEmptyArrays: true,
        //   },
        // },
        {
          $project: {
            supplierId: 1,
            supplierName: "$supplier_details.basicInfo.founderName",
            supplierContact: "$supplier_details.basicInfo.contactNo",
            companyName: "$supplier_details.basicInfo.companyName",
            // productCategoryId: "$product_details",
            productCategoryId: 1,
            productCategory: "$product_details.productCategoryName",
            productSubCategoryId: 1,
            productSubCategory: "$productSubCategory_details.subCategoryName",
            serviceName: 1,
            serviceDescription: 1,
            timeToInitiateService: 1,
            typeOfService: 1,
            customizationAvailable: 1,
            categoryType: 1,
            preRequisiteOffering: 1,
            relevantCertifications: 1,
            awardRecognition: 1,
            otherInformation: 1,
            durationOfService: 1,
            keywords: 1,
            serviceImage: 1,
            serviceImageThumbnail: 1,
            companyProfileImage: 1,
            serviceUniqId: 1,
            price: 1,
            submitStatus: 1,
            status: 1,
            isRead: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
        {
          $match: query,
        },
        {
          $sort: {
            updatedAt: -1,
          },
        },
      ];

      const options = {
        page: page,
        limit: limit,
        allowDiskUse: true,
      };

      let myAggregate = serviceModel.aggregate(agg);
      const result = await serviceModel.aggregatePaginate(myAggregate, options);
      const serviceList = result.docs;
      const totalResult = result.totalDocs;

      if (serviceList.length > 0) {
        await Promise.all(
          serviceList.map(async (item) => {
            if (item.serviceImage.length > 0) {
              let serviceImage = [];
              for (let i = 0; i < item.serviceImage.length; i++) {
                var fileExe = await Helper.getFileExtension(
                  item.serviceImage[i].imgName
                );
                serviceImage.push({
                  imgUrl:
                    process.env.IMAGE_URL +
                    "suppliers/" +
                    item.serviceImage[i].imgName,
                  imgName: item.serviceImage[i].imgName,
                  _id: item.serviceImage[i]._id,
                  fileType: fileExe,
                });
              }
              item.serviceImage = serviceImage;
            }
            if (
              item.serviceImageThumbnail != undefined &&
              item.serviceImageThumbnail.length > 0
            ) {
              let serviceImageThumbnail = [];
              for (let i = 0; i < item.serviceImageThumbnail.length; i++) {
                var fileExe = await Helper.getFileExtension(
                  item.serviceImageThumbnail[i].imgName
                );
                serviceImageThumbnail.push({
                  imgUrl:
                    process.env.IMAGE_URL +
                    "suppliers/" +
                    item.serviceImageThumbnail[i].imgName,
                  imgName: item.serviceImageThumbnail[i].imgName,
                  _id: item.serviceImageThumbnail[i]._id,
                  fileType: fileExe,
                });
              }
              item.serviceImageThumbnail = serviceImageThumbnail;
            }
            if (item.companyProfileImage.length > 0) {
              let companyProfileImage = [];

              for (let i = 0; i < item.companyProfileImage.length; i++) {
                var fileExe = await Helper.getFileExtension(
                  item.companyProfileImage[i].imgName
                );
                companyProfileImage.push({
                  imgUrl:
                    process.env.IMAGE_URL +
                    "suppliers/" +
                    item.companyProfileImage[i].imgName,
                  imgName: item.companyProfileImage[i].imgName,
                  _id: item.companyProfileImage[i]._id,
                  fileType: fileExe,
                });
              }
              item.companyProfileImage = companyProfileImage;
            }
            if (
              item.relevantCertifications !== undefined &&
              item.relevantCertifications.length > 0
            ) {
              for (let i = 0; i < item.relevantCertifications.length; i++) {
                let relevantCertificationsArr = [];

                if (
                  item.relevantCertifications[i].uploadCertificate !==
                    undefined &&
                  item.relevantCertifications[i].uploadCertificate.length > 0
                ) {
                  for (
                    let j = 0;
                    j < item.relevantCertifications[i].uploadCertificate.length;
                    j++
                  ) {
                    var fileExe = await Helper.getFileExtension(
                      item.relevantCertifications[i].uploadCertificate[j]
                        .imgName
                    );

                    relevantCertificationsArr.push({
                      imgUrl:
                        process.env.IMAGE_URL +
                        "suppliers/" +
                        item.relevantCertifications[i].uploadCertificate[j]
                          .imgName,
                      imgName:
                        item.relevantCertifications[i].uploadCertificate[j]
                          .imgName,
                      _id: item.relevantCertifications[i].uploadCertificate[j]
                        ._id,
                      fileType: fileExe,
                    });
                  }
                }

                item.relevantCertifications[i].uploadCertificate =
                  relevantCertificationsArr;
              }
            }
          })
        );

        const rsss = {
          serviceList,
          totalResult,
          limit,
        };
        Helper.response(
          res,
          CODES.STATUS_CODES.OK,
          MSG.serviceCategory.fetch[LOCALE || "en"],
          rsss
        );
      } else {
        Helper.response(
          res,
          CODES.STATUS_CODES.Not_Found,
          MSG.serviceCategory.fetch[LOCALE || "en"],
          {
            serviceList: [],
          }
        );
      }
    } catch (error) {
      console.error("Error in getService:", error);
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
  ChangeServiceStatus: async (req, res) => {
    try {
      const _id = req.params.serviceId;
      const doesproductExist = await serviceModel.findById(_id);
      if (doesproductExist) {
        const serviceData = await serviceModel.findByIdAndUpdate(
          _id,
          {
            $set: req.body,
          },
          {
            new: true,
          }
        );
        if (!serviceData) {
          return Helper.response(res, 404, "Not found");
        }
        if (req.body.status == "Active") {
          var msg = "Activated";
        } else {
          var msg = "Inactivated";
        }

        var html = `
      <p>Your service has been <b>${msg} by admin.</b>.</p> </br></br></br></br>
      `;
        const checkSupplier = await supplierModel.findOne({
          _id: doesproductExist.supplierId,
        });
        if (checkSupplier) {
          await Helper.send365Email(
            process.env.MAIL_SEND_EMAIL,
            checkSupplier.basicInfo.emailId,
            " Service update process",
            html,
            "text"
          );
        }
        return Helper.response(res, 200, "Status changed successfully");
      } else {
        return Helper.response(res, 404, "Not found");
      }
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Internal error");
    }
  },
  deleteServiceImg: async (req, res) => {
    try {
      let serviceId = new ObjectId(req.params.serviceId);
      let imageIdToDelete = req.body.imageIdToDelete;
      var query = {};
      const result = await serviceModel.findOne({
        _id: serviceId,
      });
      if (result) {
        if (req.body.key == "serviceImage") {
          query = {
            $pull: {
              serviceImage: {
                _id: new ObjectId(imageIdToDelete),
              },
            },
          };
          var msg = result.serviceImage.some(
            (img) => img._id.toString() === imageIdToDelete
          );
        }
        if (req.body.key == "companyImage") {
          query = {
            $pull: {
              companyProfileImage: {
                _id: new ObjectId(imageIdToDelete),
              },
            },
          };
          var msg = result.companyProfileImage.some(
            (img) => img._id.toString() === imageIdToDelete
          );
        }
      }

      if (!result || !msg) {
        return Helper.response(
          res,
          404,
          "Service not found or image not found for deletion."
        );
      }
      // Update the query to ensure case sensitivity
      await serviceModel.findOneAndUpdate(
        {
          _id: serviceId,
        },
        query,
        {
          new: true,
        }
      );
      // Check if any document was updated

      // Provide a more detailed success message
      return Helper.response(
        res,
        CODES.STATUS_CODES.OK,
        "Image deleted successfully."
      );
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, MSG.api.fail[LOCALE || "en"]);
    }
  },
  serviceRead: async (req, res) => {
    try {
      const _id = req.params.serviceId;
      const doesproductExist = await serviceModel.findById(_id);
      if (doesproductExist) {
        const serviceData = await serviceModel.findByIdAndUpdate(
          _id,
          {
            isRead: true,
          },
          {
            new: true,
          }
        );
        if (!serviceData) {
          return Helper.response(res, 404, "Not found");
        }
        return Helper.response(res, 200, "Service read successfully");
      } else {
        return Helper.response(res, 404, "Not found");
      }
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Internal error");
    }
  },
};
