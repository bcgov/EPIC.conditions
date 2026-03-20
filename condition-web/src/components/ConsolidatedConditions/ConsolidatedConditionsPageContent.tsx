import { PageGrid } from "@/components/Shared/PageGrid";
import { Grid } from "@mui/material";
import { ConditionModel } from "@/models/Condition";
import { ConsolidatedConditions, ConsolidatedConditionsSkeleton } from ".";

type Props = {
  isLoading: boolean;
  projectName?: string;
  projectId: string;
  documentCategory?: string;
  documentCategoryId: string;
  conditions?: ConditionModel[];
  consolidationLevel?: string;
};

export const ConsolidatedConditionsPageContent = ({
  isLoading,
  projectName,
  projectId,
  documentCategory,
  documentCategoryId,
  conditions,
  consolidationLevel,
}: Props) => {
  if (isLoading) {
    return (
      <PageGrid>
        <Grid item xs={12}>
          <ConsolidatedConditionsSkeleton />
        </Grid>
      </PageGrid>
    );
  }

  return (
    <PageGrid>
      <Grid item xs={12}>
        <ConsolidatedConditions
          projectName={projectName}
          projectId={projectId}
          documentCategory={documentCategory}
          documentCategoryId={documentCategoryId}
          conditions={conditions}
          consolidationLevel={consolidationLevel}
        />
      </Grid>
    </PageGrid>
  );
};
