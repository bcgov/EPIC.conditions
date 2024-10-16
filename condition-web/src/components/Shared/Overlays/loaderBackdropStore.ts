import { create } from "zustand";

interface LoaderBackdropState {
  isOpen: boolean;
  setOpen: () => void;
  setClose: () => void;
  setIsOpen: (isOpen: boolean) => void;
}

export const useLoaderBackdrop = create<LoaderBackdropState>((set) => ({
  isOpen: false,
  setOpen: () => set({ isOpen: true }),
  setClose: () => set({ isOpen: false }),
  setIsOpen: (isOpen) => set({ isOpen }),
}));
