import React, { useState } from 'react';
import { Box, Button, Stack, Tab, Tabs, TextField } from '@mui/material';
import { styled } from '@mui/system';
import { BCDesignTokens } from 'epic.theme';
import AddIcon from '@mui/icons-material/Add';
import { theme } from "@/styles/theme";

const StyledTabs = styled(Tabs)({
    transition: 'none',
    minHeight: 0,
    borderBottom: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`
});

const StyledTab = styled(Tab)(({ theme }) => ({
    height: '31px',
    minHeight: 0,
    color: theme.palette.secondary.main,
    fontWeight: 'inherit',
    backgroundColor: '#EDEBE9',
    marginRight: '4px',
    borderTopLeftRadius: '4px',
    borderTopRightRadius: '4px',
    border: '1px solid transparent',
    borderBottom: 'none',

    '&.Mui-selected': {
        color: theme.palette.primary.contrastText,
        backgroundColor: theme.palette.primary.main,
        border: `1px solid ${theme.palette.primary.main}`,
        borderBottom: 'none',
        fontWeight: 700,
    },

    '&:not(.Mui-selected)': {
        color: BCDesignTokens.surfaceColorBorderDark,
    },
}));

const ConditionInfoTabs: React.FC<{}> = ({ }) => {
    const [selectedTab, setSelectedTab] = useState('description');

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setSelectedTab(newValue);
    };

    return (
        <>
            <Stack
                direction="row"
                alignItems="center"
                sx={{
                    borderBottom: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`
                }}
            >
                <StyledTabs value={selectedTab} onChange={handleTabChange} aria-label="Condition details tabs">
                    <StyledTab label="Condition Description" value="description" />
                    <StyledTab label="Condition Attributes" value="attributes" />
                </StyledTabs>

            </Stack>
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: selectedTab === 'description' ? 'block' : 'none' }}>
                    <TextField 
                        variant="outlined" 
                        sx={{ width: '5%' }}
                    />
                    <TextField
                        variant="outlined" 
                        sx={{ width: '93%', paddingLeft: '10px' }}
                    />
                    <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        sx={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            color: BCDesignTokens.themeGray100,
                            border: `2px solid ${theme.palette.grey[700]}`,
                        }}
                    >
                        <AddIcon fontSize="small" /> Add Condition
                    </Button>
                </Box>
                <Box sx={{ display: selectedTab === 'attributes' ? 'block' : 'none' }}>
                    <TextField 
                        variant="outlined" 
                        sx={{ width: '5%' }}
                    />
                    <TextField
                        variant="outlined" 
                        sx={{ width: '93%', paddingLeft: '10px' }}
                    />
                </Box>
            </Box>
        </>
    );
};

export default ConditionInfoTabs;
