import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';
import { careerRoadmapProgressService } from './career-roadmap-progress.service';
import { BadRequestError } from '@/utils/errors';
import { recommendationEngineService } from '@/services/recommendation-engine';
import { roadmapGenerationService } from '@/services/roadmap-generation';

/**
 * GET /api/dashboard
 * Get unified dashboard data for authenticated user
 * Returns all data needed by dashboard in a single request
 */
export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestError('User not authenticated');
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        xp: true,
      },
    });

    if (!user) {
      throw new BadRequestError('User not found');
    }

    // Prefer the user's assessment-derived career and roadmap when available.
    let currentCareer = null;

    const [topCareer, latestUserRoadmap] = await Promise.all([
      recommendationEngineService.getTopCareer(userId).catch(() => null),
      prisma.userRoadmap.findFirst({
        where: { userId },
        include: { roadmap: true },
        orderBy: { updatedAt: 'desc' },
      }).catch(() => null),
    ]);

    if (latestUserRoadmap?.roadmap) {
      currentCareer = {
        id: latestUserRoadmap.roadmap.id,
        title: latestUserRoadmap.roadmap.title,
        description: latestUserRoadmap.roadmap.description || 'Personalized roadmap based on your assessment.',
        modules: [],
      };
    }

    if (!currentCareer && topCareer?.career) {
      const generated = await roadmapGenerationService
        .generatePersonalizedRoadmap(userId, topCareer.career, topCareer.match >= 80 ? 'Intermediate' : 'Beginner')
        .catch(() => null);

      if (generated) {
        currentCareer = {
          id: generated.id,
          title: generated.title,
          description: generated.description || 'Personalized roadmap based on your assessment.',
          modules: [],
        };
      }
    }

    if (!currentCareer) {
      const publishedCareers = await prisma.careerRoadmap.findMany({
        where: { status: 'published' },
        select: { id: true, title: true, description: true, modules: { select: { id: true } } },
        take: 1,
      });

      if (publishedCareers.length > 0) {
        currentCareer = publishedCareers[0];
      }
    }

    // Initialize dashboard response
    let dashboard: any = {
      user: {
        name: user.fullName,
        email: user.email,
        xp: user.xp,
      },
      currentCareer: currentCareer ? {
        id: currentCareer.id,
        title: currentCareer.title,
        description: currentCareer.description,
      } : null,
      currentWeek: null,
      currentDay: null,
      currentTopic: null,
      overallProgress: 0,
      weeklyProgress: 0,
      resourcesCompleted: 0,
      topicsCompleted: 0,
      streak: 0,
    };

    // Get progress summary
    const summary = await careerRoadmapProgressService.getUserProgressSummary(userId);
    dashboard.resourcesCompleted = summary.completedResources;
    dashboard.streak = summary.streak;
    dashboard.overallProgress = summary.resourcePercent;

    // If user has a current career, get detailed progress
    if (currentCareer) {
      const careerProgress = await careerRoadmapProgressService.getCareerProgress(
        userId,
        currentCareer.id
      );
      dashboard.overallProgress = careerProgress.percent;

      // Get user's completed resources in this career to determine current location
      const userProgress = await prisma.userResourceProgress.findMany({
        where: { userId, completed: true },
        orderBy: { completedAt: 'desc' },
        take: 1,
        include: {
          resource: {
            include: {
              topic: {
                include: {
                  day: {
                    include: {
                      week: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (userProgress.length > 0) {
        const lastResource = userProgress[0].resource;
        const topic = lastResource.topic;
        const day = topic.day;
        const week = day.week;

        dashboard.currentTopic = {
          id: topic.id,
          title: topic.title,
        };

        dashboard.currentDay = {
          id: day.id,
          title: day.title,
          weekNumber: week.order,
          dayNumber: day.order,
        };

        dashboard.currentWeek = {
          id: week.id,
          title: week.title,
          number: week.order,
        };

        // Get week progress
        const weekProgress = await careerRoadmapProgressService.getWeekProgress(userId, week.id);
        dashboard.weeklyProgress = weekProgress.percent;
      }

      // Count completed topics in current career
      const careerWithStructure = await prisma.careerRoadmap.findUnique({
        where: { id: currentCareer.id },
        include: {
          modules: {
            include: {
              weeks: {
                include: {
                  days: {
                    include: {
                      topics: { select: { id: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (careerWithStructure) {
        let totalTopicsInCareer = 0;
        let completedTopicsInCareer = 0;

        for (const module of careerWithStructure.modules) {
          for (const week of module.weeks) {
            for (const day of week.days) {
              for (const topic of day.topics) {
                totalTopicsInCareer += 1;
                const topicProgress = await careerRoadmapProgressService.getTopicProgress(
                  userId,
                  topic.id
                );
                if (topicProgress.isComplete) {
                  completedTopicsInCareer += 1;
                }
              }
            }
          }
        }

        dashboard.topicsCompleted = completedTopicsInCareer;
        dashboard.totalTopics = totalTopicsInCareer;
      }
    }

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/roadmap/:careerId
 * Get full roadmap with progress for dashboard display
 */
export async function getDashboardRoadmap(req: Request, res: Response, next: NextFunction) {
  try {
    const { careerId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestError('User not authenticated');
    }

    const roadmapWithProgress = await careerRoadmapProgressService.getCareerRoadmapWithProgress(
      userId,
      careerId
    );

    res.json({
      success: true,
      data: roadmapWithProgress,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/progress/dashboard/regenerate-roadmap
 * Regenerate a personalized roadmap using the latest assessment recommendation.
 */
export async function regenerateUserRoadmap(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestError('User not authenticated');
    }

    const topCareer = await recommendationEngineService.getTopCareer(userId);
    if (!topCareer?.career) {
      throw new BadRequestError('Complete an assessment to generate a roadmap for your profile.');
    }

    const roadmap = await roadmapGenerationService.generatePersonalizedRoadmap(
      userId,
      topCareer.career,
      topCareer.match >= 80 ? 'Intermediate' : 'Beginner'
    );

    res.json({
      success: true,
      data: {
        id: roadmap.id,
        title: roadmap.title,
        career: topCareer.career,
        regeneratedAt: new Date().toISOString(),
      },
      message: 'Roadmap regenerated successfully.',
    });
  } catch (error) {
    next(error);
  }
}
