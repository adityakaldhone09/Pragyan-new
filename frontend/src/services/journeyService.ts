import { api } from '@/services/apiClient';

export interface JourneyDashboardResponse {
  currentJourney?: {
    careerTitle?: string;
    roadmapTitle?: string;
    completionPercentage?: number;
    currentDay?: number;
    xp?: number;
    streak?: number;
    weakSkills?: string[];
    completedSkills?: string[];
    nextAction?: string;
    skillProgress?: Array<{
      skill: string;
      mastery: number;
      completed: boolean;
      weak: boolean;
    }>;
    roadmapDays?: Array<{
      dayNumber: number;
      title?: string;
      focus?: string;
      topics?: string[];
      tasks?: Array<{
        id?: string;
        title: string;
        type?: string;
        completed?: boolean;
        estimatedMinutes?: number;
      }>;
      resources?: Array<{
        title?: string;
        provider?: string;
        type?: string;
        url?: string;
      }>;
      completed?: boolean;
    }>;
  };
  xp?: number;
  streak?: number;
  nextAction?: string;
  weakSkills?: string[];
  eligibleJobs?: Array<unknown>;
  placementReadiness?: unknown;
  aiInsights?: string[];
}

export const journeyService = {
  getDashboard() {
    return api.get<JourneyDashboardResponse>('/journey/dashboard');
  },
  getJourney(careerSlug?: string) {
    const path = careerSlug ? `/journey/${encodeURIComponent(careerSlug)}` : '/journey/career-journey';
    return api.get<any>(path);
  },
  regenerateRoadmap() {
    return api.post<{ id: string; title: string; career: string; regeneratedAt: string }>(
      '/progress/dashboard/regenerate-roadmap'
    );
  },
};
