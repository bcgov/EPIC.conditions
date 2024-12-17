import { useEffect, useState } from "react";
import { BCDesignTokens } from "epic.theme";
import { ConditionModel, createDefaultCondition, ProjectDocumentConditionDetailModel } from "@/models/Condition";
import { Box, Button, Grid, Stack, TextField, Typography } from "@mui/material";
import { styled } from "@mui/system";
import { StyledTableHeadCell } from "../../Shared/Table/common";
import ConditionInfoTabs from "./ConditionInfoTabs";
import { useUpdateCondition } from "@/hooks/api/useConditions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import ChipInput from "../../Shared/Chips/ChipInput";
import { useNavigate } from "@tanstack/react-router";

export const CardInnerBox = styled(Box)({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  flexDirection: "column",
  height: "100%",
  padding: "0 12px",
});

type ConditionsParam = {
  conditionData?: ProjectDocumentConditionDetailModel;
};

export const CreateConditionPage = ({
  conditionData
}: ConditionsParam) => {
  console.log(conditionData);
  const navigate = useNavigate();
  const handleClose = () => {
    navigate({
      to: `/conditions/project/${conditionData?.project_id}/document/${conditionData?.document_id}`,
    });
  };

  const [condition, setCondition] = useState<ConditionModel>(
    conditionData?.condition || createDefaultCondition);

  const [tags, setTags] = useState<string[]>(condition?.topic_tags ?? []);

  const handleInputChange = (key: keyof ConditionModel) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const updatedValue = event.target.value;

    setCondition((prevCondition) => ({
      ...prevCondition,
      [key]: updatedValue,
      }));
    };
  
  useEffect(() => {
    setCondition((prevCondition) => ({
        ...prevCondition,
        topic_tags: tags,
      }));
  }, [tags, setTags]);

  const onCreateFailure = () => {
    notify.error("Failed to save condition");
  };

  const onCreateSuccess = () => {
    notify.success("Condition saved successfully");
  };

  const { mutate: updateCondition } = useUpdateCondition(
    condition?.condition_id,
    {
      onSuccess: onCreateSuccess,
      onError: onCreateFailure,
    }
  );

  const saveChanges = () => {
    if (!condition) {
      notify.error("Condition data is incomplete or undefined.");
      return;
    }
    const data: ConditionModel = {
      ...condition,
    };
    updateCondition(data);
  };

  return (
    <>
      <Grid container sx={{ border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`, borderRadius: 1 }}>
        <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'row', flexGrow: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '50%', height: '100%', paddingRight: '5em'}}>
            <Grid container direction="row">
              <Grid item xs={8}>
                <Stack direction="row" alignItems="flex-start" spacing={-2}>
                  <StyledTableHeadCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                      Project:
                  </StyledTableHeadCell>
                  <StyledTableHeadCell sx={{ verticalAlign: "top" }}>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {conditionData?.project_name}
                      </Typography>
                  </StyledTableHeadCell>
                </Stack>
              </Grid>
              <Grid item xs={4}>
                <Stack direction="row" alignItems="flex-start" spacing={-2}>
                    <StyledTableHeadCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                        Year Condition Issued:
                    </StyledTableHeadCell>
                    <StyledTableHeadCell sx={{ verticalAlign: "top" }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                            {condition?.year_issued}
                        </Typography>
                    </StyledTableHeadCell>
                </Stack>
              </Grid>
            </Grid>
            <Grid container direction="row" marginBottom={2} marginTop={-2}>
              <Grid container direction="row" alignItems="center">
                  <Grid item xs={8} sx={{ height: "60px" }}>
                      <Stack direction="row" alignItems="flex-start" spacing={-2}>
                          <StyledTableHeadCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                              Source:
                          </StyledTableHeadCell>
                          <StyledTableHeadCell sx={{ verticalAlign: "top" }}>
                              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                  {conditionData?.document_label}
                              </Typography>
                          </StyledTableHeadCell>
                      </Stack>
                  </Grid>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', width: '50%', height: '100%' }}>
            <Grid container direction="row">
              <Stack direction="row" alignItems="flex-start" spacing={-2}>
                <StyledTableHeadCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                  Tags:
                </StyledTableHeadCell>
                <StyledTableHeadCell sx={{ verticalAlign: "top" }}>
                  <ChipInput
                    chips={tags}
                    setChips={setTags}
                    placeholder="Add tag"
                    inputWidth="100%"
                  />
                </StyledTableHeadCell>
              </Stack>
            </Grid>
          </Box>
        </Grid>

        <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'row', flexGrow: 1 }}>
          <Stack direction="row" alignItems="flex-start" spacing={-10}>
            <Stack direction="column" alignItems="flex-start" spacing={-2}>
              <StyledTableHeadCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                Condition Number
              </StyledTableHeadCell>
              <Box sx={{ paddingLeft: "15px" }}>
                <TextField
                  variant="outlined"
                  size="small"
                  sx={{ width: '60%' }}
                  value={condition?.condition_number}
                  onChange={handleInputChange('condition_number')}
                />
              </Box>
            </Stack>

            <Stack direction="column" alignItems="flex-start" spacing={-2}>
              <StyledTableHeadCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                Condition Name
              </StyledTableHeadCell>
              <Box sx={{ paddingLeft: "15px" }}>
                <TextField
                  variant="outlined"
                  size="small"
                  sx={{ width: '200%' }}
                  value={condition?.condition_name}
                  onChange={handleInputChange('condition_name')}
                />
              </Box>
            </Stack>

          </Stack>
        </Grid>
      </Grid>

      <Grid container sx={{ paddingTop: "5px" }}>
        <Box
          sx={{
            boxShadow: "0px 2px 2px rgba(0, 0, 0, 0.1)",
            paddingTop: "0.5em",
            width: "100%"
          }}
        >
          <ConditionInfoTabs condition={condition} setCondition={setCondition} />
        </Box>
      </Grid>

      <Button
        variant="contained"
        color="secondary"
        size="small"
        sx={{
          minWidth: "80px",
          padding: "4px 8px",
          borderRadius: "4px",
          marginTop: "25px",
          marginRight: "5px",
        }}
        onClick={handleClose}
      >
        Close
      </Button>

      <Button
        variant="contained"
        color="primary"
        size="small"
        sx={{
          minWidth: "80px",
          padding: "4px 8px",
          borderRadius: "4px",
          marginTop: "25px",
        }}
        onClick={saveChanges}
      >
        Save
      </Button>
    </>
  );
};
