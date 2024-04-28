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
const QuerySellerResponseModel = require("../../../models//QuerySellerResponseModel");
const productModel = require("../../../models/ProductModel");
const ServiceModel = require("../../../models/ServiceModel");
const { param } = require("express-validator");
module.exports = {
  listQueryOld: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 25;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      var query = {
        supplierId: req.user._id,
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
            createdAt: -1,
          },
        },
        {
          $lookup: {
            from: "Customer",
            localField: "customerId",
            foreignField: "_id",
            as: "customerdetails",
          },
        },
        {
          $unwind: "$customerdetails",
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
            message: 1,
            replyBy: 1,
            answer: 1,
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
            console.log(err, "errquery87");
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
                    item.productDetails = await ServiceModel.findOne({
                      _id: item.productId,
                    });
                  }
                  var requestQueryData = await QueryResponseModel.find({
                    supplierId: item.supplierId,
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
  responseQuery: async (req, res) => {
    try {
      req.body.replyBy = req.body.replyBy;
      if (req.body.questionId != "") {
        const checkQuestionId = await QueryResponseModel.findOne({
          _id: req.body.questionId,
        });
        if (checkQuestionId) {
          req.body.queryId = checkQuestionId.queryId;
          const updateQuery = await QueryResponseModel.findOneAndUpdate(
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
            `Response send to customer!`
          );
        } else {
          return Helper.response(
            res,
            CODES.STATUS_CODES.Not_Found,
            MSG.notFound[LOCALE || "en"]
          );
        }
      }
      if (req.body.queryId != "") {
        const checkQuestionId = await QueryModel.findOne({
          _id: req.body.queryId,
        });
        if (checkQuestionId) {
          const updateQuery = await QueryModel.findOneAndUpdate(
            { _id: req.body.queryId },
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
  listQuery: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 25;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      var query = {
        supplierId: req.user._id,
        status: { $ne: "Delete" },
      };
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
      if (req.query.search) {
        let searchObject = {
          $or: [
            { subject: { $regex: req.query.search, $options: "i" } },
            { message: { $regex: req.query.search, $options: "i" } },
          ],
        };
        Object.assign(query, searchObject);
      }
      var agg = [
        {
          $lookup: {
            from: "Admin",
            localField: "adminId",
            foreignField: "_id",
            as: "adminDetails",
          },
        },
        {
          $unwind: "$adminDetails",
        },
        {
          $match: query,
        },
        {
          $project: {
            adminName: "$adminDetails.firstName",
            adminLastName: "$adminDetails.lastName",
            adminEmail: "$adminDetails.email",
            supplierId: 1,
            isRead: 1,
            isReadSeller: 1,
            adminId: 1,
            attachmentFiles: 1,
            description: 1,
            status: 1,
            title: 1,
            createdAt: 1,
            updatedAt: 1,
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
            console.log(err, "errquery87");
            return Helper.response(res, 500, "Internal server error.");
          } else {
            let queryData = result.docs;
            let totalResult = result.totalDocs;
            if (queryData.length > 0) {
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
  singleQuery: async (req, res) => {
    try {
      var query = {
        _id: new ObjectId(req.params._id),
        status: { $ne: "Delete" },
      };
     await QueryChatModel.findOneAndUpdate(
       query,
       { isReadSeller: true },
       { new: true }
     );
      var agg = [
        {
          $lookup: {
            from: "Admin",
            localField: "adminId",
            foreignField: "_id",
            as: "adminDetails",
          },
        },
        {
          $unwind: "$adminDetails",
        },
        {
          $match: query,
        },
        {
          $project: {
            adminName: "$adminDetails.firstName",
            adminLastName: "$adminDetails.lastName",
            adminEmail: "$adminDetails.email",
            supplierId: 1,
            adminId: 1,
            attachmentFiles: 1,
            description: 1,
            status: 1,
            title: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ];
      const options = {
        allowDiskUse: true,
      };
      let myAggregate = QueryChatModel.aggregate(agg);
      QueryChatModel.aggregatePaginate(
        myAggregate,
        options,
        async function (err, result) {
          if (err) {
            return Helper.response(res, 500, "Internal server error.");
          } else {
            let queryData = result.docs;
            if (queryData.length > 0) {
              await Promise.all(
                queryData.map(async (item) => {
                  var arrayData = [];
                  for (var i = 0; i < item.attachmentFiles.length; i++) {
                    arrayData.push({
                      imgUrl:
                        process.env.IMAGE_URL +
                        "customers/" +
                        item.attachmentFiles[i].imgName,
                      imgName: item.attachmentFiles[i].imgName,
                    });
                  }
                  var requestQueryData = await QuerySellerResponseModel.find({
                    supplierId: item.supplierId,
                    queryId: item._id,
                    status: "Active",
                  });
                  item.attachmentFiles = arrayData;
                  item.queryResponse = requestQueryData;
                })
              );
              let resData = {
                queryList: queryData[0],
              };
              return Helper.response(
                res,
                200,
                "Query details fetched successfully..",
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
  readQuery: async (req, res) => {
    try {
      const { id } = req.params;

      let updateObj = {
        isRead: true,
      };
      await QueryChatModel.findByIdAndUpdate(id, updateObj, {
        new: true,
      });

      return Helper.response(res, "200", "Query read successfully");
    } catch (error) {
      console.log(error);
      return Helper.response(res, "500", "Internal server error");
    }
  },
};
