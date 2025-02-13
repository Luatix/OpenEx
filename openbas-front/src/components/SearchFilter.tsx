import { Search } from '@mui/icons-material';
import { InputAdornment, TextField } from '@mui/material';
import { ChangeEvent, FunctionComponent, KeyboardEvent, useCallback } from 'react';
import { makeStyles } from 'tss-react/mui';

import { debounce } from '../utils/utils';
import { useFormatter } from './i18n';

const useStyles = makeStyles()(theme => ({
  searchRoot: {
    borderRadius: 4,
    padding: '0 10px 0 10px',
    backgroundColor: theme.palette.background.paper,
  },
  searchRootTopBar: {
    borderRadius: 4,
    padding: '1px 10px 0 10px',
    marginRight: 5,
    backgroundColor: theme.palette.background.paper,
    minWidth: 550,
    width: '50%',
  },
  searchRootFullTopBar: {
    borderRadius: 4,
    padding: '1px 10px 0 10px',
    marginRight: 5,
    backgroundColor: theme.palette.background.paper,
    minWidth: 1300,
    width: '50%',
  },
  searchRootInDrawer: {
    borderRadius: 5,
    padding: '0 10px 0 10px',
    height: 30,
  },
  searchRootThin: {
    borderRadius: 5,
    padding: '0 10px 0 10px',
    height: 30,
    backgroundColor: theme.palette.background.paper,
  },
  searchRootNoAnimation: {
    borderRadius: 5,
    padding: '0 10px 0 10px',
    backgroundColor: theme.palette.background.default,
  },
  searchInput: {
    'transition': theme.transitions.create('width'),
    'width': 200,
    '&:focus': {
      width: 350,
    },
  },
  searchInputSmall: {
    'transition': theme.transitions.create('width'),
    'width': 150,
    '&:focus': {
      width: 250,
    },
  },
}));

interface Props {
  keyword?: string;
  onChange?: (value?: string) => void;
  onSubmit?: (value?: string) => void;
  variant?: string;
  fullWidth?: boolean;
  placeholder?: string;
  debounceMs?: number;
}

const SearchInput: FunctionComponent<Props> = ({
  onChange,
  onSubmit,
  variant,
  keyword,
  fullWidth,
  placeholder,
  debounceMs,
}) => {
  const { classes } = useStyles();

  const { t } = useFormatter();

  let classRoot = classes.searchRoot;
  if (variant === 'inDrawer') {
    classRoot = classes.searchRootInDrawer;
  } else if (variant === 'noAnimation') {
    classRoot = classes.searchRootNoAnimation;
  } else if (variant === 'topBar') {
    classRoot = classes.searchRootTopBar;
  } else if (variant === 'fullTopBar') {
    // FIXME: why ?
    classRoot = classes.searchRootFullTopBar;
  } else if (variant === 'thin') {
    classRoot = classes.searchRootThin;
  }

  const debouncedChangeHandler = useCallback(
    debounce(onChange!, debounceMs),
    [],
  );

  const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
    if (typeof onChange === 'function') {
      debouncedChangeHandler(target.value);
    }
  };

  return (
    <TextField
      fullWidth={fullWidth}
      name="keyword"
      defaultValue={keyword}
      variant="outlined"
      size="small"
      placeholder={placeholder || `${t('Search these results')}...`}
      onChange={handleChange}
      onKeyPress={(event: KeyboardEvent<HTMLInputElement>) => {
        if (typeof onSubmit === 'function' && event.key === 'Enter') {
          onSubmit((event.target as HTMLInputElement).value);
        }
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search fontSize="small" />
          </InputAdornment>
        ),
        classes: {
          root: classRoot,
          input:
          // eslint-disable-next-line no-nested-ternary
            variant === 'small' || variant === 'thin'
              ? classes.searchInputSmall
              : variant !== 'noAnimation'
                ? classes.searchInput
                : '',
        },
      }}
      autoComplete="off"
    />
  );
};

export default SearchInput;
