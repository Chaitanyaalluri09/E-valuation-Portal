const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

// Create S3 client with proper configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  endpoint: `https://s3.${process.env.AWS_REGION}.amazonaws.com`,
});

const uploadToS3 = async (file, folder) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${folder}/${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    const fileUrl = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
    return fileUrl;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw error;
  }
};

const deleteFromS3 = async (fileUrl) => {
  try {
    const key = fileUrl.split('.amazonaws.com/')[1];
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    };
    await s3Client.send(new DeleteObjectCommand(params));
  } catch (error) {
    console.error('S3 delete error:', error);
    throw error;
  }
};

const getSignedUrlForKey = async (key) => {
  try {
    // Extract key from full URL if a full URL is provided
    const actualKey = key.includes('amazonaws.com/') ? 
      key.split('amazonaws.com/')[1] : key;

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: actualKey,
    });

    // Generate signed URL that expires in 1 hour
    const signedUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600 
    });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
};

// Export all functions
module.exports = {
  uploadToS3,
  deleteFromS3,
  getSignedUrl: getSignedUrlForKey
}; 