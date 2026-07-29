/** Labelled text input used across the parts checkout forms. */
export default function CheckoutField({
  label, value, onChange, type = 'text', required = false, inputMode, pattern, maxLength,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  pattern?: string;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-black">
        {label}
        {required && <span className="text-gray-400"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:border-black focus:outline-none"
      />
    </label>
  );
}
