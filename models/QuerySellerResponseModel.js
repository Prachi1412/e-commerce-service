const mongoose = require('mongoose')
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const QueryAdminSellerSchema = new Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },
    queryId: {
      type: ObjectId,
      ref: "Query",
    },
    senderId: {
      type: String,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    question: { type: String, default: "" },
    response: { type: String, default: "" }, // by supplier,admin
    status: {
      type: String,
      enum: ["Active", "Inactive", "Delete"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);
QueryAdminSellerSchema.plugin(aggregatePaginate);
module.exports = mongoose.model(
  "QueryAdminSeller",
  QueryAdminSellerSchema,
  "QueryAdminSeller"
);