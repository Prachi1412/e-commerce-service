const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const bannerSchema = new Schema({
    adminId: {
        type: ObjectId,
        ref: "Admins",
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    bannerImgName: {
        type: String,
        required: true
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Delete'],
        default: "Inactive"
    },

}, {
    timestamps: true
});
bannerSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Banner", bannerSchema, "Banners");