import { useEffect, useState } from "react";
import { BCDesignTokens } from "epic.theme";
import { createDefaultCondition, ProjectDocumentConditionDetailModel } from "@/models/Condition";
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
  initialCondition?: ProjectDocumentConditionDetailModel;
  projectId: string;
  documentId: string;
  conditionId: number;
};

export const ConditionDetails = ({
  initialCondition,
  projectId,
  documentId,
  conditionId
}: ConditionsParam) => {

  const [condition, setCondition] = useState(() => initialCondition?.condition || createDefaultCondition());

  useEffect(() => {
    if (initialCondition?.condition) {
      setCondition(initialCondition.condition);
    }
  }, [initialCondition]);

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
          conditionId={conditionId}
          projectName={initialCondition?.project_name || ""}
          documentLabel={initialCondition?.document_label || ""} 
          condition={condition}
          setCondition={setCondition}
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
          projectId={projectId}
          documentId={documentId}
          conditionId={conditionId}
          condition={condition}
          setCondition={setCondition}
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
