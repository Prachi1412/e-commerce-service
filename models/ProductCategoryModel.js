const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const mongoosePaginate = require("mongoose-paginate");

const productCategorySchema = new Schema(
  {
    categoryType: {
      type: String, //product,service
      default: "",
    },
    productCategoryName: {
      type: String,
      required: true,
    },
    productCategoryImage: [],
    productimageS3Key: {
      type: String,
      default: "",
    },
    mimetype: {
      type: String,
      default: "",
    },
    orderPosition: {
      type: Number,
      default: 0,
    },
    productCategoryStatus: {
      type: String,
      enum: ["Active", "Inactive", "Delete"],
      default: "Inactive",
    },
  },
  {
    timestamps: true,
  }
);
productCategorySchema.plugin(aggregatePaginate);
module.exports = mongoose.model("ProductCategory", productCategorySchema, "ProductCategory");