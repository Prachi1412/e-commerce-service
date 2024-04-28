const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate");

const AchievementSchema = new Schema(
  {
    states: { type: String, default: "" },
    innovationsListed: { type: String, default: "" },
    status: { type: String, default: "Active" },
    providers: {
      type: String,
      default: "",
    },
    sales: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);
AchievementSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Achievement", AchievementSchema, "Achievement");
