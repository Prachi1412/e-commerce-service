const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const Schema = mongoose.Schema;
const fs = require("fs");

const institutionSchema = new Schema(
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
institutionSchema.plugin(mongoosePaginate);
const InstitutionModel = mongoose.model(
  "Institutions",
  institutionSchema,
  "Institutions"
);
module.exports = InstitutionModel;
fs.readFile("institution.json", (err, data) => {
  if (err) throw err;

  const contents = JSON.parse(data);
  const contentData = contents.content;

  contentData.forEach((item) => {
    InstitutionModel.findOne({
      name: item.name,
    })
      .then((contentResult) => {
        if (!contentResult) {
          const content = new InstitutionModel(item);
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
