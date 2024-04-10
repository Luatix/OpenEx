import { ComputerOutlined, DomainOutlined, GroupsOutlined, Kayaking, LanOutlined, MovieFilterOutlined, PersonOutlined } from '@mui/icons-material';
import React from 'react';

const useEntityIcon = (entity: string) => {
  switch (entity) {
    case 'Asset':
      return (<ComputerOutlined color="primary" />);
    case 'AssetGroup':
      return (<LanOutlined color="primary" />);
    case 'User':
      return (<PersonOutlined color="primary" />);
    case 'Team':
      return (<GroupsOutlined color="primary" />);
    case 'Organization':
      return (<DomainOutlined color="primary" />);
    case 'Scenario':
      return (<MovieFilterOutlined color="primary" />);
    case 'Exercise':
      return (<Kayaking color="primary" />);
    default:
      return (<></>);
  }
};

export default useEntityIcon;
