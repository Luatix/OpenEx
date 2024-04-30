import React, { useContext, useState } from 'react';
import * as R from 'ramda';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { ControlPointOutlined, DescriptionOutlined } from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import SearchFilter from '../../../../components/SearchFilter';
import { useFormatter } from '../../../../components/i18n';
import { fetchDocuments } from '../../../../actions/Document';
import CreateDocument from '../../components/documents/CreateDocument';
import { truncate } from '../../../../utils/String';
import Transition from '../../../../components/common/Transition';
import TagsFilter from '../../../../components/TagsFilter';
import ItemTags from '../../../../components/ItemTags';
import { useHelper } from '../../../../store';
import useDataLoader from '../../../../utils/ServerSideEvent';
import { useAppDispatch } from '../../../../utils/hooks';
import { PermissionsContext } from '../Context';

const useStyles = makeStyles((theme) => ({
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
}));

const ArticleAddDocuments = (props) => {
  const { handleAddDocuments, articleDocumentsIds, channelType } = props;
  // Standard hooks
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const { t } = useFormatter();

  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [documentsIds, setDocumentsIds] = useState([]);
  const [tags, setTags] = useState([]);

  // Fetching data
  const { documents } = useHelper((helper) => ({
    documents: helper.getDocumentsMap(),
  }));
  useDataLoader(() => {
    dispatch(fetchDocuments());
  });

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setKeyword('');
    setDocumentsIds([]);
  };

  const handleSearchDocuments = (value) => {
    setKeyword(value);
  };

  const handleAddTag = (value) => {
    if (value) {
      setTags([value]);
    }
  };

  const handleClearTag = () => {
    setTags([]);
  };

  const addDocument = (documentId) => {
    setDocumentsIds(R.append(documentId, documentsIds));
  };

  const removeDocument = (documentId) => {
    setDocumentsIds(R.filter((u) => u !== documentId, documentsIds));
  };

  const submitAddDocuments = () => {
    handleAddDocuments(documentsIds);
    handleClose();
  };

  const onCreate = (result) => {
    addDocument(result.document_id);
  };
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

  // Context
  const { permissions } = useContext(PermissionsContext);

  return (
    <div>
      <ListItem
        classes={{ root: classes.item }}
        button
        divider
        onClick={handleOpen}
        color="primary"
        disabled={!permissions.canWrite}
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
        open={open}
        TransitionComponent={Transition}
        onClose={handleClose}
        fullWidth
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
          <Grid container spacing={3} style={{ marginTop: -15 }}>
            <Grid item xs={8}>
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <SearchFilter
                    onChange={handleSearchDocuments}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TagsFilter
                    onAddTag={handleAddTag}
                    onClearTag={handleClearTag}
                    currentTags={tags}
                    fullWidth
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
                      button
                      divider
                      dense
                      onClick={() => addDocument(document.document_id)}
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
                  inline
                  onCreate={onCreate}
                  filters={filters}
                />
              </List>
            </Grid>
            <Grid item xs={4}>
              <Box className={classes.box}>
                {documentsIds.map((documentId) => {
                  const document = documents[documentId];
                  return (
                    <Chip
                      key={documentId}
                      onDelete={() => removeDocument(documentId)}
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
          <Button onClick={handleClose}>{t('Cancel')}</Button>
          <Button
            color="secondary"
            onClick={submitAddDocuments}
          >
            {t('Add')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ArticleAddDocuments;
