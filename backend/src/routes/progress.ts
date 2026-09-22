import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { careerRoadmapProgressService } from '../modules/career-roadmap/career-roadmap-progress.service';
import * as dashboardController from '../modules/career-roadmap/career-roadmap-dashboard.controller';
import { BadRequestError } from '../utils/errors';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/progress/resource/complete
 * Mark a resource as complete
 */
router.post('/resource/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resourceId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestError('User not authenticated');
    }

    if (!resourceId) {
      throw new BadRequestError('resourceId is required');
    }

    const result = await careerRoadmapProgressService.completeResource(userId, resourceId);

    res.json({
      success: true,
      data: result,
      message: 'Resource marked as complete',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/progress/topic/:topicId
 * Get progress for a specific topic
 */
router.get('/topic/:topicId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topicId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestError('User not authenticated');
    }

    const progress = await careerRoadmapProgressService.getTopicProgress(userId, topicId);

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/progress/day/:dayId
 * Get progress for a specific day
 */
router.get('/day/:dayId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dayId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestError('User not authenticated');
    }

    const progress = await careerRoadmapProgressService.getDayProgress(userId, dayId);

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/progress/week/:weekId
 * Get progress for a specific week
 */
router.get('/week/:weekId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { weekId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestError('User not authenticated');
    }

    const progress = await careerRoadmapProgressService.getWeekProgress(userId, weekId);

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/progress/career/:careerId
 * Get overall progress for a specific career
 */
router.get('/career/:careerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { careerId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestError('User not authenticated');
    }

    const progress = await careerRoadmapProgressService.getCareerProgress(userId, careerId);

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/progress/summary
 * Get user's overall progress summary
 */
router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestError('User not authenticated');
    }

    const summary = await careerRoadmapProgressService.getUserProgressSummary(userId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/progress/dashboard
 * Get unified dashboard data (single endpoint)
 */
router.get('/dashboard', dashboardController.getDashboard);

/**
 * GET /api/progress/dashboard/roadmap/:careerId
 * Get full roadmap with progress for display
 */
router.get('/dashboard/roadmap/:careerId', dashboardController.getDashboardRoadmap);

/**
 * POST /api/progress/dashboard/regenerate-roadmap
 * Regenerate a personalized roadmap using the latest assessment outcome.
 */
router.post('/dashboard/regenerate-roadmap', dashboardController.regenerateUserRoadmap);

export default router;
