const mongoose = require('mongoose')
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const querySchema = new Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },
    productId: {
      type: ObjectId,
      ref: "Product",
    },
    senderId: {
      type: String,
      default: "",
    },
    replyBy: {
      type: String,
      default: "",
    }, // by supplier,admin(reply)
    answer: {
      type: String,
      default: "",
    }, // by supplier,admin
    categoryType: { type: String, default: "" }, // Product,Service
    subject: { type: String, default: "" },
    message: { type: String, default: "" },
    attachmentFiles: [],
    status: {
      type: String,
      enum: ["pending", "resolved", "Delete", "cancelled"],
      default: "pending",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isReadBuyer: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);
querySchema.plugin(aggregatePaginate);
module.exports = mongoose.model("Query", querySchema, "Query");