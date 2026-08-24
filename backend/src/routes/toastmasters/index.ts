// src/routes/toastmasters/index.ts — combines all Toastmasters sub-routers
import { Router } from 'express';
import meetingsRoutes from './meetings.routes';
import membersRoutes from './members.routes';
import rolesRoutes from './roles.routes';
import agendaRoutes from './agenda.routes';
import educationRoutes from './education.routes';
import evaluationsRoutes from './evaluations.routes';
import generalEvaluationRoutes from './generalEvaluation.routes';
import timerRoutes from './timer.routes';
import ahCounterRoutes from './ahcounter.routes';
import grammarianRoutes from './grammarian.routes';
import tableTopicsRoutes from './tabletopics.routes';
import reportRoutes from './report.routes';

const router = Router();

router.use(membersRoutes);
router.use(rolesRoutes);
router.use(agendaRoutes);
router.use(educationRoutes);
router.use(evaluationsRoutes);
router.use(generalEvaluationRoutes);
router.use(timerRoutes);
router.use(ahCounterRoutes);
router.use(grammarianRoutes);
router.use(tableTopicsRoutes);
router.use(reportRoutes);
router.use(meetingsRoutes); // last: owns the bare '/' and '/:id' catch-alls

export default router;
