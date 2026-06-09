import { Router } from 'express';
import { createUser, getUsers, getUserById, updateUser, deleteUser } from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateFields } from '../middlewares/validate.middleware';

const router = Router();

router.post('/', validateFields(['name', 'email', 'password']), createUser);
router.get('/', authenticate, authorize('admin'), getUsers);
router.get('/:id', authenticate, getUserById);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

export default router;
