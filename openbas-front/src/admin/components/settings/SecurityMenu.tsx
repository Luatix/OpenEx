import { GroupsOutlined, LocalPoliceOutlined, PermIdentityOutlined } from '@mui/icons-material';
import { type FunctionComponent } from 'react';

import RightMenu, { type RightMenuEntry } from '../../../components/common/menu/RightMenu';

const SecurityMenu: FunctionComponent = () => {
  const entries: RightMenuEntry[] = [
    {
      path: '/admin/settings/security/groups',
      icon: () => (<GroupsOutlined />),
      label: 'Groups',
    },
    {
      path: '/admin/settings/security/users',
      icon: () => (<PermIdentityOutlined />),
      label: 'Users',
    },
    {
      path: '/admin/settings/security/policies',
      icon: () => (<LocalPoliceOutlined />),
      label: 'Policies',
    },
  ];
  return (
    <RightMenu entries={entries} />
  );
};

export default SecurityMenu;
