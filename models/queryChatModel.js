const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const queryChatSchema = new Schema(
  {
    supplierId: {
      // use for supplier
      type: ObjectId,
      ref: "Supplier",
    },
    adminId: {
      type: ObjectId,
      ref: "Admin",
    },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    attachmentFiles: [
      {
        imgName: String,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "resolved", "Delete", "cancelled"],
      default: "pending",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isReadSeller: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);
queryChatSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("QueryChat", queryChatSchema, "QueryChat");
