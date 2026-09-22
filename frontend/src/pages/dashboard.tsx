import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Flame, Zap, BookOpen, ArrowRight, 
  ChevronRight, Target, AlertCircle, Sparkles, TrendingUp, Brain, CheckCircle2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { careerRoadmapService } from "@/services/careerRoadmapService";
import { journeyService } from "@/services/journeyService";
import { csvCareerService } from "@/services/csvCareerService";
import { assessmentService } from "@/services/assessmentService";
import { findNextIncompleteResource } from "@/services/nextResourceService";
import { 
  DashboardHeaderSkeleton, 
  ContinueLearningSkeleton,
  StatWidgetSkeleton,
  QuickActionsSkeleton
} from "@/components/skeletons/DashboardSkeleton";
import { NoCareerSelected, NoProgressYet } from "@/components/empty-states/EmptyStates";
import { GamificationStatsGrid } from "@/components/gamification/GamificationCards";

function getFirstName(fullName?: string | null) {
  const source = fullName?.trim() || "there";
  return source.split(/\s+/)[0];
}

export default function Dashboard() {
  const { user } = useAuth();
  
  // Fetch unified dashboard data
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      try {
        return await journeyService.getDashboard();
      } catch {
        return await careerRoadmapService.getDashboard();
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  // Fetch CSV career recommendations
  const { data: csvRecommendations } = useQuery({
    queryKey: ["csv-careers", "top"],
    queryFn: () => csvCareerService.getTopRecommendation(),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  // Check if user has completed adaptive assessment
  const [latestAssessmentId, setLatestAssessmentId] = useState<string | null>(() => {
    // Try to read from localStorage
    try {
      return localStorage.getItem('pragyan_latest_assessment_id');
    } catch {
      return null;
    }
  });

  // Fetch latest assessment result if available
  const { data: assessmentResult } = useQuery({
    queryKey: ["assessment-result", latestAssessmentId],
    queryFn: () => latestAssessmentId ? assessmentService.getAdaptiveResult(latestAssessmentId) : null,
    enabled: !!latestAssessmentId,
    retry: false,
    staleTime: 1000 * 60 * 10,
  });

  // Also fetch the roadmap with progress to find next resource
  const { data: roadmapData } = useQuery({
    queryKey: ['career-roadmap-progress', dashboard?.currentCareer?.id],
    queryFn: () => {
      if (!dashboard?.currentCareer?.id) return null;
      return careerRoadmapService.getCareerWithProgress(dashboard.currentCareer.id);
    },
    enabled: Boolean(dashboard?.currentCareer?.id),
    retry: false,
    staleTime: 1000 * 60 * 2,
  });

  const firstName = useMemo(() => getFirstName(user?.fullName), [user?.fullName]);

  // Find next incomplete resource for smart continue link
  const nextResource = useMemo(() => {
    return findNextIncompleteResource(roadmapData);
  }, [roadmapData]);

  // Build continue learning href with auto-expand params
  const continueHref = useMemo(() => {
    if (!nextResource) return '/roadmap';
    const params = new URLSearchParams({
      moduleId: nextResource.moduleId,
      weekId: nextResource.weekId,
      dayId: nextResource.dayId,
      topicId: nextResource.topicId,
      resourceId: nextResource.resourceId,
    });
    return `/roadmap?${params.toString()}`;
  }, [nextResource]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
          <DashboardHeaderSkeleton />
          
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <ContinueLearningSkeleton />
            </div>
            <div className="space-y-4">
              <StatWidgetSkeleton />
              <StatWidgetSkeleton />
              <StatWidgetSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const journey = (dashboard as any)?.currentJourney ?? null;
  const currentCareerTitle = journey?.careerTitle || dashboard?.currentCareer?.title || "Career Journey";
  const hasCareer = !!(dashboard?.currentCareer || journey?.careerTitle);
  
  if (!hasCareer && !isLoading) {
    return <NoCareerSelected />;
  }

  const progress = Number(journey?.completionPercentage ?? dashboard?.overallProgress ?? 0);
  const weekProgress = dashboard?.weeklyProgress || 0;
  const todayCompleted = dashboard?.completedToday || 0;
  const todayGoal = dashboard?.todayGoal || 2;
  const xp = Number(journey?.xp ?? dashboard?.xp ?? user?.xp ?? 0);
  const streak = Number(journey?.streak ?? dashboard?.streak ?? user?.streak ?? 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              👋 Welcome back, {firstName}
            </h1>
            <p className="text-slate-600 mt-2">Let's continue your learning journey</p>
          </div>
        </div>

        {/* Main Content - Two Column */}
        <div className="grid grid-cols-3 gap-6">
          
          {/* Left Column - Continue Learning */}
          <div className="col-span-2 space-y-6">
            
            {/* Continue Learning Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Continue Learning</h2>
              
              {hasCareer ? (
                <div className="space-y-6">
                  {/* Career Path */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Current Path</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                          {currentCareerTitle}
                        </h3>
                      </div>
                      <Link href={continueHref}>
                        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
                          Resume <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Current Position */}
                  {dashboard.currentWeek && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-xs text-slate-600 font-medium uppercase tracking-wide mb-3">Where You Are</p>
                      <div className="flex items-center gap-6">
                        {dashboard.currentWeek && (
                          <div>
                            <p className="text-sm text-slate-600">Week {dashboard.currentWeek.number}</p>
                            <p className="font-semibold text-slate-900">{dashboard.currentWeek.title}</p>
                          </div>
                        )}
                        <div className="w-0.5 h-8 bg-slate-300"></div>
                        {dashboard.currentDay && (
                          <div>
                            <p className="text-sm text-slate-600">Day {dashboard.currentDay.dayNumber}</p>
                            <p className="font-semibold text-slate-900">{dashboard.currentDay.title}</p>
                          </div>
                        )}
                        {dashboard.currentTopic && (
                          <>
                            <div className="w-0.5 h-8 bg-slate-300"></div>
                            <div>
                              <p className="text-sm text-slate-600">Topic</p>
                              <p className="font-semibold text-slate-900">{dashboard.currentTopic.title}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Progress Bars */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-700">Overall Progress</p>
                        <p className="text-sm font-bold text-slate-900">{Math.round(progress)}%</p>
                      </div>
                      <Progress value={progress} className="h-3 bg-slate-200" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-700">This Week</p>
                        <p className="text-sm font-bold text-slate-900">{Math.round(weekProgress)}%</p>
                      </div>
                      <Progress value={weekProgress} className="h-3 bg-slate-200" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">No learning path started yet</p>
                  <Link href="/careers">
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
                      Explore Careers <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Today's Goal Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-500" />
                Today's Goal
              </h2>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                  <p className="text-xs text-amber-700 font-medium uppercase tracking-wide mb-2">Target</p>
                  <p className="text-3xl font-bold text-amber-900">{todayGoal}</p>
                  <p className="text-sm text-amber-700 mt-1">Resources</p>
                </div>

                <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
                  <p className="text-xs text-emerald-700 font-medium uppercase tracking-wide mb-2">Completed</p>
                  <p className="text-3xl font-bold text-emerald-900">{todayCompleted}</p>
                  <p className="text-sm text-emerald-700 mt-1">Resources</p>
                </div>

                <div className="bg-slate-100 rounded-xl p-6 border border-slate-300">
                  <p className="text-xs text-slate-700 font-medium uppercase tracking-wide mb-2">Remaining</p>
                  <p className="text-3xl font-bold text-slate-900">{Math.max(0, todayGoal - todayCompleted)}</p>
                  <p className="text-sm text-slate-700 mt-1">Resources</p>
                </div>
              </div>

              <div className="mt-6">
                <div className="relative bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (todayCompleted / todayGoal) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-600 mt-2 text-center">
                  {todayCompleted >= todayGoal ? "🎉 Great job! You've completed today's goal!" : `${Math.max(0, todayGoal - todayCompleted)} more to go!`}
                </p>
              </div>
            </div>

            {/* Assessment Status Widget */}
            {!assessmentResult ? (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 shadow-sm p-8">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Career Assessment
                </h2>
                
                <div className="bg-white rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <Target className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-slate-900 mb-1">
                        Discover Your Perfect Career Path
                      </h3>
                      <p className="text-sm text-slate-600">
                        Take our adaptive assessment to get personalized career recommendations
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Only 6-10 adaptive questions</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Real-time confidence scoring</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Trait-based career matching</span>
                    </div>
                  </div>

                  <Link href="/assessments">
                    <Button className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 text-white gap-2">
                      Start Assessment
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-sm p-8">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-green-600" />
                  Assessment Completed
                </h2>
                
                <div className="bg-white rounded-xl p-6 border border-green-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <h3 className="text-base font-bold text-slate-900">Assessment Complete!</h3>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">
                        Confidence: <span className="font-bold text-green-600">
                          {Math.round((assessmentResult.confidence || 0) * 100)}%
                        </span>
                      </p>
                      <p className="text-sm text-slate-600">
                        {assessmentResult.topMatches?.length || 0} career matches found
                      </p>
                    </div>
                  </div>

                  {assessmentResult.topMatches && assessmentResult.topMatches[0] && (
                    <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
                      <p className="text-xs text-slate-600 mb-1">Top Match:</p>
                      <p className="text-base font-bold text-slate-900 mb-2">
                        {assessmentResult.topMatches[0].career}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-green-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${Math.round(assessmentResult.topMatches[0].score)}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-green-600">
                          {Math.round(assessmentResult.topMatches[0].score)}%
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/career-discovery?tab=adaptive">
                      <Button className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white gap-2 text-sm py-2">
                        View Matches
                        <TrendingUp className="w-3 h-3" />
                      </Button>
                    </Link>
                    <Link href="/assessments">
                      <Button variant="outline" className="w-full rounded-xl gap-2 text-sm py-2">
                        Retake
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Career Recommendations Card */}
            {csvRecommendations && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-sm p-8">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Top Career Match
                </h2>
                
                <div className="bg-white rounded-xl p-6 border border-blue-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{csvRecommendations.careerTitle}</h3>
                      <p className="text-sm text-slate-600">{csvRecommendations.recommendationReason[0] || "Based on your assessment"}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-3xl font-bold text-blue-600">{Math.round(csvRecommendations.overallScore)}%</div>
                      <p className="text-xs text-slate-600">Match</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {csvRecommendations.matchedSkills.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-600 mb-2 font-medium">Your Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {csvRecommendations.matchedSkills.slice(0, 4).map((skill) => (
                            <span key={skill} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                              {skill}
                            </span>
                          ))}
                          {csvRecommendations.matchedSkills.length > 4 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                              +{csvRecommendations.matchedSkills.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {csvRecommendations.missingSkills.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-600 mb-2 font-medium">To Learn:</p>
                        <div className="flex flex-wrap gap-2">
                          {csvRecommendations.missingSkills.slice(0, 3).map((skill) => (
                            <span key={skill} className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                              {skill}
                            </span>
                          ))}
                          {csvRecommendations.missingSkills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                              +{csvRecommendations.missingSkills.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Link href="/career-discovery">
                    <Button className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2">
                      Explore All Matches
                      <TrendingUp className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Gamification Stats */}
          <div className="col-span-1">
            <GamificationStatsGrid 
              streak={streak}
              xp={xp}
              level={Math.floor(xp / 500) + 1}
              badges={[]}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
