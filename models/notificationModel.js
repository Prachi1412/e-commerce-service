const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const notificationSchema = new Schema({
  userId: {
    type: String,
    default: ""
  },
  supplierId: {
    type: String,
    default: ""
  },
  role: {
    type: String,
    default: ""
  },
  productId: {
    type: ObjectId,
    ref: "Product",
  },
  title: {
    type: String,
    default: ""
  },
  message: {
    type: String,
    default: ""
  },
  notificationFor: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    default: "Active"
  },
  isRead: {
    type: Boolean,
    default: false
  },
}, {
  timestamps: true,
});
notificationSchema.plugin(aggregatePaginate);
module.exports = mongoose.model(
  "Notification",
  notificationSchema,
  "Notification"
);