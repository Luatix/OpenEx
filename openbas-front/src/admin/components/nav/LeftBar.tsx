import { DashboardOutlined, DescriptionOutlined, DevicesOtherOutlined, DnsOutlined, DomainOutlined, Groups3Outlined, GroupsOutlined, HubOutlined, MovieFilterOutlined, OnlinePredictionOutlined, PersonOutlined, RowingOutlined, SchoolOutlined, SettingsOutlined, SmartButtonOutlined, SubscriptionsOutlined, TerminalOutlined } from '@mui/icons-material';
import { NewspaperVariantMultipleOutline, PostOutline, SecurityNetwork, SelectGroup, Target } from 'mdi-material-ui';

import { type UserHelper } from '../../../actions/helper';
import LeftMenu from '../../../components/common/menu/leftmenu/LeftMenu';
import { useHelper } from '../../../store';

const LeftBar = () => {
  const userAdmin = useHelper((helper: UserHelper) => {
    const me = helper.getMe();
    return me?.user_admin ?? false;
  });
  const entries = [
    {
      items: [
        { path: `/admin`, icon: () => (<DashboardOutlined />), label: 'Home' },
      ],
    },
    {
      items: [
        { path: `/admin/scenarios`, icon: () => (<MovieFilterOutlined />), label: 'Scenarios' },
        { path: `/admin/simulations`, icon: () => (<HubOutlined />), label: 'Simulations' },
        { path: `/admin/atomic_testings`, icon: () => (<Target />), label: 'Atomic testings' },
      ],
    },
    {
      items: [
        {
          path: `/admin/assets`,
          icon: () => (<DnsOutlined />),
          label: 'Assets',
          href: 'assets',
          subItems: [
            { link: '/admin/assets/endpoints', label: 'Endpoints', icon: () => (<DevicesOtherOutlined fontSize="small" />) },
            { link: '/admin/assets/asset_groups', label: 'Asset groups', icon: () => (<SelectGroup fontSize="small" />) },
            { link: '/admin/assets/security_platforms', label: 'Security platforms', icon: () => (<SecurityNetwork fontSize="small" />) },
          ],
        },
        {
          path: `/admin/teams`,
          icon: () => (<Groups3Outlined />),
          label: 'People',
          href: 'teams',
          subItems: [
            { link: '/admin/teams/players', label: 'Players', icon: () => (<PersonOutlined fontSize="small" />) },
            { link: '/admin/teams/teams', label: 'Teams', icon: () => (<GroupsOutlined fontSize="small" />) },
            { link: '/admin/teams/organizations', label: 'Organizations', icon: () => (<DomainOutlined fontSize="small" />) },
          ],
        },
        {
          path: `/admin/components`,
          icon: () => (<NewspaperVariantMultipleOutline />),
          label: 'Components',
          href: 'components',
          subItems: [
            { link: '/admin/components/documents', label: 'Documents', icon: () => (<DescriptionOutlined fontSize="small" />) },
            { link: '/admin/components/channels', label: 'Channels', icon: () => (<PostOutline fontSize="small" />) },
            { link: '/admin/components/challenges', label: 'Challenges', icon: () => (<RowingOutlined fontSize="small" />) },
            { link: '/admin/components/lessons', label: 'Lessons learned', icon: () => (<SchoolOutlined fontSize="small" />) },
          ],
        },
      ],
    },
    {
      items: [
        { path: `/admin/payloads`, icon: () => (<SubscriptionsOutlined />), label: 'Payloads' },
        // { path: `/admin/mitigations`, icon: () => (<DynamicFormOutlined />), label: 'Mitigations', },
        {
          path: `/admin/integrations`,
          icon: () => (<DnsOutlined />),
          label: 'Integrations',
          href: 'integrations',
          subItems: [
            { link: '/admin/integrations/injectors', label: 'Injectors', icon: () => (<SmartButtonOutlined fontSize="small" />) },
            { link: '/admin/integrations/collectors', label: 'Collectors', icon: () => (<OnlinePredictionOutlined fontSize="small" />) },
            { link: '/admin/integrations/executors', label: 'Executors', icon: () => (<TerminalOutlined fontSize="small" />) },
          ],
        },
      ],
    },
    {
      userRight: userAdmin,
      items: [
        {
          path: `/admin/settings`,
          icon: () => (<SettingsOutlined />),
          label: 'Settings',
          href: 'settings',
          subItems: [
            { link: '/admin/settings', label: 'Parameters', exact: true },
            { link: '/admin/settings/security', label: 'Security' },
            { link: '/admin/settings/asset_rules', label: 'Customization' },
            { link: '/admin/settings/taxonomies', label: 'Taxonomies' },
            { link: '/admin/settings/data_ingestion', label: 'Data ingestion' },
          ],
        },
      ],
    },
  ];
  return (
    <LeftMenu entries={entries} />
  );
};

export default LeftBar;
