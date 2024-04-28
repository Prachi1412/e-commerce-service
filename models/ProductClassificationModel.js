const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const mongoosePaginate = require("mongoose-paginate");

const productClassificationSchema = new Schema(
  {
    // productTypeId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "ServiceCategory",
    // },
    productClassificationName: {
      type: String,
      required: true,
    },
    productClassificationImage: {
      type: String,
      default: "",
    },
    productimageS3Key: {
      type: String,
      default: "",
    },
    mimetype: { type: String, default: "" },
    productClassificationStatus: {
      type: String,
      enum: ["Active", "Inactive", "Delete"],
      default: "Inactive",
    },
  },
  {
    timestamps: true,
  }
);
productClassificationSchema.plugin(aggregatePaginate);

const productClassificationModel = mongoose.model(
  "ProductClassification",
  productClassificationSchema,"ProductClassification"
);

module.exports = productClassificationModel;
