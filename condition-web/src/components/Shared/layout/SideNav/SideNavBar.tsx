import { Box, List } from "@mui/material";
import { MainListItem } from "./MainListItem";

export default function SideNavBar() {
  return (
    <div style={{ minHeight: "calc(100vh - 88px)", borderRight: "1px solid #0000001A", width: 240 }}>
      <Box
        sx={{
          overflow: "auto",
          width: "100%",
          height: "calc(100vh - 88px)",
          zIndex: 0,
          position: "static",
        }}
      >
        <List>
          <MainListItem
            route={{
              name: "Projects",
              path: "/projects",
            }}
          />
          <MainListItem
            route={{
              name: "Extracted Documents",
              path: "/extracted-documents",
            }}
          />
        </List>
      </Box>
    </div>
  );
}
