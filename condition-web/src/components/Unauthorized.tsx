import React from "react";
import { Box, Typography, Link } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { AppConfig } from "@/utils/config";

const Unauthorized: React.FC = React.memo(() => {
  return (
    <Box
      p={3}
      pt={BCDesignTokens.layoutPaddingSmall}
      mt={BCDesignTokens.layoutMarginXxxlarge}
    >
      <Box
        sx={{
          height: "5px",
          width: "50px",
          backgroundColor: BCDesignTokens.themeGold100,
          ml: BCDesignTokens.layoutMarginXxxlarge
        }}
      />
      <Typography
        variant="h2"
        sx={{
          ml: BCDesignTokens.layoutMarginXxxlarge,
          width: "100%",
        }}
      >
        Need Access to Condition Repository?
      </Typography>
      <Typography
        variant="h6"
        gutterBottom
        fontWeight={400}
        sx={{
          ml: BCDesignTokens.layoutMarginXxxlarge,
          mt: BCDesignTokens.layoutMarginMedium,
          width: "100%",
        }}
      >
        It appears you've arrived at Condition Repository without proper access.
      </Typography>
      <Typography
        variant="h6"
        gutterBottom
        fontWeight={400}
        sx={{
          ml: BCDesignTokens.layoutMarginXxxlarge,
          mt: BCDesignTokens.layoutMarginMedium,
          width: "100%",
        }}
      >
        If you believe you should have access to Condition Repository, please
        contact the Environmental Assessment Office at
        <Link
          href={`mailto:${AppConfig.supportEmail}`}
          sx={{ ml: BCDesignTokens.layoutMarginXsmall }}
        >
          {AppConfig.supportEmail}
        </Link>
      </Typography>
    </Box>
  );
});

export default Unauthorized;
