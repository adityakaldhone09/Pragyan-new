import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { BookOpen, AlertCircle, Zap, Target, Loader2 } from 'lucide-react';

export function NoCareerSelected() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="bg-slate-100 rounded-full p-4 mb-4">
        <Target className="w-8 h-8 text-slate-600" />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-2">No Career Path Yet</h3>
      <p className="text-slate-600 text-center max-w-md mb-6">
        Take your assessment to unlock your personalized learning journey.
      </p>
      <Link href="/assessments">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
          Start Assessment
        </Button>
      </Link>
    </div>
  );
}

export function NoRoadmapContent({
  careerGoal = 'your career',
}: {
  careerGoal?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="bg-amber-100 rounded-full p-4 mb-4">
        <BookOpen className="w-8 h-8 text-amber-600" />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-2">Roadmap is being generated</h3>
      <p className="text-slate-600 text-center max-w-md mb-6">
        Your personalized roadmap for {careerGoal} is being prepared from your latest assessment results.
      </p>
      <p className="text-sm text-slate-500 text-center max-w-md mb-6">
        Please try again in a moment or complete the assessment if you have not done so yet.
      </p>
      <Link href="/assessments">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
          Start Assessment
        </Button>
      </Link>
    </div>
  );
}

export function NoResourcesFound() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-blue-100 rounded-full p-3 mb-3">
        <BookOpen className="w-6 h-6 text-blue-600" />
      </div>
      <h4 className="text-lg font-semibold text-slate-900 mb-1">No Resources Added</h4>
      <p className="text-sm text-slate-600 text-center max-w-sm">
        Content is being prepared for this topic.
      </p>
    </div>
  );
}

export function NoProgressYet() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
      <div className="bg-blue-100 rounded-full p-4 mb-4">
        <Zap className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">No Progress Yet</h3>
      <p className="text-slate-600 text-center max-w-md mb-6">
        Start learning to see your progress and earn XP.
      </p>
      <Link href="/roadmap">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
          Begin Learning
        </Button>
      </Link>
    </div>
  );
}

export function ErrorState({ message = "Something went wrong" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-red-100 rounded-full p-4 mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Oops!</h3>
      <p className="text-slate-600 text-center max-w-md mb-6">
        {message}
      </p>
      <Button 
        onClick={() => window.location.reload()}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
      >
        Try Again
      </Button>
    </div>
  );
}

export function AllResourcesCompleted() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
      <div className="text-5xl mb-4">🎉</div>
      <h3 className="text-xl font-bold text-emerald-900 mb-2">All Set!</h3>
      <p className="text-emerald-700 text-center max-w-md mb-6">
        You've completed all resources in this topic. Great work!
      </p>
    </div>
  );
}
