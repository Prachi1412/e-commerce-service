// var pdf = require("pdf-creator-node");
var pdf = require("html-pdf");
var fs = require("fs");
var ejs = require("ejs");
const Helper = require("../config/helper");
module.exports = {
  invoiceGenerator: async (template, data = null) => {
    console.log(data,'dattttttttttttttttttt')
    return new Promise(async (resolve, reject) => {
      try {
        ejs.renderFile(template, data, async (errorRes, resultHTML) => {
          if (errorRes) {
            console.log(errorRes)
            reject("Something went wrong!A");
          } else {
            let filePath = "public/templates/" + data.invoiceNumber + ".pdf";
            await pdf
              .create(resultHTML, {
                format: "A4",
                // orientation: "portrait",
                // border: "10mm",
                // margin: "5mm",
                childProcessOptions: {
                  env: {
                    OPENSSL_CONF: "/dev/null",
                  },
                },
              })
              .toStream(async (err, stream) => {
                if (err) {
                  reject("Something went wrong!B");
                } else {
                  stream.pipe(fs.createWriteStream(filePath));
                  console.log(
                    data.invoiceNumber,
                    "data.invoiceNumber"
                  );
                  const params = {
                    Key: data.invoiceNumber + ".pdf",
                    Body: stream,
                    Bucket: process.env.S3_SPACE_BUCKET + "invoice",
                    ContentType: "application/pdf",
                  };
                  let rst = await Helper.invoiceUpload(params);
                  await fs.unlink(filePath, async (err) => {
                    if (err) {
                      reject("Something went wrongC!");
                    } else {
                      console.log(rst, "rrrrrrrrrrr");
                      resolve(rst);
                    }
                  });
                }
              });
          }
        });
      } catch (error) {
        reject("Something went wrongD!");
      }
    });
  },
};
