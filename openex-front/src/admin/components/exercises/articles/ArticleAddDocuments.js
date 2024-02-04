import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as R from 'ramda';
import { Button, Chip, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, Box, ListItemIcon, Grid } from '@mui/material';
import { ControlPointOutlined, DescriptionOutlined } from '@mui/icons-material';
import withStyles from '@mui/styles/withStyles';
import SearchFilter from '../../../../components/SearchFilter';
import article18n from '../../../../components/i18n';
import { storeHelper } from '../../../../actions/Schema';
import { fetchDocuments } from '../../../../actions/Document';
import CreateDocument from '../../components/documents/CreateDocument';
import { truncate } from '../../../../utils/String';
import { isExerciseReadOnly } from '../../../../utils/Exercise';
import Transition from '../../../../components/common/Transition';
import TagsFilter from '../../../../components/TagsFilter';
import ItemTags from '../../../../components/ItemTags';

const styles = (theme) => ({
  createButton: {
    position: 'fixed',
    bottom: 30,
    right: 30,
  },
  box: {
    width: '100%',
    minHeight: '100%',
    padding: 20,
    border: '1px dashed rgba(255, 255, 255, 0.3)',
  },
  chip: {
    margin: '0 10px 10px 0',
  },
  item: {
    paddingLeft: 10,
    height: 50,
  },
  text: {
    fontSize: 15,
    color: theme.palette.primary.main,
    fontWeight: 500,
  },
});

