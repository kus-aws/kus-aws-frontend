// src/components/SuggestionChips.tsx
export function SuggestionChips({
  items,
  onSelect,
}: { items: string[]; onSelect: (q: string) => void }) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {list.map((s, index) => (
        <button 
          key={`${s}-${index}`} 
          onClick={() => onSelect(s)} 
          className="px-3 py-1 rounded-full border text-sm hover:bg-gray-50"
        >
          {s}
        </button>
      ))}
    </div>
  );
}