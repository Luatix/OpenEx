import { ArticleOutlined } from '@mui/icons-material';
import { Chip, Typography } from '@mui/material';
import { type FunctionComponent } from 'react';
import { makeStyles } from 'tss-react/mui';

import { useFormatter } from '../../../components/i18n';
import { type Executor } from '../../../utils/api-types';

const useStyles = makeStyles()(() => ({
  chip: {
    height: 30,
    fontSize: 12,
    borderRadius: 4,
    marginBottom: 10,
  },
}));

interface Props {
  executor: Executor;
}

const ExecutorDocumentationLink: FunctionComponent<Props> = ({
  executor,
}) => {
  // Standard hooks
  const { t } = useFormatter();
  const { classes } = useStyles();

  if (!executor.executor_doc) {
    return null;
  }

  return (
    <div>
      <Chip
        variant="outlined"
        icon={<ArticleOutlined aria-label={t('documentation icon')} />}
        classes={{ root: classes.chip }}
        label={t('documentation')}
      />
      <Typography variant="body1">
        {t('To install the agent please follow the')}
        {' '}
        <a target="_blank" href={executor.executor_doc} rel="noreferrer">
          {executor.executor_name}
          {' '}
          {t('documentation')}
        </a>
        .
      </Typography>
    </div>
  );
};

export default ExecutorDocumentationLink;
