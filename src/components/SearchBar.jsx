import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <div className="relative bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl px-3.5 py-2.5 shadow-sm flex items-center gap-2 w-full md:w-80">
      <Search className="w-4 h-4 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none w-full font-semibold"
      />
    </div>
  );
};

export default SearchBar;
