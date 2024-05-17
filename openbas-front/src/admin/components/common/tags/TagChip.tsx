import { Chip } from '@mui/material';
import React, { FunctionComponent } from 'react';
import { makeStyles } from '@mui/styles';
import { useHelper } from '../../../../store';
import type { TagHelper } from '../../../../actions/helper';

const useStyles = makeStyles(() => ({
  tag: {
    marginLeft: 5,
  },
}));

interface Props {
  tagId: string;
  isReadOnly: boolean;
  deleteTag: (tagId: string) => void;
}

const TagChip: FunctionComponent<Props> = ({
  tagId,
  isReadOnly,
  deleteTag,
}) => {
  // Standard hooks
  const classes = useStyles();
  const tag = useHelper((helper: TagHelper) => helper.getTag(tagId));

  if (!tag) {
    return <></>;
  }

  return (
    <Chip
      key={tag.tag_id}
      classes={{ root: classes.tag }}
      label={tag.tag_name}
      onDelete={isReadOnly
        ? (() => {
        })
        : () => deleteTag(tag.tag_id)}
    />
  );
};

export default TagChip;
