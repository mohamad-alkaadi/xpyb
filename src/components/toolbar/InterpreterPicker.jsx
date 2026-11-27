import { useEffect } from 'react';
import { useKernel } from '../../context/KernelContext.jsx';
import {
  ENVIRONMENT,
  listInterpreterOptions,
  toPythonPath,
} from '../../lib/kernel/interpreterOptions.js';

const InterpreterPicker = () => {
  const { interpreters, pythonPath, isRunning, detectInterpreters, setPythonPath } = useKernel();

  useEffect(() => {
    detectInterpreters();
  }, [detectInterpreters]);

  return (
    <label className="flex min-w-0 items-center gap-1">
      Python
      <select
        className="min-w-0 max-w-48 rounded border border-slate-300 bg-white px-1 py-1 dark:border-slate-600 dark:bg-slate-800 disabled:opacity-40"
        title={pythonPath || 'The Python found in the environment that started xpyb.'}
        disabled={isRunning}
        value={pythonPath || ENVIRONMENT}
        onFocus={detectInterpreters}
        onChange={(event) => setPythonPath(toPythonPath(event.target.value))}
      >
        {listInterpreterOptions(interpreters, pythonPath).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export default InterpreterPicker;
