import { create } from "zustand";
import { ConditionModel } from "@/models/Condition";

type CreateConditionState = {
  initialCondition: ConditionModel | undefined;
  setInitialCondition: (condition: ConditionModel | undefined) => void;
  clearInitialCondition: () => void;
};

export const useCreateConditionStore = create<CreateConditionState>((set) => ({
  initialCondition: undefined,
  setInitialCondition: (condition) => set({ initialCondition: condition }),
  clearInitialCondition: () => set({ initialCondition: undefined }),
}));
