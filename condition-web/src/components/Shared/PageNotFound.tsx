import { Toolbar, Grid, Typography, Box, Link } from "@mui/material";
import ErrorSvg from "@/assets/images/404.svg";
import { AppConfig } from "@/utils/config";

export default function PageNotFound() {
  return (
    <>
      <Toolbar />
      <Grid
        container
        direction={"column"}
        justifyContent="center"
        alignItems="center"
        spacing={1}
        padding={"2em 2em 1em 2em"}
      >
        <Grid item sx={{ marginBottom: 3 }}>
          <Typography variant="h2">
            The page you are looking for cannot be found.
          </Typography>
        </Grid>
        <Grid item sx={{ marginBottom: 2 }}>
          <img
            src={ErrorSvg}
            alt="Page not found"
            style={{
              width: "35em",
              height: "20em",
              boxSizing: "border-box",
              padding: "0px",
            }}
          />
        </Grid>
        <Grid item xs={6} justifyContent="center" mb={4}>
          <Typography variant="h2">
            The page you are looking for might have been moved or is temporarily
            unavailable.
          </Typography>
        </Grid>
        <Grid item xs={6} justifyContent={"left"}>
          <Box sx={{ mt: 1 }}>
            <Typography variant="h5" style={{ fontWeight: "bold" }}>
              Suggestions to help you find what you're looking for:
            </Typography>
            <ul>
              <li>{"Check that the web URL has been entered correctly."}</li>
              <li>
                {`Go to our `}
                <Link href="/">homepage</Link>
                {` and browse through our past and current submissions.`}
              </li>
              <li>{`Telephone Device for the Deaf (TDD) across B.C.: 711`}</li>
              <li>
                {`If you would like to email us please contact `}
                <Link href={`mailto:${AppConfig.supportEmail}`}>
                  {AppConfig.supportEmail}
                </Link>
              </li>
            </ul>
          </Box>
        </Grid>
      </Grid>
    </>
  );
}
