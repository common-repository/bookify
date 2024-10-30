import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
    Stack, Typography, Divider, Box, FormControl,
    TextField, InputAdornment, Button, Grid, Paper,
    SvgIcon
} from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import SearchIcon from '@mui/icons-material/Search';
import TaskIcon from '@mui/icons-material/Task';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import { ReactComponent as UpgradeIcon } from '../../assets/upgrade.svg';

class Location extends Component {

    state = {
        theme: createTheme({
            typography: {
                h2: {
                    fontSize: '2.5em',
                    textTransform: 'capitalize',
                },
            },
        }),
    };

    componentDidMount() {
        const title = window.wp.hooks.applyFilters('bookify_location_title', 'Location');
        this.setState({ title });
    }

    render() {

        const { theme, title } = this.state;

        return (
            <ThemeProvider theme={theme}>
                <Stack spacing={2} mt={2} mb={2} direction="row" alignItems="center">
                    <SortIcon fontSize="large" />
                    <Typography variant="h2">{title}</Typography>
                </Stack>

                <Divider variant="middle" />

                <Box component="section">
                    <Box
                        component="div"
                        sx={{
                            ml: '1em',
                            mr: '2em',
                            mb: '2em',
                            mt: '2em',
                            backgroundColor: '#FFFFFF',
                            p: '23px',
                            borderRadius: '5px',
                        }}
                    >
                        <Grid container spacing={5}>
                            <Grid item 
                                md={9} 
                                sx={{
                                    display: "grid",
                                    justifyItems: "stretch",
                                    alignItems: "center"
                                }}
                            >
                                <FormControl>
                                    <TextField
                                        disabled
                                        variant="outlined"
                                        placeholder="Search locations"
                                        sx={{
                                            borderColor: '#D9D9D9', 
                                            '&.Mui-disabled': {
                                                opacity: "0.5",
                                            } 
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start" sx={{ color: '#036666' }}>
                                                    <SearchIcon />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid item 
                                md={1.5} 
                                sx={{
                                    display: "grid",
                                    justifyItems: "stretch",
                                    alignItems: "center"
                                }}
                            >
                                <Button
                                    disabled
                                    variant="outlined"
                                    startIcon={<TaskIcon />}
                                    sx={{
                                        borderColor: '#D9D9D9',
                                        color: '#036666',
                                        textTransform: 'capitalize',
                                        height: '4em',
                                        '&.Mui-disabled': {
                                            color: '#036666',
                                            opacity: "0.5",
                                        }
                                    }}
                                    >
                                        {__('Export to CSV', 'bookify')}
                                </Button>
                            </Grid>
                            <Grid item 
                                md={1.5} 
                                sx={{
                                    display: "grid",
                                    justifyItems: "stretch",
                                    alignItems: "center"
                                }}
                            >
                                <Button
                                    disabled
                                    variant="outlined"
                                    startIcon={<AddLocationIcon />}
                                    sx={{
                                        borderColor: '#ff6c22',
                                        backgroundColor: '#ff6c22',
                                        color: '#ffffff',
                                        textTransform: 'capitalize',
                                        padding: "14px 21px",
                                        '&:hover': {
                                            color: '#036666',
                                        },
                                        '&.Mui-disabled': {
                                            color: '#ffffff',
                                            opacity: "0.5",
                                        }
                                    }}
                                >
                                    {__('Add Location', 'bookify')}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                    <Box component="div" sx={{ ml: '1em', mr: '2em', mb: '2em', mt: '2em' }}>
                        <Paper elevation={0} sx={{height:"35rem", p:"25px", display:"flex", alignItems:"center", justifyContent:"center"}}>
                            <Box component="div" sx={{textAlign:"center"}}>
                                <SvgIcon component={UpgradeIcon} viewBox="100 10 10 200" sx={{height:"10em", width:"12em"}}/>
                                <Typography variant="h6" sx={{ mb: 1 }}>{__('Interested in unlocking this feature?', 'bookify')}</Typography>
                                <Typography variant="body1" sx={{ mb: 2 }}>{__('Available in Pro Version', 'bookify')}</Typography>
                                <Button 
                                    variant="contained" 
                                    href={'https://wpbookify.com/pricing'}
                                    component="a"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: '#539ff5',
                                            color: '#FFFFFF'
                                        },
                                    }}
                                >
                                        {__('Upgrade', 'bookify')}
                                </Button>
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            </ThemeProvider>
        )
    }
}

export default Location;