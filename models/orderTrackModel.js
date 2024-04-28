const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const indiaTime = new Date().toLocaleString("en-US", {
  timeZone: "Asia/Kolkata",
});
const date = new Date(indiaTime);

const orderTrackSchema = new Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderDetails",
    },
    orderStatus: {
      type: String,
      default: "",
    },
    trackingLink: {
      type: String
    },
    shipmentId: {
      type: String
    },
    orderStatusDate: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);
orderTrackSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("OrderTrack", orderTrackSchema, "OrderTrack");
