export const CONDITION_KEYS = {
    REQUIRES_MANAGEMENT_PLAN: "Requires management plan",
    REQUIRES_CONSULTATION: "Requires consultation",
    SUBMITTED_TO_EAO_FOR: "Submitted to EAO for",
    PHASE_RELATED_TO_PLAN: "Phase related to plan",
    DAYS_PRIOR_TO_NEXT_PHASE: "Days prior to next phase to submit",
    PARTIES_REQUIRED: "Parties required to be consulted",
  };
  
  export const SELECT_OPTIONS = {
    [CONDITION_KEYS.REQUIRES_MANAGEMENT_PLAN]: [
      { value: "true", label: "Yes" },
      { value: "false", label: "No" },
    ],
    [CONDITION_KEYS.REQUIRES_CONSULTATION]: [
        { value: "true", label: "Yes" },
        { value: "false", label: "No" },
    ],
    [CONDITION_KEYS.SUBMITTED_TO_EAO_FOR]: [
      { value: "Approval", label: "Approval" },
      { value: "Acceptance", label: "Acceptance" },
      { value: "Satisfaction", label: "Satisfaction" },
    ],
    [CONDITION_KEYS.PHASE_RELATED_TO_PLAN]: [
      { value: "Pre-Construction", label: "Pre-Construction" },
      { value: "Construction", label: "Construction" },
      { value: "Commissioning", label: "Commissioning" },
      { value: "Operations", label: "Operations" },
      { value: "Care and Maintenance", label: "Care and Maintenance" },
      { value: "Decommissioning", label: "Decommissioning" },
      { value: "Other", label: "Other" },
    ],
    [CONDITION_KEYS.DAYS_PRIOR_TO_NEXT_PHASE]: [
      { value: "30", label: "30" },
      { value: "60", label: "60" },
      { value: "90", label: "90" },
    ],
  };
  