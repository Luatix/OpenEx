import { AttachMoneyOutlined, EmojiEventsOutlined, GroupsOutlined } from '@mui/icons-material';
import { NewspaperVariantMultipleOutline } from 'mdi-material-ui';
import { FunctionComponent } from 'react';

import RightMenu, { RightMenuEntry } from '../../../../components/common/menu/RightMenu';
import type { Exercise, Scenario } from '../../../../utils/api-types';

interface Numbers {
  teamsNumber?: number;
  mediaPressureNumber?: number;
  challengesNumber?: number;
  variablesNumber?: number;
}

interface Props {
  base: string;
  id: Exercise['exercise_id'] | Scenario['scenario_id'];
  numbers?: Numbers;
}

const DefinitionMenu: FunctionComponent<Props> = ({ base, id, numbers }) => {
  const entries: RightMenuEntry[] = [
    {
      path: `${base}/${id}/definition/teams`,
      icon: () => (<GroupsOutlined />),
      label: 'Teams',
      number: numbers?.teamsNumber,
    },
    {
      path: `${base}/${id}/definition/articles`,
      icon: () => (<NewspaperVariantMultipleOutline />),
      label: 'Media pressure',
      number: numbers?.mediaPressureNumber,
    },
    {
      path: `${base}/${id}/definition/challenges`,
      icon: () => (<EmojiEventsOutlined />),
      label: 'Challenges',
      number: numbers?.challengesNumber,
    },
    {
      path: `${base}/${id}/definition/variables`,
      icon: () => (<AttachMoneyOutlined />),
      label: 'Variables',
      number: numbers?.variablesNumber,
    },
  ];
  return (
    <RightMenu entries={entries} />
  );
};

export default DefinitionMenu;
