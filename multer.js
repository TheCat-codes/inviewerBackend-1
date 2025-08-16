import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import cloudinary from './cloudinary.js';
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'docs',
            resource_type: 'raw'
        };
    }
});
export const upload = multer({ storage });
//# sourceMappingURL=multer.js.map