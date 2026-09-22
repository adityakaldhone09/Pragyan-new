import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { journeyService } from '@/services/journeyService';
import { NoRoadmapContent } from '@/components/empty-states/EmptyStates';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle2, Circle, Loader2, Sparkles, Target } from 'lucide-react';

export default function Roadmap() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['journey-dashboard'],
    queryFn: journeyService.getDashboard,
    retry: false,
    staleTime: 60_000,
  });

  const regenerateMutation = useMutation({
    mutationFn: () => journeyService.regenerateRoadmap(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const journey = data?.currentJourney ?? null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="mb-2 h-4 w-36 animate-pulse rounded bg-slate-200" />
              <div className="h-10 w-72 animate-pulse rounded bg-slate-200" />
            </div>
            <div className="h-10 w-28 animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !journey || !journey.roadmapDays?.length) {
    return <NoRoadmapContent careerGoal={user?.careerTrack || user?.careerGoal || 'your career'} />;
  }

  const roadmapDays = journey.roadmapDays ?? [];
  const activeDay = roadmapDays.find((day) => day.dayNumber === journey.currentDay) ?? roadmapDays[0];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Your Career Roadmap</p>
              <h1 className="text-3xl font-black text-slate-900 md:text-4xl">{journey.roadmapTitle || journey.careerTitle}</h1>
              <p className="mt-2 text-slate-600">
                Target role: <span className="font-semibold text-slate-900">{journey.careerTitle}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                {journey.completionPercentage ?? 0}% complete
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  if (window.confirm('This will refresh your personalized roadmap from your latest assessment and keep any completed work intact.')) {
                    regenerateMutation.mutate();
                  }
                }}
                disabled={regenerateMutation.isPending}
              >
                {regenerateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Regenerate Roadmap
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Overall Progress</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{journey.completionPercentage ?? 0}%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Current Day</p>
            <p className="mt-3 text-3xl font-black text-slate-900">Day {journey.currentDay ?? activeDay?.dayNumber ?? 1}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Skills completed</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{journey.completedSkills?.length ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">XP</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{journey.xp ?? 0}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-800">
              <Target className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold">Milestones</h2>
            </div>
            <div className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">
              {journey.nextAction || 'Continue learning'}
            </div>
          </div>

          <div className="space-y-4">
            {roadmapDays.map((day) => {
              const isCompleted = Number(day.dayNumber) < Number(journey.currentDay ?? 1);
              const isCurrent = Number(day.dayNumber) === Number(journey.currentDay ?? 1);
              const isUpcoming = !isCompleted && !isCurrent;

              return (
                <div
                  key={`${day.dayNumber}-${day.title || day.focus}`}
                  className={`rounded-2xl border p-5 ${isCompleted ? 'border-emerald-200 bg-emerald-50' : isCurrent ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-blue-500' : 'bg-slate-300'}`}>
                        {isCompleted ? <CheckCircle2 className="h-4 w-4 text-white" /> : isCurrent ? <Sparkles className="h-4 w-4 text-white" /> : <Circle className="h-4 w-4 text-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Day {day.dayNumber}</p>
                        <h3 className="text-xl font-bold text-slate-900">{day.title || day.focus || 'Learning Sprint'}</h3>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-slate-700">
                      {isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Upcoming'}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                    <div>
                      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Focus</p>
                      <p className="text-slate-700">{day.focus || 'Core skill development'}</p>

                      {day.tasks && day.tasks.length > 0 && (
                        <div className="mt-4">
                          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Tasks</p>
                          <ul className="space-y-2">
                            {day.tasks.slice(0, 4).map((task) => (
                              <li key={task.id || `${day.dayNumber}-${task.title}`} className="flex items-start gap-2 text-slate-700">
                                <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                                <span>{task.title}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {(day.topics || []).slice(0, 4).map((topic) => (
                          <span key={`${day.dayNumber}-${topic}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {topic}
                          </span>
                        ))}
                      </div>
                      {day.resources && day.resources.length > 0 && (
                        <div className="mt-4">
                          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Resources</p>
                          <div className="space-y-2">
                            {day.resources.slice(0, 2).map((resource, index) => (
                              <a
                                key={`${day.dayNumber}-${resource.title || 'resource'}-${index}`}
                                href={resource.url || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="block rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
                              >
                                {resource.title || 'Learning resource'}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

