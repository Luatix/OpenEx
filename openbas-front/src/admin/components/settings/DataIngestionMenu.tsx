import { TableViewOutlined } from '@mui/icons-material';

import RightMenu, { type RightMenuEntry } from '../../../components/common/menu/RightMenu';

const DataIngestionMenu = () => {
  const entries: RightMenuEntry[] = [
    {
      path: '/admin/settings/data_ingestion/xls_mappers',
      icon: () => (<TableViewOutlined />),
      label: 'XLS mappers',
    },
  ];
  return (
    <RightMenu entries={entries} />
  );
};

export default DataIngestionMenu;
