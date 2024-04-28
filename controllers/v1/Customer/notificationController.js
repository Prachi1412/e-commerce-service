const notificationSubscribeDataModel = require("../../../models/notificationSubscribeDataModel");
const Helper = require("../../../config/helper");
const customerModel = require("../../../models/CustomerModel");
const supplierModel = require("../../../models/SupplierModel");
const notificationModel = require("../../../models/notificationModel");
module.exports = {
  subscribeData: async (req, res) => {
    try {
      var savenotificationSubscribeData;
      var checkAvailability = await notificationSubscribeDataModel.findOne({
        userId: req.body.userId,
      });
      var notificationSubscribeData = new notificationSubscribeDataModel(
        req.body
      );
      savenotificationSubscribeData = await notificationSubscribeData.save();
      if (savenotificationSubscribeData) {
        return Helper.response(res, 200, "Subscribe data added successfully");
      } else {
        return Helper.response(res, 500, "Internal Server Error");
      }
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Internal Server Error");
    }
  },
  sendNotification: async (req, res) => {
    //only for postman testing
    const notificationPayload = {
      notification: {
        title: "Push Notification",
        body: "This is a push notification from your server!",
        icon: "assets/images/logo_blue.png",
      },
    };
    const subscriptions = await notificationSubscribeDataModel.find(
      {},
      {
        subscribeData: 1,
        _id: 0,
        token: 1,
        userId: 1,
      }
    );
    if (subscriptions.length == 0) {
      return Helper.response(res, 403, "Subscribe object not found");
    }
    var data = await Helper.sendNotification(
      notificationPayload,
      subscriptions
    );
    if (data == "success") return Helper.response(res, 200, data);
  },

  list: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 25;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      var query = {
        status: {
          $ne: "Delete",
        },
      };
      console.log(req.user._id, req.user.role, "req.user._idreq.user._id");
      if (req.user.role === "supplier") {
        query.supplierId = req.user._id.toString();
        query.role = req.user.role;
      }
      if (req.user.role === "customer") {
        query.userId = req.user._id.toString();
        query.role = req.user.role;
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
            from: "Product",
            localField: "productId",
            foreignField: "_id",
            as: "productDetail",
          },
        },
        {
          $unwind: "$productDetail",
        },

        {
          $project: {
            _id: 1,
            productId: 1,
            productName: "$productDetail.productName",
            productNameForListing: "$productDetail.productNameForListing",
            productImages: "$productDetail.productImages",
            productDimensions: "$productDetail.productDimensions",
            productDescription: "$productDetail.productDescription",
            customerId: 1,
            supplierId: 1,
            userId: 1,
            role: 1,
            title: 1,
            message: 1,
            notificationFor: 1,
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
      let myAggregate = notificationModel.aggregate(agg);
      notificationModel.aggregatePaginate(
        myAggregate,
        options,
        async function (err, result) {
          if (err) {
            console.log(err, "err");
            return Helper.response(res, 500, "Internal server error.");
          } else {
            let notificationData = result.docs;
            let totalResult = result.totalDocs;
            if (notificationData.length > 0) {
              await Promise.all(
                notificationData.map(async function (item) {
                  if (item.productImages.length > 0) {
                    let productImages = [];
                    for (let i = 0; i < item.productImages.length; i++) {
                      productImages.push({
                        imgUrl:
                          process.env.IMAGE_URL +
                          "suppliers/" +
                          item.productImages[i].imgName,
                      });
                    }
                    item.productImages = productImages;
                  }
                  if (item.userId) {
                    item.customerInfo = await customerModel.findOne(
                      {
                        _id: item.userId,
                      },
                      {
                        name: 1,
                        emailId: 1,
                      }
                    );
                  }
                  if (item.supplierId) {
                    let supplierInfo = await supplierModel.findOne(
                      {
                        _id: item.supplierId,
                      },
                      {
                        basicInfo: 1,
                      }
                    );
                    if (supplierInfo && supplierInfo.basicInfo) {
                      item.supplierInfo = {
                        founderName: supplierInfo.basicInfo.founderName,
                        coFounderNames: supplierInfo.basicInfo.coFounderNames,
                        companyName: supplierInfo.basicInfo.companyName,
                        emailId: supplierInfo.basicInfo.emailId,
                        contactNo: supplierInfo.basicInfo.contactNo,
                      };
                    }
                  }
                })
              );

              let resData = {
                notificationList: notificationData,
                totalResult: totalResult,
                limit: limit,
              };
              return Helper.response(
                res,
                200,
                "Notification list fetched successfully..",
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

  delete: async (req, res) => {
    try {
      const { id } = req.params;

      let updateObj = {
        status: "Delete",
        updateAt: new Date(),
      };
      await notificationModel.findByIdAndUpdate(id, updateObj, {
        new: true,
      });

      return Helper.response(res, "200", "Notification updated successfully");
    } catch (error) {
      console.log(error);
      return Helper.response(res, "500", "Internal server error");
    }
  },

  read: async (req, res) => {
    try {
      const { id } = req.params;

      let updateObj = {
        isRead: true,
      };
      await notificationModel.findByIdAndUpdate(id, updateObj, {
        new: true,
      });

      return Helper.response(res, "200", "Notification read successfully");
    } catch (error) {
      console.log(error);
      return Helper.response(res, "500", "Internal server error");
    }
  },

  readAll: async (req, res) => {
    try {
      const id = req.user._id.toString();
      if (id && req.user.role === "supplier") {
        let supplierId = id;
        if (supplierId) {
          await notificationModel.updateMany(
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
          await notificationModel.updateMany(
            {
              userId: userId,
            },
            {
              $set: {
                isRead: true,
              },
            }
          );
        }
      }

      return Helper.response(res, "200", "Notification read All successfully");
    } catch (error) {
      console.log(error);
      return Helper.response(res, "500", "Internal server error");
    }
  },
};
