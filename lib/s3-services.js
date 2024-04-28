const AWS = require("aws-sdk");
const spacesEndpoint = new AWS.Endpoint(process.env.S3_DNS);
var credentials = {
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
};
AWS.config.update({ credentials: credentials, region: process.env.S3_REGION });
var s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  params: { Bucket: 'csgpl' },
});

exports.getSyncSignedUrl = (fileName, fileType) => {
  if (fileName !== undefined && fileName !== "") {
    const url = s3.getSignedUrl("getObject", {
      Key: fileName,
      ResponseContentType: fileType,
      Expires: 604800, // 7 * 24 * 60 * 60, // Link will expire in 7 days in sec
    });
    return url;
  }
  return "";
};
