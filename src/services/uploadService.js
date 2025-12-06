const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

class UploadService {
  // Upload d'images multiples pour produits
  async uploadProductImages(files) {
    try {
      const uploadPromises = files.map(file => 
        this.uploadSingleImage(file, 'products')
      );
      
      const results = await Promise.all(uploadPromises);
      return results.map(result => ({
        url: result.secure_url,
        publicId: result.public_id,
        alt: ''
      }));
    } catch (error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  // Upload d'avatar utilisateur
  async uploadAvatar(file) {
    try {
      const result = await this.uploadSingleImage(file, 'avatars', {
        width: 300,
        height: 300,
        crop: 'fill',
        gravity: 'face'
      });

      return {
        url: result.secure_url,
        publicId: result.public_id
      };
    } catch (error) {
      throw new Error(`Avatar upload failed: ${error.message}`);
    }
  }

  // Upload d'une image unique
  uploadSingleImage(file, folder, transformation = {}) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          transformation: transformation
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Convertir le buffer en stream
      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);
      bufferStream.pipe(stream);
    });
  }

  // Supprimer une image
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw new Error(`Image deletion failed: ${error.message}`);
    }
  }

  // Supprimer plusieurs images
  async deleteImages(publicIds) {
    try {
      const deletePromises = publicIds.map(id => 
        cloudinary.uploader.destroy(id)
      );
      return await Promise.all(deletePromises);
    } catch (error) {
      throw new Error(`Images deletion failed: ${error.message}`);
    }
  }

  // Upload de vidéo de produit
  async uploadProductVideo(file) {
    try {
      const result = await this.uploadSingleVideo(file, 'products/videos', {
        quality: 'auto:best',
        format: 'mp4'
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        duration: result.duration,
        fileSize: result.bytes,
        thumbnail: result.secure_url.replace('.mp4', '.jpg')
      };
    } catch (error) {
      throw new Error(`Video upload failed: ${error.message}`);
    }
  }

  // Upload d'une vidéo unique
  uploadSingleVideo(file, folder, transformation = {}) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'video',
          transformation: transformation
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Convertir le buffer en stream
      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);
      bufferStream.pipe(stream);
    });
  }

  // Supprimer une vidéo
  async deleteVideo(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'video'
      });
      return result;
    } catch (error) {
      throw new Error(`Video deletion failed: ${error.message}`);
    }
  }

  // Upload combiné images + vidéo
  async uploadProductMedia(files) {
    try {
      const results = { images: [], video: null };

      // Upload des images si présentes
      if (files.images && files.images.length > 0) {
        results.images = await this.uploadProductImages(files.images);
      }

      // Upload de la vidéo si présente
      if (files.video && files.video.length > 0) {
        results.video = await this.uploadProductVideo(files.video[0]);
      }

      return results;
    } catch (error) {
      throw new Error(`Media upload failed: ${error.message}`);
    }
  }
}

module.exports = new UploadService();