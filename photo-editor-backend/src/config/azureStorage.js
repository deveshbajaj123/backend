const { BlobServiceClient } = require('@azure/storage-blob');

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const photosContainer = process.env.PHOTOS_CONTAINER;
const thumbnailsContainer = process.env.THUMBNAILS_CONTAINER;

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

// Get container clients
const photosContainerClient = blobServiceClient.getContainerClient(photosContainer);
const thumbnailsContainerClient = blobServiceClient.getContainerClient(thumbnailsContainer);

// Upload file to Azure Blob Storage
async function uploadToBlob(containerClient, fileName, buffer, contentType) {
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  
  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: { blobContentType: contentType }
  });
  
  return blockBlobClient.url;
}

// Delete file from Azure Blob Storage
async function deleteFromBlob(containerClient, fileName) {
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  await blockBlobClient.deleteIfExists();
}

module.exports = {
  photosContainerClient,
  thumbnailsContainerClient,
  uploadToBlob,
  deleteFromBlob,
  blobServiceClient
};