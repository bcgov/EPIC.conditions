import { Box, Button, styled } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { ProjectModel } from "@/models/Project";
import DocumentTable from "../Documents/DocumentTable";
import { ContentBox } from "../Shared/ContentBox";
import { useNavigate } from "@tanstack/react-router";
import { theme } from "@/styles/theme";

export const CardInnerBox = styled(Box)({
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    flexDirection: "column",
    height: "100%",
    padding: "0 12px",
  });

type ProjectParam = {
    project: ProjectModel;
  };

export const Project = ({ project }: ProjectParam) => {
    const navigate = useNavigate();

    const certificateDocument = project?.documents?.find(
        (doc) => doc.document_type === "Certificate and Amendments"
      );

    // Check if all documents have a status of true
    const allDocumentsStatusTrue = project?.documents?.every(doc => doc.status === true);

    const handleViewConsolidatedConditions = () => {
    if (project?.project_id && certificateDocument?.document_id) {
        navigate({
        to: `/conditions/project/${project.project_id}/document/${certificateDocument.document_id}`,
        });
    }
    };

    return (
        <ContentBox
          mainLabel={project.project_name ? project.project_name : ""}
          label={""}
        >
            <Box
                sx={{
                borderRadius: "3px",
                border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)",
                }}
            >
                <Box height={"100%"} px={BCDesignTokens.layoutPaddingXsmall}>
                    <CardInnerBox
                        sx={{ height: "100%", py: BCDesignTokens.layoutPaddingSmall }}
                    >
                        <DocumentTable documents={project.documents || []} />
                    </CardInnerBox>
                </Box>
            </Box>
            <Box
                sx={{
                display: "flex",
                justifyContent: "flex-end",  // Aligns the button to the right
                paddingTop: "15px",          // Adds spacing from the box above
                paddingRight: BCDesignTokens.layoutPaddingXsmall,  // Aligns with Box padding
                }}
            >
                <Button
                    variant="text"
                    onClick={handleViewConsolidatedConditions}
                    disabled={!project || !certificateDocument || !allDocumentsStatusTrue}
                    sx={{
                        color: BCDesignTokens.themeGray100,
                        border: `2px solid ${theme.palette.grey[700]}`,
                    }}
                >
                    View Consolidated Conditions
                </Button>
            </Box>
        </ContentBox>
    );
};
