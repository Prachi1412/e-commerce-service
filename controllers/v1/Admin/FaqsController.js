const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const Helper = require("../../../config/helper");
const faqsModel = require("../../../models/FaqsModel");
const { logger } = require("../../../logger/winston");
module.exports = {
  addUpdateFaq: async (req, res) => {
    try {
      const { question, answer, faqId, category, title } = req.body;
      var faqData = [];
      faqData.push({ question: question, answer: answer });
      const faqObj = {
        category: category,
        title: title,
      };

      if (faqId !== undefined && faqId !== "") {
        if (question != "" && answer != "") {
          var result = await faqsModel.findByIdAndUpdate(
            new ObjectId(faqId),
            { $set: faqObj, $push: { faqArr: faqData } },
            { new: true }
          );
        } else {
          var result = await faqsModel.findByIdAndUpdate(
            new ObjectId(faqId),
            { $set: faqObj},
            { new: true }
          );
        }

        if (result) {
          return Helper.response(
            res,
            CODES.STATUS_CODES.OK,
            MSG.faqs.update[LOCALE || "en"]
          );
        }
      } else {
        faqObj.faqArr = faqData;
        const faqs = new faqsModel(faqObj);
        const savedFaq = await faqs.save();

        if (savedFaq) {
          return Helper.response(
            res,
            CODES.STATUS_CODES.OK,
            MSG.faqs.add[LOCALE || "en"]
          );
        } else {
          return Helper.response(
            res,
            CODES.STATUS_CODES.Internal_Server_Error,
            MSG.api.fail[LOCALE]
          );
        }
      }
    } catch (error) {
      logger.error(error);
      console.log(error);
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.api.fail[LOCALE]
      );
    }
  },
  getAllFaq: (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 25;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const query = { status: { $ne: "Delete" } };
    if (req.query.search) {
      let searchObject = {
        $or: [{ question: { $regex: req.query.search, $options: "i" } }],
      };
      Object.assign(query, searchObject);
    }

    const col = {
      _id: 1,
      faqId: "$_id",
      faqArr: 1,
      orderPosition: 1,
      status: 1,
      title: 1,
    }; //,'updatedDate': -1
    faqsModel
      .paginate(query, {
        page: page,
        sort: { orderPosition: 1 },
        limit: limit,
        select: col,
      })
      .then((result) => {
        let faqList = result.docs;
        let totalResult = result.total;

        if (faqList.length > 0) {
          let resData = {
            faqList: faqList,
            totalResult: totalResult,
            limit: limit,
          };
          return Helper.response(
            res,
            CODES.STATUS_CODES.OK,
            MSG.faqs.fetch[LOCALE || "en"],
            resData
          );
        } else {
          return Helper.response(res, 404, MSG.faqs.notFound[LOCALE || "en"], {
            faqList: [],
          });
        }
      })
      .catch((err) => {
        Helper.response(
          res,
          CODES.STATUS_CODES.Internal_Server_Error,
          MSG.api.fail[LOCALE || "en"]
        );
      });
  },
  deleteFaqs: async (req, res) => {
    try {
      const faqId = req.params.id;
      const faqsData = await faqsModel.findById({
        _id: new mongoose.Types.ObjectId(faqId),
      });
      if (faqsData) {
        await faqsModel.findByIdAndUpdate(
          { _id: faqId },
          { $set: { status: "Delete" } },
          { new: true }
        );
        return Helper.response(
          res,
          CODES.STATUS_CODES.OK,
          MSG.faqs.delete[LOCALE || "en"]
        );
      } else {
        return Helper.response(res, 404, MSG.faqs.notFound[LOCALE || "en"]);
      }
    } catch (error) {
      console.log(error, "error");
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.api.fail[LOCALE || "en"]
      );
    }
  },
  reorderFaqs: async (req, res) => {
    try {
      const { payload } = req.body;
      for (let i = 0; i < payload.length; i += 1) {
        let item = payload[i];
        await faqsModel.findByIdAndUpdate({ _id: item }, { orderPosition: i });
      }
      const allFaqs = await faqsModel
        .find({ status: { $ne: "Delete" } })
        .sort({ orderPosition: 0 })
        .lean();
      return Helper.response(res, 200, "Re-ordered list", { allFaqs: allFaqs });
    } catch (error) {
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.api.fail[LOCALE || "en"]
      );
    }
  },
  updateQuestionAnsFAQ: async (req, res) => {
    try {
      const updatedFaq = await faqsModel.findOneAndUpdate(
        {
          "faqArr._id": new mongoose.Types.ObjectId(req.body.questionId),
          _id: req.body.faqId,
        },
        { $set: { "faqArr.$": req.body } },
        { new: true }
      );

      if (!updatedFaq) {
        return Helper.response(res, 404, "FAQ id or question Id not found");
      }

      return Helper.response(res, 200, "Updated successfully.");
    } catch (error) {
      console.error(error);
      Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.api.fail[LOCALE || "en"]
      );
    }
  },
  deleteQuestionFAQ: async (req, res) => {
    try {
      let faqId = new ObjectId(req.body.faqId);
      let questionId = req.body.questionId;

      const result = await faqsModel.findOne({ _id: faqId });
      console.log(questionId, result, "ppppppppppppp");
      if (
        !result ||
        !result.faqArr.some(
          (question) => question._id.toString() === questionId
        )
      ) {
        return Helper.response(
          res,
          404,
          "Faq not found or question id not found for deletion."
        );
      }
      // Update the query to ensure case sensitivity
      await faqsModel.findOneAndUpdate(
        {
          _id: faqId,
        },
        { $pull: { faqArr: { _id: new ObjectId(questionId) } } },
        { new: true }
      );
      // Check if any document was updated

      // Provide a more detailed success message
      return Helper.response(res, 200, "Question deleted successfully.");
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Internal server error");
    }
  },
};
