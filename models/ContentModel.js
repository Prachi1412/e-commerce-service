const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const mongoosePaginate = require('mongoose-paginate');
const fs = require('fs');

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    default: ""
  },
  description: {
    type: String,
    default: ""
  },
  slug: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ['Inactive', 'Active', 'Delete'],
    default: 'Inactive'
  },
}, {
  timestamps: true
});

contentSchema.plugin(mongoosePaginate);
var Content = mongoose.model("Contents", contentSchema, 'Contents');
module.exports = mongoose.model("Contents", contentSchema, 'Contents');

fs.readFile("content.json", async function (err, data) {
  // Check for errors 
  if (err) throw err;
  // Converting to JSON 
  const contents = JSON.parse(data);
  var contentData = contents.content;

  for (const item of contentData) {
    try {
      const contentResult = await Content.findOne({ slug: item.slug }).exec();

      if (!contentResult) {
        const content = new Content(item);
        await content.save();
        console.log("Content Data added");
      }
    } catch (error) {
      console.log("Internal server error", error);
    }
  }
});
