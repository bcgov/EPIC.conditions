import { create } from "zustand";

type Filters = {
  status: string;
  search_text: string;
  source_document: string;
  amendment_names: string;
  year_issued: number;
};

type FilterState = {
  filters: Filters;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
};

export const initialFilters: Filters = {
  status: "",
  search_text: "",
  source_document: "",
  amendment_names: "",
  year_issued: 0,
};

export const useConditionFilters = create<FilterState>((set) => ({
  filters: { ...initialFilters },
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  resetFilters: () =>
    set(() => ({
      filters: {
        status: "",
        search_text: "",
        source_document: "",
        amendment_names: "",
        year_issued: 0,
      },
    })),
}));
