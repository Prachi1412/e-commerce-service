const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const mongoosePaginate = require("mongoose-paginate");

const productSubCategorySchema = new Schema({
  productCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductCategory",
  },
  subCategoryName: {
    type: String,
    default: "",
  },
  orderPosition: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["Active", "Inactive", "Delete"],
    default: "Inactive",
  },
}, {
  timestamps: true,
});
productSubCategorySchema.plugin(aggregatePaginate);

module.exports = mongoose.model("ProductSubCategory", productSubCategorySchema, "ProductSubCategory");