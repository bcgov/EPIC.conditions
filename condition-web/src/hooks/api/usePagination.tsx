import { useState } from "react";

export const usePagination = (items: any[], itemsPerPage: number) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, items.length);

  const currentPageItems = {
    items: items.slice(startIndex, endIndex),
    startIndex,
    endIndex,
  };

  return { currentPageItems, totalPages, currentPage, setPage: setCurrentPage };
};
