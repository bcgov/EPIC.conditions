import { Box, styled } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { ProjectModel } from "@/models/Project";
import DocumentTable from "../Documents/DocumentTable";
import { ContentBox } from "../Shared/ContentBox";

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
        </ContentBox>
    );
};