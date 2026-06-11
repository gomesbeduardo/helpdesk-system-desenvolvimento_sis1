import { Router } from 'express';
import {
  getTickets, getTicketStats, getTicketById, createTicket, updateTicket, deleteTicket, updateTicketStatus,
} from '../controllers/ticket.controller';
import { getComments, createComment } from '../controllers/comment.controller';
import { getHistory } from '../controllers/history.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateFields } from '../middlewares/validate.middleware';

const router = Router();

router.get('/stats', authenticate, getTicketStats);
router.get('/', authenticate, getTickets);
router.post('/', authenticate, validateFields(['title', 'description', 'priority', 'category_id']), createTicket);
router.get('/:id', authenticate, getTicketById);
router.put('/:id', authenticate, updateTicket);
router.delete('/:id', authenticate, deleteTicket);

router.patch('/:id/status', authenticate, authorize('technician', 'admin'), validateFields(['status']), updateTicketStatus);

router.get('/:id/comments', authenticate, getComments);
router.post('/:id/comments', authenticate, validateFields(['message']), createComment);

router.get('/:id/history', authenticate, getHistory);

export default router;
