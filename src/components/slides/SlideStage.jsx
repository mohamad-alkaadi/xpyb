import { useEffect, useRef, useState } from 'react';
import {
  computeStageTransform,
  STAGE_HEIGHT,
  STAGE_WIDTH,
} from '../../lib/layouts/viewportScale.js';

const SlideStage = ({ label, children }) => {
  const [transform, setTransform] = useState(() => computeStageTransform(0, 0));
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setTransform(computeStageTransform(width, height));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { scale, offsetX, offsetY } = transform;

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-slate-900">
      <div
        aria-label={label}
        role={label ? 'region' : undefined}
        className="absolute origin-top-left overflow-hidden"
        style={{
          left: offsetX,
          top: offsetY,
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transform: `scale(${scale})`,
          '--stage-scale': scale || 1,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default SlideStage;
