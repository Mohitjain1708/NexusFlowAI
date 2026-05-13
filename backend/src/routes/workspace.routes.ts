import { Router } from 'express';
import {
  getWorkspaces, getWorkspace, createWorkspace, updateWorkspace,
  deleteWorkspace, inviteMember, removeMember, workspaceValidation
} from '../controllers/workspace.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getWorkspaces);
router.get('/:id', getWorkspace);
router.post('/', validate(workspaceValidation), createWorkspace);
router.put('/:id', updateWorkspace);
router.delete('/:id', deleteWorkspace);
router.post('/:id/invite', inviteMember);
router.delete('/:id/members/:userId', removeMember);

export default router;
