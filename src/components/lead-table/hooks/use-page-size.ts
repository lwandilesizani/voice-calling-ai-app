import { useState } from 'react';
import { STORAGE_KEYS, DEFAULTS } from '../constants';

export function usePageSize() {
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window === 'undefined') return DEFAULTS.PAGE_SIZE;
    const savedPageSize = localStorage.getItem(STORAGE_KEYS.PAGE_SIZE);
    return savedPageSize ? parseInt(savedPageSize, 10) : DEFAULTS.PAGE_SIZE;
  });

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    localStorage.setItem(STORAGE_KEYS.PAGE_SIZE, newSize.toString());
  };

  return {
    pageSize,
    setPageSize: handlePageSizeChange
  };
}
