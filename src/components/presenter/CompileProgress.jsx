import { usePresentation } from '../../context/PresentationContext.jsx';
import { describeProgress } from '../../lib/presentation/precompile.js';

const CompileProgress = () => {
  const { progress } = usePresentation();
  const { done, total } = progress;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 bg-slate-900 text-white">
      <p role="status" className="text-4xl">
        {total > 0 ? describeProgress(progress) : 'Preparing presentation...'}
      </p>
      <progress
        aria-label="Compile progress"
        className="h-4 w-[720px] accent-sky-500"
        max={total || 1}
        value={done}
      />
      <p className="text-xl text-slate-400">Press Escape to cancel.</p>
    </div>
  );
};

export default CompileProgress;
