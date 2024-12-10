import { useState } from "react";
import { BCDesignTokens } from "epic.theme";
import { ConditionModel, ProjectDocumentConditionDetailModel } from "@/models/Condition";
import {
  Box,
  Chip,
  Grid,
  InputAdornment,
  IconButton,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { styled } from "@mui/system";
import { StyledTableHeadCell } from "../../Shared/Table/common";
import AddIcon from '@mui/icons-material/Add';
import ConditionInfoTabs from "./ConditionInfoTabs";

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

  const [condition, setCondition] = useState<ConditionModel | undefined>(conditionData?.condition);
  const [tags, setTags] = useState<string[]>(condition?.topic_tags ?? []);
  const [newTag, setNewTag] = useState("");

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddTag = () => {
      if (newTag && !tags.includes(newTag)) {
          setTags([...tags, newTag]);
          setNewTag("");
      }
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
            <Grid container direction="row" marginBottom={1.5} marginTop={-2}>
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
                  <Box>
                    {(tags ?? []).map((tag) => (
                        <Chip
                            key={tag}
                            label={tag}
                            onDelete={() => handleRemoveTag(tag)}
                            sx={{
                                marginLeft: 1,
                                backgroundColor: "#F7F9FC",
                                color: "black",
                                fontSize: "14px"
                            }}
                        />
                    ))}
                    <TextField
                        variant="outlined"
                        size="small"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddTag();
                        }}
                        placeholder="Add tag"
                        sx={{ marginLeft: 1, width: "auto", flexShrink: 0 }}
                        InputProps={{
                          endAdornment: newTag ? (
                            <InputAdornment position="end">
                              <IconButton
                                edge="end"
                                onClick={handleAddTag}
                                sx={{ padding: 0 }}
                              >
                                <AddIcon />
                              </IconButton>
                            </InputAdornment>
                          ) : null,
                        }}
                    />
                  </Box>
                </StyledTableHeadCell>
              </Stack>
            </Grid>
          </Box>
        </Grid>

        <Grid item xs={12} sx={{ marginTop: -2, display: 'flex', flexDirection: 'row', flexGrow: 1 }}>
          <Stack direction="row" alignItems="flex-start" spacing={-10}>
            <Stack direction="column" alignItems="flex-start" spacing={-6}>
              <StyledTableHeadCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                Condition Number
              </StyledTableHeadCell>
              <Box sx={{ paddingLeft: "15px" }}>
                <StyledTableHeadCell sx={{ verticalAlign: "top" }}>
                  <Typography
                    variant="body2"
                    sx={{ wordBreak: 'break-word' }}
                  >
                    {condition?.condition_number}
                  </Typography>
                </StyledTableHeadCell>
                <TextField
                  variant="outlined"
                  size="small"
                  sx={{ width: '60%' }}
                />
              </Box>
            </Stack>

            <Stack direction="column" alignItems="flex-start" spacing={-6}>
              <StyledTableHeadCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                Condition Name
              </StyledTableHeadCell>
              <Box sx={{ paddingLeft: "15px" }}>
                <StyledTableHeadCell sx={{ verticalAlign: "top" }}>
                  <Typography
                    variant="body2"
                    sx={{ wordBreak: 'break-word' }}
                  >
                    {condition?.condition_number}
                  </Typography>
                </StyledTableHeadCell>
                <TextField
                  variant="outlined"
                  size="small"
                  sx={{ width: '200%' }}
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
          <ConditionInfoTabs />
        </Box>
      </Grid>
    </>
  );
};
