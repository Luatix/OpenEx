import React, { CSSProperties, useEffect, useState } from 'react';
import { List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { AttachmentOutlined, ControlPointOutlined } from '@mui/icons-material';
import { useAppDispatch } from '../../utils/hooks';
import useDataLoader from '../../utils/hooks/useDataLoader';
import type { RawDocument } from '../../utils/api-types';
import { useHelper } from '../../store';
import type { DocumentHelper } from '../../actions/helper';
import { fetchDocuments } from '../../actions/Document';
import ItemTags from '../ItemTags';
import type { Theme } from '../Theme';
import { useFormatter } from '../i18n';
import DocumentType from '../../admin/components/components/documents/DocumentType';
import ButtonPopover, { ButtonPopoverEntry } from '../common/ButtonPopover';
import FileTransferDialog from './FileTransferDialog';

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
    fontSize: 11,
    color: theme.palette.text?.secondary,
    fontWeight: 500,
    marginTop: 20,
    marginBottom: 5,
  },
  errorText: {
    color: theme.palette.error.main,
  },
  errorMessage: {
    color: theme.palette.error.main,
    fontSize: '0.75rem',
    marginTop: 4,
  },
  errorDivider: {
    borderColor: theme.palette.error.main,
  },
}));

const inlineStyles: Record<string, CSSProperties> = {
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
  setFieldValue: (field: string, value: { id?: string, label?: string } | null) => void;
  /* For mandatory fields */
  InputLabelProps?: { required: boolean };
  onSubmit?: boolean;
}

const FileLoader: React.FC<Props> = ({
  initialValue,
  extensions = [],
  InputLabelProps,
  label,
  name,
  onSubmit,
  setFieldValue,
}) => {
  const classes = useStyles();
  const { t } = useFormatter();
  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<RawDocument | null>(null);

  // Fetching data
  const { documents }: {
    documents: [RawDocument],
  } = useHelper((helper: DocumentHelper) => ({
    documents: helper.getDocuments(),
  }));
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
    } else {
      setFieldValue(name, null);
    }
  }, [selectedDocument, setFieldValue]);

  const handleOpen = () => {
    setOpen(true);
  };

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
      <Typography
        className={`${classes.title} ${InputLabelProps?.required && !selectedDocument && onSubmit ? classes.errorText : ''}`}
      >
        {label}
        {InputLabelProps?.required
                    && <span className={!selectedDocument && onSubmit ? classes.errorText : ''}> *</span>}
      </Typography>
      <List style={{ marginTop: 0, paddingTop: 0 }}>
        {!selectedDocument && (
        <ListItem
          className={`${classes.item} ${InputLabelProps?.required && !selectedDocument && onSubmit ? classes.errorDivider : ''}`}
          divider
          onClick={handleOpen}
          color="primary"
        >
          <ListItemIcon color="primary">
            <ControlPointOutlined color="primary"/>
          </ListItemIcon>
          <ListItemText
            primary={'Add document'}
            classes={{ primary: classes.text }}
          />
        </ListItem>
        )}
        {InputLabelProps?.required && !selectedDocument && onSubmit && (
        <Typography className={classes.errorMessage}>{t('Should not be empty')}
        </Typography>
        )}
        {selectedDocument && (
        <ListItem
          classes={{ root: classes.item }}
          key={selectedDocument.document_id}
          divider
          onClick={handleOpen}
        >
          <ListItemIcon>
            <AttachmentOutlined/>
          </ListItemIcon>
          <ListItemText
            primary={
              <>
                <div className={classes.bodyItem} style={inlineStyles.document_name}>
                  {selectedDocument.document_name}
                </div>
                <div className={classes.bodyItem} style={inlineStyles.document_type}>
                  <DocumentType type={selectedDocument.document_type} variant="list"/>
                </div>
                <div className={classes.bodyItem} style={inlineStyles.document_tags}>
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
      {open && (
        <FileTransferDialog
          label={label}
          open={open}
          setOpen={setOpen}
          onAddDocument={setSelectedDocument}
          extensions={extensions}
        >
        </FileTransferDialog>)}
    </>
  );
};

export default FileLoader;
