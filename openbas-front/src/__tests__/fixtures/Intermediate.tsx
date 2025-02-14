import {Provider} from "react-redux";
import {store} from "../../store";
import ConnectedIntlProvider from "../../components/AppIntlProvider";
import ConnectedThemeProvider from "../../components/AppThemeProvider";
import {CssBaseline} from "@mui/material";
import React from "react";
import {useAppDispatch} from "../../utils/hooks";
import {fetchTags} from "../../actions/Tag";
import {DATA_FETCH_SUCCESS} from "../../constants/ActionTypes";

// @ts-ignore
const TestRootComponent = ({children, testData}) => {
    return (children);
};

export default TestRootComponent;