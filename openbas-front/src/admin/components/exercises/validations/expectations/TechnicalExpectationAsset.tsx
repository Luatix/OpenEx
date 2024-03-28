import React, { FunctionComponent, useState } from 'react';
import { Alert, Button, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { KeyboardArrowRightOutlined } from '@mui/icons-material';
import * as R from 'ramda';
import type { InjectExpectationsStore } from '../../../components/injects/expectations/Expectation';
import ExpectationLine from './ExpectationLine';
import Drawer from '../../../../../components/common/Drawer';
import { useFormatter } from '../../../../../components/i18n';
import type { Theme } from '../../../../../components/Theme';
import { typeIcon } from '../../../components/injects/expectations/ExpectationUtils';
import { truncate } from '../../../../../utils/String';
import type { Contract, InjectExpectationResult } from '../../../../../utils/api-types';

const useStyles = makeStyles((theme: Theme) => ({
  buttons: {
    display: 'flex',
    placeContent: 'space-between',
    gap: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  message: {
    width: '100%',
    color: theme.palette.chip.main,
  },
  marginBottom_2: {
    marginBottom: theme.spacing(2),
  },
}));

interface Props {
  expectation: InjectExpectationsStore;
  injectContract: Contract;
  gap?: number;
}

const TechnicalExpectationAsset: FunctionComponent<Props> = ({
  expectation,
  injectContract,
  gap,
}) => {
  const classes = useStyles();
  const { t } = useFormatter();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<InjectExpectationResult | null>(null);

  const toJsonFormat = (result: string) => {
    try {
      return JSON.parse(result).map((entry: string[], idx: number) => (
        <p key={idx}>{Object.entries(entry).map(([key, value]) => `${key}: ${value}\n`)}</p>
      ));
    } catch (e) {
      return (<p>{result}</p>);
    }
  };

  return (
    <>
      <ExpectationLine
        expectation={expectation}
        info={injectContract.config.label?.en}
        title={injectContract.label.en}
        icon={typeIcon(expectation.inject_expectation_type)}
        onClick={() => setOpen(true)}
        gap={gap}
      />
      <Drawer
        open={open}
        handleClose={() => setOpen(false)}
        title={t('Expectations of ') + injectContract.label.en}
      >
        <>
          <Alert
            classes={{ message: classes.message }}
            severity="info"
            icon={false}
            variant="outlined"
            className={classes.marginBottom_2}
          >
            {selected == null
              && <>
                {!R.isEmpty(expectation.inject_expectation_results)
                  && <>
                    <ListItem divider>
                      <ListItemText style={{ maxWidth: '200px' }} primary={<span>Source</span>} />
                      <ListItemText primary={<span>Result</span>} />
                      <ListItemIcon></ListItemIcon>
                    </ListItem>
                    <List
                      component="div"
                      disablePadding
                    >
                      {expectation.inject_expectation_results?.map((result) => (
                        <ListItem
                          key={result.sourceId}
                          divider
                          button
                          onClick={() => setSelected(result)}
                        >
                          <ListItemText style={{ minWidth: '200px', maxWidth: '200px' }} primary={<span>{result.sourceName}</span>} />
                          <ListItemText primary={<span>{truncate(result.result, 40)}</span>} />
                          <ListItemIcon>
                            <KeyboardArrowRightOutlined />
                          </ListItemIcon>
                        </ListItem>
                      ))}
                    </List>
                  </>
                }
                {R.isEmpty(expectation.inject_expectation_results) && t('Pending result')}
              </>
            }
            {selected !== null
              && <pre>
                {toJsonFormat(selected.result)}
              </pre>
            }
          </Alert>
          <div className={classes.buttons}>
            <div>
              {selected != null
                && <Button
                  variant="contained"
                  onClick={() => setSelected(null)}
                   >
                  {t('Back')}
                </Button>
              }
            </div>
            <Button
              color="secondary"
              variant="contained"
              onClick={() => setOpen(false)}
            >
              {t('Close')}
            </Button>
          </div>
        </>
      </Drawer>
    </>
  );
};

export default TechnicalExpectationAsset;
