const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const Helper = require("../../../config/helper");
const {
  getSyncSignedUrl,
  getSyncSignedProdUrl,
} = require("../../../lib/s3-services");
const customerModel = require("../../../models/CustomerModel");
const productModel = require("../../../models/ProductModel");
const cartModel = require("../../../models/CartModel");
const orderModel = require("../../../models/OrderModel");
const orderDetailsModel = require("../../../models/OrderDetailsModel");
const adminModel = require("../../../models/AdminModel");
const { logger } = require("../../../logger/winston");
const CategoryModel = require("../../../models/ProductCategoryModel");
const OrderTrackModel = require("../../../models/orderTrackModel");
const supplierModel = require("../../../models/SupplierModel");
const AddressModel = require("../../../models/AddressModel");
const axios = require("axios");
var _ = require("lodash");
const { customer } = require("../../../config/language/Messages");
const orderAttachmentFiles =
  Helper.upload_space("products").array("attachmentFiles");
const sendEmail = require("../../../helper/excel-generator/email-helper");
const moment = require("moment-timezone");
const TransactionModel = require("../../../models/TransactionModel");
const querystring = require("querystring");
module.exports = {
  order: async (req, res) => {
    try {
      var cartList = req.body.cartList;
      var customerId = req.user._id;
      var paymentMode = req.body.paymentMode;
      var companyId = req.body.companyId;
      var paymentId = req.body.paymentId;
      var addressId = req.body.addressId;
      var deliveryInstruction = req.body.deliveryInstruction;

      // promotional discount functionality
      const appliedPromo = req.body.appliedPromo ? req.body.appliedPromo : "";
      const promoDiscountAmount = req.body.promoDiscountAmount
        ? req.body.promoDiscountAmount
        : "";

      const currentHrs = await Helper.getCurrentHours();
      const [hours, minutes] = currentHrs.split(":");
      console.log(`Current time in India is ${hours}:${minutes}`);
      const generateCartId = await Helper.generateOrderId(); //generate unique parentOrderId
      // var totalAmount = parseFloat(req.body.totalPrice) - parseFloat(req.body.discount)
      var paymentStatus = "",
        status = "PENDING";
      if (paymentId != "") {
        var paymentStatus = await getPaymentStatus(paymentId); //getPaymentStatus
        paymentStatus = paymentStatus;
        status = paymentStatus == "succeeded" ? "PENDING" : "FAILED";
      }
      var newOrder = new orderModel({
        customerId,
        companyId,
        appliedPromo,
        promoDiscountAmount,
        totalPrice: req.body.totalPrice,
        deliveryMode: req.body.deliveryMode,
        paymentId: paymentId,
        addressId: addressId,
        paymentStatus: paymentStatus,
        discount: req.body.discount ? req.body.discount : 0,
        deliveryInstruction: deliveryInstruction ? deliveryInstruction : "",
        parentOrderId: generateCartId,
        deliveryCharges: req.body.deliveryCharges,
        deliveryDate: await Helper.dateFormat(new Date(), 1),
        orderStatus: status,
      });
      await newOrder
        .save()
        .then(async (result) => {
          if (result) {
            var primaryOrderId = result._id;
            const checkOrderTrack = await OrderTrackModel.findOne({
              orderId: primaryOrderId,
              orderStatus: status,
            });
            if (checkOrderTrack) {
              await OrderTrackModel.findOneAndUpdate(
                {
                  orderId,
                  orderStatus: status,
                },
                { $set: { orderStatusDate: new Date() } },
                { new: true }
              );
            } else {
              var orderTrack = new OrderTrackModel({
                orderId: primaryOrderId,
                orderStatus: status,
                orderStatusDate: new Date(),
              });
              orderTrack.save();
            }
            // if (device_token != '') {
            // var msg = `Hi! We have booked your order #${generateCartId}. Thank You for booking through MobiPetz !`;
            //     var title = "MobiPetz Notification"
            //     await Helper.sendPushNotification(serverKey, isExist.device_token, '0', title, msg)
            // }
            // await customerService.notification(result.customerId, "Order Notification", msg)
            await Promise.all(
              cartList.map(async function (item) {
                const { quantity, totalPrice } = item;
                const productId = item.productId;
                const cartId = item._id;
                const product = await productModel.findOne({ _id: productId });
                if (!product) {
                  return Helper.response(res, 404, "Product not found!");
                } else {
                  if (Number(product.productQuantity) < Number(quantity)) {
                    return Helper.response(res, 404, "Insufficient stock");
                  }

                  const orderId = await Helper.generateOrderId(); //generate unique OrderId
                  const order = new orderDetailsModel({
                    primaryOrderId,
                    productId: product._id,
                    productType: product.productType,
                    quantity,
                    paymentMode,
                    orderId,
                    totalPrice: totalPrice,
                  });

                  order
                    .save()
                    .then(async (result) => {
                      if (result) {
                        await cartModel.deleteOne({ _id: cartId });
                        if (paymentStatus == "succeeded") {
                          await customerModel.findOneAndUpdate(
                            { _id: customerId },
                            { $set: { isDiscount: false } },
                            { new: true, useFindAndModify: false }
                          );
                        }
                        var addressDetails = await AddressModel.findOne({
                          _id: req.body.addressId,
                        });
                        return Helper.response(
                          res,
                          200,
                          "Product placed successfully..",
                          {
                            orderResponse: generateCartId,
                            addressDetails: addressDetails,
                            orderId: primaryOrderId,
                          }
                        );
                      }
                    })
                    .catch((error) => {
                      console.log(error, "errorerrorerror");
                      Helper.response(res, 400, "ERROR!", { error: error });
                    });
                  if (paymentStatus == "succeeded") {
                    product.productQuantity -= quantity;
                  }
                  await product.save();
                }
              })
            );
          }
        })
        .catch((error) => {
          console.log(error, "errorerrorerror");
          Helper.response(res, 400, "ERROR!", { error: error });
        });
    } catch (err) {
      console.log(err);
      return Helper.response(res, 500, "Server error.", err);
    }
  },
  orderDetails: async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 25;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const query = { status: { $ne: "Delete" } };
    const customerId = req.user._id;
    let agg = [
      { $match: { customerId: new ObjectId(customerId) } },
      {
        $lookup: {
          from: "OrderDetails",
          localField: "_id",
          foreignField: "primaryOrderId",
          as: "OrderDetails",
        },
      },
      { $unwind: "$OrderDetails" },
      {
        $lookup: {
          from: "Address",
          localField: "addressId",
          foreignField: "_id",
          as: "AddressDetails",
        },
      },
      { $unwind: "$AddressDetails" },
      {
        $lookup: {
          from: "Product",
          localField: "OrderDetails.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
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
          orderDetails: { $push: "$OrderDetails" },
          cat_title: { $first: "$categorized" },
          subCategory: { $first: "$subCategory.subcategory_title" },
          deliveryMode: { $first: "$deliveryMode" },
          totalPrice: { $first: "$totalPrice" },
          deliveryCharges: { $first: "$deliveryCharges" },
          paymentStatus: { $first: "$paymentStatus" },
          orderStatus: { $first: "$orderStatus" },
          discount: { $first: "$discount" },
          paymentId: { $first: "$paymentId" },
          addressId: { $first: "$addressId" },
          addressDetails: { $first: "$AddressDetails" },
          deliveryInstruction: { $first: "$deliveryInstruction" },
          parentOrderId: { $first: "$parentOrderId" },
          attachmentFiles: { $first: "$attachmentFiles" },
          createdAt: { $first: "$createdAt" },
          companyDetails: { $first: "$companyDetails" },
          deliveryDate: { $first: "$deliveryDate" },
          appliedPromo: { $first: "$appliedPromo" },
          promoDiscountAmount: { $first: "$promoDiscountAmount" },
        },
      },
      {
        $project: {
          orderDetails: 1,
          addressDetails: 1,
          deliveryMode: 1,
          totalPrice: 1,
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
            $cond: { if: "$appliedPromo", then: "$appliedPromo", else: "" },
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
      { $sort: { createdAt: -1 } },
    ];
    const options = {
      page: page,
      limit: limit,
      allowDiskUse: true,
    };
    var totalResult = await orderModel
      .find({ customerId: new ObjectId(customerId) })
      .count();
    let myAggregate = await orderModel
      .aggregate(agg)
      .skip((page - 1) * limit)
      .limit(limit);
    let orderItems = myAggregate;
    if (orderItems.length > 0) {
      await Promise.all(
        orderItems.map(async function (element) {
          await Promise.all(
            element.orderDetails.map(async function (item) {
              if (item.productDetails.productImages.length > 0) {
                let productImages = [];
                for (
                  let i = 0;
                  i < item.productDetails.productImages.length;
                  i++
                ) {
                  console.log(process.env.IMAGE_URL);
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
                item.productDetails.productImageThumbnail != undefined &&
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

              item.isResult = false; // result visible only test kit category
              let productCategoryId = item.productDetails.productCategoryId;
              if (productCategoryId) {
                let category = await CategoryModel.findOne(
                  { _id: productCategoryId },
                  { categoryName: 1 }
                );
                item.isResult =
                  category.categoryName == "Test Kits" ? true : false;
              }
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
      return Helper.response(res, 404, "Order not found", { orderList: [] });
    }
  },
  cancelOrder: async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const updateObj = {
        orderStatus: "CANCELED",
      };
      const customerId = req.user._id;

      const exist = await orderModel.findOne({ _id: new ObjectId(orderId) });

      if (!exist) {
        return Helper.response(res, 404, "Order not found");
      }

      const orderDetails = await orderDetailsModel.find({
        primaryOrderId: orderId,
        productId: req.body.productId,
      });
      const orderDetailsUpdate = await orderDetailsModel.findOneAndUpdate(
        {
          primaryOrderId: orderId,
          productId: req.body.productId,
        },
        { $set: updateObj },
        { new: true }
      );
      await Promise.all(
        orderDetails.map(async (item) => {
          const product = await productModel.findOne({ _id: item.productId });
          if (product) {
            product.productQuantity += item.quantity;
            product.noOfUnitSold -= item.quantity;
            await product.save();
          } else {
            return Helper.response(res, 404, "Product not found!");
          }
        })
      );
      const updatedOrder = await orderModel
        .findOneAndUpdate(
          { _id: new ObjectId(orderId) },
          { $set: updateObj },
          { new: true }
        )
        .lean();

      if (!updatedOrder) {
        return Helper.response(res, 500, MSG.api.fail[LOCALE || "en"]);
      }

      const totalResult = await orderModel.find({
        customerId,
        orderStatus: "COMPLETED",
      });

      if (totalResult.length < 1) {
        await customerModel.findOneAndUpdate(
          { _id: customerId },
          { $set: { isDiscount: true } },
          { new: true, useFindAndModify: false }
        );
      }

      Helper.response(res, 200, "Order Cancelled Successfully", {
        orderResponse: { _id: orderId, orderStatus: updatedOrder.orderStatus },
      });
    } catch (error) {
      console.error(error);
      Helper.response(res, 500, "Internal Server Error");
    }
  },
  changeOrderStatusOld: async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const updateObj = {
        orderStatus: req.body.status,
      };

      const exist = await orderModel.findOne({ _id: new ObjectId(orderId) });

      if (!exist) {
        return Helper.response(res, 404, "Order not found");
      }
      const updatedOrder = await orderModel
        .findOneAndUpdate(
          { _id: new ObjectId(orderId) },
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
          },
          { $set: { orderStatusDate: new Date() } },
          { new: true }
        );
      } else {
        var orderTrack = new OrderTrackModel({
          orderId: orderId,
          orderStatus: req.body.status,
          orderStatusDate: new Date(),
        });
        orderTrack.save();
      }
      var productIdGet = await await orderDetailsModel.findOne(
        {
          primaryOrderId: new ObjectId(orderId),
        },
        { productId: 1, _id: 0 }
      );
      const updateProductOrderStatus = await orderDetailsModel
        .findOneAndUpdate(
          {
            primaryOrderId: new ObjectId(orderId),
            supplierId: req.user._id,
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
          await product.save();
        } else {
          return Helper.response(res, 404, "Product not found!");
        }
      }
      // if (req.body.status == "DELIVERED") {
      //   const product = await productModel.findOne({
      //     _id: updateProductOrderStatus.productId,
      //   });
      //   if (product) {
      //     product.productQuantity =
      //       Number(product.productQuantity) - updateProductOrderStatus.quantity;
      //     await product.save();
      //   } else {
      //     return Helper.response(res, 404, "Product not found!");
      //   }
      // }
      let text = req.body.status.toLowerCase();
      await Helper.sendNotification(
        updatedOrder.customerId,
        "customer",
        productIdGet.productId,
        `Your order no ${updatedOrder.parentOrderId} has been ${text}.`,
        `order ${text}`,
        `Order ${text}`,
        req.user._id
      );
      await Helper.sendNotification(
        req.user._id,
        "supplier",
        productIdGet.productId,
        `You ${text} the order no ${updatedOrder.parentOrderId}`,
        `order ${text}`,
        `Order ${text}`,
        updatedOrder.customerId
      );
      if (!updatedOrder) {
        return Helper.response(res, 500, MSG.api.fail[LOCALE || "en"]);
      }
      Helper.response(res, 200, `Order status changed successfully`);
    } catch (error) {
      console.error(error);
      Helper.response(res, 500, "Internal Server Error");
    }
  },
  changeOrderStatus: async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const updateObj = {
        orderStatus: req.body.status,
        isRead: false,
        isReadSeller: true,
        updatedAt: moment().format(),
      };
      let addressArr = [];
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
      // console.log(customer, "exist>>", exist, )
      // return
      if (!exist) {
        return Helper.response(res, 404, "Order not found");
      }

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
        //-----------------------------------Feedback & Review
        var html = `
                            Dear <b>${customer.name},</b><br><br>
                                Thankyou for placing order for ${productName}.<br>
                                we request for your reviews about the product <a href="${process.env.ORDER_SUPPORT}">here</a><br>
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
            supplierId: req.user._id,
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
      let text = req.body.status.toLowerCase();
      await Helper.sendNotification(
        updatedOrder.customerId,
        "customer",
        exist.productId,
        `Your order no ${updatedOrder.parentOrderId} has been ${text}.`,
        `order ${text}`,
        `Order ${text}`,
        req.user._id
      );
      await Helper.sendNotification(
        req.user._id,
        "supplier",
        exist.productId,
        `You ${text} the order no ${updatedOrder.parentOrderId}`,
        `order ${text}`,
        `Order ${text}`,
        updatedOrder.customerId
      );
      if (!updatedOrder) {
        return Helper.response(res, 500, MSG.api.fail[LOCALE || "en"]);
      }
      Helper.response(res, 200, `Order status changed successfully`);
    } catch (error) {
      console.error(error);
      Helper.response(res, 500, "Internal Server Error");
    }
  },
  uploadOrderAttachment: async (req, res) => {
    try {
      const orderId = req.params.orderId;
      orderAttachmentFiles(req, res, async function (err, result) {
        if (err) {
          console.log(err);
          return Helper.response(res, 422, "Something went wrong");
        } else {
          var attachmentFilesArr = [];
          req.files.forEach((file) => {
            attachmentFilesArr.push(file.location.split("products/")[1]);
          });
          var orderObj = {
            attachmentFiles: attachmentFilesArr,
          };
          const orderAttachmentFiles = await orderModel.findByIdAndUpdate(
            new ObjectId(orderId),
            { $set: orderObj },
            { new: true }
          );
          if (orderAttachmentFiles) {
            return Helper.response(
              res,
              200,
              "Attachment uploaded successfully"
            );
          }
        }
      });
    } catch (error) {
      Helper.response(res, 500, "Internal Server Error");
    }
  },
  getResult: async (req, res) => {
    try {
      let { orderId, productId } = req.query;
      if (!orderId) {
        return Helper.response(res, 500, "Order is required");
      }
      if (!productId) {
        return Helper.response(res, 500, "Product is required");
      }
      let filter = {
        orderId: ObjectId(orderId),
        productId: ObjectId(productId),
      };
      // console.log(req.query, "check")  // return
      // get the test result for the particular product
      const isExists = await testResultModel
        .find(filter, { __v: 0 })
        .lean()
        .exec();
      if (isExists.length > 0) {
        for await (ls of isExists) {
          let keynames = Object.keys(ls);
          for await (sub_ls of keynames) {
            let alpha_diversity = sub_ls.toString().replace(/_/g, " ");
            alpha_diversity = await Helper.CapitalizeWordString(
              alpha_diversity
            );
            let fil = { testParameter: { $eq: alpha_diversity.slice() } };
            let data = await TestParameterModel.findOne(fil);
            if (sub_ls == "carb_&_fiber_score") {
              var isObject = { carbsFiber: ls[sub_ls] };
            }
            if (data) {
              ls[sub_ls + "_data"] = {
                result: ls[sub_ls],
                lowRange: data.lowRange,
                highRange: data.highRange,
                information: data.information,
              };
              delete ls[sub_ls];
            }
          }
        }

        // get nutrition products on the basis of result
        const isResult = await testResultModel
          .findOne(filter, { __v: 0 })
          .lean()
          .exec();
        let query = [
          { $match: { productType: "Nutrition", status: "Active" } },
          {
            $lookup: {
              from: "ProductRange",
              localField: "_id",
              foreignField: "productId",
              as: "ProductRange",
            },
          },
          { $unwind: "$ProductRange" },
          {
            $lookup: {
              from: "PetCategory",
              localField: "petCategoryId",
              foreignField: "_id",
              as: "petType",
            },
          },
          { $unwind: "$petType" },
          {
            $lookup: {
              from: "ProductRating",
              localField: "_id",
              foreignField: "productId",
              as: "ratings",
            },
          },
          {
            $addFields: {
              ratings: {
                $cond: {
                  if: { $eq: [{ $size: "$ratings" }, 0] },
                  then: 0,
                  else: { $avg: "$ratings.rating" },
                },
              },
              petType: "$petType.name",
            },
          },
        ];

        const nutritionProduct = await productModel.aggregate(query);
        var suggestedFood = [];
        await Promise.all(
          nutritionProduct.map(async function (item, i) {
            var isCount = 0;
            if (
              isResult.alpha_diversity >=
                item.ProductRange.alphaDiversityLowerLimit &&
              isResult.alpha_diversity <=
                item.ProductRange.alphaDiversityUpperLimit
            ) {
              isCount++;
            }
            if (
              isResult.evenness >= item.ProductRange.evennessLowerLimit &&
              isResult.evenness <= item.ProductRange.evennessUpperLimit
            ) {
              isCount++;
            }
            if (
              isResult.richness >= item.ProductRange.richnessLowerLimit &&
              isResult.richness <= item.ProductRange.richnessUpperLimit
            ) {
              isCount++;
            }
            if (
              isResult.protein_score >=
                item.ProductRange.proteinScoreLowerLimit &&
              isResult.protein_score <= item.ProductRange.proteinScoreUpperLimit
            ) {
              isCount++;
            }
            if (
              isResult.fat_score >= item.ProductRange.fatScoreLowerLimit &&
              isResult.fat_score <= item.ProductRange.fatScoreUpperLimit
            ) {
              isCount++;
            }
            if (
              isObject.carbsFiber >=
                item.ProductRange.carbFiberScoreLowerLimit &&
              isObject.carbsFiber <= item.ProductRange.carbFiberScoreUpperLimit
            ) {
              isCount++;
            }
            if (
              isResult.chondroitin_score >=
                item.ProductRange.chondroitinScoreLowerLimit &&
              isResult.chondroitin_score <=
                item.ProductRange.chondroitinScoreUpperLimit
            ) {
              isCount++;
            }
            if (
              isResult.gut_shield_score &&
              isResult.gut_shield_score >=
                item.ProductRange.gutShieldScoreLowerLimit &&
              isResult.gut_shield_score <=
                item.ProductRange.gutShieldScoreUpperLimit
            ) {
              isCount++;
            }
            delete item.ProductRange;
            // console.log(isCount, '<<isCount', i)
            if (isCount >= 4) {
              if (item.productImages.length > 0) {
                let productImages = [];
                for (let i = 0; i < item.productImages.length; i++) {
                  productImages.push({
                    imgUrl: getSyncSignedUrl(
                      item.productImages[i].imgS3Key,
                      "image/jpg"
                    ),
                    isPrimary: item.productImages[i].isPrimary,
                  });
                }
                item.productImages = productImages;
              }
              if (
                item.productImageThumbnail != undefined &&
                item.productImageThumbnail.length > 0
              ) {
                let productImageThumbnail = [];
                for (let i = 0; i < item.productImageThumbnail.length; i++) {
                  productImageThumbnail.push({
                    imgUrl: getSyncSignedUrl(
                      item.productImageThumbnail[i].imgS3Key,
                      "image/jpg"
                    ),
                    isPrimary: item.productImageThumbnail[i].isPrimary,
                  });
                }
                item.productImageThumbnail = productImageThumbnail;
              }
              suggestedFood.push(item);
            }
          })
        );
        console.log(suggestedFood.length, "<<suggestedFood");
        Helper.response(res, 200, "Test result fetched successfully..", {
          testResultList: isExists,
          foodSuggestion: suggestedFood,
        });
      } else {
        Helper.response(res, 404, "No record found...", { testResultList: [] });
      }
    } catch (err) {
      console.log(err);
      return Helper.handlerMongooseErrorResponse(res, err);
    }
  },
  getCompanyDetails: async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const status = req.query.status ? req.query.status : "";
    const companyId = req.query.companyId ? req.query.companyId : "";
    let query = {
      _id: ObjectId(companyId),
      status: { $ne: "Delete" },
      role: "company",
    };
    if (status) {
      query = { status: { $eq: status } };
    }
    if (!companyId) {
      return Helper.response(res, 500, "Company id is required");
    }
    // console.log(query);
    const col = { password: 0, JWT_Token: 0, certificates: 0, license: 0 };
    if (req.query.search) {
      var searchObject = {
        $or: [{ companyName: { $regex: req.query.search, $options: "i" } }],
      };
      Object.assign(query, searchObject);
    }
    adminModel
      .paginate(query, {
        page: page,
        sort: { createdDate: -1 },
        limit: limit,
        select: col,
      })
      .then((result) => {
        var companyList = result.docs;
        var totalResult = result.total;
        if (companyList.length > 0) {
          var resData = {
            companyList: companyList,
            totalResult: totalResult,
            limit: limit,
          };
          Helper.response(
            res,
            CODES.STATUS_CODES.OK,
            "Company details fetch successfully",
            resData
          );
        } else {
          Helper.response(
            res,
            CODES.STATUS_CODES.Not_Found,
            MSG.company.fetch[LOCALE || "en"],
            { companyList: [] }
          );
        }
      })
      .catch((err) => {
        return Helper.response(
          res,
          CODES.STATUS_CODES.Internal_Server_Error,
          MSG.serverError[LOCALE || "en"]
        );
      });
  },
  gatewaySession: async (req, res) => {
    try {
      let { amount } = req.body;
      let data = JSON.stringify({
        amount: amount * 100,
        currency: "SGD",
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      });

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: paymentUrl,
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic QlBQX0FVVEhfVVNFUjokMmEkMTAkWG9FcDRVY0UwenI5YzQudEtkYnAwT3Z1cGp3cndxczhEeTlO",
          Cookie:
            "JSESSIONID=HxC31Cmj9nsgO6bxNClaQ07nRQSy0gy5iPD46w10.bppapp01",
        },
        data: data,
      };
      const response = await axios.request(config);
      logger.info(`Generate payment gateway api response: ${response.data} `);
      return Helper.response(res, 200, "Payment gateway response", {
        response: response.data,
      });
    } catch (error) {
      console.error(error);
      logger.error(`####### payment gateway ######### error: ${error} `);
      return Helper.response(res, 500, { error: error });
    }
  },
  getPaymentStatus: async (req, res) => {
    try {
      const paymentId = req.query.paymentId;
      var name = _.capitalize(req.user.name);
      var device_token = req.user.device_Token;
      let data = JSON.stringify({
        paymentId: paymentId,
      });

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: checkPaymentStatusUrl,
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic QlBQX0FVVEhfVVNFUjokMmEkMTAkWG9FcDRVY0UwenI5YzQudEtkYnAwT3Z1cGp3cndxczhEeTlO",
          Cookie:
            "JSESSIONID=FJThHapGvMG5252kOvIEkAQx03KXL7jINKnQa1H1.bppapp01",
        },
        data: data,
      };
      const response = await axios.request(config);
      var isUpdate = await orderModel
        .findOneAndUpdate(
          { paymentId, paymentStatus: "Pending" },
          { $set: { paymentStatus: response.data.status } },
          { new: true, useFindAndModify: false }
        )
        .lean();
      console.log("<<<isUpdate", isUpdate);
      logger.info(`MarketPlace paymentStatus api response: ${isUpdate} `);
      // if (response.data.status == "succeeded") {
      //     var title = "Order Placed Successfully"
      //     var msg = `Hi ${name}, Thank You for choosing Mobipetz. Your order (ID: ${isUpdate.parentOrderId}) of $${isUpdate.totalPrice} has been successfully placed. Thanks for being a part of our goodness journey.`
      // } else {
      //     var title = "Transaction Failed!"
      //     var msg = `We're sorry, but your transaction for order ${isUpdate.parentOrderId} has failed. Please check your payment details and try again.`
      // }
      // await Helper.sendPushNotification(serverKey, device_token, '0', title, msg)
      if (isUpdate && response.data.status != "succeeded") {
        const orderId = isUpdate._id;
        const orderDetails = await orderDetailsModel.find({
          primaryOrderId: orderId,
        });

        await Promise.all(
          orderDetails.map(async function (item) {
            const product = await productModel.findOne({ _id: item.productId });
            if (product) {
              product.productQuantity += item.quantity;
              await product.save();
            } else {
              return Helper.response(res, 404, "Product not found!");
            }
          })
        );
      } else {
        return Helper.response(
          res,
          200,
          "Payment status successfully updated!",
          response.data
        );
      }
      return Helper.response(res, 200, "Fetch payment status..", response.data);
    } catch (error) {
      console.error(error);
    }
  },
  verifyPromo: async (req, res) => {
    try {
      let { companyId, promoCode } = req.body;
      var date = new Date(req.currentDate);
      const query = {
        promoCode,
        companyId: ObjectId(companyId),
        status: "Active",
      };
      // console.log(query, "query")
      const promoBanners = await promoBannerModel.findOne(query, {
        title: 1,
        bannerName: 1,
        promoCode: 1,
        productCategoryId: 1,
        subCategoryId: 1,
        minAmountPurchase: 1,
        amountPercentage: 1,
        discountAmount: 1,
      });
      if (promoBanners) {
        const promo = await promoBannerModel.findOne({
          _id: promoBanners._id,
          startDate: { $lte: Helper.dateFormat(date) },
          endDate: { $gte: await Helper.dateFormat(date) },
        });
        if (promo) {
          console.log(promo, "Promo Applied"); //Promo Applied
          return Helper.response(res, 200, "Promo applied..", {
            isApplied: true,
            promo: promoBanners,
          });
        } else {
          console.log("expired!"); //Promo expired
          return Helper.response(res, 200, "Promo code is expired!", {
            isApplied: false,
          });
        }
      } else {
        console.log("not valid!");
        return Helper.response(res, 200, "Promo code is not valid!", {
          isApplied: false,
        });
      }
    } catch (error) {
      console.error(error);
      return Helper.response(res, 500, { error: error });
    }
  },
  list: async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 25;
    var page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * limit;
    var status = req.query.status ? req.query.status : null;
    var startsDate = req.query.startDate ? req.query.startDate : null;
    var endsDate = req.query.endDate ? req.query.endDate : null;
    var supplierId = req.user._id;
    var query = {
      orderStatus: { $ne: "Delete" },
      supplierId,
    };
    endsDate = Helper.modifyDate(endsDate, 1);
    if (startsDate && endsDate) {
      let dateFilter = {
        createdAt: { $gte: new Date(startsDate), $lte: new Date(endsDate) },
      };
      Object.assign(query, dateFilter);
    }

    if (status) {
      if (status == "ORDER RECEIVED") {
        Object.assign(query, { orderStatus: "PENDING" });
      } else {
        Object.assign(query, { orderStatus: status });
      }
    } else {
      Object.assign(query, { orderStatus: { $ne: "Delete" } });
    }

    if (req.query.search) {
      let searchObject = {
        $or: [
          { customerName: { $regex: req.query.search, $options: "i" } },
          { customerMobile: { $regex: req.query.search, $options: "i" } },
          { productType: { $regex: req.query.search, $options: "i" } },
          { parentOrderId: { $regex: req.query.search, $options: "i" } },
          { deliveryMode: { $regex: req.query.search, $options: "i" } },
          { trackingId: { $regex: req.query.search, $options: "i" } },
          { paymentId: { $regex: req.query.search, $options: "i" } },
        ],
      };
      Object.assign(query, searchObject);
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
      { $unwind: "$productDetails" },
      {
        $lookup: {
          from: "OrderTrack",
          localField: "_id",
          foreignField: "orderId",
          as: "orderTrackStatusDetails",
        },
      },
      {
        $match: query,
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $group: {
          _id: "$primaryOrderId",
          // parentOrderId: "$orderData.parentOrderId",
          // createdAt: "$orderData.createdAt",
          orderDetails: {
            $push: {
              _id: "$_id",
              productId: "$productId",
              installationProcess: "$installationProcess",
              orderId: "$orderId",
              orderStatus: "$orderStatus",
              quantity: "$quantity",
              createdAt: "$createdAt",
              productDetails: {
                _id: "$productDetails._id",
                productName: "$productDetails.productName",
                productImages: "$productDetails.productImages",
                productPrice: "$productDetails.productPrice",
                productQuantity: "$productDetails.productQuantity",
                productUniqueId: "$productDetails.productUniqueId",
                shippingPreference: "$productDetails.shippingPreference",
                createdAt: "$productDetails.createdAt",
              },
              orderTrackStatus: "$orderTrackStatusDetails",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          primaryOrderId: "$_id",
          orderDetails: 1,
          parentOrderId: "$orderData.parentOrderId",
          orderCount: { $size: "$orderDetails" },
        },
      },
    ];
    const options = {
      page: page,
      limit: limit,
      allowDiskUse: true,
    };
    let myAggregate = orderDetailsModel.aggregate(agg);
    orderDetailsModel.aggregatePaginate(
      myAggregate,
      options,
      async function (err, result) {
        if (err) {
          console.log(err);
          return Helper.response(res, 500, "Internal server error.");
        } else {
          if (result.docs.length > 0) {
            let cartItems = result.docs;
            let totalResult = result.totalDocs;
            if (cartItems.length > 0) {
              let finalArr = [];
              await Promise.all(
                cartItems.map(async function (order) {
                  var orderData = await orderModel.findOne({
                    _id: order.primaryOrderId,
                  });

                  if (orderData) {
                    order.parentOrderId = orderData.parentOrderId;
                    order.paymentStatus = orderData.paymentStatus
                      ? orderData.paymentStatus
                      : "Pending";
                    order.createdAt = orderData.createdAt;
                    order.updatedAt = orderData.updatedAt;
                    order.isReadSeller = orderData.isReadSeller;
                    order.customerId = orderData.customerId;
                  } else {
                    order.parentOrderId = "";
                    order.paymentStatus = "Failed";
                    order.isReadSeller = false;
                  }
                  var orderResult = [];
                  order.orderDetails.map(async function (orderDetail) {
                    if (orderDetail.orderStatus == "PENDING") {
                      orderDetail.orderStatus = "ORDER RECEIVED";
                    }
                    if (
                      orderDetail.productDetails.productImages &&
                      orderDetail.productDetails.productImages.length > 0
                    ) {
                      const productImages =
                        orderDetail.productDetails.productImages.map((img) => ({
                          imgUrl:
                            process.env.IMAGE_URL + "suppliers/" + img.imgName,
                          imgName: img.imgName,
                        }));
                      orderDetail.productDetails.productImages = productImages;
                    }
                    orderDetail.orderTrackStatus.forEach((track) => {
                      if (track.orderStatus == "PENDING") {
                        track.orderStatus = "ORDER RECEVICED";
                      }
                    });

                    orderResult.push(orderDetail);
                  });

                  order.orderDetails = orderResult;

                  finalArr.push(order);
                })
              );
              finalArr = _.orderBy(finalArr, ["updatedAt"], ["desc"]);
              var orderCount = await orderDetailsModel.find(query);
              const uniqueOrdersArray = _.uniqBy(orderCount, (order) =>
                order.primaryOrderId.toString()
              );
              let resData = {
                orderList: finalArr,
                totalResult: uniqueOrdersArray.length,
                limit: limit,
              };
              Helper.response(
                res,
                200,
                "Order details fetched successfully",
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
  },
  orderDetailById: async (req, res) => {
    var _id = req.params.orderId ? new ObjectId(req.params.orderId) : null;
    let orderData = await orderModel
      .findById({ _id })
      .populate(
        "customerId",
        "_id name contactNo countryCode customerUniqId emailId"
      )
      .populate("addressId", {
        _id: 1,
        name: 1,
        mobileNumber: 1,
        address: 1,
        street: 1,
        landMark: 1,
        pinCode: 1,
        city: 1,
        state: 1,
      })
      .lean();
    let orderDetails = await orderDetailsModel
      .find({ primaryOrderId: _id })
      .populate("productId", {
        _id: 1,
        discountPercent: 1,
        discountPrice: 1,
        description: 1,
        productType: 1,
        productName: 1,
        productPrice: 1,
        productCode: 1,
        sku: 1,
        hsnNo: 1,
        productImages: 1,
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
      orderDetails.map((productData) => {
        if (productData.productId.productImages) {
          productData.productId.productImages.map((img) => {
            img.imgName = process.env.IMAGE_URL + "suppliers/" + img.imgName;
          });
        }
        if (
          productData.productId.productImageThumbnail != undefined &&
          productData.productId.productImageThumbnail
        ) {
          productData.productId.productImageThumbnail.map((img) => {
            img.imgName = process.env.IMAGE_URL + "suppliers/" + img.imgName;
          });
        }
      });
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
      orderData.orderTrackData = await orderTrackDetails(_id);
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
      return Helper.response(res, 404, "No data found");
    }
  },
  sendConfirmationMail: async (req, res) => {
    var _id = req.body.orderId ? new ObjectId(req.body.orderId) : null;
    let orderData = await orderModel
      .findById({ _id })
      .populate(
        "customerId",
        "_id name contactNo countryCode customerUniqId emailId"
      )
      .populate("addressId", {
        _id: 1,
        name: 1,
        mobileNumber: 1,
        address: 1,
        street: 1,
        state: 1,
        landMark: 1,
        country: 1,
        pinCode: 1,
        city: 1,
      })
      .lean();
    let orderDetails = await orderDetailsModel
      .find({ primaryOrderId: _id })
      .populate("productId", {
        _id: 1,
        discountPercent: 1,
        discountPrice: 1,
        description: 1,
        productType: 1,
        productName: 1,
        productPrice: 1,
        productCode: 1,
        sku: 1,
        hsnNo: 1,
        productImages: 1,
        productImageThumbnail: 1,
        etd: 1,
      })
      .lean();
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
      var event = new Date(orderData.createdAt);
      let date = JSON.stringify(event);
      var dateDetails = date.slice(1, 11);
      var html = `
    <p>Dear ${orderData.customerId.name}, </br></br></br>
    I trust this message finds you well. We are delighted to inform you that your recent order with us has been successfully processed and confirmed. We appreciate your trust in our products/services, and we are committed to ensuring a seamless and satisfying shopping experience for you.

    Here are the details of your order:<br>
    Order Number: ${orderData.parentOrderId}<br>
    Order Date: ${dateDetails}<br>
    Shipping Address: ${orderData.addressId.address},  ${orderData.addressId.street},  ${orderData.addressId.landMark}, ${orderData.addressId.pinCode},  ${orderData.addressId.city} <br>
    Order Summary:<br>
    `;

      let transactiondetails = await TransactionModel.findOne({
        trackingId: orderData.paymentId,
      });

      const transactiondetailsData =
        transactiondetails && transactiondetails.ccavResponse
          ? querystring.parse(transactiondetails.ccavResponse)
          : null;
      var transactionMode =
        transactiondetailsData && transactiondetailsData.payment_mode
          ? transactiondetailsData.payment_mode
          : "Offline";
      // Loop through the products in orderData
      for (const product of orderDetails) {
        html += `
        Quantity: ${product.quantity} <br>
        Price: ${product.totalPrice} <br>
        orderId: ${product.orderId} <br>
        Estimated Delivery Date: ${product.etd}<br><br>
         <br>
    `;
      }
      //  [Additional Product Details as Applicable]
      html += `
    Total Order Amount: ${billingDetails.total}<br><br>
    Payment Method: ${transactionMode}<br><br>
    

    Our team is working diligently to prepare your order for shipment. You will receive a notification once your order has been dispatched, along with tracking information to monitor the delivery status.

    If you have any questions or if there's anything else we can assist you with, please do not hesitate to reach out to our customer service team at [Customer Service Email/Phone Number].

    Thank you once again for choosing us. We look forward to serving you, and we hope you enjoy your purchase.
      <br><br>
    Best regards, <br><br>

    Your Seller<br>
    ${req.user.basicInfo.founderName}<br>
    ${req.user.basicInfo.companyName}<br>
    ${req.user.basicInfo.contactNo}<br>`;

      // Now 'html' contains the dynamically generated HTML with the order summary

      await Helper.send365Email(
        process.env.MAIL_SEND_EMAIL, //req.user.basicInfo.emailId,
        orderData.customerId.emailId,
        `Order Confirmation - ${orderData.parentOrderId}`,
        html,
        "text"
      );
      // var mailRes = await sendEmail(
      //   req.user.basicInfo.emailId,
      //   orderData.customerId.emailId,
      //   `Order Confirmation - ${orderData.parentOrderId}`,
      //   html
      // );
      return Helper.response(res, 200, "Mail send to this customer");
    } else {
      return Helper.response(res, 404, "No data found");
    }
  },
  orderReadSeller: async (req, res) => {
    try {
      const _id = req.params.orderId;
      const doesOrderExist = await orderModel.findById(_id);
      if (doesOrderExist) {
        const orderdata = await orderModel.findByIdAndUpdate(
          _id,
          {
            isReadSeller: true,
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
  completedInstallationBySeller: async (req, res) => {
    try {
      let { orderId, customerId, productUniqueId } = req.body;
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
      //for highlight to seller
      await orderModel
        .findOneAndUpdate(
          { _id: order.primaryOrderId },
          { isRead: false, updatedAt: moment().format() }
        )
        .lean();
      const product = await productModel
        .findOne({ _id: order.productId })
        .lean();
      if (!product) {
        return Helper.response(res, 401, "Product not found");
      }
      const supplierData = await supplierModel
        .findOne({ _id: order.supplierId })
        .lean();
      if (!supplierData) {
        return Helper.response(res, 401, "Supplier not found");
      }
      const customer = await customerModel.findById(customerId).lean();
      if (!customer) {
        return Helper.response(res, 401, "Buyer not found");
      }
      // for Customer email
      var html = `
                Dear <b>${customer.name},</b><br><br>
               Your request for installation of <b>${product.productName} (${product.productUniqueId})</b> from the project is completed.<br>
               Please confirm for the same here  ${process.env.ORDER_QUERY}<br><br>
                You may raise any concerns related to delivered item.<a href="${process.env.ORDER_SUPPORT}">here</a><br>
                <br>
                Thank you for your valued trust in this.<br>
                <br>
                Best regards,<br><br>
                Team project<br><br>`;

      await Helper.send365Email(
        process.env.MAIL_SEND_EMAIL,
        customer.emailId,
        `Your request for installation of ${product.productName} (${product.productUniqueId}) is completed`,
        html,
        "text"
      );
      // for Seller email
      let supplier = supplierData.basicInfo;
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
      var supllierHtml = `
          <p>Dear ${supplier.founderName},<br><br>
The installation for your ${product.productName} & ${product.productUniqueId} at ${customer.name} and ${buyerAddress} is completed on ${installDate}.<br>
Thankyou for your valued trust in this. <br><br>
          `;
      await Helper.send365Email(
        process.env.MAIL_SEND_EMAIL,
        supplier.emailId,
        `Your request for installation of ${product.productName} (${product.productUniqueId}) is completed`,
        supllierHtml,
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
    } catch (error) {
      logger.error(error);
      console.log(error, "error");
      return Helper.response(res, 500, "Internal error");
    }
  },
};

const orderTrackDetails = async (orderId) => {
  var checkOrderTrackData = await OrderTrackModel.find({ orderId });
  return checkOrderTrackData;
};
