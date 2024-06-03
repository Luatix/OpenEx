import React, { Component } from 'react';
import * as R from 'ramda';
import { Box } from '@mui/material';
import { withStyles } from '@mui/styles';
import { connect } from 'react-redux';
import { FileOutline } from 'mdi-material-ui';
import { addDocument, fetchDocuments } from '../actions/Document';
import Autocomplete from './Autocomplete';
import inject18n from './i18n';
import { storeHelper } from '../actions/Schema';

const styles = () => ({
  icon: {
    paddingTop: 4,
    display: 'inline-block',
  },
  text: {
    display: 'inline-block',
    flexGrow: 1,
    marginLeft: 10,
  },
  autoCompleteIndicator: {
    display: 'none',
  },
});

class DocumentField extends Component {
  constructor(props) {
    super(props);
    this.state = { documentInput: '' };
  }

  componentDidMount() {
    this.props.fetchDocuments();
  }

  render() {
    const { t, name, documents, classes } = this.props;
    const documentsOptions = R.map(
      (n) => ({
        id: n.document_id,
        label: n.document_name,
      }),
      documents,
    );
    return (
      <div>
        <Autocomplete
          variant="standard"
          size="small"
          name={name}
          fullWidth={true}
          multiple={false}
          label={t('Document')}
          options={documentsOptions}
          style={{ marginTop: 20 }}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <div className={classes.icon}>
                <FileOutline />
              </div>
              <div className={classes.text}>{option.label}</div>
            </Box>
          )}
          classes={{ clearIndicator: classes.autoCompleteIndicator }}
        />
      </div>
    );
  }
}

const select = (state) => {
  const helper = storeHelper(state);
  return {
    documents: helper.getDocuments(),
  };
};

export default R.compose(
  connect(select, { fetchDocuments, addDocument }),
  inject18n,
  withStyles(styles),
)(DocumentField);
