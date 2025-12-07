const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class LocalUploadService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads');
  }

  // Upload d'avatar utilisateur
  async uploadAvatar(file) {
    try {
      const filename = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
      const filepath = path.join(this.uploadsDir, 'avatars', filename);
      
      // Créer le dossier s'il n'existe pas
      if (!fs.existsSync(path.dirname(filepath))) {
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
      }

      // Écrire le fichier
      fs.writeFileSync(filepath, file.buffer);

      // Retourner le chemin relatif
      const relativePath = `/uploads/avatars/${filename}`;
      return {
        url: relativePath,
        filename,
        size: file.size,
        mimetype: file.mimetype
      };
    } catch (error) {
      throw new Error(`Avatar upload failed: ${error.message}`);
    }
  }

  // Upload d'images multiples pour produits
  async uploadProductImages(files) {
    try {
      const uploadPromises = files.map(file => 
        this.uploadSingleImage(file, 'products')
      );
      
      const results = await Promise.all(uploadPromises);
      return results.map(result => ({
        url: result.url,
        filename: result.filename,
        size: result.size
      }));
    } catch (error) {
      throw new Error(`Images upload failed: ${error.message}`);
    }
  }

  // Upload d'une image unique
  async uploadSingleImage(file, folder) {
    try {
      const filename = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
      const filepath = path.join(this.uploadsDir, folder, filename);
      
      // Créer le dossier s'il n'existe pas
      if (!fs.existsSync(path.dirname(filepath))) {
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
      }

      // Écrire le fichier
      fs.writeFileSync(filepath, file.buffer);

      const relativePath = `/uploads/${folder}/${filename}`;
      return {
        url: relativePath,
        filename,
        size: file.size
      };
    } catch (error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  // Upload de vidéo
  async uploadProductVideo(file) {
    try {
      const filename = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
      const filepath = path.join(this.uploadsDir, 'videos', filename);
      
      // Créer le dossier s'il n'existe pas
      if (!fs.existsSync(path.dirname(filepath))) {
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
      }

      // Écrire le fichier
      fs.writeFileSync(filepath, file.buffer);

      const relativePath = `/uploads/videos/${filename}`;
      return {
        url: relativePath,
        filename,
        size: file.size,
        duration: null,
        thumbnail: relativePath
      };
    } catch (error) {
      throw new Error(`Video upload failed: ${error.message}`);
    }
  }

  // Upload mixte (images + vidéo)
  async uploadProductMedia(files) {
    try {
      const results = {};

      if (files.images) {
        results.images = await Promise.all(
          files.images.map(file => this.uploadSingleImage(file, 'products'))
        );
      }

      if (files.video) {
        results.video = await this.uploadProductVideo(files.video[0]);
      }

      return results;
    } catch (error) {
      throw new Error(`Media upload failed: ${error.message}`);
    }
  }

  // Supprimer une image
  async deleteImage(filePath) {
    try {
      const fullPath = path.join(this.uploadsDir, filePath.replace('/uploads/', ''));
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return { success: true };
      }
      
      return { success: false, message: 'File not found' };
    } catch (error) {
      throw new Error(`Image deletion failed: ${error.message}`);
    }
  }

  // Supprimer plusieurs images
  async deleteImages(filePaths) {
    try {
      const deletePromises = filePaths.map(filePath => 
        this.deleteImage(filePath)
      );
      return await Promise.all(deletePromises);
    } catch (error) {
      throw new Error(`Images deletion failed: ${error.message}`);
    }
  }
}

module.exports = new LocalUploadService();
