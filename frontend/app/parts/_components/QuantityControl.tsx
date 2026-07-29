interface Props {
  partNumber: string;
  quantity: number;
  onChange: (quantity: number) => void;
}

export default function QuantityControl({ partNumber, quantity, onChange }: Props) {
  return (
    <div className="flex h-8 items-center overflow-hidden rounded-md border border-black bg-white">
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        aria-label={`Remove one ${partNumber} from cart`}
        className="flex h-full w-8 items-center justify-center text-lg font-medium text-black hover:bg-gray-100"
      >
        −
      </button>
      <span className="min-w-8 border-x border-black px-2 text-center text-sm font-semibold text-black">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        aria-label={`Add one more ${partNumber} to cart`}
        className="flex h-full w-8 items-center justify-center text-lg font-medium text-black hover:bg-gray-100"
      >
        +
      </button>
    </div>
  );
}
