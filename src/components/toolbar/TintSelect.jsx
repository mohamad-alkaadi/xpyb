const TintSelect = ({ value, onChange }) => (
  <label className="flex items-center gap-1">
    <span>Tint</span>
    <select
      className="cursor-pointer rounded border border-slate-300 bg-white px-1 py-1"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="dark">Dark</option>
      <option value="light">Light</option>
    </select>
  </label>
);

export default TintSelect;
