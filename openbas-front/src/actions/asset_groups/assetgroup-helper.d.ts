import { type AssetGroup } from '../../utils/api-types';

export interface AssetGroupsHelper {
  getAssetGroups: () => AssetGroup[];
  getAssetGroupMaps: () => Record<string, AssetGroup>;
  getAssetGroup: (assetGroupId: string) => AssetGroup | undefined;
}
