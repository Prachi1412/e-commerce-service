const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const indiaTime = new Date().toLocaleString("en-US", {
  timeZone: "Asia/Kolkata",
});
const date = new Date(indiaTime);
const orderDetailsSchema = new Schema({
  primaryOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  productId: {
    type: ObjectId,
    ref: "Product",
    required: true,
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
  },
  orderId: { type: String, default: "" }, // J8BNV4M934

  questionArr: { type: Array, default: [] },
  quantity: { type: Number, default: 0 },
  paymentId: { type: String, default: "" },
  totalPrice: { type: Number, default: 0 },
  testResult: {
    type: String,
    default: "Pending",
  },

  productType: { type: String, default: "" },
  paymentStatus: {
    type: String,
    default: "Pending",
  },
  installationProcess: {
    isProcessed: {
      type: Boolean,
      default: false,
    },
    value: {
      type: String,
      default: "",
    },
    installationDate: {
      type: Date,
    },
  },
  shippingCharge: {
    type: String,
  },
  courierId: {
    type: String,
  },
  etd: {
    type: String,
  },
  shipmentDetails: {
    type: Object,
  },
  awbDetails: {
    type: Object,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  isReadSeller: {
    type: Boolean,
    default: false,
  },
  orderStatus: {
    type: String,
    default: "PENDING",
  },
  createdAt: { type: Date, default: date },
});
orderDetailsSchema.plugin(aggregatePaginate);
module.exports = mongoose.model(
  "OrderDetails",
  orderDetailsSchema,
  "OrderDetails"
);
