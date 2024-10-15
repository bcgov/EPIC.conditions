import { create } from "zustand";

// Define the store state and actions
interface ModalStore {
  isOpen: boolean;
  modalContent: React.ReactNode | null;
  setOpen: (modal: React.ReactNode) => Promise<void>;
  setClose: () => void;
}

// Create the Zustand store
export const useModal = create<ModalStore>((set) => ({
  isOpen: false,
  modalContent: null,

  setOpen: async (modal) => {
    if (modal) {
      set(() => ({
        modalContent: modal,
        isOpen: true,
      }));
    }
  },

  setClose: () => {
    set({
      isOpen: false,
      modalContent: null,
    });
  },
}));
