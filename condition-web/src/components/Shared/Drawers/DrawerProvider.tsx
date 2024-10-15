import React from "react";
import { useDrawer } from "./DrawerStore";
import { Box, Drawer } from "@mui/material";

const DrawerProvider: React.FC = () => {
  const { drawerContent, direction, setClose, isOpen } = useDrawer();

  return (
    <Drawer open={isOpen} onClose={setClose} anchor={direction}>
      <Box>{drawerContent}</Box>
    </Drawer>
  );
};

export default DrawerProvider;
