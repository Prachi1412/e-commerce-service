const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');

const VideoSchema = new Schema(
  {
    videoTitle: { type: String, default: "" },
    videoDescription: { type: String, default: "" },
    status: { type: String, default: "Active" },
    videoName: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);
VideoSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Video", VideoSchema, "Video");