import { Box, Typography } from "@mui/material";
import { AppConfig } from "@/utils/config";
import MenuIcon from "@mui/icons-material/Menu";
import { theme } from "@/styles/theme";
import { openDrawer } from "../../Drawers/DrawerStore";
import SideNavBar from "../SideNav/SideNavBar";

export default function MobileNav() {
  return (
    <Box
      sx={{
        p: 1,
        borderBottom: "1px solid #0000001A",
        justifyContent: "space-between",
      }}
      display={"flex"}
    >
      <Typography
        variant="h5"
        color="info"
        component="div"
        paddingLeft={"0.5rem"}
        fontWeight={"bold"}
      >
        {AppConfig.appTitle || "App Title"}
      </Typography>
      <Box
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        mr={theme.spacing(1)}
      >
        <Typography variant="body1" color="info" mr={1}>
          Menu
        </Typography>
        <MenuIcon
          fontSize="small"
          htmlColor={theme.palette.text.primary}
          sx={{ m: 0, p: 0, alignSelf: "center" }}
          onClick={() => openDrawer(<SideNavBar />, "left")}
        />
      </Box>
    </Box>
  );
}
