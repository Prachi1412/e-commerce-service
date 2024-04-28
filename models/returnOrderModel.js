const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const returnOrderSchema = new Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderDetails",
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    reason: {
      type: String,
      default: "",
    },
    returnRequestDate: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);
returnOrderSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("ReturnOrder", returnOrderSchema, "ReturnOrder");
