export const CONDITION_KEYS = {
  REQUIRES_MANAGEMENT_PLAN: "Requires management plan(s)",
  REQUIRES_CONSULTATION: "Requires consultation",
  SUBMITTED_TO_EAO_FOR: "Submitted to EAO for",
  MILESTONES_RELATED_TO_PLAN_SUBMISSION: "Milestone(s) related to plan submission",
  MILESTONES_RELATED_TO_PLAN_IMPLEMENTATION: "Project phases(s) related to plan implementation",
  TIME_ASSOCIATED_WITH_SUBMISSION_MILESTONE: "Time associated with submission milestone",
  PARTIES_REQUIRED: "Parties required to be consulted",
  MANAGEMENT_PLAN_ACRONYM: "Management plan acronym(s)",
  MANAGEMENT_PLAN_NAME: "Management plan name(s)",
  REQUIRES_IEM_TERMS_OF_ENGAGEMENT: "Requires IEM Terms of Engagement",
  DELIVERABLE_NAME: "Deliverable name"
};

export const TIME_UNITS = [
  { value: "days", label: "Days" },
  { value: "months", label: "Month(s)" },
  { value: "years", label: "Year(s)" },
  { value: "na", label: "N/A" },
];

export const TIME_VALUES = {
  "Days": [
    { value: "30", label: "30" },
    { value: "60", label: "60" },
    { value: "90", label: "90" },
    { value: "120", label: "120" },
    { value: "Other", label: "Other" },
  ],
  "Month(s)": [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "6", label: "6" },
    { value: "7", label: "7" },
    { value: "8", label: "8" },
    { value: "9", label: "9" },
    { value: "10", label: "10" },
    { value: "11", label: "11" },
    { value: "12", label: "12" },
    { value: "Other", label: "Other" },
  ],
  "Year(s)": [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "Other", label: "Other" },
  ],
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
  [CONDITION_KEYS.REQUIRES_IEM_TERMS_OF_ENGAGEMENT]: [
    { value: "true", label: "Yes" },
    { value: "false", label: "No" },
  ],
  [CONDITION_KEYS.SUBMITTED_TO_EAO_FOR]: [
    { value: "Approval", label: "Approval" },
    { value: "Acceptance", label: "Acceptance" },
    { value: "Review", label: "Review" },
    { value: "Satisfaction", label: "Satisfaction" },
  ],
  [CONDITION_KEYS.MILESTONES_RELATED_TO_PLAN_SUBMISSION]: [
    { value: "Pre-Construction", label: "Pre-Construction" },
    { value: "Construction", label: "Construction" },
    { value: "Commissioning", label: "Commissioning" },
    { value: "Operations", label: "Operations" },
    { value: "Care and Maintenance", label: "Care and Maintenance" },
    { value: "Decommissioning", label: "Decommissioning" },
    { value: "Closure", label: "Closure" },
    { value: "N/A", label: "N/A" },
  ],
  [CONDITION_KEYS.MILESTONES_RELATED_TO_PLAN_IMPLEMENTATION]: [
    { value: "Pre-Construction", label: "Pre-Construction" },
    { value: "Construction", label: "Construction" },
    { value: "Commissioning", label: "Commissioning" },
    { value: "Operations", label: "Operations" },
    { value: "Care and Maintenance", label: "Care and Maintenance" },
    { value: "Decommissioning", label: "Decommissioning" },
    { value: "Closure", label: "Closure" },
    { value: "N/A", label: "N/A" },
  ],
};

export const managementRequiredKeys = [
  CONDITION_KEYS.SUBMITTED_TO_EAO_FOR,
  CONDITION_KEYS.MANAGEMENT_PLAN_NAME,
  CONDITION_KEYS.MILESTONES_RELATED_TO_PLAN_SUBMISSION,
  CONDITION_KEYS.MILESTONES_RELATED_TO_PLAN_IMPLEMENTATION,
  CONDITION_KEYS.TIME_ASSOCIATED_WITH_SUBMISSION_MILESTONE,
  CONDITION_KEYS.REQUIRES_CONSULTATION,
];

export const consultationRequiredKeys = [
  CONDITION_KEYS.PARTIES_REQUIRED,
];

export const iemRequiredKeys = [
  CONDITION_KEYS.SUBMITTED_TO_EAO_FOR,
  CONDITION_KEYS.MILESTONES_RELATED_TO_PLAN_SUBMISSION,
  CONDITION_KEYS.MILESTONES_RELATED_TO_PLAN_IMPLEMENTATION,
  CONDITION_KEYS.TIME_ASSOCIATED_WITH_SUBMISSION_MILESTONE,
  CONDITION_KEYS.REQUIRES_CONSULTATION,
  CONDITION_KEYS.DELIVERABLE_NAME,
];
