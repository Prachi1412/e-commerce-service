const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const Schema = mongoose.Schema;
const fs = require("fs");

const professionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    orderPosition: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Delete"],
      default: "Inactive",
    },
  },
  {
    timestamps: true,
  }
);
professionSchema.plugin(mongoosePaginate);
const ProfessionsModel = mongoose.model(
  "Professions",
  professionSchema,
  "Professions"
);
module.exports = ProfessionsModel;
fs.readFile("profession.json", (err, data) => {
  if (err) throw err;

  const contents = JSON.parse(data);
  const contentData = contents.content;

  contentData.forEach((item) => {
    ProfessionsModel.findOne({
      name: item.name,
    })
      .then((contentResult) => {
        if (!contentResult) {
          const content = new ProfessionsModel(item);
          return content.save();
        }
      })
      .then((result) => {
        if (result) {
          console.log("Institutions Data added");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        console.log("Internal server error");
      });
  });
});
