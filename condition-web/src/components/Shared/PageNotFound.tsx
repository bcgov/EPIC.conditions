import { Grid, Typography, Toolbar } from '@mui/material';
import ErrorSvg from '../../../src/assets/images/404.svg';
import { Link } from "@tanstack/react-router";

const marginStyle = { mr: 2 };

const PageNotFound = ({ errorMessage }: { errorMessage?: string }) => {

    return (
        <>
            <Toolbar />
            <Grid
                container
                direction={'column'}
                justifyContent="center"
                alignItems="center"
                spacing={1}
                padding={'2em 2em 1em 2em'}
            >
                <Grid item sx={{ ...marginStyle, marginBottom: 3 }}>
                    <Typography variant="h1">
                      {errorMessage}
                    </Typography>
                </Grid>
                <Grid item sx={{ marginStyle, marginBottom: 2 }}>
                <img src={ErrorSvg} alt="404 Not Found" />
                </Grid>
                <Grid item xs={6} justifyContent={'left'}>
                  <Typography variant="h4">
                    <Link to={"/"}>Go Home</Link>
                  </Typography>
                </Grid>
            </Grid>
        </>
    );
};

export default PageNotFound;
