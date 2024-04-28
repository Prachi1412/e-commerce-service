const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const Helper = require("../../../config/helper");
const queryAttachment =
  Helper.upload_space("queryManagement").array("attachmentFiles");
const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const QueryModel = require("../../../models/QueryModel");
const QueryChatModel = require("../../../models/queryChatModel");
const QueryResponseModel = require("../../../models/QueryResponseModel");
const adminModel = require("../../../models/AdminModel");
const supplierModel = require("../../../models/SupplierModel");
const { param } = require("express-validator");
const productModel = require("../../../models/ProductModel");
const serviceModel = require("../../../models/ServiceModel");
const moment = require("moment-timezone");
module.exports = {
  addQuery: async (req, res) => {
    try {
      queryAttachment(req, res, async function (err, result) {
        if (err) {
          console.log(err, "err");
          return Helper.response(res, 422, "Something went wrong");
        } else {
          const customerId = req.user._id;
          var queryAttachmentArr = [];
          if (req.files.length) {
            for (var i = 0; i < req.files.length; i++) {
              var files = req.files[i].location.split("queryManagement/");
              queryAttachmentArr.push(files[1]);
            }
          }

          let queryObj = {
            customerId: customerId,
            senderId: customerId,
            productId: req.body.productId,
            supplierId: req.body.supplierId,
            subject: req.body.subject,
            message: req.body.message,
            attachmentFiles: queryAttachmentArr,
            categoryType: req.body.categoryType,
          };
          const query = new QueryModel(queryObj);
          const savedquery = await query.save();
          var adminData = await adminModel.findOne({
            role: "superadmin",
            status: "Active",
          });
          var sellerData = await supplierModel.findOne(
            {
              _id: new ObjectId(req.body.supplierId),
            },
            { "basicInfo.founderName": 1, supplierUniqId: 1 }
          );
          if (sellerData) {
            var msg = `You have new query request regarding to ${req.body.categoryType} by buyer ${req.user.name} (${req.user.customerUniqId}) to seller ${sellerData.basicInfo.founderName} (${sellerData.supplierUniqId})`;
          } else {
            var msg = `You have new query request`;
          }

          await Helper.sendNotification(
            adminData._id.toString(),
            "admin",
            req.body.productId,
            msg,
            `query request`,
            `Query Request`,
            customerId
          );
          await Helper.sendNotification(
            customerId.toString(),
            "customer",
            req.body.productId,
            `Your query send to admin. Admin will connect to you soon.`,
            `query request`,
            `Query Request`,
            req.body.supplierId
          );
          if (savedquery) {
            return Helper.response(res, "200", "Query submitted successfully.");
          }
        }
      });
    } catch (error) {
      return Helper.response(res, 500, "Something went wrong.");
    }
  },
  updateQuery: async (req, res) => {
    try {
      console.log("update query");
      const queryId = req.params.id;
      const queryAttachmentArr = [];
      queryAttachment(req, res, async function (err, result) {
        if (err) {
          console.log(err, "err");
          return Helper.response(res, 422, "Something went wrong");
        } else {
          const customerId = req.user._id;
          if (req.files && req.files.length) {
            queryAttachmentArr.push(
              ...req.files.map(
                (file) => file.location.split("queryManagement/")[1]
              )
            );
            var queryObj = {
              customerId,
              senderId: customerId,
              productId: req.body.productId,
              subject: req.body.subject,
              message: req.body.message,
              ...(req.files && { attachmentFiles: queryAttachmentArr }),
            };
          } else {
            var queryObj = {
              customerId,
              productId: req.body.productId,
              supplierId: req.body.supplierId,
              subject: req.body.subject,
              message: req.body.message,
              categoryType: req.body.categoryType,
            };
          }

          const updatedQuery = await QueryModel.findOneAndUpdate(
            { _id: new ObjectId(queryId) },
            { $set: queryObj },
            { new: true }
          );

          if (updatedQuery) {
            return Helper.response(
              res,
              CODES.STATUS_CODES.OK,
              "Query updated successfully."
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
  changeQueryStatus: async (req, res) => {
    try {
      var msg = "";
      const queryId = req.params.id;
      if (req.user.role == "supplier") {
           const doesSupplierExist = await QueryChatModel.findById(queryId);
           if (doesSupplierExist) {
             req.body.isReadSeller = true;
             req.body.isRead = false;
             req.body.updatedAt = moment().format();
             const updateQuery = await QueryChatModel.findByIdAndUpdate(
               queryId,
               { $set: req.body },
               { new: true }
             );
             if (req.body.status == "resolve") {
               msg = "resolved";
             } else {
               msg = req.body.status;
             }
             if (!updateQuery) {
               return Helper.response(
                 res,
                 CODES.STATUS_CODES.Not_Found,
                 MSG.notFound[LOCALE || "en"]
               );
             }
             return Helper.response(
               res,
               CODES.STATUS_CODES.OK,
               `Query ${msg} successfully`
             );
           } else {
             return Helper.response(
               res,
               CODES.STATUS_CODES.Not_Found,
               MSG.notFound[LOCALE || "en"]
             );
           }
      } else {
        const doesSupplierExist = await QueryModel.findById(queryId);
        if (doesSupplierExist) {
          req.body.isReadBuyer = true;
          req.body.isRead = false;
          req.body.updatedAt = moment().format();
          const updateQuery = await QueryModel.findByIdAndUpdate(
            queryId,
            { $set: req.body },
            { new: true }
          );
          if (req.body.status == "resolve") {
            msg = "resolved";
          } else {
            msg = req.body.status;
          }
          if (!updateQuery) {
            return Helper.response(
              res,
              CODES.STATUS_CODES.Not_Found,
              MSG.notFound[LOCALE || "en"]
            );
          }
          return Helper.response(
            res,
            CODES.STATUS_CODES.OK,
            `Query ${msg} successfully`
          );
        } else {
          return Helper.response(
            res,
            CODES.STATUS_CODES.Not_Found,
            MSG.notFound[LOCALE || "en"]
          );
        }
      }
    } catch (error) {
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
  listQuery: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 25;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      if (req.query.status) {
        if (req.query.status == "cancelled") {
          query.status = { $in: ["canceled", "cancelled"] };
        } else {
          query.status = req.query.status;
        }
      }
      if (req.query.isRead) {
        query.isRead = req.query.isRead;
      }
      var query = {
        customerId: req.user._id,
        status: { $ne: "Delete" },
      };
      if (req.query.categoryType) {
        query.categoryType = req.query.categoryType;
      }
      if (req.query.search) {
        let searchObject = {
          $or: [
            { subject: { $regex: req.query.search, $options: "i" } },
            { message: { $regex: req.query.search, $options: "i" } },
          ],
        };
        Object.assign(query, searchObject);
      }
      const agg = [
        {
          $match: query,
        },
        {
          $sort: {
            updatedAt: -1,
          },
        },
        // {
        //   $lookup: {
        //     from: "Product",
        //     localField: "productId",
        //     foreignField: "_id",
        //     as: "productDetail",
        //   },
        // },
        // {
        //   $unwind: "$productDetail",
        // },
        {
          $lookup: {
            from: "Customer",
            localField: "customerId",
            foreignField: "_id",
            as: "customerDetails",
          },
        },
        {
          $unwind: "$customerDetails",
        },
        {
          $project: {
            _id: 1,
            productId: 1,
            // productDetails: "$productDetail",
            customerId: 1,
            customerName: "$customerDetails.name",
            // customerDetails: "$customerDetails",
            customerEmail: "$customerDetails.emailId",
            supplierId: 1,
            senderId: 1,
            isRead: 1,
            subject: 1,
            replyBy: 1,
            answer: 1,
            message: 1,
            categoryType: 1,
            attachmentFiles: 1,
            status: 1,
            isReadBuyer: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ];
      const options = {
        page: page,
        limit: limit,
        allowDiskUse: true,
      };
      let myAggregate = QueryModel.aggregate(agg);
      QueryModel.aggregatePaginate(
        myAggregate,
        options,
        async function (err, result) {
          if (err) {
            console.log(err, "err");
            return Helper.response(res, 500, "Internal server error.");
          } else {
            let queryData = result.docs;
            let totalResult = result.totalDocs;
            if (queryData.length > 0) {
              await Promise.all(
                queryData.map(async (item) => {
                  var arrayData = [];
                  for (var i = 0; i < item.attachmentFiles.length; i++) {
                    arrayData.push(
                      process.env.IMAGE_URL +
                        "queryManagement/" +
                        item.attachmentFiles[i]
                    );
                  }
                  if (item.categoryType == "Product") {
                    item.productDetails = await productModel.findOne({
                      _id: item.productId,
                    });
                  }
                  if (item.categoryType == "Service") {
                    item.productDetails = await serviceModel.findOne({
                      _id: item.productId,
                    });
                  }
                  var requestQueryData = await QueryResponseModel.find({
                    customerId: item.customerId,
                    queryId: item._id,
                    status: "Active",
                  });
                  item.attachmentFiles = arrayData;
                  item.queryResponse = requestQueryData;
                })
              );
              let resData = {
                queryList: queryData,
                totalResult: totalResult,
                limit: limit,
              };
              return Helper.response(
                res,
                200,
                "Query details fetched successfully..",
                resData
              );
            } else {
              return Helper.response(res, "404", "Not found", {
                queryList: [],
              });
            }
          }
        }
      );
    } catch (error) {
      console.error(error);
      Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
  requestQuery: async (req, res) => {
    try {
      if (req.user.role == "customer") {
        var checkQueryId = await QueryModel.findOneAndUpdate(
          {
            _id: req.body.queryId,
          },
          { isRead: false }
        );
      } else {
        var checkQueryId = await QueryModel.findOneAndUpdate(
          {
            _id: req.body.queryId,
          },
          { isReadBuyer: false }
        );
      }

      if (checkQueryId) {
        const query = new QueryResponseModel(req.body);
        const saveRequest = await query.save();
        if (saveRequest) {
          return Helper.response(res, "200", "Query request send!");
        }
      } else {
        return Helper.response(
          res,
          CODES.STATUS_CODES.Not_Found,
          "Query Id invalid"
        );
      }
    } catch (error) {
      console.log(error);
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
  viewQuery: async (req, res) => {
    try {
      var query = {
        _id: new ObjectId(req.params.queryId),
      };
      await QueryModel.findOneAndUpdate(
        query,
        { isReadBuyer: true },
        { new: true }
      );
      const agg = [
        {
          $match: query,
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        // {
        //   $lookup: {
        //     from: "Product",
        //     localField: "productId",
        //     foreignField: "_id",
        //     as: "productDetail",
        //   },
        // },
        // {
        //   $unwind: "$productDetail",
        // },
        {
          $lookup: {
            from: "Customer",
            localField: "customerId",
            foreignField: "_id",
            as: "customerDetails",
          },
        },
        {
          $unwind: "$customerDetails",
        },
        {
          $lookup: {
            from: "Supplier",
            localField: "supplierId",
            foreignField: "_id",
            as: "supplierDetails",
          },
        },
        {
          $unwind: "$supplierDetails",
        },
        {
          $project: {
            _id: 1,
            productId: 1,
            customerId: 1,
            customerName: "$customerDetails.name",
            customerEmail: "$customerDetails.emailId",
            supplierId: 1,
            senderId: 1,
            supplierName: "$supplierDetails.basicInfo.founderName",
            supplierEmail: "$supplierDetails.basicInfo.emailId",
            subject: 1,
            message: 1,
            isReadBuyer: 1,
            queryResponse: 1,
            categoryType: 1,
            attachmentFiles: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ];

      const options = {
        allowDiskUse: true,
      };
      let myAggregate = QueryModel.aggregate(agg);
      QueryModel.aggregatePaginate(
        myAggregate,
        options,
        async function (err, result) {
          if (err) {
            console.log(err, "err");
            return Helper.response(res, 500, "Internal server error.");
          } else {
            let queryData = result.docs;
            if (queryData.length > 0) {
              await Promise.all(
                queryData.map(async (item) => {
                  var arrayData = [],
                    imageArr = [];
                  if (item.categoryType == "Product") {
                    var productDetails = await productModel
                      .findOne({
                        _id: item.productId,
                      })
                      .lean();
                    let productImages = [];
                    if (productDetails.productImages.length) {
                      for (
                        let i = 0;
                        i < productDetails.productImages.length;
                        i++
                      ) {
                        var fileExe = await Helper.getFileExtension(
                          productDetails.productImages[i].imgName
                        );
                        productImages.push({
                          imgUrl:
                            process.env.IMAGE_URL +
                            "suppliers/" +
                            productDetails.productImages[i].imgName,
                          imgName: productDetails.productImages[i].imgName,
                          _id: productDetails.productImages[i]._id,
                          fileType: fileExe,
                        });
                      }
                    }
                    productDetails.productImages = productImages;
                    let productImageThumbnail = [];
                    if (
                      productDetails.productImageThumbnail != undefined &&
                      productDetails.productImageThumbnail.length
                    ) {
                      for (
                        let i = 0;
                        i < productDetails.productImageThumbnail.length;
                        i++
                      ) {
                        var fileExe = await Helper.getFileExtension(
                          productDetails.productImageThumbnail[i].imgName
                        );
                        productImageThumbnail.push({
                          imgUrl:
                            process.env.IMAGE_URL +
                            "suppliers/" +
                            productDetails.productImageThumbnail[i].imgName,
                          imgName:
                            productDetails.productImageThumbnail[i].imgName,
                          _id: productDetails.productImageThumbnail[i]._id,
                          fileType: fileExe,
                        });
                      }
                    }
                    productDetails.productImageThumbnail =
                      productImageThumbnail;
                    item.productDetails = productDetails;
                  }
                  if (item.categoryType == "Service") {
                    var productDetails = await serviceModel
                      .findOne({
                        _id: item.productId,
                      })
                      .lean();
                    let serviceImage = [];
                    if (productDetails.serviceImage.length) {
                      for (
                        let i = 0;
                        i < productDetails.serviceImage.length;
                        i++
                      ) {
                        var fileExe = await Helper.getFileExtension(
                          productDetails.serviceImage[i].imgName
                        );
                        serviceImage.push({
                          imgUrl:
                            process.env.IMAGE_URL +
                            "suppliers/" +
                            productDetails.serviceImage[i].imgName,
                          imgName: productDetails.serviceImage[i].imgName,
                          _id: productDetails.serviceImage[i]._id,
                          fileType: fileExe,
                        });
                      }
                    }
                    productDetails.serviceImage = serviceImage;
                    let serviceImageThumbnail = [];
                    if (
                      productDetails.serviceImageThumbnail != undefined &&
                      productDetails.serviceImageThumbnail.length
                    ) {
                      for (
                        let i = 0;
                        i < productDetails.serviceImageThumbnail.length;
                        i++
                      ) {
                        var fileExe = await Helper.getFileExtension(
                          productDetails.serviceImageThumbnail[i].imgName
                        );
                        serviceImageThumbnail.push({
                          imgUrl:
                            process.env.IMAGE_URL +
                            "suppliers/" +
                            productDetails.serviceImageThumbnail[i].imgName,
                          imgName:
                            productDetails.serviceImageThumbnail[i].imgName,
                          _id: productDetails.serviceImageThumbnail[i]._id,
                          fileType: fileExe,
                        });
                      }
                    }
                    productDetails.serviceImageThumbnail =
                      serviceImageThumbnail;
                    item.productDetails = productDetails;
                  }
                  for (var i = 0; i < item.attachmentFiles.length; i++) {
                    arrayData.push(
                      process.env.IMAGE_URL +
                        "queryManagement/" +
                        item.attachmentFiles[i]
                    );
                  }

                  var responseQueryData = await QueryResponseModel.find({
                    // supplierId: item.supplierId,
                    queryId: req.params.queryId,
                    status: "Active",
                  });
                  item.attachmentFiles = arrayData;
                  item.queryResponse = responseQueryData;
                })
              );
              let resData = {
                queryList: queryData[0],
              };
              return Helper.response(
                res,
                200,
                "Query detail fetched successfully..",
                resData
              );
            } else {
              return Helper.response(res, "404", "Not found", {
                queryList: {},
              });
            }
          }
        }
      );
    } catch (error) {
      console.error(error);
      Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
  ChangeSupportStatus: async (req, res) => {
    try {
      const _id = req.params.supportId;
      req.body.updatedAt = moment().format();
      const doesSupportExist = await SupportModel.findById(_id);
      if (doesSupportExist) {
        const supportData = await SupportModel.findByIdAndUpdate(
          _id,
          { $set: req.body },
          { new: true }
        );
        console.log({ supportData });
        if (!supportData) {
          return Helper.response(res, 404, "Not found");
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
  readQuery: async (req, res) => {
    try {
      const { id } = req.params;

      let updateObj = {
        isRead: true,
      };
      await QueryModel.findByIdAndUpdate(id, updateObj, {
        new: true,
      });

      return Helper.response(res, "200", "Query read successfully");
    } catch (error) {
      console.log(error);
      return Helper.response(res, "500", "Internal server error");
    }
  },
  readAllQuery: async (req, res) => {
    try {
      const id = req.user._id.toString();
      if (id && req.user.role === "supplier") {
        let supplierId = id;
        if (supplierId) {
          await QueryChatModel.updateMany(
            {
              supplierId: supplierId,
            },
            {
              $set: {
                isRead: true,
              },
            }
          );
        }
      }
      if (id && req.user.role === "customer") {
        let userId = id;
        if (userId) {
          await QueryModel.updateMany(
            {
              customerId: userId,
            },
            {
              $set: {
                isRead: true,
              },
            },
            { multi: true }
          );
        }
      }

      return Helper.response(res, "200", "Query read All successfully");
    } catch (error) {
      console.log(error);
      return Helper.response(res, "500", "Internal server error");
    }
  },
};
