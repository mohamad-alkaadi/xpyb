import { useTheme } from '../../context/ThemeContext.jsx';
import { THEMES } from '../../lib/theme/theme.js';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="App theme"
      className="flex overflow-hidden rounded border border-slate-300 text-sm dark:border-slate-600"
    >
      {THEMES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          aria-pressed={id === theme}
          className="cursor-pointer px-2 py-1 hover:bg-slate-100 aria-pressed:bg-sky-600 aria-pressed:text-white dark:hover:bg-slate-700 dark:aria-pressed:bg-sky-600"
          onClick={() => setTheme(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
