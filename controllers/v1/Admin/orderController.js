const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const Helper = require("../../../config/helper");
const orderModel = require("../../../models/OrderModel");
const orderDetailsModel = require("../../../models/OrderDetailsModel");
const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const moment = require("moment-timezone");
const productModel = require("../../../models/ProductModel");
const OrderTrackModel = require("../../../models/orderTrackModel");
const AddressModel = require("../../../models/AddressModel");
const { logger } = require("../../../logger/winston");
const supplierModel = require("../../../models/SupplierModel");
const customerModel = require("../../../models/CustomerModel");
const axios = require("axios");
module.exports = {
  list: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 25;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      var status = req.query.status ? req.query.status : null;
      var startsDate = req.query.startDate ? req.query.startDate : null;
      var endsDate = req.query.endDate ? req.query.endDate : null;
      var query = {};
      let orderQuery = {
        orderStatus: {
          $ne: "Delete",
        },
      };
      endsDate = Helper.modifyDate(endsDate, 1);
      if (startsDate && endsDate) {
        let dateFilter = {
          createdAt: {
            $gte: new Date(startsDate),
            $lte: new Date(endsDate),
          },
        };
        Object.assign(orderQuery, dateFilter);
      }
      if (req.query.isRead == "true" || req.query.isRead == true) {
        orderQuery.isRead = true;
      } else if (req.query.isRead == "false" || req.query.isRead == false) {
        orderQuery.isRead = false;
      }
      if (status) {
        var finalStatusArr = [];
        const statusArray = status.split(",");
        statusArray.forEach((ele) => {
          if (ele == "ORDER RECEIVED") {
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
        Object.assign(query, { $ne: "Delete" });
      }
      if (req.query.paymentStatus) {
        if (req.query.paymentStatus == "Pending") {
          orderQuery.paymentStatus = "";
        } else {
          orderQuery.paymentStatus = req.query.paymentStatus;
        }
      }
      if (req.query.customerId) {
        let cusIdArr = [];
        var cusId = req.query.customerId.split(",");
        cusId.forEach((ids) => {
          cusIdArr.push(new ObjectId(ids));
        });
        orderQuery.customerId = { $in: cusIdArr };
      }
      if (req.query.productPaymentMode) {
        query["productDetails.productPaymentMode"] =
          req.query.productPaymentMode;
      }
      // if (req.query.search) {
      //   let searchObject = {
      //     $or: [
      //       {
      //         customerName: {
      //           $regex: req.query.search,
      //           $options: "i",
      //         },
      //       },
      //       {
      //         customerMobile: {
      //           $regex: req.query.search,
      //           $options: "i",
      //         },
      //       },
      //       {
      //         productType: {
      //           $regex: req.query.search,
      //           $options: "i",
      //         },
      //       },
      //       {
      //         parentOrderId: {
      //           $regex: req.query.search,
      //           $options: "i",
      //         },
      //       },
      //       {
      //         deliveryMode: {
      //           $regex: req.query.search,
      //           $options: "i",
      //         },
      //       },
      //       {
      //         trackingId: {
      //           $regex: req.query.search,
      //           $options: "i",
      //         },
      //       },
      //       {
      //         paymentId: {
      //           $regex: req.query.search,
      //           $options: "i",
      //         },
      //       },
      //       {
      //         "productDetails.productName": {
      //           $regex: req.query.search,
      //           $options: "i",
      //         },
      //       },
      //       {
      //         "productDetails.productCode": {
      //           $regex: req.query.search,
      //           $options: "i",
      //         },
      //       },
      //       {
      //         "customerDetails.name": {
      //           $regex: req.query.search,
      //           $options: "i",
      //         },
      //       },
      //       {
      //         "customerDetails.customerUniqId": {
      //           $regex: req.query.search,
      //           $options: "i",
      //         },
      //       },
      //     ],
      //   };
      //   Object.assign(query, searchObject);
      // }
      if (req.query.search) {
        let searchObject = {
          $or: [
            {
              parentOrderId: {
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
            {
              "customerDetails.emailId": {
                $regex: req.query.search,
                $options: "i",
              },
            },
          ],
        };
        Object.assign(orderQuery, searchObject);
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
        { $match: { "OrderDetails.orderStatus": query } },
        {
          $lookup: {
            from: "Product",
            localField: "OrderDetails.productId",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        {
          $unwind: "$productDetails",
        },
        {
          $lookup: {
            from: "Supplier",
            localField: "OrderDetails.supplierId",
            foreignField: "_id",
            as: "supplierDetails",
          },
        },
        { $unwind: "$supplierDetails" },
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
        // },
        {
          $addFields: {
            "OrderDetails.productdetails": {
              productName: "$productDetails.productName",
              productImages: "$productDetails.productImages",
              productPrice: "$productDetails.productPrice",
              categoryType: "$productDetails.categoryType",
              productCode: "$productDetails.productCode",
              productUniqueId: "$productDetails.productUniqueId",
              quantity: "$OrderDetails.quantity",
              shippingPreference: "$productDetails.shippingPreference",
              // // orderStatus: "$OrderTrackDetail.orderStatus",
              // shippingPreference: {
              //   $cond: {
              //     if: "$productDetails.shippingPreference",
              //     then: "productDetails.shippingPreference",
              //     else: "self-managed",
              //   },
              // },
            },
            "OrderDetails.supplierdetails": {
              _id: "$supplierDetails._id",
              name: "$supplierDetails.basicInfo.founderName",
              companyName: "$supplierDetails.basicInfo.companyName",
              supplierUniqId: "$supplierDetails.supplierUniqId",
            },
            // "OrderDetails.orderStatus": {
            //   $cond: {
            //     if: { $eq: ["$OrderTrackDetail.orderStatus", "PENDING"] },
            //     then: "ORDER RECEIVED",
            //     else: "$OrderTrackDetail.orderStatus",
            //   },
            // },
            "OrderDetails.orderTrackStatus": "$OrderTrackDetail",
          },
        },
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
          $match: orderQuery,
        },
        {
          $group: {
            _id: "$_id",
            orderDetails: {
              $push: "$OrderDetails",
            },
            customerId: {
              $first: "$customerDetails._id",
            },
            customerName: {
              $first: "$customerDetails.name",
            },
            contactNo: {
              $first: "$customerDetails.contactNo",
            },
            country: {
              $first: "$customerDetails.country",
            },
            countryCode: {
              $first: "$customerDetails.countryCode",
            },
            companyName: {
              $first: "$productDetails.companyName",
            },
            customerUniqId: {
              $first: "$customerDetails.customerUniqId",
            },
            productDetails: {
              $push: "$productDetails",
            },
            // productType: { $first: "$productDetails.productType" },
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
            orderStatusDate: {
              $first: "$orderStatusDate",
            },
            parentOrderId: {
              $first: "$parentOrderId",
            },
            attachmentFiles: {
              $first: "$attachmentFiles",
            },
            trackingId: {
              $first: "$trackingId",
            },
            paymentId: {
              $first: "$paymentId",
            },
            createdAt: {
              $first: "$createdAt",
            },
            updatedAt: {
              $first: "$updatedAt",
            },
            totalQuantity: {
              $sum: "$OrderDetails.quantity",
            },
            deliveryDate: {
              $first: "$deliveryDate",
            },
            paymentGateway: {
              $first: "$paymentGateway",
            },
            trackingId: {
              $first: "$trackingId",
            },
            customerEmail: {
              $first: "$customerDetails.emailId",
            },
            isRead: {
              $first: "$isRead",
            },
            amountReceived: {
              $first: {
                $cond: {
                  if: "$amountReceived",
                  then: "$amountReceived",
                  else: 0,
                },
              },
            },
          },
        },
        {
          $project: {
            // "orderDetails": 1,
            orderDetails: 1,
            customerId: 1,
            customerName: 1,
            countryCode: 1,
            customerMobile: 1,
            contactNo: 1,
            country: 1,
            companyName: "$companyDetails.companyName",
            customerUniqId: 1,
            productDetails: "$productDetails",
            productType: 1,
            totalQuantity: 1,
            deliveryMode: 1,
            totalPrice: 1,
            deliveryCharges: 1,
            discount: 1,
            paymentStatus: 1,
            orderStatus: 1,
            createdAt: 1,
            parentOrderId: 1,
            attachmentFiles: 1,
            paymentId: 1,
            trackingId: 1,
            orderStatusDate: 1,
            deliveryDate: 1,
            paymentGateway: 1,
            paymentMode: 1,
            trackingId: 1,
            customerEmail: 1,
            isRead: 1,
            updatedAt: 1,
            amountReceived: 1,
            orderCount: { $size: "$orderDetails" },
          },
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
      console.log(JSON.stringify(agg), "agg");
      let myAggregate = orderModel.aggregate(agg);
      orderModel.aggregatePaginate(
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
                        if (orderDetail.orderStatus == "PENDING") {
                          orderDetail.orderStatus = "ORDER RECEIVED";
                        } else {
                          orderDetail.orderStatus = orderDetail.orderStatus;
                        }
                        if (
                          orderDetail.productdetails.productImages &&
                          orderDetail.productdetails.productImages.length > 0
                        ) {
                          let productImages = [];
                          for (
                            let i = 0;
                            i < orderDetail.productdetails.productImages.length;
                            i++
                          ) {
                            productImages.push({
                              imgUrl:
                                process.env.IMAGE_URL +
                                "suppliers/" +
                                orderDetail.productdetails.productImages[i]
                                  .imgName,
                              imgName:
                                orderDetail.productdetails.productImages[i]
                                  .imgName,
                            });
                          }
                          orderDetail.productdetails.productImages =
                            productImages;
                        }
                        orderDetail.orderTrackStatus.forEach((track) => {
                          if (track.orderStatus == "PENDING") {
                            track.orderStatus = "ORDER PLACED";
                          }
                        });
                        const token = await Helper.generateToken();
                        orderDetail.awbCode =
                          orderDetail && orderDetail.awbDetails
                            ? orderDetail.awbDetails.response.data.awb_code
                            : "";
                        if (orderDetail && orderDetail.awbCode != "") {
                          let awbTrackUrl = await Helper.orderTrackByAwb(
                            orderDetail.awbCode,
                            token
                          );
                          if (awbTrackUrl) {
                            orderDetail.shiprocketTrackUrl =
                              awbTrackUrl.tracking_data.track_url;
                          } else {
                            orderDetail.shiprocketTrackUrl = "";
                          }
                        } else {
                          orderDetail.shiprocketTrackUrl = "";
                        }
                        orderDetail.shipmentId =
                          orderDetail && orderDetail.shipmentDetails
                            ? orderDetail.shipmentDetails.shipment_id
                            : "";
                        delete orderDetail.shipmentDetails;
                        delete orderDetail.awbDetails;
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
  orderDetails: async (req, res) => {
    var _id = req.query.orderId ? new ObjectId(req.query.orderId) : null;
    let orderData = await orderModel
      .findById({
        _id,
      })
      .populate(
        "customerId",
        "_id name emailId customerUniqId contactNo countryCode"
      )
      .populate("addressId")
      .lean();
    let orderDetails = await orderDetailsModel
      .find({
        primaryOrderId: _id,
      })
      .populate("productId", {
        _id: 1,
        discountPercent: 1,
        discountPrice: 1,
        description: 1,
        productType: 1,
        productName: 1,
        productPrice: 1,
        productCode: 1,
        productUniqueId: 1,
      })
      .lean();
    // let orderStatus = await lalamoveModel
    //   .find(
    //     { lalamoveOrderId: orderData.trackingId },
    //     {
    //       status: 1,
    //       lalamoveOrderId: 1,
    //       createdAt: 1,
    //       eventId: 1,
    //       eventType: 1,
    //     }
    //   )
    //   .lean(); //.sort({createdAt:-1})
    // console.log(orderStatus);return;
    if (orderData && orderDetails) {
      let billingDetails = {
        CartTotal:
          parseInt(orderData.totalPrice) -
          parseInt(orderData.deliveryCharges) +
          parseInt(orderData.discount),
        discountOffered: parseInt(orderData.discount),
        orderTotal:
          parseInt(orderData.totalPrice) - parseInt(orderData.deliveryCharges),
        shippingCharge: parseInt(orderData.deliveryCharges),
        total: parseInt(orderData.totalPrice),
      };
      var attachmentFilesArr = [];
      if (orderData.attachmentFiles != undefined) {
        orderData.attachmentFiles.map((attachmentFile) => {
          console.log(attachmentFile, "attachmentFile");
          if (attachmentFile) {
            attachmentFilesArr.push({
              name: attachmentFile,
              files: process.env.IMAGE_URL + "products/" + attachmentFile,
            });
          }
        });
      }
      orderData.attachmentFiles = attachmentFilesArr;
      let order = {
        orderDetails: orderData,
        billingDetails: billingDetails,
        productsDetail: orderDetails,
        // orderStatus: orderStatus,
      };
      return Helper.response(res, 200, "Order Details ", {
        order: order,
      });
    } else {
    }
  },
  cancelOrder: async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const supplierId = req.params.supplierId;
      const updateObj = {
        orderStatus: "CANCELED",
      };

      const exist = await orderModel.findOne({
        _id: new ObjectId(orderId),
      });

      if (!exist) {
        return Helper.response(res, CODES.STATUS_CODES.Not_Found, "Not Found");
      }

      const order = await orderModel.findOneAndUpdate(
        {
          _id: new ObjectId(orderId),
        },
        {
          $set: updateObj,
        },
        {
          new: true,
        }
      );
      const orderDetails = await orderDetailsModel.findOneAndUpdate(
        {
          _id: new ObjectId(orderId),
          supplierId,
        },
        {
          $set: updateObj,
        },
        {
          new: true,
        }
      );
      if (req.body.status == "CANCELED") {
        const product = await productModel.findOne({
          _id: orderDetails.productId,
        });
        if (product) {
          product.productQuantity =
            Number(product.productQuantity) + orderDetails.quantity;
          product.noOfUnitSold =
            Number(product.noOfUnitSold) - orderDetails.quantity;
          await product.save();
        } else {
          return Helper.response(res, 404, "Product not found!");
        }
      }
      const checkOrderTrack = await OrderTrackModel.findOne({
        orderId,
        orderStatus: "CANCELED",
      });
      if (checkOrderTrack) {
        await OrderTrackModel.findOneAndUpdate(
          {
            orderId,
            orderStatus: "CANCELED",
          },
          {
            $set: {
              orderStatusDate: new Date(),
            },
          },
          {
            new: true,
          }
        );
      } else {
        var orderTrack = new OrderTrackModel({
          orderId: orderId,
          orderStatus: "CANCELED",
          orderStatusDate: new Date(),
        });
        orderTrack.save();
      }

      if (!order) {
        return Helper.response(res, CODES.STATUS_CODES.Not_Found, "Not Found");
      }
      Helper.response(
        res,
        CODES.STATUS_CODES.OK,
        "Order Cancelled Successfully"
      );

      // Uncomment the following code if you want to implement the lalamove cancellation logic

      // const _isExistOrder = await lalamoveModels.findOne({ lalamoveOrderId: orderId });

      // if (_isExistOrder) {
      //     try {
      //         const result = await sdkClient.Order.cancel(region, orderId);
      //         logger.info("sdkClient Result =>", result);
      //         return Helper.response(res, CODES.STATUS_CODES.OK, "Success", { status: result });
      //     } catch (error) {
      //         logger.error("sdkClient Catch Error =>", error);
      //         return Helper.response(res, CODES.STATUS_CODES.Internal_Server_Error, MSG.serverError[LOCALE || "en"]);
      //     }
      // } else {
      //     return Helper.response(res, CODES.STATUS_CODES.Unprocessable_Entity, MSG.lalamove.orderNotExist[LOCALE || "en"]);
      // }
    } catch (error) {
      console.error(error);
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
  changeOrderStatus: async (req, res) => {
    try {
      const orderId = req.params.orderId;
      let addressArr = [];
      const updateObj = {
        orderStatus: req.body.status,
      };
      const exist = await orderDetailsModel
        .findOneAndUpdate(
          {
            _id: new ObjectId(orderId),
          },
          updateObj,
          { new: true }
        )
        .populate("productId", "productCode productName")
        .populate("supplierId", "basicInfo")
        .populate(
          "primaryOrderId",
          "customerId parentOrderId addressId totalPrice"
        );
      const customer = await customerModel.findOne(
        { _id: exist.primaryOrderId.customerId },
        { name: 1, emailId: 1, contactNo: 1 }
      );
      var addressDetails = await AddressModel.findOne({
        _id: exist.primaryOrderId.addressId,
      });
      if (!addressDetails) {
        return Helper.response(res, 404, "Invalid address id");
      }
      if (addressDetails.address) addressArr.push(addressDetails.address);
      if (addressDetails.street) addressArr.push(addressDetails.street);
      if (addressDetails.landMark) addressArr.push(addressDetails.landMark);
      if (addressDetails.pinCode) addressArr.push(addressDetails.pinCode);
      if (addressDetails.city) addressArr.push(addressDetails.city);
      const productName = exist.productId.productName;
      const totalPrice = exist.primaryOrderId.totalPrice;
      let supplier = exist.supplierId.basicInfo;
      if (!exist) {
        return Helper.response(res, 404, "Order not found");
      }
      updateObj.isReadSeller = false;
      updateObj.isRead = true;
      updateObj.updatedAt = moment().format();
      const updatedOrder = await orderModel
        .findOneAndUpdate(
          { _id: new ObjectId(exist.primaryOrderId) },
          { $set: updateObj },
          { new: true }
        )
        .lean();
      const checkOrderTrack = await OrderTrackModel.findOne({
        orderId: orderId,
        orderStatus: req.body.status,
      });
      if (checkOrderTrack) {
        await OrderTrackModel.findOneAndUpdate(
          {
            orderId,
            orderStatus: req.body.status,
            trackingLink: req.body.trackingLink,
            shipmentId: req.body.shipmentId,
          },
          { $set: { orderStatusDate: moment().format() } },
          { new: true }
        );
      } else {
        var orderTrack = new OrderTrackModel({
          orderId: orderId,
          orderStatus: req.body.status,
          trackingLink: req.body.trackingLink,
          shipmentId: req.body.shipmentId,
          orderStatusDate: moment().format(),
        });
        orderTrack.save();
      }
      const updateProductOrderStatus = await orderDetailsModel
        .findOneAndUpdate(
          {
            _id: new ObjectId(orderId),
          },
          { $set: updateObj },
          { new: true }
        )
        .lean();
      if (req.body.status == "CANCELED") {
        const product = await productModel.findOne({
          _id: updateProductOrderStatus.productId,
        });
        if (product) {
          product.productQuantity =
            Number(product.productQuantity) + updateProductOrderStatus.quantity;
          product.noOfUnitSold =
            Number(product.noOfUnitSold) - updateProductOrderStatus.quantity;
          await product.save();
        } else {
          return Helper.response(res, 404, "Product not found!");
        }
      }
      if (req.body.status == "PICKED UP") {
        const product = await productModel.findOne({
          _id: updateProductOrderStatus.productId,
        });
        if (product) {
          product.productQuantity =
            Number(product.productQuantity) + updateProductOrderStatus.quantity;
          product.noOfUnitSold =
            Number(product.noOfUnitSold) - updateProductOrderStatus.quantity;
          await product.save();
        } else {
          return Helper.response(res, 404, "Product not found!");
        }
      }
      console.log(req.body.status, "req.body.status");
      let text = req.body.status.toLowerCase();
      await Helper.sendNotification(
        updatedOrder.customerId,
        "customer",
        exist.productId,
        `Your order no ${updatedOrder.parentOrderId} has been ${text}.`,
        `order ${text}`,
        `Order ${text}`,
        req.admin._id
      );
      await Helper.sendNotification(
        exist.supplierId,
        "supplier",
        exist.productId,
        `You ${text} the order no ${updatedOrder.parentOrderId}`,
        `order ${text}`,
        `Order ${text}`,
        updatedOrder.customerId
      );
      //calling shiprocket api for creating order
      if (req.body.status == "READY FOR SHIPPING") {
        const orderData = await orderDetailsModel
          .findOne({
            _id: new ObjectId(orderId),
          })
          .populate({
            path: "primaryOrderId",
            select: "parentOrderId totalPrice paymentMode",
            populate: [
              { path: "addressId" },
              { path: "customerId", select: "name emailId" },
            ],
          })
          .populate({
            path: "supplierId",
            select: "address",
          })
          .populate({
            path: "productId",
            select:
              "productName hsnNo sku productDimensions productWeight shippingPreference",
          });

        if (
          orderData.productId.shippingPreference == "project" &&
          process.env.NODE_ENV == "production"
        ) {
          var typeOfHSN = await Helper.isNumeric(orderData.productId.hsnNo);
          let length =
            orderData.productId.productDimensions.length > 0
              ? orderData.productId.productDimensions.length
              : 0.5;
          let width =
            orderData.productId.productDimensions.width > 0
              ? orderData.productId.productDimensions.width
              : 0.5;
          let height =
            orderData.productId.productDimensions.height > 0
              ? orderData.productId.productDimensions.height
              : 0.5;
          if (
            (typeOfHSN == true || orderData.productId.hsnNo == "") &&
            orderData.productId.productWeight > 0
          ) {
            var data = {
              order_id: orderData.orderId,
              order_date: orderData.createdAt,
              pickup_location: "Primary", // seller's pickup
              channel_id: "",
              comment: "",
              billing_customer_name: orderData.primaryOrderId.customerId.name,
              billing_last_name: "",
              billing_name: orderData.primaryOrderId.addressId.name,
              billing_address: orderData.primaryOrderId.addressId.address,
              billing_city: orderData.primaryOrderId.addressId.city,
              billing_pincode: orderData.primaryOrderId.addressId.pinCode,
              billing_state: orderData.primaryOrderId.addressId.state,
              billing_country: "India",
              billing_email: orderData.primaryOrderId.customerId.emailId,
              billing_phone: orderData.primaryOrderId.addressId.mobileNumber,
              shipping_is_billing: true,
              shipping_customer_name: "",
              shipping_address: "",
              shipping_city: "",
              shipping_pincode: "",
              shipping_country: "",
              shipping_state: "",
              shipping_phone: "",
              order_items: [
                {
                  name: orderData.productId.productName,
                  sku: orderData.productId.sku,
                  units: orderData.quantity,
                  selling_price: orderData.totalPrice,
                  discount: "",
                  tax: "",
                  hsn: orderData.productId.hsnNo,
                },
              ],
              payment_method: orderData.primaryOrderId.paymentMode,
              sub_total: orderData.totalPrice,
              length: length,
              breadth: width,
              height: height,
              weight: orderData.productId.productWeight,
            };
            const token = await Helper.generateToken();
            const response = await Helper.createShiprocketOrder(data, token);
            const responseAwb = await Helper.getAWBNumber(
              response.shipment_id,
              orderData.courierId,
              "",
              token
            );
            if (responseAwb && response) {
              await orderDetailsModel.findOneAndUpdate(
                {
                  _id: new ObjectId(orderId),
                },
                {
                  $set: {
                    shipmentDetails: response,
                    awbDetails: responseAwb,
                  },
                },
                { new: true }
              );
            }
          }
        }
        //--------------------------------------- buyer email --------------------------------------
        const totalAmount = Number(exist.quantity) * Number(exist.totalPrice);
        var html = `
                            Dear <b>${customer.name},</b><br><br>
                                Your order for ${productName} for amount ₹ ${totalPrice} has been shipped.<br>
                                Order id: ${exist.primaryOrderId.parentOrderId}<br> 
                                Item: ${productName}<br> 
                                Amount: ₹${totalAmount} <br>
                                Quantity: ${exist.quantity} <br>
                                Shipping Address: ${addressArr} <br>
                                Contact information: ${customer.contactNo} <br><br>
                            You may track the order status <a href="${process.env.BUYER_ORDER_LIST_URL}">here</a><br><br>`;
        await Helper.send365Email(
          process.env.MAIL_SEND_EMAIL,
          customer.emailId,
          `Your order for ${productName} has been successfully shipped by the seller`,
          html,
          "text"
        );
        //--------------------------------------- seller email--------------------------------------
        var html = `
                            Dear <b>${supplier.founderName},</b><br><br>
                                Thankyou for confirmation of shippping the order.<br>
                                Item: ${productName}<br> 
                                Order id: ${exist.primaryOrderId.parentOrderId}<br> 
                                Amount: ₹${totalAmount} <br>
                                Quantity: ${exist.quantity} <br>
                                Shipping Address: ${addressArr} <br>
                                Customer name: ${customer.name} <br><br>
                            To confirm the status <a href="${process.env.SELLER_ORDER_LIST_URL}">here</a><br><br>`;
        await Helper.send365Email(
          process.env.MAIL_SEND_EMAIL,
          supplier.emailId,
          `Thankyou for confirmation of shippping #${exist.primaryOrderId.parentOrderId}`,
          html,
          "text"
        );
      }
      if (req.body.status == "DELIVERED") {
        //--------------------------------------- buyer email --------------------------------------
        const totalAmount = Number(exist.quantity) * Number(exist.totalPrice);
        var html = `
                            Dear <b>${customer.name},</b><br><br>
                                Your order for ${productName} for amount ₹ ${totalPrice} has been delivered.<br><br> 
                                The details of the order is as-<br> 
                                Order id: ${exist.primaryOrderId.parentOrderId}<br> 
                                Item: ${productName}<br> 
                                Quantity: ${exist.quantity} <br>
                                Amount: ₹${totalAmount} <br>
                                Shipping Address: ${addressArr} <br>
                                Contact information: ${customer.contactNo} <br><br>
                            You may raise any concerns related to delivered item <a href="${process.env.ORDER_SUPPORT}">here</a><br>
                            To request/schedule the installation/Demo <a href="${process.env.ORDER_SUPPORT}">here</a><br><br>`;
        await Helper.send365Email(
          process.env.MAIL_SEND_EMAIL,
          customer.emailId,
          `Your order for ${productName} has been successfully delivered by the seller`,
          html,
          "text"
        );
        //-----------------------------------Feedback & Reviews
        var html = `
                            Dear <b>${customer.name},</b><br><br>
                                Thankyou for placing order for ${productName}.<br>
                                we request for your reviews about the product <a href="${process.env.BUYER_ORDER_TRACK_URL}${orderId}">here</a><br>
                            You may raise any concerns related to delivered item <a href="${process.env.ORDER_SUPPORT}">here</a><br>
                            Thankyou for your valued trust in us. `;
        await Helper.send365Email(
          process.env.MAIL_SEND_EMAIL,
          customer.emailId,
          `Thankyou for your purchase of  ${productName} from project`,
          html,
          "text"
        );
        //--------------------------------------- seller email --------------------------------------
        var html = `
                            Dear <b>${supplier.founderName},</b><br><br>
                                Thankyou for confirmation of shippping the order.<br>
                                Item: ${productName}<br> 
                                Order id: ${exist.primaryOrderId.parentOrderId}<br> 
                                Amount: ₹${totalAmount} <br>
                                Quantity: ${exist.quantity} <br>
                                Shipping Address: ${addressArr} <br>
                                Customer name: ${customer.name} <br><br>
                            To confirm the status <a href="${process.env.SELLER_ORDER_LIST_URL}">click here.</a> Your payment will be proccesed within 3 to 4 days as per the agreement.<br><br>`;
        await Helper.send365Email(
          process.env.MAIL_SEND_EMAIL,
          supplier.emailId,
          `Order has been delivered #${exist.primaryOrderId.parentOrderId}`,
          html,
          "text"
        );
      }
      if (!updatedOrder) {
        return Helper.response(res, 500, MSG.api.fail[LOCALE || "en"]);
      }
      Helper.response(res, 200, `Order status changed successfully`);
    } catch (error) {
      console.error(error, "Errorrrrrr");
      Helper.response(res, 500, "Internal Server Error");
    }
  },
  orderRead: async (req, res) => {
    try {
      const _id = req.params.orderId;
      const doesOrderExist = await orderModel.findById(_id);
      if (doesOrderExist) {
        const orderdata = await orderModel.findByIdAndUpdate(
          _id,
          {
            isRead: true,
          },
          {
            new: true,
          }
        );
        if (!orderdata) {
          return Helper.response(res, 404, "Not found");
        }
        return Helper.response(res, 200, "Order read successfully");
      } else {
        return Helper.response(res, 404, "Not found");
      }
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Internal error");
    }
  },
  orderDetailsRead: async (req, res) => {
    try {
      const _id = req.params.orderId;
      const doesOrderDetailsExist = await orderDetailsModel.findById(_id);
      if (doesOrderDetailsExist) {
        const orderDetailsdata = await orderDetailsModel.findByIdAndUpdate(
          _id,
          {
            isRead: true,
          },
          {
            new: true,
          }
        );
        if (!orderDetailsdata) {
          return Helper.response(res, 404, "Not found");
        }
        return Helper.response(res, 200, "Order detail read successfully");
      } else {
        return Helper.response(res, 404, "Not found");
      }
    } catch (error) {
      logger.error(error);
      return Helper.response(res, 500, "Internal error");
    }
  },
  acceptInstallationRequest: async (req, res) => {
    try {
      let { orderId, customerId, supplierId, productUniqueId } = req.body;
      let installationProcess = {
        isProcessed: true,
        value: "INSTALLATION ACCEPTED",
        installationDate: moment().format(),
      };
      const order = await orderDetailsModel
        .findOneAndUpdate({ _id: orderId }, { installationProcess })
        .lean();
      if (!order) {
        return Helper.response(res, 401, "Order not found");
      }
      //for highlight to seller

      await orderModel
        .findOneAndUpdate(
          { _id: order.primaryOrderId },
          { isReadSeller: false, updatedAt: moment().format() }
        )
        .lean();
      const supplier = await supplierModel.findById(supplierId).lean();
      if (!supplier) {
        return Helper.response(res, 401, "Seller not found");
      }
      const product = await productModel.findOne({ productUniqueId }).lean();
      if (!product) {
        return Helper.response(res, 401, "Product not found");
      }
      const customer = await customerModel.findById(customerId).lean();
      if (!customer) {
        return Helper.response(res, 401, "Buyer not found");
      }
      let installDate = await Helper.dateFormat(new Date(), 1);
      let buyerAddress =
        customer.address +
        ", " +
        customer.city +
        ", " +
        customer.state +
        ", " +
        customer.zipCode;
      //-----------buyer email
      var html = `
        <p>Dear ${customer.name}, <br>Your installation request for the ${order.orderId}, product name ${product.productName}  purchased from project on has been scheduled for ${installDate} by the seller.<br>
        The seller will get in touch with you for further coodination for installation process. <br>
       You may raise any queries and concerns regarding the installation, by writing to us on info@project.com. <br>
       Thanks for your valued trust in us. </p> </br></br></br>
          `;
      await Helper.send365Email(
        process.env.MAIL_SEND_EMAIL,
        customer.emailId,
        `Installation Scheduled of product name ${product.productName} & product code <b> ${productUniqueId}.`,
        html,
        "text"
      );
      //-----------seller email
      var html = `
        <p>Dear ${supplier.basicInfo.founderName}, <br>Installation request for the ${order.orderId}, product name ${product.productName} purchased from project is confirmed  for ${installDate} by the customer.<br>
        You are requested to arrange for the installation on the confirmed date & time.  Address for the installation- ${buyerAddress} <br>
       You may raise any queries and concerns regarding reaching to the customer, write to us on info@project.com.<br>
        Thankyou for your valued trust</p> </br></br></br>
          `;
      await Helper.send365Email(
        process.env.MAIL_SEND_EMAIL,
        supplier.basicInfo.emailId,
        `Installation Scheduled of product name ${product.productName} & product code <b> ${productUniqueId}.`,
        html,
        "text"
      );
      const checkOrderTrack = await OrderTrackModel.findOne({
        orderId: orderId,
        orderStatus: "INSTALLATION ACCEPTED",
      });
      if (checkOrderTrack) {
        await OrderTrackModel.findOneAndUpdate(
          {
            orderId,
            orderStatus: "INSTALLATION ACCEPTED",
          },
          { $set: { orderStatusDate: moment().format() } },
          { new: true }
        );
      } else {
        var orderTrack = new OrderTrackModel({
          orderId: orderId,
          orderStatus: "INSTALLATION ACCEPTED",
          orderStatusDate: moment().format(),
        });
        orderTrack.save();
      }
      return Helper.response(
        res,
        200,
        "Installation accepted and assigned to the seller of this product."
      );
    } catch {
      logger.error(error);
      return Helper.response(res, 500, "Internal error");
    }
  },
  completedInstallationRequest: async (req, res) => {
    try {
      let { orderId, customerId, supplierId } = req.body;
      let installationProcess = {
        isProcessed: true,
        value: "INSTALLATION COMPLETED",
        installationDate: moment().format(),
      };
      const order = await orderDetailsModel
        .findOneAndUpdate({ _id: orderId }, { installationProcess })
        .lean();
      if (!order) {
        return Helper.response(res, 401, "Order not found");
      }
      const product = await productModel.findOne({ _id: order.productId });
      const supplier = await supplierModel.findById(supplierId).lean();
      if (!supplier) {
        return Helper.response(res, 401, "Seller not found");
      }
      const customer = await customerModel.findById(customerId).lean();
      if (!customer) {
        return Helper.response(res, 401, "Buyer not found");
      }
      //for buyer
      var html = `
          <p>Dear ${customer.name},<br><br>

Your request for  installation of ${product.productName}(${product.productUniqueId})  from the project is completed.<br>
Please confirm for the same here  ${process.env.ORDER_QUERY}<br>
You may raise any concerns related to delivered item here ${process.env.ORDER_QUERY}<br>
Thankyou for your valued trust in us. </b></p> </br></br></br>
          `;
      await Helper.send365Email(
        process.env.MAIL_SEND_EMAIL,
        customer.emailId,
        `Your request for installation of ${product.productName} & ${product.productUniqueId} is completed`,
        html,
        "text"
      );
      let buyerAddress =
        customer.address +
        ", " +
        customer.city +
        ", " +
        customer.state +
        ", " +
        customer.zipCode;
      let installDate = await Helper.dateFormat(new Date(), 1);
      //for seller
      var html = `
          <p>Dear ${supplier.basicInfo.founderName},<br><br>
The installation for your ${product.productName} & ${product.productUniqueId} at ${customer.name} and ${buyerAddress} is completed on ${installDate}.<br>
Thankyou for your valued trust in this. <br><br>
          `;
      await Helper.send365Email(
        process.env.MAIL_SEND_EMAIL,
        supplier.basicInfo.emailId,
        `Your request for installation of ${product.productName} & ${product.productUniqueId} is recieved`,
        html,
        "text"
      );
      const checkOrderTrack = await OrderTrackModel.findOne({
        orderId: orderId,
        orderStatus: "INSTALLATION COMPLETED",
      });
      if (checkOrderTrack) {
        await OrderTrackModel.findOneAndUpdate(
          {
            orderId,
            orderStatus: "INSTALLATION COMPLETED",
          },
          { $set: { orderStatusDate: moment().format() } },
          { new: true }
        );
      } else {
        var orderTrack = new OrderTrackModel({
          orderId: orderId,
          orderStatus: "INSTALLATION COMPLETED",
          orderStatusDate: moment().format(),
        });
        orderTrack.save();
      }
      return Helper.response(res, 200, "Installation completed");
    } catch {
      logger.error(error);
      return Helper.response(res, 500, "Internal error");
    }
  },
  orderAmount: async (req, res) => {
    try {
      const _id = req.params.orderId;
      console.log(_id, "<<<_id", req.query.amountReceived);
      // return
      const obj = {
        amountReceived: req.query.amountReceived,
        paymentStatus: "Success",
      };
      var isUpdate = await orderModel.findOneAndUpdate(
        { _id },
        { $set: obj },
        { new: true, useFindAndModify: false }
      );
      if (isUpdate) {
        return Helper.response(res, 200, `Amount saved successfully`);
      } else {
        return Helper.response(res, 200, `Order not found!`);
      }
    } catch (error) {
      console.error(error);
      Helper.response(res, 500, "Internal Server Error");
    }
  },
};
