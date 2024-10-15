import { create } from "zustand";
import React from "react";

// Define the store state and actions
interface DrawerStore {
  isOpen: boolean;
  drawerContent: React.ReactNode | null;
  direction: "left" | "right" | "top" | "bottom";
  setOpen: (
    drawer: React.ReactNode,
    direction: "left" | "right" | "top" | "bottom",
  ) => Promise<void>;
  setClose: () => void;
}

// Create the Zustand store
export const useDrawer = create<DrawerStore>((set) => ({
  isOpen: false,
  drawerContent: null,
  direction: "left",

  setOpen: async (drawer, direction) => {
    if (drawer) {
      set(() => ({
        drawerContent: drawer,
        isOpen: true,
        direction: direction,
      }));
    }
  },

  setClose: () => {
    set({
      isOpen: false,
      drawerContent: null,
      direction: "left",
    });
  },
}));

// Export a function called openDrawer
export const openDrawer = async (
  drawer: React.ReactNode,
  direction: "left" | "right" | "top" | "bottom",
) => {
  const { setOpen } = useDrawer.getState();
  await setOpen(drawer, direction);
};
