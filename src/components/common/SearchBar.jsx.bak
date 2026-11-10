import { useState, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import './SearchBar.css';

function SearchBar({ value, onChange, onSubmit, placeholder = 'Search vehicles...' }) {
  const [term, setTerm] = useState(value || '');

  useEffect(() => {
    setTerm(value || '');
  }, [value]);

  const handleChange = (e) => {
    setTerm(e.target.value);
    if (onChange) onChange(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(term);
  };

  const handleClear = () => {
    setTerm('');
    if (onChange) onChange('');
    if (onSubmit) onSubmit('');
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <FiSearch className="search-bar-icon" />
      <input
        type="text"
        value={term}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label="Search vehicles"
      />
      {term && (
        <button
          type="button"
          className="search-bar-clear"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <FiX />
        </button>
      )}
      <button type="submit" className="search-bar-submit">Search</button>
    </form>
  );
}

export default SearchBar;
