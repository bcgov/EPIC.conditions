import { BCDesignTokens } from "epic.theme";
import { ConditionModel } from "@/models/Condition";
import { Box, Stack } from "@mui/material";
import { ContentBoxSkeleton } from "../Shared/ContentBox/ContentBoxSkeleton";
import { styled } from "@mui/system";
import ConditionInfoTabs from "./ConditionInfoTabs";
import ConditionHeader from "./ConditionHeader";

export const CardInnerBox = styled(Box)({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  flexDirection: "column",
  height: "100%",
  padding: "0 12px",
});

type ConditionsParam = {
  condition?: ConditionModel;
  projectName: string;
  documentName: string;
  projectId: string;
  documentId: string;
  conditionNumber: number;
};

export const ConditionDetails = ({
  projectName,
  documentName,
  condition,
  projectId,
  documentId,
  conditionNumber
}: ConditionsParam) => {

  return (
    <Stack spacing={2} direction={"column"} sx={{ width: '100%' }}>
      <Box
        sx={{
          borderRadius: "3px",
          border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
          boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)",
        }}
      >
        <ConditionHeader
          projectName={projectName}
          documentName={documentName} 
          yearIssued={condition?.year_issued}
          conditionName={condition?.condition_name}
          isApproved={condition?.is_approved}
          topicTags={condition?.topic_tags}
        />
      </Box>

      <Box
        sx={{
          borderRadius: "3px",
          boxShadow: "0px 2px 2px rgba(0, 0, 0, 0.1)",
          paddingTop: "0.5em"
        }}
      >
        <ConditionInfoTabs
          condition={condition}
          projectId={projectId}
          documentId={documentId}
          conditionNumber={conditionNumber}
        />
      </Box>
    </Stack>
  );
};

export const ConditionDetailsSkeleton = () => {
  return (
    <Stack spacing={2} direction={"column"} sx={{ width: '100%' }}>
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
    </Stack>
  );
};