class ArticleAddDocuments extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      keyword: '',
      documentsIds: [],
      tags: [],
    };
  }

  componentDidMount() {
    this.props.fetchDocuments();
  }

  handleOpen() {
    this.setState({ open: true });
  }

  handleClose() {
    this.setState({ open: false, keyword: '', documentsIds: [] });
  }

  handleSearchDocuments(value) {
    this.setState({ keyword: value });
  }

  handleAddTag(value) {
    if (value) {
      this.setState({ tags: [value] });
    }
  }

  handleClearTag() {
    this.setState({ tags: [] });
  }

  addDocument(documentId) {
    this.setState({
      documentsIds: R.append(documentId, this.state.documentsIds),
    });
  }

  removeDocument(documentId) {
    this.setState({
      documentsIds: R.filter((u) => u !== documentId, this.state.documentsIds),
    });
  }

  submitAddDocuments() {
    this.props.handleAddDocuments(this.state.documentsIds);
    this.handleClose();
  }

  onCreate(result) {
    this.addDocument(result);
  }

  render() {
    const {
      classes,
      t,
      documents,
      articleDocumentsIds,
      exercise,
      channelType,
    } = this.props;
    const { keyword, documentsIds, tags } = this.state;
    const filterByKeyword = (n) => keyword === ''
      || (n.document_name || '').toLowerCase().indexOf(keyword.toLowerCase())
        !== -1
      || (n.document_description || '')
        .toLowerCase()
        .indexOf(keyword.toLowerCase()) !== -1
      || (n.document_type || '').toLowerCase().indexOf(keyword.toLowerCase())
        !== -1;
    const filteredDocuments = R.pipe(
      R.filter(
        (n) => tags.length === 0
          || R.any(
            (filter) => R.includes(filter, n.document_tags),
            R.pluck('id', tags),
          ),
      ),
      R.filter(filterByKeyword),
    )(Object.values(documents));
    let finalDocuments = R.take(10, filteredDocuments);
    let filters = null;
    if (channelType === 'newspaper') {
      finalDocuments = R.take(
        10,
        filteredDocuments.filter((d) => d.document_type.includes('image/')),
      );
      filters = ['image/'];
    } else if (channelType === 'microblogging') {
      finalDocuments = R.take(
        10,
        filteredDocuments.filter(
          (d) => d.document_type.includes('image/')
            || d.document_type.includes('video/'),
        ),
      );
      filters = ['image/', 'video/'];
    } else if (channelType === 'tv') {
      finalDocuments = R.take(
        10,
        filteredDocuments.filter((d) => d.document_type.includes('video/')),
      );
      filters = ['video/'];
    }
    return (
      <div>
        <ListItem
          classes={{ root: classes.item }}
          button={true}
          divider={true}
          onClick={this.handleOpen.bind(this)}
          color="primary"
          disabled={isExerciseReadOnly(exercise)}
        >
          <ListItemIcon color="primary">
            <ControlPointOutlined color="primary" />
          </ListItemIcon>
          <ListItemText
            primary={t('Add documents')}
            classes={{ primary: classes.text }}
          />
        </ListItem>
        <Dialog
          open={this.state.open}
          TransitionComponent={Transition}
          onClose={this.handleClose.bind(this)}
          fullWidth={true}
          maxWidth="lg"
          PaperProps={{
            elevation: 1,
            sx: {
              minHeight: 580,
              maxHeight: 580,
            },
          }}
        >
          <DialogTitle>{t('Add documents in this channel pressure')}</DialogTitle>
          <DialogContent>
            <Grid container={true} spacing={3} style={{ marginTop: -15 }}>
              <Grid item={true} xs={8}>
                <Grid container={true} spacing={3}>
                  <Grid item={true} xs={6}>
                    <SearchFilter
                      onChange={this.handleSearchDocuments.bind(this)}
                      fullWidth={true}
                    />
                  </Grid>
                  <Grid item={true} xs={6}>
                    <TagsFilter
                      onAddTag={this.handleAddTag.bind(this)}
                      onClearTag={this.handleClearTag.bind(this)}
                      currentTags={tags}
                      fullWidth={true}
                    />
                  </Grid>
                </Grid>
                <List>
                  {finalDocuments.map((document) => {
                    const disabled = documentsIds.includes(document.document_id)
                      || articleDocumentsIds.includes(document.document_id);
                    return (
                      <ListItem
                        key={document.document_id}
                        disabled={disabled}
                        button={true}
                        divider={true}
                        dense={true}
                        onClick={this.addDocument.bind(
                          this,
                          document.document_id,
                        )}
                      >
                        <ListItemIcon>
                          <DescriptionOutlined />
                        </ListItemIcon>
                        <ListItemText
                          primary={document.document_name}
                          secondary={document.document_description}
                        />
                        <ItemTags
                          variant="list"
                          tags={document.document_tags}
                        />
                      </ListItem>
                    );
                  })}
                  <CreateDocument
                    exercise={exercise}
                    inline={true}
                    onCreate={this.onCreate.bind(this)}
                    filters={filters}
                  />
                </List>
              </Grid>
              <Grid item={true} xs={4}>
                <Box className={classes.box}>
                  {this.state.documentsIds.map((documentId) => {
                    const document = documents[documentId];
                    return (
                      <Chip
                        key={documentId}
                        onDelete={this.removeDocument.bind(this, documentId)}
                        label={truncate(document.document_name, 22)}
                        icon={<DescriptionOutlined />}
                        classes={{ root: classes.chip }}
                      />
                    );
                  })}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose.bind(this)}>{t('Cancel')}</Button>
            <Button
              color="secondary"
              onClick={this.submitAddDocuments.bind(this)}
            >
              {t('Add')}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

ArticleAddDocuments.propTypes = {
  t: PropTypes.func,
  exerciseId: PropTypes.string,
  exercise: PropTypes.object,
  fetchDocuments: PropTypes.func,
  documents: PropTypes.object,
  articleDocumentsIds: PropTypes.array,
  handleAddDocuments: PropTypes.func,
};

const select = (state, ownProps) => {
  const helper = storeHelper(state);
  const { exerciseId } = ownProps;
  const exercise = helper.getExercise(exerciseId);
  const documents = helper.getDocumentsMap();
  return { exercise, documents };
};

export default R.compose(
  connect(select, { fetchDocuments }),
  article18n,
  withStyles(styles),
)(ArticleAddDocuments);
