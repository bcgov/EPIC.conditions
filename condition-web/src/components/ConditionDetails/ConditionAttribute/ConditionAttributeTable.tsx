import React, { memo, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Select,
  Stack,
  MenuItem,
  Paper
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { BCDesignTokens } from "epic.theme";
import { theme } from "@/styles/theme";
import { useUpdateConditionAttributeDetails } from "@/hooks/api/useConditionAttribute";
import { ConditionModel } from "@/models/Condition";
import { ConditionAttributeModel } from "@/models/ConditionAttribute";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useUpdateConditionDetails } from "@/hooks/api/useConditions";
import { updateTopicTagsModel } from "@/models/Condition";
import { useGetAttributes } from "@/hooks/api/useAttributeKey";
import ConditionAttributeRow from "./ConditionAttributeRow";
import { useQueryClient } from "@tanstack/react-query";
import { CONDITION_KEYS, SELECT_OPTIONS } from "./Constants";
import CloseIcon from '@mui/icons-material/Close';
import DynamicFieldRenderer from "./DynamicFieldRenderer";

type ConditionAttributeTableProps = {
    projectId: string;
    documentId: string;
    condition: ConditionModel;
    setCondition: React.Dispatch<React.SetStateAction<ConditionModel>>;
};

const ConditionAttributeTable = memo(({
    projectId,
    documentId,
    condition,
    setCondition
  }: ConditionAttributeTableProps) => {

    const queryClient = useQueryClient();

    const onCreateFailure = () => {
      notify.error("Failed to save condition attributes");
    };
    
    const onCreateSuccess = () => {
      notify.success("Condition attributes saved successfully");

      queryClient.invalidateQueries({
        queryKey: ["conditions", condition.condition_id],
      });
    };
  
    const { mutateAsync: updateAttributes } = useUpdateConditionAttributeDetails(
      condition.condition_id,
      {
        onSuccess: onCreateSuccess,
        onError: onCreateFailure,
      }
    );
  
    const onApproveFailure = () => {
        notify.error("Failed to approve condition attribute");
    };
  
    const onApproveSuccess = () => {
        notify.success("Condition attribute successfully approved");
    };
  
    const { data: conditionDetails, mutate: updateConditionDetails } = useUpdateConditionDetails(
        projectId,
        documentId,
        condition.condition_number,
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
          }));
      }
    }, [conditionDetails, setCondition]);
  
    const approveConditionAttributes = () => {
      const data: updateTopicTagsModel = {
        is_condition_attributes_approved: !condition.is_condition_attributes_approved }
      updateConditionDetails(data);
    };

    const handleSave = async (updatedAttribute: ConditionAttributeModel) => {
      const updatedAttributes = condition.condition_attributes?.map((attr) =>
        attr.id === updatedAttribute.id ? updatedAttribute : attr
      ) || [];

      setCondition((prevCondition) => ({
        ...prevCondition,
        condition_attributes: updatedAttributes,
        ...conditionDetails,
      }));
      updateAttributes(updatedAttributes);
    };
  
    const handleAddConditionAttribute = () => {
      if (isAttributesLoading) {
        notify.info("Loading attributes, please wait...");
        return;
      }
  
      if (isAttributesError) {
        notify.error("Failed to load attributes");
        return;
      }
  
      setModalOpen(true);
    };
  
    const {
      data: attributesData,
      isPending: isAttributesLoading,
      isError: isAttributesError,
    } = useGetAttributes(condition.condition_id);
  
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedAttribute, setSelectedAttribute] = useState("");
    const [attributeValue, setAttributeValue] = useState("");
    const [otherValue, setOtherValue] = useState("");
    const [chips, setChips] = useState<string[]>(
      selectedAttribute === CONDITION_KEYS.PARTIES_REQUIRED
        ? attributeValue
            ?.replace(/[{}]/g, "")
            .split(",")
            .map((item) => item.trim().replace(/^"|"$/g, ""))
        : []
    );
    const [milestones, setMilestones] = useState<string[]>([]);

    const handleCloseModal = () => {
      setModalOpen(false);
      setSelectedAttribute("");
      setAttributeValue("");
      setOtherValue("");

      queryClient.invalidateQueries({
        queryKey: ["conditions", condition.condition_id],
      });
    };
  
    const handleAttributeSelection = () => {
      if (!selectedAttribute) {
        notify.error("Please select an attribute before proceeding");
        return;
      }

      const newAttribute = {
        id: `(condition.condition_attributes?.length || 0) + 1-${Date.now()}`,
        key: selectedAttribute,
        value: selectedAttribute === CONDITION_KEYS.PARTIES_REQUIRED ?
        `{${chips.filter((chip) => chip !== null && chip !== "").map((chip) => `"${chip}"`).join(",")}}`
        : selectedAttribute === CONDITION_KEYS.MILESTONES_RELATED_TO_PLAN_IMPLEMENTATION ?
        milestones.map((milestone) => `${milestone}`).join(",")
        : otherValue !== "" ? otherValue : attributeValue,
      };

      updateAttributes([
        {
          id: `(condition.condition_attributes?.length || 0) + 1-${Date.now()}`,
          key: selectedAttribute,
          value: selectedAttribute === CONDITION_KEYS.PARTIES_REQUIRED ?
          `{${chips.filter((chip) => chip !== null && chip !== "").map((chip) => `"${chip}"`).join(",")}}`
          : selectedAttribute === CONDITION_KEYS.MILESTONES_RELATED_TO_PLAN_IMPLEMENTATION ?
          milestones.map((milestone) => `${milestone}`).join(",")
          : otherValue !== "" ? otherValue : attributeValue,
        }
      ]);

      setCondition((prevCondition) => ({
        ...prevCondition,
        condition_attributes: [
          ...(prevCondition.condition_attributes || []),
          newAttribute,
        ],
      }));
  
      // Close the modal and reset the selection
      setModalOpen(false);
      setSelectedAttribute("");
      setAttributeValue("");
      setChips([]);
      setOtherValue("");
    };

    const renderEditableField = () => {
      const options = SELECT_OPTIONS[selectedAttribute];
      return (
        <DynamicFieldRenderer
          editMode={false}
          attributeKey={selectedAttribute}
          attributeValue={attributeValue}
          setAttributeValue={setAttributeValue}
          chips={chips}
          setChips={setChips}
          milestones={milestones}
          setMilestones={setMilestones}
          otherValue={otherValue}
          setOtherValue={setOtherValue}
          options={options}
        />
      );
    };

    return (
      <Box>
        <TableContainer component={Box} sx={{ height: "100%", overflow: "hidden", borderRadius: "4px" }}>
          <Table sx={{ tableLayout: "fixed" }}>
            <TableHead
              sx={{
                ".MuiTableCell-root": {
                  p: BCDesignTokens.layoutPaddingXsmall,
                  backgroundColor: BCDesignTokens.themeGray30,
                  marginBottom: `15px solid white`,
                  fontSize: '14px',
                  fontWeight: "bold",
                },
              }}
            >
              <TableRow>
                <TableCell align="left" sx={{ width: "30%", paddingLeft: "10px !important" }}>Condition</TableCell>
                <TableCell align="left" sx={{ width: "60%", paddingLeft: "10px !important" }}>Attribute</TableCell>
                <TableCell align="left" sx={{ width: "10%", paddingLeft: "10px !important" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
  
            <Box sx={{ height: "5px", backgroundColor: BCDesignTokens.themeGray10 }} />
  
            <TableBody
              sx={{
                ".MuiTableCell-root": {
                  p: BCDesignTokens.layoutPaddingXsmall,
                  backgroundColor: condition.is_condition_attributes_approved ?'#F7F9FC' : BCDesignTokens.themeGray10,
                  fontSize: '14px',
                },
              }}
            >
              {(condition.condition_attributes || []).map((attribute, index) => (
                <ConditionAttributeRow
                  key={attribute.id}
                  conditionAttributeItem={attribute}
                  onSave={handleSave}
                  is_approved={condition.is_condition_attributes_approved}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack sx={{ mt: 5 }} direction={"row"}>
          <Box width="50%" sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            {!condition.is_condition_attributes_approved  && attributesData?.length > 0 && (
              <Button
                variant="contained"
                color="secondary"
                size="small"
                sx={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  color: BCDesignTokens.themeGray100,
                  border: `2px solid ${theme.palette.grey[700]}`,
                }}
                onClick={handleAddConditionAttribute}
              >
                <AddIcon fontSize="small" /> Add Condition Attribute
              </Button>
            )}
          </Box>
  
          <Modal
            open={isModalOpen}
            onClose={handleCloseModal}
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
          >
            <Paper
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "90%",
                maxWidth: "500px",
                borderRadius: "4px",
                outline: "none",
              }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                padding={"14px 5px 14px 14px"}
              >
                <Typography variant="h6">Add Condition Attribute</Typography>
                <IconButton onClick={handleCloseModal}>
                  <CloseIcon />
                </IconButton>
              </Box>
              <Divider />
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                padding={"14px"}
              >
                <Stack direction={"column"} sx={{ width: "100%" }}>
                  <Typography variant="body1" marginBottom={"2px"}>
                    Select an Attribute
                  </Typography>
                  {isAttributesLoading ? (
                    <CircularProgress size={24} sx={{ display: "block", margin: "16px auto" }} />
                  ) : (
                    <Select
                      value={selectedAttribute}
                      onChange={(e) => setSelectedAttribute(e.target.value)}
                      fullWidth
                      displayEmpty
                      sx={{
                        fontSize: "inherit",
                        lineHeight: "inherit",
                        width: "100%",
                        "& .MuiSelect-select": {
                          padding: "8px",
                        },
                        mb: 2
                      }}
                    >
                      {attributesData?.map((attribute: any) => (
                        <MenuItem key={attribute.id} value={attribute.key_name}>
                          {attribute.key_name}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                  <Typography variant="body1">
                    Select a Value
                  </Typography>
                  {renderEditableField()}
                  <Box sx={{ display: "flex", justifyContent: "right", mt: 2 }}>
                    <Button
                      variant="outlined"
                      sx={{ minWidth: "100px" }}
                      onClick={handleCloseModal}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      sx={{ marginLeft: "8px", minWidth: "100px" }}
                      onClick={handleAttributeSelection}
                      disabled={!attributeValue && chips.length === 0 && milestones.length === 0}
                    >
                      Confirm
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </Paper>
          </Modal>
          <Box width="50%" sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{
                width: "250px", 
                padding: "4px 8px",
                borderRadius: "4px",
              }}
              onClick={approveConditionAttributes}
          >
            {condition.is_condition_attributes_approved ?
            'Un-approve Condition Attributes' : 'Approve Condition Attributes'}
          </Button>
          </Box>
        </Stack>
      </Box>
    );
});

export default ConditionAttributeTable;
