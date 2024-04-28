const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const bcrypt = require("bcrypt");
const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const serviceModel = require("../../../models/ServiceModel");
const supplierModel = require("../../../models/SupplierModel");
const util = require("util");
const moment = require("moment-timezone");
const { logger } = require("../../../logger/winston");
const Helper = require("../../../config/helper");

const serviceUpload = Helper.upload_space("service").single(
  "companyProfileImage"
);

// Promisify the serviceUpload function to use async/await
const promisifiedServiceUpload = util.promisify(serviceUpload);
module.exports = {
  addService: async (req, res) => {
    const { supplierId, serviceDetails } = req.body;
    try {
      const savedServices = [];
      var checkAvailable = await supplierModel.findOne({
        _id: supplierId,
      });
      if (!checkAvailable) {
        return Helper.response(res, 404, "Supplier not found");
      }
      for (const serviceDetail of serviceDetails) {
        const Service = new serviceModel({
          supplierId,
          serviceUniqId: await Helper.generateServiceUniqId(supplierId),
          // serviceUniqId: await getUniqueServiceCode(),
          submitStatus: {
            isSubmitted: true,
            submitttedDate: moment().format(),
          },
          ...serviceDetail,
        });
        const savedService = await Service.save();
        savedServices.push(savedService);
      }
      var html = `
            <p>Thank you adding your service in . Admin will review the service and update.</p></br></br></br></br></br>`;
      await Helper.send365Email(
        process.env.MAIL_SEND_EMAIL,
        checkAvailable.basicInfo.emailId,
        " Service completion process",
        html,
        "text"
      );
      return Helper.response(res, 200, "Service detail added successfully");
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Could not add service.");
    }
  },
  getServiceDetails: async (req, res) => {
    try {
      const serviceId = req.params.id;
      // console.log({ serviceId });

      const serviceDetails = await serviceModel
        .findById(serviceId)
        .populate("productCategoryId")
        .populate("productSubCategoryId")
        .lean();

      if (serviceDetails) {
        // serviceDetails.orderList = await orderByUser(id);
        if (serviceDetails.serviceImage.length > 0) {
          let serviceImage = [];
          for (let i = 0; i < serviceDetails.serviceImage.length; i++) {
            serviceImage.push({
              imgUrl:
                process.env.IMAGE_URL +
                "suppliers/" +
                serviceDetails.serviceImage[i].imgName,
              imgName: serviceDetails.serviceImage[i].imgName,
            });
          }
          serviceDetails.serviceImage = serviceImage;
        }
        if (serviceDetails.serviceImageThumbnail.length > 0) {
          let serviceImageThumbnail = [];
          for (
            let i = 0;
            i < serviceDetails.serviceImageThumbnail.length;
            i++
          ) {
            serviceImageThumbnail.push({
              imgUrl:
                process.env.IMAGE_URL +
                "suppliers/" +
                serviceDetails.serviceImageThumbnail[i].imgName,
              imgName: serviceDetails.serviceImageThumbnail[i].imgName,
            });
          }
          serviceDetails.serviceImageThumbnail = serviceImageThumbnail;
        }
        if (serviceDetails.companyProfileImage.length > 0) {
          let companyProfileImage = [];
          for (let i = 0; i < serviceDetails.companyProfileImage.length; i++) {
            companyProfileImage.push({
              imgUrl:
                process.env.IMAGE_URL +
                "suppliers/" +
                serviceDetails.companyProfileImage[i].imgName,
              imgName: serviceDetails.companyProfileImage[i].imgName,
            });
          }
          serviceDetails.companyProfileImage = companyProfileImage;
        }
        if (
          serviceDetails.relevantCertifications !== undefined &&
          serviceDetails.relevantCertifications.length > 0
        ) {
          for (
            let i = 0;
            i < serviceDetails.relevantCertifications.length;
            i++
          ) {
            let relevantCertificationsArr = [];

            if (
              serviceDetails.relevantCertifications[i].uploadCertificate !==
                undefined &&
              serviceDetails.relevantCertifications[i].uploadCertificate
                .length > 0
            ) {
              for (
                let j = 0;
                j <
                serviceDetails.relevantCertifications[i].uploadCertificate
                  .length;
                j++
              ) {
                var fileExe = await Helper.getFileExtension(
                  serviceDetails.relevantCertifications[i].uploadCertificate[j]
                    .imgName
                );

                relevantCertificationsArr.push({
                  imgUrl:
                    process.env.IMAGE_URL +
                    "suppliers/" +
                    serviceDetails.relevantCertifications[i].uploadCertificate[
                      j
                    ].imgName,
                  imgName:
                    serviceDetails.relevantCertifications[i].uploadCertificate[
                      j
                    ].imgName,
                  _id: serviceDetails.relevantCertifications[i]
                    .uploadCertificate[j]._id,
                  fileType: fileExe,
                });
              }
            }

            serviceDetails.relevantCertifications[i].uploadCertificate =
              relevantCertificationsArr;
          }
        }
        //   imgName: serviceDetails.productCategoryImage[i].imgName;

        return Helper.response(res, 200, MSG.success[LOCALE || "en"], {
          serviceDetails,
        });
      }
      return Helper.response(res, 402, MSG.notFound[LOCALE || "en"]);
    } catch (error) {
      return Helper.response(res, 500, MSG.serverError[LOCALE || "en"]);
    }
  },
  updateServiceDetails: async (req, res) => {
    const serviceId = req.params.id;
    req.body.updatedAt = new Date();
    try {
      const existingService = await serviceModel.findById(serviceId);
      if (!existingService) {
        return Helper.response(res, 404, "Service not found.");
      }
      if (req.body.isEdit != "admin") {
        existingService.status = "Inactive";
        existingService.isEdit = "supplier";
        existingService.isRead = false;
      } else {
        existingService.isEdit = "admin";
      }
      // Update service properties with new values
      Object.assign(existingService, req.body);

      // Save the updated service
      const updatedService = await existingService.save();
      if (req.body.status == "Delete") {
        var msg = "Service deleted successfully";
        var msgData = "deleted";
      } else {
        var msg = "Service updated successfully";
        var msgData = "updated";
      }
      var html = `
      <p>Your service has been ${msgData}.</b></p> </br></br></br>
      `;
      const checkSupplier = await supplierModel.findOne({
        _id: req.body.supplierId,
      });
      if (checkSupplier) {
        await Helper.send365Email(
          process.env.MAIL_SEND_EMAIL,
          checkSupplier.basicInfo.emailId,
          " Product update process",
          html,
          "text"
        );
      }

      return Helper.response(res, 200, msg);
    } catch (error) {
      console.error(error);
      return Helper.response(res, 500, "Could not update service.");
    }
  },
  serviceListing: async (req, res) => {
    try {
      const supplierId = req.params.id;
      const limit = req.query.limit ? parseInt(req.query.limit) : 25;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const query = {
        status: {
          $ne: "Delete",
        },
        supplierId: new ObjectId(supplierId),
      };
      // const col = { createdAt: 0, updatedAt: 0, __v: 0 };

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
            as: "subcategory_details",
          },
        },
        {
          $project: {
            supplierId: 1,
            supplierName: "$supplier_details.founderName",
            supplierContact: "$supplier_details.contactNo",
            serviceName: 1,
            productCategoryId: 1,
            productCategory: "$product_details.productCategoryName",
            productSubCategoryId: 1,
            productSubCategory: "$subcategory_details.subCategoryName",
            serviceDescription: 1,
            timeToInitiateService: 1,
            preRequisiteOffering: 1,
            relevantCertifications: 1,
            awardRecognition: 1,
            otherInformation: 1,
            typeOfService: 1,
            customizationAvailable: 1,
            categoryType: 1,
            durationOfService: 1,
            keywords: 1,
            companyProfileImage: 1,
            serviceImage: 1,
            serviceImageThumbnail: 1,
            submitStatus: 1,
            price: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
        {
          $match: query,
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ];

      const options = {
        page: page,
        limit: limit,
        allowDiskUse: true,
      };

      logger.info("agg......query", JSON.stringify(agg));
      console.log(JSON.stringify(agg));
      let myAggregate = serviceModel.aggregate(agg);
      console.log({
        myAggregate,
      });

      const result = await serviceModel.aggregatePaginate(myAggregate, options);
      // console.log({ result });

      const serviceList = result.docs;
      const totalResult = result.totalDocs;

      if (serviceList.length > 0) {
        await Promise.all(
          serviceList.map(async (item) => {
            if (item.serviceImage.length > 0) {
              let serviceImage = [];
              for (let i = 0; i < item.serviceImage.length; i++) {
                serviceImage.push({
                  imgUrl:
                    process.env.IMAGE_URL +
                    "suppliers/" +
                    item.serviceImage[i].imgName,
                  imgName: item.serviceImage[i].imgName,
                });
              }
              item.serviceImage = serviceImage;
            }
            if (item.serviceImageThumbnail.length > 0) {
              let serviceImageThumbnail = [];
              for (let i = 0; i < item.serviceImageThumbnail.length; i++) {
                serviceImageThumbnail.push({
                  imgUrl:
                    process.env.IMAGE_URL +
                    "suppliers/" +
                    item.serviceImageThumbnail[i].imgName,
                  imgName: item.serviceImageThumbnail[i].imgName,
                });
              }
              item.serviceImageThumbnail = serviceImageThumbnail;
            }
            if (item.companyProfileImage.length > 0) {
              let companyProfileImage = [];
              for (let i = 0; i < item.companyProfileImage.length; i++) {
                companyProfileImage.push({
                  imgUrl:
                    process.env.IMAGE_URL +
                    "suppliers/" +
                    item.companyProfileImage[i].imgName,
                  imgName: item.companyProfileImage[i].imgName,
                });
              }
              item.companyProfileImage = companyProfileImage;
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
  changeServiceStatus: async (req, res) => {
    try {
      const _id = req.params.serviceId;
      const doesproductExist = await serviceModel.findById(_id);
      if (doesproductExist) {
        if (req.body.status == "Cancel") {
          req.body.status = "Cancel";
        }
        const serviceData = await serviceModel.findByIdAndUpdate(
          _id,
          {
            $set: req.body,
          },
          {
            new: true,
          }
        );
        console.log({
          serviceData,
        });
        if (!serviceData) {
          return Helper.response(res, 404, "Not found");
        }
        return Helper.response(res, 200, "Service status changed successfully");
      } else {
        return Helper.response(res, 404, "Not found");
      }
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Internal error");
    }
  },
  supplierAccountStatusUpdate: async (req, res) => {
    try {
      const { _id } = req.params;
      const { status } = req.body;
      let updateObj = {
        accountStatus: status,
        // JWT_Token: [],
      };

      const supplierDetails = await supplierModel.findById(_id);
      if (!supplierDetails) {
        Helper.response(
          res,
          CODES.STATUS_CODES.Not_Found,
          MSG.notFound[LOCALE || "en"]
        );
        return;
      }

      const updatedSupplierDetails = await supplierModel.findByIdAndUpdate(
        _id,
        {
          $set: updateObj,
        },
        {
          new: true,
        }
      );
      if (!updatedSupplierDetails) {
        Helper.response(
          res,
          CODES.STATUS_CODES.Not_Found,
          MSG.notFound[LOCALE || "en"]
        );
        return;
      }

      Helper.response(res, CODES.STATUS_CODES.OK, MSG.success[LOCALE || "en"]);
    } catch (err) {
      console.log(err, "err");
      Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
  supplierDetails: async (req, res) => {
    try {
      const supplierId = req.params.id;
      const supplierDetails = await supplierModel.findById(supplierId, {
        password: 0,
        JWT_Token: 0,
        _v: 0,
      });
      if (supplierDetails) {
        // supplierDetails.orderList = await orderByUser(id);
        return Helper.response(res, 200, MSG.success[LOCALE || "en"], {
          supplierDetails,
        });
      }
      return Helper.response(res, 402, MSG.notFound[LOCALE || "en"]);
    } catch (error) {
      return Helper.response(res, 500, MSG.serverError[LOCALE || "en"]);
    }
  },
  supplierStatusDelete: async (req, res) => {
    try {
      const supplierId = req.params.id;
      console.log({
        supplierId,
      });

      const fieldsToUpdate = {
        // mobile: "00007777",
        // oldNumber: req.user.mobile,
        accountStatus: "Delete",
        JWT_Token: [],
      };

      console.log({
        fieldsToUpdate,
      });

      const doesSupplierExist = await supplierModel.findById(supplierId);
      console.log({
        doesSupplierExist,
      });

      if (doesSupplierExist) {
        //   const customer = await customerModel
        //     .findOneAndUpdate(
        //       { _id: ObjectId(supplierId) },
        //       { $set: updateObj },
        //       { new: true }
        //     )
        //     .exec();

        //  const updatedSupplierDetails = await customerModel
        //    .findOneAndUpdate(
        //      { _id: ObjectId(supplierId) },
        //      { $set: updateObj },
        //      { new: true }
        //    )
        //    .exec();

        const updatedSupplierDetails = await supplierModel
          .findByIdAndUpdate(
            supplierId,
            {
              $set: fieldsToUpdate,
            },
            {
              new: true,
            }
          )
          .select({
            password: 0,
            __v: 0,
          });
        console.log({
          updatedSupplierDetails,
        });

        if (!updatedSupplierDetails) {
          return Helper.response(
            res,
            CODES.STATUS_CODES.Not_Found,
            MSG.notFound[LOCALE || "en"]
          );
        }
        return Helper.response(
          res,
          CODES.STATUS_CODES.OK,
          MSG.success[LOCALE || "en"]
        );
      } else {
        return Helper.response(
          res,
          CODES.STATUS_CODES.Not_Found,
          MSG.notFound[LOCALE || "en"]
        );
      }
    } catch (error) {
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
};

const getUniqueServiceCode = async () => {
  let isDuplicate = true;
  let uniqueServiceId = "";
  while (isDuplicate) {
    uniqueServiceId = Helper.generateRandProductId();

    let isExist = await serviceModel.countDocuments({
      serviceUniqId: "ecom-" + uniqueServiceId,
    });

    if (isExist === 0) {
      isDuplicate = false;
      serviceUniqId = "ecom-" + uniqueServiceId;
      break;
    }
  }

  return serviceUniqId;
};
