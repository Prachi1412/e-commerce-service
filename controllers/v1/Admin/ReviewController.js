const ReviewModel = require("../../../models/ReviewModel");
const Helper = require("../../../config/helper");
const OrderModel = require("../../../models/OrderModel");
const { logger } = require("../../../logger/winston");
module.exports = {
  getReview1: async (req, res) => {
    try {
      var query = {};
      if (req.query.search) {
        let searchObject = {
          $or: [
            {
              title: {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              description: {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              "productDetails.productName": {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              "customerDetails.name": {
                $regex: req.query.search,
                $options: "i",
              },
            },
          ],
        };
        Object.assign(query, searchObject);
      }
      var reviewList = await ReviewModel.find(query)
        .lean()
        .sort({ createdAt: 1 })
        .populate("productId", "productName productDescription productUniqueId")
        .populate("customerId", "customerUniqId name emailId");
      await Promise.all(
        reviewList.map(async function (item) {
          if (item.images.length > 0) {
            let imagesArr = [];
            for (let i = 0; i < item.images.length; i++) {
              imagesArr.push({
                imgName: item.images[i].imgName,
                imgUrl:
                  process.env.IMAGE_URL + "customers/" + item.images[i].imgName,
              });
            }
            var orderDetails = await OrderModel.findOne(
              {
                _id: item.orderId,
                orderStatus: { $ne: "DELETE" },
              },
              { parentOrderId: 1 }
            );
            if (orderDetails) item.parentOrderId = orderDetails.parentOrderId;
            item.images = imagesArr;
          }
        })
      );
      return Helper.response(res, "200", "List of all reviews", {
        data: reviewList,
      });
    } catch (error) {
      logger.error(error);
      return Helper.response(res, 500, "Something went wrong.");
    }
  },
  getReview: async (req, res) => {
    try {
      var query = {};
      const limit = req.query.limit ? parseInt(req.query.limit) : 25;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      if (req.query.search) {
        let searchObject = {
          $or: [
            {
              title: {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              description: {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              "productDetails.productName": {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              "productDetails.productUniqueId": {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              "customerDetails.name": {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              "customerDetails.customerUniqId": {
                $regex: req.query.search,
                $options: "i",
              },
            },
          ],
        };
        Object.assign(query, searchObject);
      }
      if (req.query.isRead == "true" || req.query.isRead == true) {
        query.isRead = true;
      } else if (req.query.isRead == "false" || req.query.isRead == false) {
        query.isRead = false;
      }
      let agg = [
        {
          $lookup: {
            from: "Product",
            localField: "productId",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        {
          $unwind: "$productDetails",
        },
        {
          $lookup: {
            from: "Customer", // Assuming the customers collection name
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
            "customerDetails.jwtToken": 0,
            "customerDetails.password": 0,
            "customerDetails.isOtpVerified": 0,
            "customerDetails.isVerified": 0,
            "customerDetails.verificationToken": 0,
            "customerDetails.verificationTokenExpires": 0,
            "customerDetails.otp": 0,
            "customerDetails.profileImage": 0,
          },
        },
        {
          $match: query,
        },
        {
          $sort: { createdAt: 1 },
        },
        {
          $project: {
            _id: 1,
            rating: 1,
            description: 1,
            title: 1,
            orderId: 1,
            images: 1,
            createdAt: 1,
            updateAt: 1,
            isRead: 1,
            productId: "$productDetails",
            customerId: "$customerDetails",
          },
        },
      ];
        const options = {
          page: page,
          limit: limit,
          allowDiskUse: true,
        };
             let myAggregate = ReviewModel.aggregate(agg);
             ReviewModel.aggregatePaginate(
               myAggregate,
               options,
               async function (err, result) {
                 if (err) {
                   console.log("err", err);
                   return Helper.response(res, 500, "Internal server error.");
                 } else {
                   if (result.docs.length > 0) {
                     let reviewList = result.docs;
                     let totalResult = result.totalDocs;
                     if (reviewList.length > 0) {
                       await Promise.all(
                         reviewList.map(async function (item) {
                           if (item.images.length > 0) {
                             let imagesArr = [];
                             for (let i = 0; i < item.images.length; i++) {
                               imagesArr.push({
                                 imgName: item.images[i].imgName,
                                 imgUrl:
                                   process.env.IMAGE_URL +
                                   "customers/" +
                                   item.images[i].imgName,
                               });
                             }

                             var orderDetails = await OrderModel.findOne(
                               {
                                 _id: item.orderId,
                                 orderStatus: { $ne: "DELETE" },
                               },
                               { parentOrderId: 1 }
                             );

                             if (orderDetails)
                               item.parentOrderId = orderDetails.parentOrderId;
                             item.images = imagesArr;
                           }
                         })
                       );
                       let resData = {
                         data: reviewList,
                         totalResult: totalResult,
                         limit: limit,
                       };
                       Helper.response(
                         res,
                         200,
                         "List of all reviews",
                         resData
                       );
                     } else {
                       Helper.response(res, 404, "Order not found", {
                         orderList: [],
                       });
                     }
                   } else {
                     Helper.response(res, 404, "List of all reviews", {
                       data: [],
                     });
                   }
                 }
               }
             );

    } catch (error) {
      logger.error(error);
      return Helper.response(res, 500, "Something went wrong.");
    }
  },

  deleteReview: async (req, res) => {
    try {
      var deleteReview = await ReviewModel.findOneAndDelete({
        _id: req.params._id,
      });
      return Helper.response(res, "200", "Review deleted successfully");
    } catch (error) {
      logger.error(error);
      return Helper.response(res, 500, "Something went wrong.");
    }
  },
  reviewRead: async (req, res) => {
    try {
      const _id = req.params.reviewId;
      const reviewExist = await ReviewModel.findById(_id);
      if (reviewExist) {
        const reviewdata = await ReviewModel.findByIdAndUpdate(
          _id,
          {
            isRead: true,
          },
          {
            new: true,
          }
        );
        if (!reviewdata) {
          return Helper.response(res, 404, "Not found");
        }
        return Helper.response(res, 200, "Review read successfully");
      } else {
        return Helper.response(res, 404, "Not found");
      }
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Internal error");
    }
  },
};
