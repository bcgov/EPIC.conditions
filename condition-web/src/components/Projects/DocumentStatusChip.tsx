import { DocumentStatus } from "@/models/Document";
import { Chip } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type StyleProps = {
  sx: Record<string, string | number>;
  label: string;
};
const statusStyles: Record<DocumentStatus, StyleProps> = {
  true: {
    sx: {
      borderRadius: 1,
      border: `2px solid ${BCDesignTokens.supportBorderColorSuccess}`,
      background: BCDesignTokens.supportSurfaceColorSuccess,
    },
    label: "Approved",
  },
  false: {
    sx: {
      borderRadius: 1,
      border: `2px solid ${BCDesignTokens.themeGold100}`,
      background: BCDesignTokens.themeGold20,
    },
    label: "Awaiting Approval",
  },
  nodata: {
    sx: {
      borderRadius: 1,
      border: `2px solid ${BCDesignTokens.themeGold100}`,
      background: BCDesignTokens.themeGold20,
    },
    label: "Data Entry Required",
  },
};

export default function DocumentStatusChip({
  status,
}: {
  status: DocumentStatus;
}) {
  const style = statusStyles[status];

  return (
    <Chip
      sx={{
        ...style.sx,
      }}
      label={style.label}
    />
  );
}
