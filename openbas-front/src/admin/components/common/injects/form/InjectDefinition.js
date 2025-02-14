import {
  AttachmentOutlined,
  EmojiEventsOutlined,
  GroupsOutlined,
  HelpOutlineOutlined,
  RotateLeftOutlined,
} from '@mui/icons-material';
import {
  Button,
  FormControlLabel,
  FormGroup,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import * as PropTypes from 'prop-types';
import * as R from 'ramda';
import { Component } from 'react';
import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

import { findEndpoints } from '../../../../../actions/assets/endpoint-actions.js';
import { fetchChallenges } from '../../../../../actions/Challenge.js';
import { fetchChannels } from '../../../../../actions/channels/channel-action.js';
import { fetchDocuments } from '../../../../../actions/Document';
import { fetchInjectTeams } from '../../../../../actions/Inject';
import { storeHelper } from '../../../../../actions/Schema.js';
import MultipleFileLoader from '../../../../../components/fields/MultipleFileLoader';
import inject18n from '../../../../../components/i18n.js';
import ItemBoolean from '../../../../../components/ItemBoolean';
import ItemTags from '../../../../../components/ItemTags';
import Loader from '../../../../../components/Loader';
import arraysEqual from '../../../../../utils/ArrayUtils';
import AssetGroupPopover from '../../../assets/asset_groups/AssetGroupPopover';
import AssetGroupsList from '../../../assets/asset_groups/AssetGroupsList';
import EndpointPopover from '../../../assets/endpoints/EndpointPopover';
import EndpointsList from '../../../assets/endpoints/EndpointsList';
import ChallengePopover from '../../../components/challenges/ChallengePopover';
import ChannelIcon from '../../../components/channels/ChannelIcon';
import DocumentPopover from '../../../components/documents/DocumentPopover';
import DocumentType from '../../../components/documents/DocumentType';
import InjectAddAssetGroups from '../../../simulations/simulation/injects/asset_groups/InjectAddAssetGroups';
import InjectAddEndpoints from '../../../simulations/simulation/injects/endpoints/InjectAddEndpoints';
import AvailableVariablesDialog from '../../../simulations/simulation/variables/AvailableVariablesDialog';
import ArticlePopover from '../../articles/ArticlePopover';
import InjectExpectations from '../expectations/InjectExpectations';
import InjectAddArticles from '../InjectAddArticles';
import InjectAddChallenges from '../InjectAddChallenges';
import InjectAddTeams from '../InjectAddTeams';
import InjectTeamsList from '../teams/InjectTeamsList';
import InjectContentFieldComponent from './InjectContentFieldComponent';

const styles = theme => ({
  header: {
    backgroundColor: theme.palette.background.nav,
    padding: '20px 20px 20px 60px',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    left: 5,
    color: 'inherit',
  },
  itemHead: {
    paddingLeft: 10,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  item: {
    paddingLeft: 10,
    height: 50,
  },
  bodyItem: {
    height: '100%',
    fontSize: 13,
  },
  itemIcon: {
    color: theme.palette.primary.main,
  },
  title: {
    float: 'left',
  },
  allTeams: {
    float: 'right',
    marginTop: -10,
  },
  errorColor: {
    color: theme.palette.error.main,
  },
  inline: {
    display: 'flex',
    flexDirection: 'row',
    padding: 0,
  },
  duration: {
    marginTop: 20,
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    border: `1px solid ${theme.palette.primary.main}`,
    padding: 15,
  },
  trigger: {
    fontFamily: ' Consolas, monaco, monospace',
    fontSize: 12,
    paddingTop: 15,
    color: theme.palette.primary.main,
  },
});

const inlineStyles = {
  team_name: {
    float: 'left',
    width: '30%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  team_users_number: {
    float: 'left',
    width: '15%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  team_users_enabled_number: {
    float: 'left',
    width: '15%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  team_tags: {
    float: 'left',
    width: '30%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  article_channel_type: {
    float: 'left',
    width: '15%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  article_channel_name: {
    float: 'left',
    width: '20%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  article_name: {
    float: 'left',
    width: '30%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  article_author: {
    float: 'left',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  challenge_category: {
    float: 'left',
    width: '20%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  challenge_name: {
    float: 'left',
    width: '35%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  challenge_tags: {
    float: 'left',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  document_name: {
    float: 'left',
    width: '35%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  document_type: {
    float: 'left',
    width: '20%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  document_tags: {
    float: 'left',
    width: '30%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  document_attached: {
    float: 'left',
    width: '15%',
    height: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

class InjectDefinition extends Component {
  constructor(props) {
    super(props);
    this.builtInFields = [
      'teams',
      'assets',
      'assetgroups',
      'articles',
      'challenges',
      'attachments',
      'expectations',
    ];
    this.state = {
      allTeams: props.inject.inject_all_teams,
      teamsIds: props.inject.inject_teams || [],
      assetIds: props.inject.inject_assets || [],
      endpoints: [],
      assetGroupIds: props.inject.inject_asset_groups || [],
      articlesIds: props.inject.inject_content?.articles || [],
      challengesIds: props.inject.inject_content?.challenges || [],
      documents: props.inject.inject_documents || [],
      expectations: props.inject.inject_content?.expectations || props.injectorContract.fields.filter(f => f.key === 'expectations').flatMap(f => f.predefinedExpectations) || [],
      documentsSortBy: 'document_name',
      documentsOrderAsc: true,
      articlesSortBy: 'article_name',
      articlesOrderAsc: true,
      challengesSortBy: 'challenge_name',
      challengesOrderAsc: true,
      openVariables: false,
      dynamicFields: this.getDynamicFields(),
    };
  }

  async componentDidMount() {
    this.props.fetchDocuments();
    this.props.fetchChannels();
    this.props.fetchChallenges();
    this.props.setInjectDetailsState(this.state);
    this.setState({ endpoints: await this.refreshEndpoints(this.state.assetIds) });
  }

  componentDidUpdate(prevProps) {
    const { inject } = prevProps;

    const updateStateIfChanged = (currentValue, newValue, stateKey) => {
      if (Array.isArray(newValue) && Array.isArray(currentValue)) {
        if (!arraysEqual(newValue, currentValue)) {
          this.setState({ [stateKey]: newValue || [] });
        }
      } else if (currentValue !== newValue) {
        this.setState({ [stateKey]: newValue });
      }
    };

    updateStateIfChanged(inject.inject_all_teams, this.props.inject.inject_all_teams, 'allTeams');
    updateStateIfChanged(inject.inject_teams || [], this.props.inject.inject_teams || [], 'teamsIds');
    updateStateIfChanged(inject.inject_assets || [], this.props.inject.inject_assets || [], 'assetIds');
    updateStateIfChanged(inject.inject_asset_groups || [], this.props.inject.inject_asset_groups || [], 'assetGroupIds');
    updateStateIfChanged(inject.inject_content?.articles || [], this.props.inject.inject_content?.articles || [], 'articlesIds');
    updateStateIfChanged(inject.inject_content?.challenges || [], this.props.inject.inject_content?.challenges || [], 'challengesIds');
    updateStateIfChanged(inject.inject_documents || [], this.props.inject.inject_documents || [], 'documents');
    updateStateIfChanged(inject.inject_content?.expectations || [], this.props.inject.inject_content?.expectations || [], 'expectations');
  }

  toggleAll() {
    this.setState({ allTeams: !this.state.allTeams }, () => this.props.setInjectDetailsState(this.state));
  }

  handleOpenVariables() {
    this.setState({ openVariables: true });
  }

  handleCloseVariables() {
    this.setState({ openVariables: false });
  }

  // Teams
  handleModifyTeams(teamsIds) {
    this.setState({
      teamsIds: [...teamsIds],
    }, () => this.props.setInjectDetailsState(this.state));
  }

  handleRemoveTeam(teamId) {
    this.setState({
      teamsIds: this.state.teamsIds.filter(a => a !== teamId),
    }, () => this.props.setInjectDetailsState(this.state));
  }

  // Assets
  async refreshEndpoints(assetIds) {
    const result = await findEndpoints(assetIds);
    return result.data;
  }

  async setAssetIdsState(assetIds) {
    this.setState({
      assetIds: assetIds,
    }, () => this.props.setInjectDetailsState(this.state));

    // also force update resolved endpoints at the cost of a backend call
    this.setState({ endpoints: await this.refreshEndpoints(assetIds) });
  }

  async handleAddAssets(assetIds) {
    await this.setAssetIdsState(assetIds);
  }

  async handleRemoveAsset(assetId) {
    await this.setAssetIdsState(this.state.assetIds.filter(a => a !== assetId));
  }

  // Asset Groups
  handleAddAssetGroups(assetGroupIds) {
    this.setState({
      assetGroupIds,
    }, () => this.props.setInjectDetailsState(this.state));
  }

  handleRemoveAssetGroup(assetGroupId) {
    this.setState({
      assetGroupIds: this.state.assetGroupIds.filter(a => a !== assetGroupId),
    }, () => this.props.setInjectDetailsState(this.state));
  }

  // Articles
  handleAddArticles(articlesIds) {
    this.setState({
      articlesIds: [...this.state.articlesIds, ...articlesIds],
    }, () => this.props.setInjectDetailsState(this.state));
  }

  handleRemoveArticle(articleId) {
    this.setState({
      articlesIds: this.state.articlesIds.filter(a => a !== articleId),
    }, () => this.props.setInjectDetailsState(this.state));
  }

  // Challenges
  handleAddChallenges(challengesIds) {
    this.setState({
      challengesIds: [...this.state.challengesIds, ...challengesIds],
    }, () => this.props.setInjectDetailsState(this.state));
  }

  handleRemoveChallenge(challengeId) {
    this.setState({
      challengesIds: this.state.challengesIds.filter(a => a !== challengeId),
    }, () => this.props.setInjectDetailsState(this.state));
  }

  // Documents
  handleAddDocuments(documents) {
    this.setState({
      documents,
    }, () => this.props.setInjectDetailsState(this.state));
  }

  handleRemoveDocument(documentId) {
    this.setState({
      documents: this.state.documents.filter(
        d => d.document_id !== documentId,
      ),
    }, () => this.props.setInjectDetailsState(this.state));
  }

  // Expectations
  handleExpectations(expectations) {
    this.setState({ expectations }, () => this.props.setInjectDetailsState(this.state));
  }

  toggleAttachment(documentId) {
    this.setState({
      documents: this.state.documents.map(d => (d.document_id === documentId
        ? {
            document_id: d.document_id,
            document_attached: !d.document_attached,
          }
        : d)),
    }, () => this.props.setInjectDetailsState(this.state));
  }

  getDynamicFields = () => this.props.injectorContract.fields
    .filter(f => !this.builtInFields.includes(f.key) && !f.expectation)
    .filter(f =>
      f.linkedFields.every((linkedField) => {
        const fieldValue = this.props.getValues(linkedField.key);
        if (linkedField.type === 'checkbox') {
          return fieldValue;
        }
        if (linkedField.type === 'select') {
          f.linkedValues.includes(fieldValue);
        }
        return true;
      }),
    );

  setDynamicFields = () => {
    this.setState({ dynamicFields: this.getDynamicFields() });
  };

  resetDefaultvalues(setFieldValue, injectorContract) {
    injectorContract.fields
      .filter(f => !this.builtInFields.includes(f.key) && !f.expectation)
      .forEach((field) => {
        let defaultValue = field.cardinality === '1' ? R.head(field.defaultValue) : field.defaultValue;
        if (
          field.type === 'textarea'
          && field.richText
          && defaultValue
          && defaultValue.length > 0
        ) {
          defaultValue = defaultValue
            .replaceAll(
              '<#list challenges as challenge>',
              '&lt;#list challenges as challenge&gt;',
            )
            .replaceAll(
              '<#list articles as article>',
              '&lt;#list articles as article&gt;',
            )
            .replaceAll('</#list>', '&lt;/#list&gt;');
        }
        setFieldValue(field.key, defaultValue);
      });
  }

  render() {
    const {
      t,
      classes,
      setValue,
      values,
      submitting,
      inject,
      injectorContract,
      documentsMap,
      articlesMap,
      channelsMap,
      challengesMap,
      articlesFromExerciseOrScenario,
      isAtomic,
    } = this.props;
    if (!inject) {
      return <Loader variant="inElement" />;
    }
    const {
      allTeams,
      teamsIds,
      assetIds,
      endpoints,
      assetGroupIds,
      documents,
      expectations,
      documentsSortBy,
      documentsOrderAsc,
      dynamicFields,
      articlesOrderAsc,
      articlesSortBy,
      articlesIds,
      challengesOrderAsc,
      challengesSortBy,
      challengesIds,
      openVariables,
    } = this.state;
    // -- TEAMS --
    const fieldTeams = injectorContract.fields.filter(n => n.key === 'teams').at(0);
    const hasTeams = injectorContract.fields
      .map(f => f.key)
      .includes('teams');
    // -- ASSETS --
    const fieldAssets = injectorContract.fields.filter(n => n.key === 'assets').at(0);
    const hasAssets = injectorContract.fields
      .map(f => f.key)
      .includes('assets');
    // -- ASSET GROUPS --
    const hasAssetGroups = injectorContract.fields
      .map(f => f.key)
      .includes('assetgroups');
    // -- ARTICLES --
    const articles = articlesIds
      .map(a => articlesMap[a])
      .filter(a => a !== undefined)
      .map(a => ({
        ...a,
        article_channel_type: channelsMap[a.article_channel]?.channel_type || '',
        article_channel_name: channelsMap[a.article_channel]?.channel_name || '',
      }));
    const sortArticles = R.sortWith(
      articlesOrderAsc
        ? [R.ascend(R.prop(articlesSortBy))]
        : [R.descend(R.prop(articlesSortBy))],
    );
    const sortedArticles = sortArticles(articles);
    const fieldArticles = injectorContract.fields.filter(n => n.key === 'articles').at(0);
    const hasArticles = injectorContract.fields
      .map(f => f.key)
      .includes('articles');
    // -- CHALLENGES --
    const challenges = challengesIds
      .map(a => challengesMap[a])
      .filter(a => a !== undefined);
    const sortChallenges = R.sortWith(
      challengesOrderAsc
        ? [R.ascend(R.prop(challengesSortBy))]
        : [R.descend(R.prop(challengesSortBy))],
    );
    const sortedChallenges = sortChallenges(challenges);
    const fieldChallenges = injectorContract.fields.filter(n => n.key === 'challenges').at(0);
    const hasChallenges = injectorContract.fields
      .map(f => f.key)
      .includes('challenges');
    // -- DOCUMENTS --
    const docs = documents
      .map(d => (documentsMap[d.document_id]
        ? {
            ...documentsMap[d.document_id],
            document_attached: d.document_attached,
          }
        : undefined))
      .filter(d => d !== undefined);
    const attachedDocs = docs.filter(n => n.document_attached);
    const sortDocuments = R.sortWith(
      documentsOrderAsc
        ? [R.ascend(R.prop(documentsSortBy))]
        : [R.descend(R.prop(documentsSortBy))],
    );
    const sortedDocuments = sortDocuments(docs);
    const fieldAttachements = injectorContract.fields.filter(n => n.key === 'attachments').at(0);
    const hasAttachments = injectorContract.fields
      .map(f => f.key)
      .includes('attachments');
    // -- EXPECTATIONS --
    const hasExpectations = injectorContract.fields
      .map(f => f.key)
      .includes('expectations');
    const predefinedExpectations = injectorContract.fields.filter(
      f => f.key === 'expectations',
    ).flatMap(f => f.predefinedExpectations);
    const expectationsNotManual = injectorContract.fields.filter(
      f => f.expectation === true,
    );

    return (
      <>
        {hasTeams && (
          <>
            <Typography variant="h5" style={{ fontWeight: 500, float: 'left' }}>
              {t('Targeted teams')}
            </Typography>
            <FormGroup row={true} classes={{ root: classes.allTeams }}>
              <FormControlLabel
                control={(
                  <Switch
                    checked={allTeams}
                    onChange={this.toggleAll.bind(this)}
                    color="primary"
                    size="small"
                    disabled={this.props.readOnly || fieldTeams.readOnly}
                  />
                )}
                label={<strong>{t('All teams')}</strong>}
              />
            </FormGroup>
            <div className="clearfix" />
            <List>
              {allTeams ? (
                <ListItem classes={{ root: classes.item }} divider={true}>
                  <ListItemIcon>
                    <GroupsOutlined />
                  </ListItemIcon>
                  <ListItemText
                    primary={(
                      <>
                        <div
                          className={classes.bodyItem}
                          style={inlineStyles.team_name}
                        >
                          <i>{t('All teams')}</i>
                        </div>
                        <div
                          className={classes.bodyItem}
                          style={inlineStyles.team_users_number}
                        >
                          <strong>
                            {this.props.allUsersNumber}
                          </strong>
                        </div>
                        <div
                          className={classes.bodyItem}
                          style={inlineStyles.team_users_enabled_number}
                        >
                          <strong>
                            {this.props.usersNumber}
                          </strong>
                        </div>
                        <div
                          className={classes.bodyItem}
                          style={inlineStyles.team_tags}
                        >
                          <ItemTags variant="reduced-view" tags={[]} />
                        </div>
                      </>
                    )}
                  />
                  <ListItemSecondaryAction> &nbsp; </ListItemSecondaryAction>
                </ListItem>
              ) : (
                <>
                  <InjectTeamsList
                    teamIds={teamsIds}
                    handleRemoveTeam={this.handleRemoveTeam.bind(this)}
                  />
                  <InjectAddTeams
                    injectTeamsIds={teamsIds}
                    handleModifyTeams={this.handleModifyTeams.bind(this)}
                  />
                </>
              )}
            </List>
          </>
        )}
        {hasAssets && (
          <>
            <Typography variant="h5" style={{ fontWeight: 500, marginTop: hasTeams ? 20 : 0 }}>
              {t('Targeted assets')}
            </Typography>
            <EndpointsList
              endpoints={endpoints}
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore: Endpoint property handle by EndpointsList
              actions={
                <EndpointPopover inline onRemoveEndpointFromInject={this.handleRemoveAsset.bind(this)} onDelete={this.handleRemoveAsset.bind(this)} />
              }
            />
            <InjectAddEndpoints
              endpointIds={assetIds}
              onSubmit={this.handleAddAssets.bind(this)}
              disabled={fieldAssets.readOnly}
              platforms={injectorContract.platforms}
              payloadArch={inject.inject_injector_contract?.injector_contract_arch}
            />
          </>
        )}
        {hasAssetGroups && (
          <>
            <Typography variant="h5" style={{ fontWeight: 500, marginTop: hasTeams || hasAssets ? 20 : 0 }}>
              {t('Targeted asset groups')}
            </Typography>
            <AssetGroupsList
              assetGroupIds={assetGroupIds}
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore: Endpoint property handle by EndpointsList
              actions={
                <AssetGroupPopover inline onRemoveAssetGroupFromList={this.handleRemoveAssetGroup.bind(this)} />
              }
            />
            <InjectAddAssetGroups assetGroupIds={assetGroupIds} onSubmit={this.handleAddAssetGroups.bind(this)} />
          </>
        )}
        {hasArticles && (
          <>
            <Typography variant="h5" style={{ fontWeight: 500, marginTop: hasTeams || hasAssets || hasAssetGroups ? 20 : 0 }}>
              {t('Media pressure to publish')}
            </Typography>
            <List>
              {sortedArticles.map(article => (
                <ListItem
                  key={article.article_id}
                  classes={{ root: classes.item }}
                  divider={true}
                >
                  <ListItemIcon>
                    <ChannelIcon
                      type={article.article_channel_type}
                      variant="inline"
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={(
                      <>
                        <div
                          className={classes.bodyItem}
                          style={inlineStyles.article_channel_type}
                        >
                          {t(article.article_channel_type || 'Unknown')}
                        </div>
                        <div
                          className={classes.bodyItem}
                          style={inlineStyles.article_channel_name}
                        >
                          {article.article_channel_name}
                        </div>
                        <div
                          className={classes.bodyItem}
                          style={inlineStyles.article_name}
                        >
                          {article.article_name}
                        </div>
                        <div
                          className={classes.bodyItem}
                          style={inlineStyles.article_author}
                        >
                          {article.article_author}
                        </div>
                      </>
                    )}
                  />
                  <ListItemSecondaryAction>
                    <ArticlePopover
                      article={article}
                      onRemoveArticle={this.handleRemoveArticle.bind(this)}
                      disabled={this.props.readOnly || fieldArticles.readOnly}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              <InjectAddArticles
                articles={articlesFromExerciseOrScenario}
                injectArticlesIds={articlesIds}
                handleAddArticles={this.handleAddArticles.bind(this)}
              />
            </List>
          </>
        )}
        {hasChallenges && (
          <>
            <Typography variant="h5" style={{ fontWeight: 500, marginTop: hasTeams || hasAssets || hasAssetGroups || hasArticles ? 20 : 0 }}>
              {t('Challenges to publish')}
            </Typography>
            <List>
              {sortedChallenges.map(challenge => (
                <ListItem
                  key={challenge.challenge_id}
                  classes={{ root: classes.item }}
                  divider={true}
                >
                  <ListItemIcon>
                    <EmojiEventsOutlined />
                  </ListItemIcon>
                  <ListItemText
                    primary={(
                      <>
                        <div
                          className={classes.bodyItem}
                          style={inlineStyles.challenge_category}
                        >
                          {t(challenge.challenge_category || 'Unknown')}
                        </div>
                        <div
                          className={classes.bodyItem}
                          style={inlineStyles.challenge_name}
                        >
                          {challenge.challenge_name}
                        </div>
                        <div
                          className={classes.bodyItem}
                          style={inlineStyles.challenge_tags}
                        >
                          <ItemTags
                            variant="reduced-view"
                            tags={challenge.challenge_tags}
                          />
                        </div>
                      </>
                    )}
                  />
                  <ListItemSecondaryAction>
                    <ChallengePopover
                      inline
                      challenge={challenge}
                      onRemoveChallenge={this.handleRemoveChallenge.bind(
                        this,
                      )}
                      disabled={this.props.readOnly || fieldChallenges.readOnly}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              <InjectAddChallenges
                injectChallengesIds={challengesIds}
                handleAddChallenges={this.handleAddChallenges.bind(
                  this,
                )}
              />
            </List>
          </>
        )}
        <div style={{ marginTop: hasTeams || hasAssets || hasAssetGroups || hasArticles || hasChallenges ? 24 : 0 }}>
          <div style={{ float: 'left' }}>
            <Typography variant="h5" style={{ fontWeight: 500 }}>{t('Inject data')}</Typography>
          </div>
          <div style={{ float: 'left' }}>
            <Tooltip title={t('Reset to default values')}>
              <IconButton
                color="primary"
                variant="outlined"
                disabled={submitting || this.props.readOnly}
                onClick={() => this.resetDefaultvalues(setValue, injectorContract)}
                size="small"
                style={{ margin: '-12px 0 0 5px' }}
              >
                <RotateLeftOutlined />
              </IconButton>
            </Tooltip>
          </div>
          <div style={{ float: 'right' }}>
            <Button
              color="primary"
              variant="outlined"
              size="small"
              onClick={this.handleOpenVariables.bind(this)}
              startIcon={<HelpOutlineOutlined />}
              style={{ marginTop: -10 }}
            >
              {t('Available variables')}
            </Button>
          </div>
          <div className="clearfix" />
        </div>
        {
          dynamicFields.map(field => (
            <InjectContentFieldComponent
              key={field.key}
              control={this.props.control}
              register={this.props.register}
              field={field}
              values={values}
              attachedDocs={attachedDocs}
              onSelectOrCheckboxFieldChange={() => this.setDynamicFields()}
              readOnly={this.props.readOnly || field.readOnly}
            />
          ))
        }
        {(hasExpectations || expectationsNotManual.length > 0) && (
          <>
            <Typography variant="h5" style={{ marginTop: 20, fontWeight: 500 }}>
              {t('Inject expectations')}
            </Typography>
            {expectationsNotManual.length > 0 && (
              <>
                <div style={{ marginTop: -15 }}>
                  {this.renderFields(
                    expectationsNotManual.filter((f) => {
                      // Filter display if linked fields
                      for (let index = 0; index < f.linkedFields.length; index += 1) {
                        const linkedField = f.linkedFields[index];
                        if (linkedField.type === 'checkbox' && values[linkedField.key] === false) {
                          return false;
                        }
                        if (linkedField.type === 'select' && !f.linkedValues.includes(values[linkedField.key])) {
                          return false;
                        }
                      }
                      return true;
                    }),
                    values,
                    attachedDocs,
                  )}
                </div>
              </>
            )}
            {hasExpectations && (
              <InjectExpectations
                predefinedExpectationDatas={predefinedExpectations}
                expectationDatas={expectations}
                handleExpectations={this.handleExpectations.bind(this)}
              />
            )}
          </>
        )}
        {!isAtomic && (
          <>
            <Typography variant="h5" style={{ fontWeight: 500, marginTop: 20 }}>
              {t('Inject documents')}
            </Typography>
            <List>
              {sortedDocuments.map(document => (
                <ListItemButton
                  key={document.document_id}
                  classes={{ root: classes.item }}
                  divider={true}
                  component="a"
                  href={`/api/documents/${document.document_id}/file`}
                >
                  <ListItemIcon>
                    <AttachmentOutlined />
                  </ListItemIcon>
                  <ListItemText
                    primary={(
                      <>
                        <div
                          className={classes.bodyItem}
                          style={inlineStyles.document_name}
                        >
                          {document.document_name}
                        </div>
                        <div
                          className={classes.bodyItem}
                          style={inlineStyles.document_type}
                        >
                          <DocumentType
                            type={document.document_type}
                            variant="list"
                          />
                        </div>
                        <div
                          className={classes.bodyItem}
                          style={inlineStyles.document_tags}
                        >
                          <ItemTags
                            variant="reduced-view"
                            tags={document.document_tags}
                          />
                        </div>
                        <div
                          className={classes.bodyItem}
                          style={inlineStyles.document_attached}
                        >
                          <ItemBoolean
                            status={hasAttachments ? document.document_attached : null}
                            label={document.document_attached ? t('Yes') : t('No')}
                            variant="inList"
                            onClick={(event) => {
                              event.preventDefault();
                              this.toggleAttachment(document.document_id);
                            }}
                            disabled={this.props.readOnly || (hasAttachments && fieldAttachements.readOnly) || !hasAttachments}
                          />
                        </div>
                      </>
                    )}
                  />
                  <ListItemSecondaryAction>
                    <DocumentPopover
                      inline
                      document={document}
                      onRemoveDocument={this.handleRemoveDocument.bind(this)}
                      onToggleAttach={hasAttachments ? this.toggleAttachment.bind(this) : null}
                      attached={document.document_attached}
                      disabled={this.props.readOnly || (hasAttachments && fieldAttachements.readOnly)}
                    />
                  </ListItemSecondaryAction>
                </ListItemButton>
              ))}
              <MultipleFileLoader
                initialDocumentIds={documents.filter(a => !a.inject_document_attached).map(d => d.document_id)}
                handleAddDocuments={this.handleAddDocuments.bind(this)}
                hasAttachments={hasAttachments}
              />
            </List>
          </>
        )}
        <AvailableVariablesDialog
          uriVariable={this.props.uriVariable}
          variables={this.props.variablesFromExerciseOrScenario}
          open={openVariables}
          handleClose={this.handleCloseVariables.bind(this)}
          injectorContract={injectorContract}
        />
      </>
    );
  }
}

InjectDefinition.propTypes = {
  t: PropTypes.func,
  nsdt: PropTypes.func,
  injectId: PropTypes.string,
  inject: PropTypes.object,
  fetchInjectTeams: PropTypes.func,
  fetchChannels: PropTypes.func,
  fetchChallenges: PropTypes.func,
  handleClose: PropTypes.func,
  injectorContract: PropTypes.object,
  fetchDocuments: PropTypes.func,
  tagsMap: PropTypes.object,
  articlesFromExerciseOrScenario: PropTypes.array,
  variablesFromExerciseOrScenario: PropTypes.array,
  readOnly: PropTypes.bool,
  uriVariable: PropTypes.string,
  allUsersNumber: PropTypes.number,
  usersNumber: PropTypes.number,
  teamsUsers: PropTypes.array,
  isAtomic: PropTypes.bool,
};

const select = (state) => {
  const helper = storeHelper(state);
  const documentsMap = helper.getDocumentsMap();
  const channelsMap = helper.getChannelsMap();
  const articlesMap = helper.getArticlesMap();
  const challengesMap = helper.getChallengesMap();
  return {
    documentsMap,
    articlesMap,
    channelsMap,
    challengesMap,
  };
};

export default R.compose(
  connect(select, {
    fetchInjectTeams,
    fetchDocuments,
    fetchChannels,
    fetchChallenges,
  }),
  inject18n,
  Component => withStyles(Component, styles),
)(InjectDefinition);
