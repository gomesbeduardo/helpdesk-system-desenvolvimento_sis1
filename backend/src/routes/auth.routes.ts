import { Router } from 'express';
import { login } from '../controllers/auth.controller';
import { validateFields } from '../middlewares/validate.middleware';

const router = Router();

router.post('/login', validateFields(['email', 'password']), login);

export default router;
