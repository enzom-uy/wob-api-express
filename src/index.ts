import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { wobsRoutes } from './routes/wobs.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hola mundo.' });
});

app.use('/wobs', wobsRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
