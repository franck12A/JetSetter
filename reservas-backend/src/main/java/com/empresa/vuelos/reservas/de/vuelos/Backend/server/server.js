// server/server.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

// Configuración básica
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Configuración de Multer (por si subís imágenes o archivos)
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// ✅ Endpoint para obtener 10 productos aleatorios
app.post('/api/products/', upload.array('images',5), async (req, res) => {
const {name, description, price } = req.boddy
  try {
    const existing = await prisma.product.findUnique({
    where: { name: name},
    });
    if (existing) {
    return res.status(400).json({ message: 'El nombre del producto ya existe'});
  }

  const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

  const product = await prisma.product.create({
    data: {
    name,
    description,
    price: parseFloat(price),
    imageUrls,
    },
    });

    res.json(product);
  }catch (error) {
   console.error(error)
   res.status(500).json({ message: 'Error al agregar producto'});
   }
});

// Ejemplo de subida de imagen (opcional)
app.post('/api/upload', upload.single('file'), (req, res) => {
  res.json({ filename: req.file.filename });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Servidor backend corriendo en http://localhost:${PORT}`);
});
