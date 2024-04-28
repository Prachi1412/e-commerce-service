const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate");

const notificationSubscribeDetailsSchema = new Schema(
  {
    userId: {
      type: String,
      default: "",
    },
    token:{
         type: String,
      default: "",
    },
    subscribeData: {},
    role: {
      type: String,
      default: "", //buyer,seller
    },
  },
  {
    timestamps: true,
  }
);
notificationSubscribeDetailsSchema.plugin(mongoosePaginate);
module.exports = mongoose.model(
  "NotificationSubscribeDetails",
  notificationSubscribeDetailsSchema,
  "NotificationSubscribeDetails"
);
