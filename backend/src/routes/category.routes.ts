import { Router } from 'express';
import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateFields } from '../middlewares/validate.middleware';

const router = Router();

router.get('/', authenticate, getCategories);
router.get('/:id', authenticate, getCategoryById);
router.post('/', authenticate, authorize('admin'), validateFields(['name']), createCategory);
router.put('/:id', authenticate, authorize('admin'), validateFields(['name']), updateCategory);
router.delete('/:id', authenticate, authorize('admin'), deleteCategory);

export default router;
