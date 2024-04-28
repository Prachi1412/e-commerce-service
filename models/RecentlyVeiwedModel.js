const mongoose = require("mongoose");
const { Schema } = mongoose;

const RecentlyVeiwSchema = new Schema(
  {
    viewedId: {
      type: String,
      default: "", // id of product/service
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer", // Assuming you have a User model
    },
    categoryType: {
      type: String,
      default: "", // product/service
    },
  },
  {
    timestamps: true,
  }
);

const RecentlyVeiw = mongoose.model(
  "RecentlyVeiw",
  RecentlyVeiwSchema,
  "RecentlyVeiw"
);

module.exports = RecentlyVeiw;
