import {store} from "../../store";
import React from 'react';
import ConnectedIntlProvider from "../../components/AppIntlProvider";
import ConnectedThemeProvider from "../../components/AppThemeProvider";
import {CssBaseline} from "@mui/material";
import { Provider } from 'react-redux';
import {APP_BASE_PATH} from "../../utils/Action";
import {BrowserRouter} from "react-router";
import {useAppDispatch} from "../../utils/hooks";
import {fetchTags} from "../../actions/Tag";

// @ts-ignore
const TestRootComponent = ({children}) => {
    return (<Provider store={store}>
        <ConnectedIntlProvider>
            <ConnectedThemeProvider>
                <CssBaseline />
                {children}
            </ConnectedThemeProvider>
        </ConnectedIntlProvider>
    </Provider>);
};

export default TestRootComponent;