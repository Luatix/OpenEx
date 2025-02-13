import { DevicesOtherOutlined, Groups3Outlined, PersonOutlined } from '@mui/icons-material';
import { Divider, ListItemButton, ListItemIcon, ListItemText, Paper } from '@mui/material';
import { SelectGroup } from 'mdi-material-ui';
import { FunctionComponent } from 'react';
import { makeStyles } from 'tss-react/mui';

import PlatformIcon from '../../../../components/PlatformIcon';
import type { InjectTargetWithResult } from '../../../../utils/api-types';
import AtomicTestingResult from './AtomicTestingResult';

const useStyles = makeStyles()(() => ({
  bodyTarget: {
    fontSize: 13,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    verticalAlign: 'middle',
    textOverflow: 'ellipsis',
  },
  dividerL: {
    position: 'absolute',
    backgroundColor: 'rgba(105, 103, 103, 0.45)',
    width: '2px',
    bottom: '0',
    left: '30px',
    height: '99%',
  },
}));

interface Props {
  selected?: boolean;
  isChild?: boolean;
  onClick: (target: InjectTargetWithResult) => void;
  target: InjectTargetWithResult;
}

const TargetListItem: FunctionComponent<Props> = ({ isChild, onClick, target, selected }) => {
  const { classes } = useStyles();
  const style = isChild ? { marginBottom: 10, marginLeft: 50 } : { marginBottom: 10 };
  const handleItemClick = () => {
    onClick(target);
  };
  // Icon
  const getIcon = (type: string | undefined) => {
    if (type === 'ASSETS') {
      return <DevicesOtherOutlined />;
    }
    if (type === 'ASSETS_GROUPS') {
      return <SelectGroup />;
    }
    if (isChild) {
      return <PersonOutlined fontSize="small" />; // Player in a team
    }
    return <Groups3Outlined />;
  };
  return (
    <>
      {isChild && <Divider className={classes.dividerL} />}
      <Paper elevation={1} style={style} key={target?.id}>
        <ListItemButton onClick={handleItemClick} style={{ marginBottom: 15 }} selected={selected}>
          <ListItemIcon>
            {getIcon(target?.targetType)}
          </ListItemIcon>
          <ListItemText
            primary={(
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className={classes.bodyTarget} style={{ width: '50%' }}>
                  {target?.name}
                </div>
                <div className={classes.bodyTarget} style={{ width: '30%', display: 'flex', alignItems: 'center' }}>
                  <PlatformIcon platform={target?.platformType ?? 'Unknown'} width={20} marginRight={10} />
                  {target?.platformType ?? 'Unknown'}
                </div>
                <div className={classes.bodyTarget} style={{ width: '20%' }}>
                  <AtomicTestingResult expectations={target?.expectationResultsByTypes} />
                </div>
              </div>
            )}
          />
        </ListItemButton>
      </Paper>
    </>
  );
};

export default TargetListItem;
