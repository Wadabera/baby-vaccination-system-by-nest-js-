/** Landing page for each role. Kept outside ProtectedRoute so that both the
 * route guard and the navigation bar can share it. */
export const homeFor = (role) => {
  switch (role) {
    case "admin":
      return "/admin";
    case "registrar":
      return "/registrar";
    case "doctor":
      return "/doctor";
    case "parent":
      return "/parent";
    default:
      return "/dashboard";
  }
};

export default homeFor;
