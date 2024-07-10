import React, { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { AttachmentOutlined, ControlPointOutlined, DescriptionOutlined } from '@mui/icons-material';
import { useAppDispatch } from '../../utils/hooks';
import useDataLoader from '../../utils/hooks/useDataLoader';
import type { RawDocument } from '../../utils/api-types';
import { useHelper } from '../../store';
import type { DocumentHelper, UserHelper } from '../../actions/helper';
import { fetchDocuments } from '../../actions/Document';
import Transition from '../common/Transition';
import SearchFilter from '../SearchFilter';
import TagsFilter from '../../admin/components/common/filters/TagsFilter';
import ItemTags from '../ItemTags';
import CreateDocument from '../../admin/components/components/documents/CreateDocument';
import type { Theme } from '../Theme';
import { useFormatter } from '../i18n';
import DocumentType from '../../admin/components/components/documents/DocumentType';
import ButtonPopover, { ButtonPopoverEntry } from '../common/ButtonPopover';

const useStyles = makeStyles((theme: Theme) => ({
  bodyItem: {
    height: '100%',
    fontSize: 13,
  },
  item: {
    paddingLeft: 10,
    height: 50,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action?.hover,
    },
  },
  text: {
    fontSize: 15,
    color: theme.palette.primary.main,
    fontWeight: 500,
  },
  title: {
    fontSize: '0.7 rem',
    color: theme.palette.text?.secondary,
    fontWeight: 500,
    marginTop: 20,
    marginBottom: 10,
  },
}));

const inlineStyles = {
  document_name: {
    float: 'left',
    width: '35%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  document_type: {
    float: 'left',
    width: '20%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  document_tags: {
    float: 'left',
    width: '30%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

interface Props {
  initialValue?: { id?: string, label?: string };
  extensions?: string[];
  label: string;
  name: string;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  setFieldValue: (field: string, value: any) => void;
  InputLabelProps?: { required: boolean }
}

const DocumentLoader: React.FC<Props> = ({ initialValue, extensions = [], InputLabelProps, label, name, setFieldValue }) => {
  const classes = useStyles();
  const { t } = useFormatter();

  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState<string>('');
  const [tags, setTags] = useState<{ id: string, label: string, color: string }[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<RawDocument | null>(null);

  // Fetching data
  const { documents, userAdmin }: { documents: [RawDocument], userAdmin: string } = useHelper((helper: DocumentHelper & UserHelper) => ({
    documents: helper.getDocuments(),
    userAdmin: helper.getMe()?.user_admin,
  }));
  const dispatch = useAppDispatch();
  useDataLoader(() => {
    dispatch(fetchDocuments());
  });

  useEffect(() => {
    if (initialValue?.id && documents.length > 0) {
      const resolvedDocument = documents.find((doc) => doc.document_id === initialValue.id);
      if (resolvedDocument) {
        setSelectedDocument(resolvedDocument);
      }
    }
  }, [documents]);

  useEffect(() => {
    if (selectedDocument) {
      setFieldValue(name, { id: selectedDocument.document_id, label: selectedDocument.document_name });
      setTags([]);
      setKeyword('');
    } else {
      setFieldValue(name, null);
    }
  }, [selectedDocument, setFieldValue]);

  const filterByKeyword = (n: RawDocument) => keyword === ''
      || n.document_name?.toLowerCase().includes(keyword.toLowerCase())
      || n.document_description?.toLowerCase().includes(keyword.toLowerCase())
      || n.document_type?.toLowerCase().includes(keyword.toLowerCase());

  const filterByExtensions = (n: RawDocument) => extensions.length === 0
      || extensions.map((ext) => ext.toLowerCase()).includes(n.document_name?.split('.').pop()?.toLowerCase() || '');

  const filteredDocuments = documents.filter((doc) => {
    return (!tags.length || tags.every((tag) => doc.document_tags?.includes(tag.id)))
        && filterByKeyword(doc)
        && filterByExtensions(doc);
  }).slice(0, 10);

  const handleClose = () => {
    setOpen(false);
    setTags([]);
    setKeyword('');
  };

  const handleSearchDocuments = (value?: string) => {
    setKeyword(value || '');
  };

  const addDocument = (document: RawDocument) => {
    setSelectedDocument(document);
    handleClose();
  };

  const handleAddTag = (value: { id: string, label: string, color: string }) => {
    if (!tags.includes(value)) {
      setTags([...tags, value]);
    }
  };

  const handleClearTag = () => setTags([]);

  // Actions
  const handleUpdate = () => setOpen(true);
  const handleRemove = () => setSelectedDocument(null);
  const handleDownload = (documentId: string | undefined) => {
    if (documentId) {
      window.location.href = `/api/documents/${documentId}/file`;
    }
  };

  // Button Popover entries
  const entries: ButtonPopoverEntry[] = [
    { label: 'Update', action: handleUpdate },
    { label: 'Remove', action: handleRemove },
    { label: 'Download', action: () => handleDownload(selectedDocument?.document_id) },
  ];

  return (
    <>
      <Typography className={classes.title}>
        {label}
        {InputLabelProps?.required && <span> *</span>}
      </Typography>
      <List style={{ marginTop: 0, paddingTop: 0 }}>
        {!selectedDocument && (
          <ListItem
            classes={{ root: classes.item }}
            divider
            onClick={() => setOpen(true)}
            color="primary"
          >
            <ListItemIcon color="primary">
              <ControlPointOutlined color="primary"/>
            </ListItemIcon>
            <ListItemText
              primary={t('Add document')}
              classes={{ primary: classes.text }}
            />
          </ListItem>)}
        {selectedDocument && (
          <ListItem
            classes={{ root: classes.item }}
            key={selectedDocument.document_id}
            divider
            onClick={() => setOpen(true)}
          >
            <ListItemIcon>
              <AttachmentOutlined/>
            </ListItemIcon>
            <ListItemText
              primary={
                <>
                  <div className={classes.bodyItem}
                            /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
                            // @ts-ignore
                    style={inlineStyles.document_name}
                  >
                    {selectedDocument.document_name}
                  </div>
                  <div className={classes.bodyItem}
                            /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
                            // @ts-ignore
                    style={inlineStyles.document_type}
                  >
                    <DocumentType type={selectedDocument.document_type} variant="list"/>
                  </div>
                  <div className={classes.bodyItem}
                            /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
                            // @ts-ignore
                    style={inlineStyles.document_tags}
                  >
                    <ItemTags
                      variant="reduced-view"
                      tags={selectedDocument.document_tags}
                    />
                  </div>
                </>
                    }
            />
            <ListItemSecondaryAction>
              <ButtonPopover
                entries={entries}
                buttonProps={{
                  color: 'primary',
                  size: 'large',
                  /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
                  // @ts-ignore
                  borderRadius: '50%',
                  border: 'none',
                  padding: '12px',
                }}
              />
            </ListItemSecondaryAction>
          </ListItem>)}
      </List>
      <Dialog
        open={open}
        onClose={handleClose}
        TransitionComponent={Transition}
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
        <DialogTitle>{t(label)}</DialogTitle>
        <DialogContent>
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
            {filteredDocuments.map((document: RawDocument) => {
              return (
                <ListItem
                  classes={{ root: classes.item }}
                  key={document.document_id}
                  divider
                  onClick={() => addDocument(document)}
                >
                  <ListItemIcon>
                    <DescriptionOutlined/>
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
            {userAdmin && (
              <CreateDocument
                inline
                onCreate={addDocument}
              />
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t('Cancel')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DocumentLoader;
