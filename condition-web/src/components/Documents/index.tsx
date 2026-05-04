import { useState, useEffect } from "react";
import { BCDesignTokens } from "epic.theme";
import { AllDocumentModel, DocumentStatus, DocumentTypeModel } from "@/models/Document";
import { Box, styled, Stack, Typography, Grid } from "@mui/material";
import { ContentBoxSkeleton } from "../Shared/ContentBox/ContentBoxSkeleton";
import { ContentBox } from "../Shared/ContentBox";
import DocumentTable from "./DocumentTable";
import DocumentStatusChip from "../Projects/DocumentStatusChip";
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import AddIcon from '@mui/icons-material/Add';
import LoadingButton from "../Shared/Buttons/LoadingButton";
import { CreateDocumentModal } from "../Projects/CreateDocumentModal";
import { ProjectModel } from "@/models/Project";
import { useHasAllowedRoles, KeycloakRoles } from "@/hooks/useAuthorization";

export const CardInnerBox = styled(Box)({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  flexDirection: "column",
  height: "100%",
  padding: "0 12px",
});

type DocumentsParam = {
  documents?: AllDocumentModel[];
  projectName: string;
  projectId: string;
  categoryId: number;
  documentLabel: string;
  project?: ProjectModel;
  documentType?: DocumentTypeModel[];
};

export const Documents = ({ projectName, projectId, categoryId, documentLabel, documents, project, documentType }: DocumentsParam) => {
  const canManage = useHasAllowedRoles([KeycloakRoles.MANAGE_CONDITIONS]);
  const [isAllApproved, setIsAllApproved] = useState<boolean | null>(false);
  const [openModal, setOpenModal] = useState(false);
  const [isOpeningModal, setIsOpeningModal] = useState(false);

  const handleOpenAddDocument = () => {
    setIsOpeningModal(true);
    setOpenModal(true);
  };

  const handleCloseAddDocument = () => {
    setOpenModal(false);
  };

  useEffect(() => {
    if (documents && documents.length > 0) {
      const hasNullStatus = documents.some((document) => document.status === null);
      if (hasNullStatus) {
        setIsAllApproved(null);
      } else {
        const allApproved = documents.every((document) => document.status === true);
        setIsAllApproved(allApproved);
      }
    }
  }, [documents]);

  return (
    <Stack spacing={2} direction={"column"} sx={{ width: '100%' }}>
      <ContentBox
        mainLabel={
          <Box component="span">
            <Typography component="span" variant="h5" fontWeight="normal">
              {projectName}
            </Typography>
          </Box>
        }
        label={""}
      >
        <Box
          sx={{
            borderRadius: "3px",
            border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
            boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Box
            sx={{
              px: BCDesignTokens.layoutPaddingXsmall,
              py: BCDesignTokens.layoutPaddingSmall,
              borderBottom: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
            }}
          >
            <Grid container direction="row" alignItems="center" paddingBottom={3}>
              <Grid item xs>
                <Box sx={{ px: 2.5, display: "flex", alignItems: "center" }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="h6" component="span">{documentLabel}</Typography>
                    <LayersOutlinedIcon fontSize="small" sx={{ ml: 1, mr: 1 }} />
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", fontWeight: "normal" }}>
                    <DocumentStatusChip status={isAllApproved === null ? "nodata" : String(isAllApproved) as DocumentStatus} />
                  </Box>
                </Box>
              </Grid>
              {canManage && project && documentType && (
                <Grid item sx={{ pr: BCDesignTokens.layoutPaddingMedium }}>
                  <LoadingButton
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddDocument}
                    loading={isOpeningModal}
                    sx={{
                      borderRadius: "4px",
                      width: "100%",
                      minWidth: "170px",
                      maxWidth: "200px",
                      height: "42px",
                    }}
                  >
                    Add Document
                  </LoadingButton>
                </Grid>
              )}
            </Grid>
            <Box height={"100%"} px={BCDesignTokens.layoutPaddingXsmall}>
                <CardInnerBox
                    sx={{ height: "100%", py: BCDesignTokens.layoutPaddingSmall }}
                >
                    <DocumentTable
                      projectId={projectId}
                      documents={documents || []}
                    />
                </CardInnerBox>
            </Box>
          </Box>
        </Box>
      </ContentBox>
      {project && documentType && (
        <CreateDocumentModal
          open={openModal}
          onClose={handleCloseAddDocument}
          documentType={documentType}
          projectArray={[project]}
          preselectedProject={project}
          restrictToCategoryId={categoryId}
          onTransitionEnd={() => setIsOpeningModal(false)}
        />
      )}
    </Stack>
  );
};

export const DocumentsSkeleton = () => {
  return (
    <Stack spacing={2} direction={"column"} sx={{ width: '100%' }}>
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
    </Stack>
  );
};
