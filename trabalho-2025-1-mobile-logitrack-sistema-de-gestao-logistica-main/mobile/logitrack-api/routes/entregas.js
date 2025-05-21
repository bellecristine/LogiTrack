const express = require('express');
const multer = require('multer');
const path = require('path');
const { finalizarEntrega } = require('../controllers/entregaController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

router.post('/:id/finalizar', upload.single('foto'), finalizarEntrega);

module.exports = router;
