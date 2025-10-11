import { useEffect, useCallback } from 'react';

export const useUnsavedChanges = (hasUnsavedChanges, message = 'You have unsaved changes. Are you sure you want to leave?') => {
  const handleBeforeUnload = useCallback((event) => {
    if (hasUnsavedChanges) {
      event.preventDefault();
      event.returnValue = message;
      return message;
    }
  }, [hasUnsavedChanges, message]);

  useEffect(() => {
    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [hasUnsavedChanges, handleBeforeUnload]);

  return {
    hasUnsavedChanges
  };
};
