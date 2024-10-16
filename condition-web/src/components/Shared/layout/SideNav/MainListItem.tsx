import { alpha, ListItem, ListItemButton } from "@mui/material";
import { RouteType } from "./SideNavElements";
import { Link, useRouterState } from "@tanstack/react-router";
import { theme } from "@/styles/theme";

export const MainListItem = ({ route }: { route: RouteType }) => {
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const isActive =
    currentPath === route.path || currentPath.includes(route.path);
  return (
    <ListItem key={route.name} sx={{ py: 0, pr: 0 }}>
      <Link
        to={route.path}
        style={{
          color: theme.palette.primary.light,
          fontWeight: "bold",
          textDecoration: "none",
          width: "100%",
        }}
      >
        <ListItemButton
          sx={{
            pl: "2rem",
            backgroundColor: isActive
              ? alpha(theme.palette.secondary.main, 0.1)
              : theme.palette.primary.light,
            borderLeft: `4px solid ${theme.palette.primary.main}`,
          }}
        >
          <span
            style={{
              color: alpha(theme.palette.primary.main, 0.8),
            }}
          >
            {route.name}
          </span>
        </ListItemButton>
      </Link>
    </ListItem>
  );
};
