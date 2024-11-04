import { useState } from "react";
import { BCDesignTokens } from "epic.theme";
import { ConditionModel } from "@/models/Condition";
import { Box, Button, Grid, styled, Stack, Typography, Tabs, Tab } from "@mui/material";
import { ContentBoxSkeleton } from "../Shared/ContentBox/ContentBoxSkeleton";
import { ContentBox } from "../Shared/ContentBox";
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { DocumentStatus } from "@/models/Document";
import DocumentStatusChip from "../Documents/DocumentStatusChip";
import { StyledTableHeadCell } from "../Shared/Table/common";
import ConditionDescription from './ConditionDescription';

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
};

export const ConditionDetails = ({ projectName, documentName, condition }: ConditionsParam) => {

  const [selectedTab, setSelectedTab] = useState("description");

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue);
  };

  return (
    <Stack spacing={2} direction={"column"} sx={{ width: '100%' }}>
      {/* Showing results message */}
      <Box
        sx={{
          borderRadius: "3px",
          border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
          boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            px: BCDesignTokens.layoutPaddingXsmall,
            py: BCDesignTokens.layoutPaddingSmall,
            borderBottom: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
          }}
        >
          <Grid container direction="row" paddingBottom={3}>
            <Grid item xs={6}>
              <Box
                sx={{
                  px: 2.5,
                  display: "flex", // Align items in a row
                  alignItems: "center", // Vertically center the elements
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}> {/* Add horizontal padding to the document name */}
                  {condition?.condition_name}
                  <ContentCopyOutlinedIcon fontSize="small" sx={{ ml: 1, mr: 1 }} />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", fontWeight: "normal" }}>
                    <DocumentStatusChip status={String(condition?.is_approved) as DocumentStatus} />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6} textAlign="right">
              <Button
                variant="outlined"
                size="small"
                sx={{
                  alignSelf: "flex-end",
                  marginRight: 2,
                  padding: "4px 8px",
                  borderRadius: "4px",
                }}
              >
                Add tags
              </Button>
            </Grid>
          </Grid>
          <Grid
            sx={{
              border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
              mx: 2,
              borderRadius: "3px",
              p: 1, // Adjust padding of the container for tighter layout
            }}
          >
            {/* First Row */}
            <Grid container direction="row" alignItems="left" spacing={0.5}> {/* Reduced spacing */}
              {/* Label Column */}
              <Grid item xs={1}>
                <StyledTableHeadCell sx={{ p: 0.5 }}> {/* Reduced padding */}
                  Project:
                </StyledTableHeadCell>
              </Grid>
              {/* Data Column */}
              <Grid item xs={3} marginRight={"10px"}>
                <StyledTableHeadCell sx={{ p: 0.5 }}>
                  <Typography component="span" variant="body2" sx={{ mx: 0 }}> {/* Removed extra margin */}
                    {projectName}
                  </Typography>
                </StyledTableHeadCell>
              </Grid>
              {/* Label Column */}
              <Grid item xs={2}>
                <StyledTableHeadCell sx={{ p: 0.5 }}> {/* Reduced padding */}
                  Topic(s):
                </StyledTableHeadCell>
              </Grid>
              {/* Data Column */}
              <Grid item xs={3}>
                <StyledTableHeadCell sx={{ p: 0.5 }}>
                  <Typography component="span" variant="body2" sx={{ mx: 0 }}> {/* Removed extra margin */}
                    {condition?.topic_tags}
                  </Typography>
                </StyledTableHeadCell>
              </Grid>
            </Grid>

            {/* Second Row */}
            <Grid container direction="row" alignItems="center" spacing={0.5} mt={0.5}>
              {/* Label Column */}
              <Grid item xs={1}>
                <StyledTableHeadCell sx={{ p: 0.5 }}>
                  Source:
                </StyledTableHeadCell>
              </Grid>
              {/* Data Column */}
              <Grid item xs={3} marginRight={"10px"}>
                <StyledTableHeadCell sx={{ p: 0.5 }}>
                  <Typography component="span" variant="body2" sx={{ mx: 0 }}>
                    {documentName}
                  </Typography>
                </StyledTableHeadCell>
              </Grid>
              {/* Label Column */}
              <Grid item xs={2}>
                <StyledTableHeadCell sx={{ p: 0.5 }}>
                  Year Condition Issued:
                </StyledTableHeadCell>
              </Grid>
              {/* Data Column */}
              <Grid item xs={3}>
                <StyledTableHeadCell sx={{ p: 0.5 }}>
                  <Typography component="span" variant="body2" sx={{ mx: 0 }}>
                    {condition?.year_issued}
                  </Typography>
                </StyledTableHeadCell>
              </Grid>
            </Grid>
          </Grid>

        </Typography>
      </Box>

      {/* Tab Section */}
      <Tabs value={selectedTab} onChange={handleTabChange}>
        <Tab label="Condition Description" value="description" />
        <Tab label="Condition Attributes" value="attributes" />
      </Tabs>
      {/* Content Box */}
      <ContentBox mainLabel={""} showHeader={false}>
        {selectedTab === "description" ? (
          <ConditionDescription condition={condition} />
        ) : (
          <Typography variant="body2"> {/* Replace with actual content */}
            Attributes content goes here.
          </Typography>
        )}
      </ContentBox>
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
