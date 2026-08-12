import { memo } from 'react';

export const SearchBar = memo(({
  value = '',
  onChange,
  placeholder = 'Search or start new chat...',
  onClear,
  className = ''
}) => {
  return (
    <div className={`relative w-full ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          className="h-4 w-4 text-app-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search conversations"
        className="
          w-full pl-9 pr-8 py-2.5 text-sm
          bg-app-bg border border-transparent
          hover:border-app-border
          focus:border-app-primary focus:ring-2 focus:ring-app-primary/20
          text-app-text placeholder:text-app-muted
          rounded-xl outline-none
          transition-colors duration-150
        "
      />

      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="
            absolute inset-y-0 right-0 pr-3 flex items-center
            text-app-muted hover:text-app-text cursor-pointer
            transition-colors duration-150
          "
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
});

export default SearchBar;
