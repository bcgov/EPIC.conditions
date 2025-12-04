import React, { memo } from "react";
import {
  Box,
  Button,
  CircularProgress
} from "@mui/material";
import { managementRequiredKeys } from "../../ConditionAttribute/Constants";
import { createDefaultManagementPlan } from "./helpers";
import ManagementPlanAccordion from "./ManagementPlanAccordion";
import { ManagementPlanModel } from "@/models/ConditionAttribute";
import { ConditionModel } from "@/models/Condition";
import { useUpdateConditionAttributeDetails } from "@/hooks/api/useConditionAttribute";
import { useRemoveManagementPlan } from "@/hooks/api/useManagementPlan";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useQueryClient } from "@tanstack/react-query";

type ManagementPlanSectionProps = {
    condition: ConditionModel;
    setCondition: React.Dispatch<React.SetStateAction<ConditionModel>>;
};

const ManagementPlanSection = memo(({ condition, setCondition, }: ManagementPlanSectionProps) => {
    const queryClient = useQueryClient();

    const managementPlans = condition?.condition_attributes?.management_plans || [];

    const onCreateSuccess = () => {
      notify.success("Management Plan added successfully");
      queryClient.invalidateQueries({ queryKey: ["conditions", condition.condition_id] });
    };
  
    const onCreateFailure = () => {
      notify.error("Failed to add management plan");
    };
  
    const { mutateAsync: updateAttributes, isPending: isUpdating } = useUpdateConditionAttributeDetails(
      condition.condition_id,
      {
        onSuccess: onCreateSuccess,
        onError: onCreateFailure,
      }
    );

    const { mutateAsync: removeManagementPlan } = useRemoveManagementPlan({
      onSuccess: () => {
        notify.success("Management plan deleted");
      },
      onError: () => {
        notify.error("Failed to delete management plan");
      },
    });

    const handleAddPlan = async () => {
      const newPlan: ManagementPlanModel = createDefaultManagementPlan(
        `(condition.condition_attributes?.length || 0) + 1-${Date.now()}`,
        managementRequiredKeys
      );
  
      try { 
        const updatedPlans = [...managementPlans, newPlan];

        const response = await updateAttributes({
          requires_management_plan: true,
          condition_attribute: {
            independent_attributes: condition.condition_attributes?.independent_attributes || [],
            management_plans: updatedPlans,
          },
        });

        const updatedResponsePlans = response?.management_plans ?? updatedPlans;

        // Update global condition state too
        setCondition((prev) => ({
          ...prev,
          condition_attributes: {
            independent_attributes: prev.condition_attributes?.independent_attributes ?? [],
            management_plans: updatedResponsePlans,
          },
          subconditions: prev.subconditions, // preserve optional fields if needed
        }));

      } catch (error) {
        notify.error("Failed to add plan.");
      }
    };

    const handleDeletePlan = async (planId: string) => {
      await removeManagementPlan(planId);
      setCondition((prev) => ({
        ...prev,
        condition_attributes: {
          ...prev.condition_attributes,
          management_plans: prev.condition_attributes?.management_plans?.filter(p => p.id !== planId) || [],
          independent_attributes: prev.condition_attributes?.independent_attributes || [],
        },
      }));
    };

    return (
      <Box>
          {managementPlans.map((plan, index) => (
          <ManagementPlanAccordion
              key={plan.id}
              attributes={plan}
              title={plan.name || `Management Plan ${index + 1}`}
              condition={condition}
              setCondition={setCondition}
              onDelete={handleDeletePlan}
          />
          ))}

          {isUpdating ? (
            <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
          ) : (
            <Button
                variant="outlined"
                onClick={handleAddPlan}
                sx={{ mt: 2 }}
                data-testid="add-management-plan-btn"
                >
                Add Management Plan
            </Button>
          )}
      </Box>
    );
});

export default ManagementPlanSection;
