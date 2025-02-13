import { Breadcrumbs as MUIBreadcrumbs, Typography } from '@mui/material';
import { type FunctionComponent } from 'react';
import { Link } from 'react-router';
import { makeStyles } from 'tss-react/mui';

import { truncate } from '../utils/String';

export const BACK_LABEL = 'backlabel';
export const BACK_URI = 'backuri';

export interface BreadcrumbsElement {
  label: string;
  link?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  variant: 'standard' | 'list' | 'object';
  elements: BreadcrumbsElement[];
}

const useStyles = makeStyles()(() => ({
  breadcrumbsList: {
    marginTop: -5,
    marginBottom: 15,
  },
  breadcrumbsObject: {
    marginTop: -5,
    marginBottom: 15,
  },
  breadcrumbsStandard: {
    marginTop: -5,
  },
}));

const Breadcrumbs: FunctionComponent<BreadcrumbsProps> = ({ elements, variant }) => {
  const { classes } = useStyles();
  let className = classes.breadcrumbsStandard;
  if (variant === 'list') {
    className = classes.breadcrumbsList;
  } else if (variant === 'object') {
    className = classes.breadcrumbsObject;
  }
  return (
    <MUIBreadcrumbs classes={{ root: className }}>
      {elements.map((element) => {
        if (element.current) {
          return (
            <Typography key={element.label} color="text.primary">{truncate(element.label, 26)}</Typography>
          );
        }
        if (!element.link) {
          return (
            <Typography key={element.label} color="inherit">{truncate(element.label, 26)}</Typography>
          );
        }
        return (
          <Link key={element.label} to={element.link}>{truncate(element.label, 26)}</Link>
        );
      })}
    </MUIBreadcrumbs>
  );
};

export default Breadcrumbs;
