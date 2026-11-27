const ColorPicker = ({ label, value, onChange }) => (
  <label className="flex cursor-pointer items-center gap-1">
    <span>{label}</span>
    <input
      type="color"
      className="h-7 w-9 cursor-pointer rounded border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);

export default ColorPicker;
