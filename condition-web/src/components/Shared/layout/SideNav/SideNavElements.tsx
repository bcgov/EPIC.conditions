export const AuthenticatedRoutes: RouteType[] = [
  {
    name: "Admin",
    path: "/profile",
  },
];

export const AdminRoute: RouteType = {
  name: "Admin",
  path: "/admin",
};

export const ProjectRoute: RouteType = {
  name: "Home",
  path: "/projects",
};

export interface RouteType {
  name: string;
  path: string;
}
