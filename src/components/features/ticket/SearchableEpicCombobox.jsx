import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { Combobox } from '../../ui/combobox';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';
import { Badge } from '../../ui/badge';
import { debounce } from 'lodash';
import { API_BASE_URL } from '../../../config/api';

const SearchableEpicCombobox = ({
  value,
  onChange,
  jiraConfig,
  placeholder = "Search epics...",
  emptyText = "No epics found",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term) => {
      if (!jiraConfig.url || !jiraConfig.email || !jiraConfig.token || !jiraConfig.projectKey) {
        setSearchError('Jira configuration is incomplete');
        return;
      }

      setIsSearching(true);
      setSearchError(null);

      try {
        console.log(`🔍 Searching Epics: "${term}"`);
        
        const response = await fetch(`${API_BASE_URL}/jira/search-epics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: jiraConfig.url,
            email: jiraConfig.email,
            token: jiraConfig.token,
            projectKey: jiraConfig.projectKey,
            searchTerm: term,
            maxResults: 50 // Get more results for search
          })
        });

        const result = await response.json();
        console.log(`📋 Epic search result:`, result);

        if (result.success) {
          setSearchResults(result.epics || []);
          setHasSearched(true);
          
          if (result.fallback) {
            setSearchError('Search failed, showing recent epics instead');
          }
        } else {
          setSearchError(result.error || 'Failed to search epics');
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Epic search error:', error);
        setSearchError('Network error while searching epics');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500), // 500ms debounce
    [jiraConfig]
  );

  // Handle search input change
  const handleSearchChange = (term) => {
    setSearchTerm(term);
    if (term.trim().length >= 2) {
      debouncedSearch(term.trim());
    } else if (term.trim().length === 0) {
      // Load recent epics when search is cleared
      debouncedSearch('');
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  // Load initial recent epics on mount
  useEffect(() => {
    if (jiraConfig.url && jiraConfig.email && jiraConfig.token && jiraConfig.projectKey) {
      debouncedSearch(''); // Load recent epics
    }
  }, [jiraConfig, debouncedSearch]);

  // Format epic options for Combobox
  const epicOptions = useMemo(() => {
    return searchResults.map(epic => ({
      value: epic.key,
      label: `${epic.key} - ${epic.summary}`,
      epic: epic
    }));
  }, [searchResults]);

  // Custom search input component
  const SearchInput = () => (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Type to search epics (min 2 characters)..."
        value={searchTerm}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="pl-10 pr-10"
      />
      {isSearching && (
        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
      )}
    </div>
  );

  // Custom option renderer
  const renderOption = (option) => (
    <div className="flex flex-col gap-1 py-1">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {option.epic.key}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {option.epic.status}
        </Badge>
      </div>
      <div className="text-sm font-medium truncate">
        {option.epic.summary}
      </div>
      {option.epic.created && (
        <div className="text-xs text-gray-500">
          Created: {new Date(option.epic.created).toLocaleDateString()}
        </div>
      )}
    </div>
  );

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Search Input */}
      <SearchInput />
      
      {/* Search Error */}
      {searchError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {searchError}
          </AlertDescription>
        </Alert>
      )}

      {/* Search Results Info */}
      {hasSearched && !isSearching && (
        <div className="text-sm text-gray-600">
          {searchResults.length > 0 ? (
            <>
              Found {searchResults.length} epic{searchResults.length !== 1 ? 's' : ''}
              {searchTerm ? ` matching "${searchTerm}"` : ' (recent)'}
            </>
          ) : (
            <>No epics found{searchTerm ? ` matching "${searchTerm}"` : ''}</>
          )}
        </div>
      )}

      {/* Epic Selection Combobox */}
      <Combobox
        value={value}
        onChange={onChange}
        options={epicOptions}
        placeholder={epicOptions.length > 0 ? "Select an epic..." : placeholder}
        emptyText={hasSearched ? "No epics match your search" : emptyText}
        className="w-full"
        renderOption={renderOption}
        disabled={isSearching}
      />

      {/* Search Instructions */}
      {!hasSearched && !isSearching && (
        <div className="text-xs text-gray-500">
          💡 Type at least 2 characters to search epics, or leave empty to see recent epics
        </div>
      )}
    </div>
  );
};

export default SearchableEpicCombobox;

