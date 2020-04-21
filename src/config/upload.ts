import multer from 'multer';
import crypto from 'crypto';
import { resolve } from 'path';

const tmpDir = resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: tmpDir,
  storage: multer.diskStorage({
    destination: tmpDir,
    filename(request, file, callback) {
      const fileHash = crypto.randomBytes(10).toString('HEX');
      const fileName = `${fileHash}-${file.originalname}`;

      return callback(null, fileName);
    },
  }),
};
