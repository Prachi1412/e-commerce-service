const bcrypt = require("bcrypt");
const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const customerModel = require("../../../models/CustomerModel");
const AddressModel = require("../../../models/AddressModel");
const OrderModel = require("../../../models/OrderModel");
const ReviewModel = require("../../../models/ReviewModel");
const CategoryModel = require("../../../models/ProductCategoryModel");
const institutionModel = require("../../../models/InstitutionModel");
const professionModel = require("../../../models/ProfessionModel");
const QueryModel = require("../../../models/QueryModel");
const QueryResponseModel = require("../../../models/QueryResponseModel");
const { logger } = require("../../../logger/winston");
const productSubCategoryModel = require("../../../models/ProductSubCategoryModel");
const mongoose = require("mongoose");
var _ = require("lodash");
const { ObjectId } = mongoose.Types;
const Helper = require("../../../config/helper");
module.exports = {
  getCustomerListing: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const status = req.query.status ? req.query.status : "";
      const registerType = req.query.registerType ? req.query.registerType : "";
      let query = {
        status: {
          $ne: "Delete",
        },
      };

      if (status) {
        query = {
          status: {
            $eq: status,
          },
        };
      }
      if (registerType) {
        query = {
          registerType: {
            $eq: registerType,
          },
        };
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
              name: {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              emailId: {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              customerUniqId: {
                $regex: req.query.search,
                $options: "i",
              },
            },
          ],
        };
        Object.assign(query, searchObject);
      }
      let productCategoryId = req.query.productCategoryId
        ? req.query.productCategoryId
        : null;

      if (productCategoryId) {
        let productCategoryIdArray = productCategoryId.split(",");
        let objectIdArray = productCategoryIdArray.map(
          (id) => new ObjectId(id)
        );
        query.productCategoryId = {
          $in: objectIdArray,
        };
      }
      let subCategoryId = req.query.productSubCategoryId
        ? req.query.productSubCategoryId
        : null;
      if (subCategoryId) {
        let subCategoryIdArray = subCategoryId.split(",");
        let objectIdSubIdArray = subCategoryIdArray.map(
          (id) => new ObjectId(id)
        );
        query.productSubCategoryId = {
          $in: objectIdSubIdArray,
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
      const agg = [
        {
          $lookup: {
            from: "ProductCategory",
            localField: "productCategoryId",
            foreignField: "_id",
            as: "category_details",
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
          $lookup: {
            from: "Order",
            localField: "_id",
            foreignField: "customerId",
            as: "orderDetails",
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
        {
          $project: {
            _id: 1,
            emailId: 1,
            accountUpgradeStatus: 1,
            productCategoryName: "$category_details.productCategoryName",
            subCategoryName: "$subcategory_details.subCategoryName",
            address: 1,
            cardDetails: 1,
            city: 1,
            contactNo: 1,
            country: 1,
            countryCode: 1,
            customerUniqId: 1,
            dob: 1,
            isOtpVerified: 1,
            isOtpVerified: 1,
            name: 1,
            nameOfFounder: 1,
            noOfBeds: 1,
            planDetails: 1,
            productCategoryId: 1,
            productSubCategoryId: 1,
            professionalQualification: 1,
            profileImage: 1,
            registerType: 1,
            SPOCDetails: 1,
            other: 1,
            state: 1,
            status: 1,
            typeOfAccount: 1,
            typeOfHospital: 1,
            typeOfHospitalValue: 1,
            yearOfEstablishment: 1,
            yearsOfPractice: 1,
            zipCode: 1,
            createdAt: 1,
            updatedAt: 1,
            isRead: 1,
            ordersCount: { $size: "$orderDetails" },
          },
        },
      ];
      const options = {
        page: page,
        limit: limit,
        allowDiskUse: true,
      };
      let myAggregate = customerModel.aggregate(agg);
      customerModel.aggregatePaginate(
        myAggregate,
        options,
        async function (err, result) {
          if (err) {
            console.log(err, "err");
            return Helper.response(res, 500, "Internal server error.");
          } else {
            let serviceList = result.docs;
            let totalResult = result.totalDocs;
            if (serviceList.length > 0) {
              // await Promise.all(
              //   serviceList.map(async function (item) {
              //     var orderCount = await OrderModel.find({
              //       customerId: item._id,
              //       orderStatus: {
              //         $ne: "DELETE",
              //       },
              //     }).count();
              //     item.ordersCount = orderCount;
              //   })
              // );
              const resData = {
                customerList: serviceList,
                totalResult: totalResult,
                limit: limit,
              };
              Helper.response(
                res,
                CODES.STATUS_CODES.OK,
                MSG.customer.fetch[LOCALE || "en"],
                resData
              );
            } else {
              return Helper.response(res, "404", "Not found", {
                customerList: [],
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
  customerAccountStatusUpdate: async (req, res) => {
    try {
      let { customerId } = req.body;

      let updateObj = req.body;
      var msg = "";
      if (req.body.status == "Active") {
        msg = "Customer activated successfully";
      } else {
        msg = "Updated successfully";
      }
      if (req.body.status == "Inactive") {
        msg = "Customer inactivated successfully";
      } else {
        msg = "Updated successfully";
      }
      if (req.body.status == "Delete") {
        await ReviewModel.deleteMany({ customerId });
        await OrderModel.updateMany(
          { customerId },
          { $set: { status: "Delete" } },
          { multi: true }
        );
        await QueryModel.updateMany(
          { customerId },
          { $set: { status: "Delete" } },
          { multi: true }
        );
        await QueryResponseModel.updateMany(
          { customerId },
          { $set: { status: "Delete" } },
          { multi: true }
        );
        msg = "Customer deleted successfully";
      } else {
        msg = "Updated successfully";
      }
      const customerDetails = await customerModel.findById(customerId);
      console.log({
        customerDetails,
      });

      if (!customerDetails) {
        Helper.response(
          res,
          CODES.STATUS_CODES.Not_Found,
          MSG.notFound[LOCALE || "en"]
        );
        return;
      }
      req.body.jwtToken = [];
      const updatedCustomerDetails = await customerModel.findByIdAndUpdate(
        customerId,
        {
          $set: updateObj,
        },
        {
          new: true,
        }
      );
      var html = `
      <p>Your account has been <b>${req.body.status}</b></p> </br></br></br>
      `;
      await Helper.send365Email(
        process.env.MAIL_SEND_EMAIL,
        customerDetails.emailId,
        "Regarding Your Registration",
        html,
        "text"
      );
      if (!updatedCustomerDetails) {
        Helper.response(
          res,
          CODES.STATUS_CODES.Not_Found,
          MSG.notFound[LOCALE || "en"]
        );
        return;
      }

      Helper.response(res, 200, msg);
    } catch (err) {
      logger.error(err);
      Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
  customerDetails: async (req, res) => {
    try {
      const customerId = req.params.id;
      const customerDetails = await customerModel
        .findOneAndUpdate(
          { _id: customerId },
          { $set: { isRead: true } },
          { new: true }
        )
        .lean();
      // {
      //   password: 0,
      //   jwtToken: 0,
      //   address: 0,
      //   _v: 0,
      // }
      if (customerDetails) {
        customerDetails.imgUrl =
          process.env.IMAGE_URL + "customers/" + customerDetails.profileImage;
        var addressDetails = await AddressModel.find({
          customerId: customerDetails._id,
          status: "Active",
        });
        customerDetails.addressDetails = addressDetails;
        if (customerDetails.institutionId) {
          let institution = await institutionModel.findById({
            _id: customerDetails.institutionId,
          });
          customerDetails.institutionId = institution._id;
          customerDetails.institutionName = institution.name;
        } else {
          customerDetails.institutionId = "";
          customerDetails.institutionName = "";
        }
        if (customerDetails.professionId) {
          let profession = await professionModel.findById({
            _id: customerDetails.professionId,
          });
          customerDetails.professionId = profession._id;
          customerDetails.professionName = profession.name;
        } else {
          customerDetails.professionId = "";
          customerDetails.professionName = "";
        }
        let productCategoryId = customerDetails.productCategoryId;
        let productSubCategoryId = customerDetails.productSubCategoryId;
        if (productCategoryId && productCategoryId.length > 0) {
          customerDetails.productCategoryId = await CategoryModel.find(
            {
              _id: {
                $in: productCategoryId,
              },
            },
            {
              _id: 1,
              productCategoryName: 1,
              categoryType: 1,
            }
          );
        }
        if (productSubCategoryId && productSubCategoryId.length > 0) {
          customerDetails.productSubCategoryId =
            await productSubCategoryModel.find(
              {
                _id: {
                  $in: productSubCategoryId,
                },
              },
              {
                _id: 1,
                subCategoryName: 1,
              }
            );
        }
        delete customerDetails.jwtToken;
        delete customerDetails.password;
        delete customerDetails.address;
        return Helper.response(res, 200, MSG.success[LOCALE || "en"], {
          customerDetails,
        });
      }
      return Helper.response(res, 402, MSG.notFound[LOCALE || "en"]);
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, MSG.serverError[LOCALE || "en"]);
    }
  },

  customerStatusDelete: async (req, res) => {
    try {
      const customerId = req.params.id;
      console.log({
        customerId,
      });

      const fieldsToUpdate = {
        // mobile: "00007777",
        // oldNumber: req.user.mobile,
        status: "Delete",
        jwtToken: [],
      };

      console.log({
        fieldsToUpdate,
      });

      const doesCustomerExist = await customerModel.findById(customerId);
      console.log({
        doesCustomerExist,
      });

      if (doesCustomerExist) {
        //   const customer = await customerModel
        //     .findOneAndUpdate(
        //       { _id: ObjectId(customerId) },
        //       { $set: updateObj },
        //       { new: true }
        //     )
        //     .exec();

        //  const updatedCustomerDetails = await customerModel
        //    .findOneAndUpdate(
        //      { _id: ObjectId(customerId) },
        //      { $set: updateObj },
        //      { new: true }
        //    )
        //    .exec();

        const updatedCustomerDetails = await customerModel
          .findByIdAndUpdate(
            customerId,
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
          updatedCustomerDetails,
        });

        if (!updatedCustomerDetails) {
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
  orderDetails: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 25;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      var status = req.query.status ? req.query.status : null;
      var query = {};
      if (status) {
        var finalStatusArr = [];
        const statusArray = status.split(",");
        statusArray.forEach((ele) => {
          if (ele == "ORDER PLACED") {
            finalStatusArr.push("PENDING");
          } else {
            finalStatusArr.push(ele);
          }
        });
        status = {
          $in: finalStatusArr,
        };
        Object.assign(query, status);
      } else {
        status = {
          $nin: ["DELETE"],
        };
        Object.assign(query, status);
      }
      let agg = [
        {
          $lookup: {
            from: "OrderDetails",
            localField: "_id",
            foreignField: "primaryOrderId",
            as: "OrderDetails",
          },
        },
        {
          $unwind: "$OrderDetails",
        },
        { $match: { "OrderDetails.orderStatus": status } },
        {
          $lookup: {
            from: "Product",
            localField: "OrderDetails.productId",
            foreignField: "_id",
            as: "productDetail",
          },
        },
        {
          $unwind: "$productDetail",
        },
        {
          $lookup: {
            from: "OrderTrack",
            localField: "OrderDetails._id",
            foreignField: "orderId",
            as: "OrderTrackDetail",
          },
        },
        // {
        //   $unwind: "$OrderTrackDetail",
        // }
        {
          $addFields: {
            "OrderDetails.productDetails": {
              productName: "$productDetail.productName",
              productImages: "$productDetail.productImages",
              productPrice: "$productDetail.productPrice",
              categoryType: "$productDetail.categoryType",
              productCode: "$productDetail.productCode",
              productUniqueId: "$productDetail.productUniqueId",
              quantity: "$OrderDetails.quantity",
              shippingPreference: {
                $cond: {
                  if: "$OrderDetails.shippingPreference",
                  then: "OrderDetails.shippingPreference",
                  else: "self-managed",
                },
              },
            },
            "OrderDetails.orderStatus": {
              $cond: {
                if: { $eq: ["$OrderDetails.orderStatus", "PENDING"] },
                then: "ORDER PLACED",
                else: "$OrderDetails.orderStatus",
              },
            },
            "OrderDetails.orderTrackStatus": "$OrderTrackDetail",
          },
        },
        {
          $match: {
            orderStatus: {
              $ne: "DELETED",
            },
            customerId: new ObjectId(req.params._id),
          },
        },
        {
          $group: {
            _id: "$_id",
            orderDetails: {
              $push: "$OrderDetails",
            },
            addressId: {
              $first: "$addressId",
            },
            parentOrderId: {
              $first: "$parentOrderId",
            },
            createdAt: {
              $first: "$createdAt",
            },
          },
        },
        // {
        //   $match: query
        // },
        {
          $project: {
            orderDetails: 1,
            // productDetails: "$productDetails",
            addressId: 1,
            parentOrderId: 1,
            createdAt: 1,
            orderCount: { $size: "$orderDetails" },
          },
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

      let myAggregate = OrderModel.aggregate(agg);
      OrderModel.aggregatePaginate(
        myAggregate,
        options,
        async function (err, result) {
          if (err) {
            console.log("err", err);
            return Helper.response(res, 500, "Internal server error.");
          } else {
            if (result.docs.length > 0) {
              let cartItems = result.docs;
              let totalResult = result.totalDocs;
              if (cartItems.length > 0) {
                await Promise.all(
                  cartItems.map(async function (item) {
                    await Promise.all(
                      item.orderDetails.map(async function (orderDetail) {
                        if (
                          orderDetail.productDetails.productImages &&
                          orderDetail.productDetails.productImages.length > 0
                        ) {
                          let productImages = [];
                          for (
                            let i = 0;
                            i < orderDetail.productDetails.productImages.length;
                            i++
                          ) {
                            productImages.push({
                              imgUrl:
                                process.env.IMAGE_URL +
                                "suppliers/" +
                                orderDetail.productDetails.productImages[i]
                                  .imgName,
                              imgName:
                                orderDetail.productDetails.productImages[i]
                                  .imgName,
                            });
                          }
                          orderDetail.productDetails.productImages =
                            productImages;
                        }
                        orderDetail.orderTrackStatus.forEach((track) => {
                          if (track.orderStatus == "PENDING") {
                            track.orderStatus = "ORDER PLACED";
                          }
                        });
                      })
                    );
                  })
                );
                let resData = {
                  orderList: cartItems,
                  totalResult: totalResult,
                  limit: limit,
                };
                Helper.response(
                  res,
                  200,
                  "Order details fetched successfully!",
                  resData
                );
              } else {
                Helper.response(res, 404, "Order not found", {
                  orderList: [],
                });
              }
            } else {
              Helper.response(res, 404, "Order not found", {
                orderList: [],
              });
            }
          }
        }
      );
    } catch (err) {
      logger.error(err);
      return Helper.response(res, 500, "Server error.", err);
    }
  },
  orderDetailsold: async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 25;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const customerId = req.params._id;
    let agg = [
      {
        $match: {
          customerId: new ObjectId(customerId),
          orderStatus: {
            $ne: "DELETED",
          },
        },
      },
      {
        $lookup: {
          from: "OrderDetails",
          localField: "_id",
          foreignField: "primaryOrderId",
          as: "OrderDetails",
        },
      },
      {
        $unwind: {
          path: "$OrderDetails",
        },
      },
      {
        $lookup: {
          from: "Address",
          localField: "addressId",
          foreignField: "_id",
          as: "AddressDetails",
        },
      },
      {
        $unwind: {
          path: "$AddressDetails",
        },
      },
      {
        $lookup: {
          from: "Product",
          localField: "OrderDetails.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: {
          path: "$productDetails",
        },
      },
      {
        $addFields: {
          "OrderDetails.productDetails": "$productDetails",
          // "OrderDetails.companyName": "$companyDetails.companyName",
          // "OrderDetails.avgRating": {
          //     "$cond": {
          //         "if": { "$eq": [{ "$size": "$ratings" }, 0] },
          //         "then": 0,
          //         "else": { "$toInt": { "$avg": "$ratings.rating" } }
          //     }
          // },
          // "OrderDetails.ratingCount": { $size: "$ratings" },
          // "OrderDetails.testResult": {
          //     $cond: { if: { $eq: ["$OrderDetails.testResult", "FirstApproval"] }, then: "Pending", else: "$OrderDetails.testResult" }
          // },
        },
      },
      {
        $group: {
          _id: "$_id",
          orderDetails: {
            $push: "$OrderDetails",
          },
          cat_title: {
            $first: "$categorized",
          },
          subCategory: {
            $first: "$subCategory.subcategory_title",
          },
          deliveryMode: {
            $first: "$deliveryMode",
          },
          totalPrice: {
            $first: "$totalPrice",
          },
          deliveryCharges: {
            $first: "$deliveryCharges",
          },
          paymentStatus: {
            $first: "$paymentStatus",
          },
          orderStatus: {
            $first: "$orderStatus",
          },
          discount: {
            $first: "$discount",
          },
          paymentId: {
            $first: "$paymentId",
          },
          addressId: {
            $first: "$addressId",
          },
          addressDetails: {
            $first: "$AddressDetails",
          },
          deliveryInstruction: {
            $first: "$deliveryInstruction",
          },
          parentOrderId: {
            $first: "$parentOrderId",
          },
          attachmentFiles: {
            $first: "$attachmentFiles",
          },
          createdAt: {
            $first: "$createdAt",
          },
          companyDetails: {
            $first: "$companyDetails",
          },
          deliveryDate: {
            $first: "$deliveryDate",
          },
          appliedPromo: {
            $first: "$appliedPromo",
          },
          promoDiscountAmount: {
            $first: "$promoDiscountAmount",
          },
          orderDetails: {
            $push: "$OrderDetails",
          },
          cat_title: {
            $first: "$categorized",
          },
          subCategory: {
            $first: "$subCategory.subcategory_title",
          },
          deliveryMode: {
            $first: "$deliveryMode",
          },
          totalPrice: {
            $first: "$totalPrice",
          },
          deliveryCharges: {
            $first: "$deliveryCharges",
          },
          paymentStatus: {
            $first: "$paymentStatus",
          },
          orderStatus: {
            $first: "$orderStatus",
          },
          discount: {
            $first: "$discount",
          },
          paymentId: {
            $first: "$paymentId",
          },
          addressId: {
            $first: "$addressId",
          },
          addressDetails: {
            $first: "$AddressDetails",
          },
          deliveryInstruction: {
            $first: "$deliveryInstruction",
          },
          parentOrderId: {
            $first: "$parentOrderId",
          },
          attachmentFiles: {
            $first: "$attachmentFiles",
          },
          createdAt: {
            $first: "$createdAt",
          },
          companyDetails: {
            $first: "$companyDetails",
          },
          deliveryDate: {
            $first: "$deliveryDate",
          },
          appliedPromo: {
            $first: "$appliedPromo",
          },
          promoDiscountAmount: {
            $first: "$promoDiscountAmount",
          },
        },
      },
      {
        $project: {
          orderDetails: 1,
          addressDetails: 1,
          deliveryMode: 1,
          totalPrice: 1,
          customerId: 1,
          deliveryCharges: 1,
          discount: 1,
          paymentStatus: 1,
          orderStatus: 1,
          paymentId: 1,
          addressId: 1,
          createdAt: 1,
          companyId: 1,
          parentOrderId: 1,
          attachmentFiles: 1,
          deliveryDate: 1,
          deliveryInstruction: {
            $cond: {
              if: "$deliveryInstruction",
              then: "$deliveryInstruction",
              else: "",
            },
          },
          appliedPromo: {
            $cond: {
              if: "$appliedPromo",
              then: "$appliedPromo",
              else: "",
            },
          },
          promoDiscountAmount: {
            $cond: {
              if: "$promoDiscountAmount",
              then: "$promoDiscountAmount",
              else: "",
            },
          },
        },
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
    var totalResult = await OrderModel.find({
      customerId: new ObjectId(customerId),
    }).count();
    let myAggregate = await OrderModel.aggregate(agg)
      .skip((page - 1) * limit)
      .limit(limit);
    let orderItems = myAggregate;
    if (orderItems.length > 0) {
      await Promise.all(
        orderItems.map(async function (element) {
          await Promise.all(
            element.orderDetails.map(async function (item) {
              if (
                item.productDetails &&
                item.productDetails.productImages &&
                item.productDetails.productImages.length > 0
              ) {
                let productImages = [];
                for (
                  let i = 0;
                  i < item.productDetails.productImages.length;
                  i++
                ) {
                  productImages.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      item.productDetails.productImages[i].imgName,
                  });
                }
                item.productDetails.productImages = productImages;
              }
              if (
                item.productDetails &&
                item.productDetails.productImageThumbnail &&
                item.productDetails.productImageThumbnail.length > 0
              ) {
                let productImageThumbnail = [];
                for (
                  let i = 0;
                  i < item.productDetails.productImageThumbnail.length;
                  i++
                ) {
                  console.log(process.env.IMAGE_URL);
                  productImageThumbnail.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      item.productDetails.productImageThumbnail[i].imgName,
                  });
                }
                item.productDetails.productImageThumbnail =
                  productImageThumbnail;
              }
              //deliveryDate
              element.deliveryDate = element.deliveryDate
                ? element.deliveryDate
                : await Helper.dateFormat(new Date(element.createdAt), 1);
            })
          );
        })
      );

      let resData = {
        orderList: orderItems,
        totalResult: totalResult,
        limit: limit,
      };
      return Helper.response(
        res,
        200,
        "Order details fetched successfully..",
        resData
      );
    } else {
      return Helper.response(res, 404, "Order not found", {
        orderList: [],
      });
    }
  },
  orderDetails1: async (req, res) => {
    try {
      const customerId = req.params._id;
      var orderData = await OrderModel.find({
        customerId: new ObjectId(customerId),
        orderStatus: {
          $ne: "DELETE",
        },
      });
      let resData = {
        orderList: orderData,
      };
      return Helper.response(
        res,
        200,
        "Order details fetched successfully..",
        resData
      );
    } catch (error) {
      console.error("Error:", error);
      Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
  getCustomer: async (req, res) => {
    try {
      let query = {
        status: "Active",
      };
      var result = await customerModel
        .find(query, {
          customerUniqId: 1,
          name: 1,
        })
        .sort({
          createdAt: -1,
        });
      const resData = {
        customerList: result,
      };
      Helper.response(
        res,
        CODES.STATUS_CODES.OK,
        MSG.customer.fetch[LOCALE || "en"],
        resData
      );
    } catch (error) {
      console.error("Error:", error);
      Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
};
