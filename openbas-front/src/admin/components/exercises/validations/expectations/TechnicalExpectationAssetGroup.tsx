import React, { FunctionComponent } from 'react';
import { ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { DnsOutlined } from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import type { InjectExpectationsStore } from '../../../components/injects/expectations/Expectation';
import type { Contract, Team } from '../../../../../utils/api-types';
import ExpectationLine from './ExpectationLine';
import { typeIcon } from '../../../components/injects/expectations/ExpectationUtils';
import type { EndpointStore } from '../../../assets/endpoints/Endpoint';
import TechnicalExpectationAsset from './TechnicalExpectationAsset';
import { useHelper } from '../../../../../store';
import type { EndpointsHelper } from '../../../../../actions/assets/asset-helper';
import type { AssetGroupStore } from '../../../assets/asset_groups/AssetGroup';
import groupedByAsset from './ExpectationUtils';

const useStyles = makeStyles(() => ({
  item: {
    height: 40,
  },
  bodyItem: {
    height: '100%',
    float: 'left',
    fontSize: 13,
  },
}));

interface Props {
  expectation: InjectExpectationsStore;
  injectContract: Contract;
  relatedExpectations: InjectExpectationsStore[];
  team: Team;
  assetGroup: AssetGroupStore;
}

const TechnicalExpectationAssetGroup: FunctionComponent<Props> = ({
  expectation,
  injectContract,
  relatedExpectations,
  team,
  assetGroup,
}) => {
  // Standard hooks
  const classes = useStyles();

  // Fetching data
  const {
    assetsMap,
  } = useHelper((helper: EndpointsHelper) => {
    return {
      assetsMap: helper.getEndpointsMap(),
    };
  });

  return (
    <>
      <ExpectationLine
        expectation={expectation}
        info={injectContract.config.label?.en}
        title={injectContract.label.en}
        icon={typeIcon(expectation.inject_expectation_type)}
      />
      {Array.from(groupedByAsset(relatedExpectations)).map(([groupedId, groupedExpectations]) => {
        const relatedAsset: EndpointStore = assetsMap[groupedId];
        return (
          <div key={relatedAsset?.asset_id}>
            <ListItem
              divider
              sx={{ pl: 12 }}
              classes={{ root: classes.item }}
            >
              <ListItemIcon>
                {!!relatedAsset && <DnsOutlined fontSize="small" />}
              </ListItemIcon>
              <ListItemText
                primary={
                  <div className={classes.bodyItem} style={{ width: '20%' }}>
                    {team?.team_name || relatedAsset?.asset_name || assetGroup?.asset_group_name}
                  </div>
                }
              />
            </ListItem>
            {groupedExpectations.map((e: InjectExpectationsStore) => (
              <TechnicalExpectationAsset key={e.inject_expectation_id} expectation={e} injectContract={injectContract} gap={16} />
            ))}
          </div>
        );
      })}
    </>
  );
};

export default TechnicalExpectationAssetGroup;
