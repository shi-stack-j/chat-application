import React, { memo } from 'react';

/**
 * REUSABLE SEARCH BAR COMPONENT
 * 
 * Provides search filtering. Wrapped in React.memo.
 */
export const SearchBar = memo(({ 
  value = '', 
  onChange, 
  placeholder = 'Search or start new chat...', 
  onClear,
  className = '' 
}) => {
  return (
    <div className={`relative w-full ${className}`}>
      {/* Search Glass Icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg 
          className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
          />
        </svg>
      </div>

      {/* Input Field */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full pl-9 pr-8 py-2 text-sm
          bg-slate-100 dark:bg-slate-800/60
          border border-transparent focus:border-slate-200 dark:focus:border-slate-700
          text-slate-900 dark:text-slate-100
          placeholder-slate-400 dark:placeholder-slate-500
          rounded-xl focus:outline-hidden
          transition-all duration-200
        "
      />

      {/* Clear (X) Button - Only shows when there's text */}
      {value && onClear && (
        <button
          onClick={onClear}
          className="
            absolute inset-y-0 right-0 pr-3 flex items-center 
            text-slate-400 hover:text-slate-600 dark:hover:text-slate-200
            transition-colors duration-150
          "
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
});

export default SearchBar;
