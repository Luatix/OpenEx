import {store} from "../../store";
import React from 'react';
import ConnectedIntlProvider from "../../components/AppIntlProvider";
import ConnectedThemeProvider from "../../components/AppThemeProvider";
import {CssBaseline} from "@mui/material";
import { Provider } from 'react-redux';
import TestContext from './TestContext'
import {APP_BASE_PATH} from "../../utils/Action";
import {BrowserRouter} from "react-router";

// @ts-ignore
const TestRootComponent = ({children}) => {
    let component;
    return (<Provider store={store}>
        <BrowserRouter basename={"to"}>
        <TestContext.Provider value={{}}>
            <ConnectedIntlProvider>
                <ConnectedThemeProvider>
                    <CssBaseline />
                    {children}
                </ConnectedThemeProvider>
            </ConnectedIntlProvider>
        </TestContext.Provider>
        </BrowserRouter>
    </Provider>);
};

export default TestRootComponent;