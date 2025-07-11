import React, { useState, useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  CircularProgress,
  Button,
  Grid,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Typography,
  Stack,
  IconButton,
  Tooltip
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import { IndependentAttributeModel, ManagementPlanModel } from "@/models/ConditionAttribute";
import { BCDesignTokens } from "epic.theme";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { CONDITION_KEYS } from "../../ConditionAttribute/Constants";
import ConditionAttributeRow from "../../ConditionAttribute/Independent/ConditionAttributeRow";
import { ConditionModel } from "@/models/Condition";
import { usePatchManagementPlan } from "@/hooks/api/useManagementPlan";
import DocumentStatusChip from "../../../Projects/DocumentStatusChip";
import { useUpdateConditionAttributeDetails } from "@/hooks/api/useConditionAttribute";
import { useQueryClient } from "@tanstack/react-query";
import ErrorMessage from "../ErrorMessage";
import { ApproveButton } from "../ApproveButton";
import { validateRequiredAttributes } from "@/utils/attributeValidation";
import { useUpdateConditionDetails } from "@/hooks/api/useConditions";
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteConfirmationModal from "./DeleteConfirmationModal";

type Props = {
  attributes: ManagementPlanModel;
  title: string;
  condition: ConditionModel;
  setCondition: React.Dispatch<React.SetStateAction<ConditionModel>>;
  onDelete?: (planId: string) => void;
};

const ManagementPlanAccordion: React.FC<Props> = ({
    attributes,
    title,
    condition,
    setCondition,
    onDelete
}) => {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [planName, setPlanName] = useState(title);
  const [expanded, setExpanded] = useState(false);

  const [isAnyRowEditing, setIsAnyRowEditing] = useState(false);
  const [showEditingError, setShowEditingError] = useState(false);
  const [conditionAttributeError, setConditionAttributeError] = useState(false);
  const [isConsultationRequired, setIsConsultationRequired] = useState(false);
  const [isIEMRequired, setIsIEMRequired] = useState(false);
  const [attributeHasData, setAttributeHasData] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const isManagementRequired = true;

  const {
    mutateAsync: updatePlanName,
    isPending: isUpdating,
  } = usePatchManagementPlan(attributes.id, {
    onSuccess: () => {
      notify.success("Management plan name updated successfully");
    },
    onError: () => {
      notify.error("Failed to update management plan name");
    },
  });

  const onApproveFailure = () => {
    notify.error("Failed to approve condition attribute");
  };

  const onApproveSuccess = () => {
    notify.success("Condition attribute successfully approved");
  };

  const { data: conditionDetails, mutate: updateConditionDetails } = useUpdateConditionDetails(
    false,
    false,
    condition.condition_id,
      {
        onSuccess: onApproveSuccess,
        onError: onApproveFailure,
      }
  );

  useEffect(() => {
    if (conditionDetails) {
        setCondition((prevCondition) => ({
            ...prevCondition,
            ...conditionDetails,
            subconditions: prevCondition.subconditions
        }));
    }
  }, [conditionDetails, setCondition]);

  useEffect(() => {
    if (!attributes?.attributes) {
      setAttributeHasData(false);
      return;
    }
  
    // Check if any attribute value is non-empty
    const anyHasValue = attributes.attributes.some(attr => (attr.value ?? '').trim() !== '');
  
    setAttributeHasData(anyHasValue);

  }, [attributes]);

  const { data: conditionAttributeDetails, mutateAsync: updateAttributes } = useUpdateConditionAttributeDetails(
    condition.condition_id,
    {
        onSuccess: () => {
            notify.success("Condition attributes saved successfully");

            queryClient.invalidateQueries({
              queryKey: ["conditions", condition.condition_id],
            });
          },
          onError: () => {
            notify.error("Failed to save condition attributes");
          },
    }
  );

  const handleUpdatePlan = async (
    updates: Partial<{ name: string; is_approved: boolean }>,
    afterSuccess?: () => void
  ) => {
    try {
      await updatePlanName(updates);
  
      // Locally update the condition state
      setCondition((prev) => {
        const updatedPlans = prev.condition_attributes?.management_plans?.map((plan) =>
          plan.id === attributes.id ? { ...plan, ...updates } : plan
        ) || [];
  
        return {
          ...prev,
          condition_attributes: {
            ...prev.condition_attributes,
            independent_attributes: prev.condition_attributes?.independent_attributes ?? [],
            management_plans: updatedPlans,
          },
          subconditions: prev.subconditions,
        };
      });
  
      afterSuccess?.();
    } catch (err) {
      console.error("Error updating management plan:", err);
    }
  };  

  const handleSavePlanName = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setConditionAttributeError(false);
    handleUpdatePlan({ name: planName }, () => setEditMode(false));
  };

  useEffect(() => {
    if (conditionAttributeDetails?.management_plans) {
      setCondition((prevCondition) => ({
        ...prevCondition,
        condition_attributes: {
          independent_attributes: prevCondition.condition_attributes?.independent_attributes ?? [],
          management_plans: conditionAttributeDetails.management_plans,
        },
      }));
  
      // Flatten all attributes from all management plans
      const allPlanAttributes = conditionAttributeDetails.management_plans.flatMap(
        (plan: ManagementPlanModel) => plan.attributes || []
      );
  
      // Check if consultation is required
      const consultationRequired = allPlanAttributes.some(
        (attr: IndependentAttributeModel) =>
          attr.key === CONDITION_KEYS.REQUIRES_CONSULTATION && attr.value === "true"
      );
      setIsConsultationRequired(!!consultationRequired);
  
      // Check if IEM terms of engagement are required
      const IEMRequired = allPlanAttributes.some(
        (attr: IndependentAttributeModel) =>
          attr.key === CONDITION_KEYS.REQUIRES_IEM_TERMS_OF_ENGAGEMENT && attr.value === "true"
      );
      setIsIEMRequired(!!IEMRequired);
    }
  }, [conditionAttributeDetails]);  

  const handleApprovePlan = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isAnyRowEditing) {
        setShowEditingError(true);
        return;
    }

    setShowEditingError(false);

    const allAttributes = attributes.attributes || [];

    const isValid = validateRequiredAttributes({
        attributes: allAttributes,
        isConsultationRequired,
        isIEMRequired,
        isManagementRequired,
    });
    
    if (!isValid) {
        setConditionAttributeError(true);
        return;
    }

    setConditionAttributeError(false);

    const currentApproval = attributes.is_approved;
    handleUpdatePlan({ is_approved: !currentApproval });

    const allPlans = condition.condition_attributes?.management_plans || [];
  
    // Return early if there are no plans
    if (allPlans.length === 0) return;
  
    const allApproved = allPlans.every((plan) => plan.is_approved);
  
    // Only update if condition doesn't match the derived value
    if (condition.is_condition_attributes_approved !== allApproved) {
      updateConditionDetails({
        is_condition_attributes_approved: allApproved,
      });
    }

  };

  const handleSave = async (updatedAttribute: IndependentAttributeModel) => {
    const updatedPlans = (condition.condition_attributes?.management_plans || []).map((plan) => {
      if (plan.id === attributes.id) {
        return {
          ...plan,
          attributes: plan.attributes.map((attr) =>
            attr.id === updatedAttribute.id ? updatedAttribute : attr
          ),
        };
      }
      return plan;
    });
  
    const updatedConditionAttributes = {
      independent_attributes: condition.condition_attributes?.independent_attributes || [],
      management_plans: updatedPlans,
    };
  
    setCondition((prev) => ({
      ...prev,
      condition_attributes: updatedConditionAttributes,
    }));
  
    await updateAttributes({
      requires_management_plan: true,
      condition_attribute: updatedConditionAttributes,
    });
  };
  
  return (
    <Grid
        container
        sx={{
            border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
            borderRadius: 1,
            marginBottom: "20px",
        }}
    >
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ flexDirection: "row-reverse", justifyContent: "start", gap: 1 }}
        >
            <Box display="flex" flexDirection="row" alignItems="center" width="100%">
              <Box display="flex" flexDirection="column" width="76%">
                  <Typography>Management Plan</Typography>

                  {editMode && expanded ? (
                      <Box display="flex" flexDirection="row" alignItems="stretch" gap={1}>
                          <TextField
                              variant="outlined"
                              fullWidth
                              value={planName}
                              onChange={(e) => setPlanName(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onFocus={(e) => e.stopPropagation()}
                              sx={{
                              "& .MuiOutlinedInput-root": {
                                  borderRadius: "4px",
                                  height: "40px",
                              },
                              }}
                          />
                          {isUpdating ? (
                              <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                          ) : (
                              <Button
                                  variant="contained"
                                  size="medium"
                                  onClick={handleSavePlanName}
                                  sx={{
                                      minWidth: "100px",
                                      borderRadius: "4px",
                                      backgroundColor: BCDesignTokens.surfaceColorBackgroundLightGray,
                                      color: "black",
                                      '&:hover': {
                                          backgroundColor: BCDesignTokens.surfaceColorBorderDefault,
                                      },
                                      height: "40px",
                                      padding: "0 12px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      whiteSpace: "nowrap",
                                  }}
                              >
                                  <SaveAltIcon sx={{ color: "#255A90", mr: 1 }} fontSize="small" />
                                  <Box sx={{ color: "#255A90", fontWeight: "bold" }}>Save</Box>
                              </Button>
                          )}
                      </Box>
                  ) : (
                  <Box display="flex" alignItems="center" gap={1}>
                      <Typography fontWeight="bold">{planName}</Typography>
                      {expanded && !attributes.is_approved && (
                      <Button
                          variant="contained"
                          size="small"
                          onClick={(e) => {
                              e.stopPropagation(); // Prevent accordion toggle
                              e.preventDefault();
                              setEditMode(true);
                          }}
                          sx={{
                          height: "28px",
                          backgroundColor: BCDesignTokens.surfaceColorBackgroundLightGray,
                          color: "black",
                          '&:hover': {
                              backgroundColor: BCDesignTokens.surfaceColorBorderDefault,
                          },
                          }}
                      >
                          <EditIcon sx={{ color: "#255A90", mr: 0.5 }} fontSize="small" />
                          <Box sx={{ color: "#255A90", fontWeight: "bold" }}>Edit</Box>
                      </Button>
                      )}
                  </Box>
                  )}
              </Box>
            </Box>

            <Box display="flex" flexDirection="column" width="20%" marginTop="12px" alignItems="flex-end">
              <DocumentStatusChip
                status={!attributeHasData ? "nodata" : attributes.is_approved ? "true" : "false"}
              />
            </Box>
            <Box
              display="flex"
              flexDirection="column"
              width="4%"
              marginTop="5px"
              alignItems="flex-end"
            >
              <Tooltip title="Delete Management Plan">
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent accordion toggle
                    setIsDeleteModalOpen(true);
                  }}
                  size="small"
                >
                  <DeleteIcon sx={{ fontSize: '34px' }} />
                </IconButton>
              </Tooltip>
            </Box>
        </AccordionSummary>

        <AccordionDetails>
          <TableContainer component={Box} sx={{ borderRadius: "4px", overflow: "auto" }}>
            <Table sx={{ tableLayout: "fixed" }}>
              <TableHead
                sx={{
                  ".MuiTableCell-root": {
                    p: BCDesignTokens.layoutPaddingXsmall,
                    backgroundColor: BCDesignTokens.themeGray30,
                    fontSize: "14px",
                    fontWeight: "bold",
                  },
                  borderBottom: "5px solid white",
                }}
              >
                <TableRow>
                  <TableCell align="left" sx={{ width: "30%" }}>Condition</TableCell>
                  <TableCell align="left" sx={{ width: "60%" }}>Attribute</TableCell>
                  <TableCell align="left" sx={{ width: "10%" }}>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody
                sx={{
                  ".MuiTableCell-root": {
                    p: BCDesignTokens.layoutPaddingXsmall,
                    backgroundColor: BCDesignTokens.themeGray10,
                    fontSize: "14px",
                  },
                }}
              >
                {attributes.attributes?.map((attr: IndependentAttributeModel) => (
                  <ConditionAttributeRow
                    key={attr.id}
                    conditionAttributeItem={attr}
                    onSave={handleSave}
                    is_approved={attributes.is_approved}
                    onEditModeChange={(isEditing) => {
                        setIsAnyRowEditing(isEditing);
                    }}
                    isManagementRequired={isManagementRequired}
                    isConsultationRequired={isConsultationRequired}
                    isIEMRequired={isIEMRequired}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <ErrorMessage
            visible={conditionAttributeError}
            message="Please complete all the required attribute fields before approving the Management Plan Attributes."
          />

          <Stack sx={{ mt: 5 }} direction={"row"}>
            {origin !== 'create' && (
                <Box width="100%" sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <ApproveButton
                            isApproved={attributes.is_approved}
                            isAnyRowEditing={isAnyRowEditing}
                            showEditingError={showEditingError}
                            onApprove={handleApprovePlan}
                            label={
                              attributes.is_approved
                                ? "Un-approve Management Plan Attributes"
                                : "Approve Management Plan Attributes"
                            }
                        />
                    </Box>
                </Box>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          onDelete?.(attributes.id);
          setIsDeleteModalOpen(false);
        }}
      />
    </Grid>
  );
};

export default ManagementPlanAccordion;
