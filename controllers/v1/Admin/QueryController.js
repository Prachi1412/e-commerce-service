const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const Helper = require("../../../config/helper");
const queryAttachment =
  Helper.upload_space("queryManagement").array("attachmentFiles");
const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const QueryModel = require("../../../models/QueryModel");
const QueryResponseModel = require("../../../models/QueryResponseModel");
const QueryChatModel = require("../../../models/queryChatModel");
const QuerySellerResponseModel = require("../../../models/QuerySellerResponseModel");
const SupportModel = require("../../../models/SupportModel");
const { param } = require("express-validator");
const productModel = require("../../../models/ProductModel");
const serviceModel = require("../../../models/ServiceModel");
const moment = require("moment-timezone");
const supplierModel = require("../../../models/SupplierModel");
const { NetworkManager } = require("aws-sdk");
const _ = require("lodash");
module.exports = {
  listQuery: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 25;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      var query = {
        status: { $ne: "Delete" },
      };
      if (req.query.categoryType) {
        query.categoryType = req.query.categoryType;
      }
      if (req.query.status) {
        if (req.query.status == "cancel" || req.query.status == "cancelled") {
          query.status = { $in: ["canceled", "cancelled", "cancel"] };
        } else {
          query.status = req.query.status;
        }
      }
      if (req.query.isRead) {
        if (req.query.isRead == "true" || req.query.isRead == true) {
          query.isRead = true;
        } else {
          query.isRead = false;
        }
      }
      if (req.query.search) {
        let searchObject = {
          $or: [
            { subject: { $regex: req.query.search, $options: "i" } },
            { message: { $regex: req.query.search, $options: "i" } },
            { categoryType: { $regex: req.query.search, $options: "i" } },
            {
              "customerDetails.name": {
                $regex: req.query.search,
                $options: "i",
              },
            },

            {
              "supplierDetails.basicInfo.founderName": {
                $regex: req.query.search,
                $options: "i",
              },
            },
          ],
        };
        Object.assign(query, searchObject);
      }
      if (req.query.customerId) {
        let cusIdArr = [];
        var cusId = req.query.customerId.split(",");
        cusId.forEach((ids) => {
          cusIdArr.push(new ObjectId(ids));
        });
        query.customerId = { $in: cusIdArr };
      }
      if (req.query.supplierId) {
        let suppIdArr = [];
        var suppId = req.query.supplierId.split(",");
        suppId.forEach((ids) => {
          suppIdArr.push(new ObjectId(ids));
        });
        query.supplierId = { $in: suppIdArr };
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
      const agg = [
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
          $match: query,
        },
        {
          $sort: {
            updatedAt: -1,
          },
        },
        {
          $project: {
            _id: 1,
            productId: 1,
            customerId: 1,
            customerName: "$customerDetails.name",
            customerDetails: "$customerDetails",
            supplierId: 1,
            senderId: 1,
            subject: 1,
            supplierName: "$supplierDetails.basicInfo.founderName",
            supplierDetails: "$supplierDetails.basicInfo",
            message: 1,
            replyBy: 1,
            answer: 1,
            queryResponse: 1,
            categoryType: 1,
            attachmentFiles: 1,
            status: 1,
            isRead: 1,
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
                  var responseQueryData = await QueryResponseModel.find({
                    queryId: item._id,
                    status: "Active",
                  });
                  item.attachmentFiles = arrayData;
                  item.queryResponse = responseQueryData;
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
  listSupport: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 25;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      var query = {
        status: { $ne: "Delete" },
      };
          if (req.query.isRead == "true" || req.query.isRead == true) {
            query.isRead = true;
          } else if (req.query.isRead == "false" || req.query.isRead == false) {
            query.isRead = false;
          }
      if (req.query.status) {
        query.status = req.query.status;
      }
      if (req.query.supportType) {
        query.supportType = req.query.supportType;
      }
      if (req.query.search) {
        let searchObject = {
          $or: [
            { email: { $regex: req.query.search, $options: "i" } },
            { message: { $regex: req.query.search, $options: "i" } },
            { name: { $regex: req.query.search, $options: "i" } },
            { mobileNumber: { $regex: req.query.search, $options: "i" } },
          ],
        };
        Object.assign(query, searchObject);
      }
      const agg = [
        {
          $match: query,
        },
        {
                    $addFields: {
                        productIdObjectId: {
                            $cond: {
                                if: { $ne: ["$productId", ""] },
                                then: { $toObjectId: "$productId" },
                                else: "$productId"
                            }
                        },
                    }
                },
                {
                    $lookup: {
                        from: "Product",
                        localField: "productIdObjectId",
                        foreignField: "_id",
                        as: "productInfo"
                    }
                },
                { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
                {
                    $sort: {
                        updatedAt: -1,
                    },
                },
                {
                    $project: {
                        _id: 1,
                        addedBy: 1,
                        email: 1,
                        message: 1,
                        mobileNumber: 1,
                        supportType: 1,
                        productId: 1,
                        productName: "$productInfo.productName",
                        productUniqueId: "$productInfo.productUniqueId",
                        // productId: "$productInfo._id",
                        categoryType: 1,
                        attachedFiles: 1,
                        name: 1,
                        status: 1,
                        isRead: 1,
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
      let myAggregate = SupportModel.aggregate(agg);
      SupportModel.aggregatePaginate(
        myAggregate,
        options,
        async function (err, result) {
          if (err) {
            console.log(err, "err");
            return Helper.response(res, 500, "Internal server error.");
          } else {
            var newResArr = [];
            let supportData = result.docs;
            let totalResult = result.totalDocs;
            if (supportData.length > 0) {
              await Promise.all(
                supportData.map(async (item) => {
                  item = JSON.parse(JSON.stringify(item));
                  if (item.productId) {
                    if (item.categoryType == "Product") {
                      var productDetails = await productModel.findOne({
                        _id: item.productId,
                      });
                      if (productDetails) {
                        item.productName = productDetails.productName;
                        item.productUniqueId = productDetails.productUniqueId;
                        item.productId = item.productId;
                      } else {
                        item.productName = "";
                        item.productUniqueId = "";
                        item.productId = "";
                      }
                    }
                    if (item.categoryType == "Service") {
                      console.log(item.categoryType, "item.categoryType");
                      let serviceDetails = await serviceModel.findOne({
                        _id: new ObjectId(item.productId),
                      });

                      if (serviceDetails) {
                        item.productName = serviceDetails.serviceName;
                        item.productUniqueId = serviceDetails.serviceUniqId;
                        item.productId = item.productId;
                      } else {
                        item.productName = "";
                        item.productUniqueId = "";
                        item.productId = "";
                      }
                    }
                  } else {
                    item.productName = "";
                    item.productUniqueId = "";
                    item.productId = "";
                  }
                  if (item.attachedFiles && item.attachedFiles.length > 0) {
                    let attachedFilesArr = [];
                    for (let i = 0; i < item.attachedFiles.length; i++) {
                      attachedFilesArr.push({
                        imgUrl:
                          process.env.IMAGE_URL +
                          "customers/" +
                          item.attachedFiles[i].imgName,
                        imgName: item.attachedFiles[i].imgName,
                      });
                    }
                    item.attachedFiles = attachedFilesArr;
                  }
                  newResArr.push(item);
                })
              );
              newResArr = _.orderBy(newResArr, ["createdAt"], ["desc"]);
              let resData = {
                supportList: newResArr,
                totalResult: totalResult,
                limit: limit,
              };
              return Helper.response(
                res,
                200,
                "Support details fetched successfully..",
                resData
              );
            } else {
              return Helper.response(res, "404", "Not found", {
                supportList: [],
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
  responseQuery: async (req, res) => {
    try {
      const checkQuestionId = await QueryModel.findOne({
        _id: req.body.questionId,
      });
      req.body.updatedAt = moment().format();
      if (checkQuestionId) {
        const updateQuery = await QueryModel.findOneAndUpdate(
          { _id: req.body.questionId },
          { $set: req.body },
          { new: true }
        );

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
          `Your response send successfully!`
        );
      } else {
        return Helper.response(
          res,
          CODES.STATUS_CODES.Not_Found,
          MSG.notFound[LOCALE || "en"]
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
  changeSupportStatusByAdmin: async (req, res) => {
    try {
      const _id = req.params.supportId;
      req.body.updatedAt = moment().format();
      if (req.body.status == "resolve") {
        req.body.dateOfResoluton = moment().format();
      }
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
  chatInitiateByAdmin: async (req, res) => {
    try {
      req.body.adminId = req.admin._id;
      req.body.updatedAt = moment().format();
      req.body.isRead = true;
      await Helper.sendNotification(
        req.body.supplierId,
        "supplier",
        "",
        `You have a new chat request from admin!`,
        "New Query Request From Admin",
        "New Query Request From Admin"
      );
      await Helper.sendNotificationToAdmin(
        "New Query Request",
        "New Query Request",
        `You have send a new chat request to seller!`,
        req.body.supplierId // buyer id
      );
      const queryChat = new QueryChatModel(req.body);
      const saveQueryChat = await queryChat.save();
      if (saveQueryChat) {
        return Helper.response(
          res,
          CODES.STATUS_CODES.OK,
          "Send Successfully."
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
  chatInitiateByAdminList: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 25;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      var query = { status: { $ne: "Delete" } };
      if (req.query.status) {
        query.status = req.query.status;
      }
      if (req.query.search) {
        let searchObject = {
          $or: [
            { title: { $regex: req.query.search, $options: "i" } },
            { description: { $regex: req.query.search, $options: "i" } },
            {
              "supplierDetails.basicInfo.founderName": {
                $regex: req.query.search,
                $options: "i",
              },
            },
          ],
        };
        Object.assign(query, searchObject);
      }
      if (req.query.supplierId) {
        let suppIdArr = [];
        var suppId = req.query.supplierId.split(",");
        suppId.forEach((ids) => {
          suppIdArr.push(new ObjectId(ids));
        });
        query.supplierId = { $in: suppIdArr };
      }
       if (req.query.isRead == "true" || req.query.isRead == true) {
         query.isRead = true;
       } else if (req.query.isRead == "false" || req.query.isRead == false) {
         query.isRead = false;
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
      var agg = [
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
          $match: query,
        },
        {
          $project: {
            supplierName: "$supplierDetails.basicInfo.founderName",
            companyName: "$supplierDetails.basicInfo.companyName",
            supplierUniqId: "$supplierDetails.supplierUniqId",
            supplierId: 1,
            adminId: 1,
            attachmentFiles: 1,
            description: 1,
            status: 1,
            title: 1,
            createdAt: 1,
            updatedAt: 1,
            isRead: 1,
          },
        },
        { $sort: { updatedAt: -1 } },
      ];
      const options = {
        page: page,
        limit: limit,
        allowDiskUse: true,
      };
      let myAggregate = QueryChatModel.aggregate(agg);
      QueryChatModel.aggregatePaginate(
        myAggregate,
        options,
        async function (err, result) {
          if (err) {
            console.log(err, "err");
            return Helper.response(res, 500, "Internal server error.");
          } else {
            let queryChatData = result.docs;
            let totalResult = result.totalDocs;
            if (queryChatData.length > 0) {
              await Promise.all(
                queryChatData.map(async (item) => {
                  if (item.attachmentFiles && item.attachmentFiles.length > 0) {
                    let attachmentFilesArr = [];
                    for (let i = 0; i < item.attachmentFiles.length; i++) {
                      attachmentFilesArr.push({
                        imgUrl:
                          process.env.IMAGE_URL +
                          "customers/" +
                          item.attachmentFiles[i].imgName,
                        imgName: item.attachmentFiles[i].imgName,
                      });
                    }
                    item.attachmentFiles = attachmentFilesArr;
                  }
                  var responseQueryData = await QuerySellerResponseModel.find({
                    queryId: item._id,
                    status: "Active",
                  });
                  item.queryResponse = responseQueryData;
                })
              );

              return Helper.response(res, 200, "Chat fetched successfully", {
                data: queryChatData,
                totalResult: totalResult,
                limit: limit,
              });
            } else {
              return Helper.response(res, "404", "Not found", {
                data: [],
              });
            }
          }
        }
      );
    } catch (error) {
      console.error(error);
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.api.fail[LOCALE || "en"]
      );
    }
  },
  changeQueryStatusBuyer: async (req, res) => {
    try {
      const queryId = req.params.id;
      const doesSupplierExist = await QueryModel.findById(queryId);
      if (doesSupplierExist) {
        const updateQuery = await QueryModel.findByIdAndUpdate(
          queryId,
          { $set: req.body },
          { new: true }
        );
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
          `Query ${req.body.status} successfully`
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
  changeQueryStatusSeller: async (req, res) => {
    try {
      const _id = req.params.id;
      const doesChatexist = await QueryChatModel.findById(_id);
      if (doesChatexist) {
        const updateQuery = await QueryChatModel.findByIdAndUpdate(
          _id,
          { $set: req.body },
          { new: true }
        );

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
          `Query ${req.body.status} successfully`
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
  requestChatByAdmin: async (req, res) => {
    try {
      if (req.user.role == "supplier") {
        var checkQueryId = await QueryChatModel.findOneAndUpdate(
          {
            _id: req.body.queryId,
          },
          { isRead: false }
        );
      } else {
        var checkQueryId = await QueryChatModel.findOneAndUpdate(
          {
            _id: req.body.queryId,
          },
          { isReadSeller: false }
        );
      }

      if (checkQueryId) {
        const query = new QuerySellerResponseModel(req.body);
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
  queryBuyerRead: async (req, res) => {
    try {
      const _id = req.params.queryId;
      const queryExist = await QueryModel.findById(_id);
      if (queryExist) {
        const queryData = await QueryModel.findByIdAndUpdate(
          _id,
          {
            isRead: true,
          },
          {
            new: true,
          }
        );
        if (!queryData) {
          return Helper.response(res, 404, "Not found");
        }
        return Helper.response(res, 200, "Query read successfully");
      } else {
        return Helper.response(res, 404, "Not found");
      }
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Internal error");
    }
  },
  querySellerRead: async (req, res) => {
    try {
      const _id = req.params.queryId;
      const queryExist = await QueryChatModel.findById(_id);
      if (queryExist) {
        const queryData = await QueryChatModel.findByIdAndUpdate(
          _id,
          {
            isRead: true,
          },
          {
            new: true,
          }
        );
        if (!queryData) {
          return Helper.response(res, 404, "Not found");
        }
        return Helper.response(res, 200, "Query read successfully");
      } else {
        return Helper.response(res, 404, "Not found");
      }
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Internal error");
    }
  },
  supportRead: async (req, res) => {
    try {
      const _id = req.params.supportId;
      const supportExist = await SupportModel.findById(_id);
      if (supportExist) {
        const supportData = await SupportModel.findByIdAndUpdate(
          _id,
          {
            isRead: true,
          },
          {
            new: true,
          }
        );
        if (!supportData) {
          return Helper.response(res, 404, "Not found");
        }
        return Helper.response(res, 200, "Support read successfully");
      } else {
        return Helper.response(res, 404, "Not found");
      }
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Internal error");
    }
  },
};
