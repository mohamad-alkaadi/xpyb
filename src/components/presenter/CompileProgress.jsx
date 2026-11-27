import { usePresentation } from '../../context/PresentationContext.jsx';
import { describeProgress } from '../../lib/presentation/precompile.js';

const CompileProgress = () => {
  const { progress } = usePresentation();
  const { done, total } = progress;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-white text-[#0f172a]">
      <div className="flex flex-col items-center gap-8 rounded-2xl border border-slate-200 px-20 py-14">
        <p role="status" className="text-4xl font-semibold tabular-nums">
          {total > 0 ? describeProgress(progress) : 'Preparing presentation...'}
        </p>
        <progress
          aria-label="Compile progress"
          className="h-1.5 w-[720px] appearance-none overflow-hidden rounded-full border-0 bg-slate-200 [&::-moz-progress-bar]:bg-[#0f172a] [&::-webkit-progress-bar]:bg-slate-200 [&::-webkit-progress-value]:bg-[#0f172a]"
          max={total || 1}
          value={done}
        />
        <p className="text-xl text-slate-500">Press Escape to cancel.</p>
      </div>
    </div>
  );
};

export default CompileProgress;
