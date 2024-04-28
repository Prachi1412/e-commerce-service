const mongoose = require('mongoose')
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const WishListSchema = new Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    productId: {
      type: ObjectId,
      ref: "Products",
      required: true,
    },
    supplierId: {
      type: ObjectId,
      ref: "Supplier"
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);
WishListSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("WishList", WishListSchema, "WishList");