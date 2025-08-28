// src/components/SuggestionChips.tsx
export function SuggestionChips({ 
  items, 
  onSelect 
}: { 
  items: string[]; 
  onSelect: (q: string) => void;
}) {
  if (!items?.length) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {items.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)} // ✅ 즉시 실행 금지
          className="px-3 py-1 rounded-full border text-sm hover:bg-gray-50"
        >
          {s}
        </button>
      ))}
    </div>
  );
}