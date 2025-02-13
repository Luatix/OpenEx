import { Box } from '@mui/material';
import { Fragment, type FunctionComponent, useEffect } from 'react';
import { makeStyles } from 'tss-react/mui';

import { type Filter, type PropertySchemaDTO } from '../../../../utils/api-types';
import { type Option } from '../../../../utils/Option';
import { useFormatter } from '../../../i18n';
import { convertOperatorToIcon } from './FilterUtils';
import useRetrieveOptions from './useRetrieveOptions';

const useStyles = makeStyles()(theme => ({
  mode: {
    display: 'inline-block',
    height: '100%',
    backgroundColor: theme.palette.action?.selected,
    margin: '0 4px',
    padding: '0 4px',
  },
  container: {
    gap: '4px',
    display: 'flex',
    alignItems: 'center',
    lineHeight: '32px',
    maxWidth: '400px',
  },
  label: {
    'cursor': 'pointer',
    '&:hover': {
      textDecorationLine: 'underline',
    },
  },
}));

interface Props {
  filter: Filter;
  propertySchema?: PropertySchemaDTO;
  isTooltip?: boolean;
  handleOpen?: () => void;
}

const FilterChipValues: FunctionComponent<Props> = ({
  filter,
  propertySchema,
  isTooltip = false,
  handleOpen,
}) => {
  // Standard hooks
  const { t, fldt } = useFormatter();
  const { classes, cx } = useStyles();

  const { options, searchOptions } = useRetrieveOptions();

  useEffect(() => {
    if (filter.values) {
      searchOptions(filter.key, filter.values);
    }
  }, [filter]);

  const or = (
    <div className={classes.mode}>
      {t('OR')}
    </div>
  );

  const toValues = (opts: Option[]) => opts.map((o, idx) => (
    <Fragment key={o.id}>
      {idx > 0 && or}
      <span>
        {' '}
        {propertySchema?.schema_property_type.includes('instant') || !o.label ? (o.label) : t(o.label)}
      </span>
    </Fragment>
  ));

  const operator = filter.operator ?? 'eq';
  const isOperatorNil = ['empty', 'not_empty'].includes(operator);
  if (isOperatorNil) {
    return (
      <>
        <strong
          className={cx({ [classes.label]: !!handleOpen })}
          onClick={handleOpen}
        >
          {t(filter.key)}
        </strong>
        {' '}
        <span>
          {operator === 'empty' ? t('is empty') : t('is not empty')}
        </span>
      </>
    );
  }

  if (isTooltip) {
    let str = '';
    options.forEach((o, idx) => {
      if (idx > 0) {
        str = `${str} ${t('OR')}`;
      }
      if (propertySchema?.schema_property_type.includes('instant')) {
        str = `${str} ${o.label ? fldt(o.label) : o.label}`;
      } else {
        str = `${str} ${o.label ? t(o.label) : o.label}`;
      }
    });
    return str;
  }

  return (
    (
      <span className={classes.container}>
        <strong
          className={cx({ [classes.label]: !!handleOpen })}
          onClick={handleOpen}
        >
          {t(filter.key)}
          {convertOperatorToIcon(t, filter.operator)}
        </strong>
        {' '}
        <Box sx={{ display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
          {toValues(options)}
        </Box>
      </span>
    )
  );
};

export default FilterChipValues;
