import { Stack } from "@mui/material";
import { ContentBoxSkeleton } from "../Shared/ContentBox/ContentBoxSkeleton";

export const ProjectsSkeleton = () => {
  return (
    <Stack spacing={2} direction={"column"}>
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
    </Stack>
  );
};
