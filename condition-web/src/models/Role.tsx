export type EpicConditionRole =
  | "view_conditions";

export const EPIC_CONDITION_ROLE = Object.freeze<
  Record<EpicConditionRole, EpicConditionRole>
>({
  view_conditions: "view_conditions",
});
