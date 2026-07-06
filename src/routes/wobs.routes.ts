import { Router } from 'express';
import { recent, search, random } from '../controllers/wobs.controller';

export const wobsRoutes = Router();

wobsRoutes.get('/search', search);
wobsRoutes.get('/random', random);
wobsRoutes.get('/recent', recent);
