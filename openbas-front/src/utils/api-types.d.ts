/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface Agent {
  agent_active?: boolean;
  agent_asset: string;
  /** @format date-time */
  agent_created_at: string;
  agent_deployment_mode: "service" | "session";
  agent_executed_by_user: string;
  agent_executor?: string;
  agent_external_reference?: string;
  agent_id: string;
  agent_inject?: string;
  /** @format date-time */
  agent_last_seen?: string;
  agent_parent?: string;
  agent_privilege: "admin" | "standard";
  agent_process_name?: string;
  /** @format date-time */
  agent_updated_at: string;
  agent_version?: string;
  listened?: boolean;
}

/** List of agents */
export interface AgentOutput {
  /** Indicates whether the endpoint is active. The endpoint is considered active if it was seen in the last 3 minutes. */
  agent_active?: boolean;
  /** Agent deployment mode */
  agent_deployment_mode?: "service" | "session";
  /** The user who executed the agent */
  agent_executed_by_user?: string;
  /** Agent executor */
  agent_executor?: ExecutorOutput;
  /** Agent id */
  agent_id: string;
  /**
   * Instant when agent was last seen
   * @format date-time
   */
  agent_last_seen?: string;
  /** Agent privilege */
  agent_privilege?: "admin" | "standard";
}

/** Represents the output result details of an agent execution */
export interface AgentStatusOutput {
  agent_executor_name?: string;
  agent_executor_type?: string;
  agent_id: string;
  agent_name?: string;
  /**
   * Execution status of the agent
   * @example "SUCCESS, ERROR, MAYBE_PREVENTED..."
   */
  agent_status_name?: string;
  /** List of agent execution traces */
  agent_traces?: ExecutionTracesOutput[];
  /** Endpoint ID */
  asset_id: string;
  /** @format date-time */
  tracking_end_date?: string;
  /** @format date-time */
  tracking_sent_date?: string;
}

export interface AiGenericTextInput {
  ai_content: string;
  ai_format?: string;
  ai_tone?: string;
}

export interface AiMediaInput {
  ai_author?: string;
  ai_context?: string;
  ai_format: string;
  ai_input: string;
  /** @format int32 */
  ai_paragraphs?: number;
  ai_tone?: string;
}

export interface AiMessageInput {
  ai_context?: string;
  ai_format: string;
  ai_input: string;
  /** @format int32 */
  ai_paragraphs?: number;
  ai_recipient?: string;
  ai_sender?: string;
  ai_tone?: string;
}

export interface AiResult {
  chunk_content?: string;
  chunk_id?: string;
}

export interface Article {
  article_author?: string;
  article_channel: string;
  /** @format int32 */
  article_comments?: number;
  article_content?: string;
  /** @format date-time */
  article_created_at: string;
  article_documents?: string[];
  article_exercise?: string;
  article_id: string;
  article_is_scheduled?: boolean;
  /** @format int32 */
  article_likes?: number;
  article_name?: string;
  article_scenario?: string;
  /** @format int32 */
  article_shares?: number;
  /** @format date-time */
  article_updated_at: string;
  /** @format date-time */
  article_virtual_publication?: string;
  listened?: boolean;
}

export interface ArticleCreateInput {
  article_author?: string;
  article_channel: string;
  /** @format int32 */
  article_comments?: number;
  article_content?: string;
  article_documents?: string[];
  /** @format int32 */
  article_likes?: number;
  article_name: string;
  article_published?: boolean;
  /** @format int32 */
  article_shares?: number;
}

export interface ArticleUpdateInput {
  article_author?: string;
  article_channel: string;
  /** @format int32 */
  article_comments?: number;
  article_content?: string;
  article_documents?: string[];
  /** @format int32 */
  article_likes?: number;
  article_name: string;
  article_published?: boolean;
  /** @format int32 */
  article_shares?: number;
}

export interface AssetAgentJob {
  asset_agent_agent?: string;
  /** @deprecated */
  asset_agent_asset?: string;
  asset_agent_command: string;
  asset_agent_id: string;
  asset_agent_inject?: string;
  listened?: boolean;
}

export interface AssetGroup {
  asset_group_assets?: string[];
  /** @format date-time */
  asset_group_created_at: string;
  asset_group_description?: string;
  asset_group_dynamic_assets?: string[];
  /** Filter object to search within filterable attributes */
  asset_group_dynamic_filter?: FilterGroup;
  asset_group_id: string;
  asset_group_name: string;
  asset_group_tags?: string[];
  /** @format date-time */
  asset_group_updated_at: string;
  listened?: boolean;
}

export interface AssetGroupInput {
  asset_group_description?: string;
  /** Filter object to search within filterable attributes */
  asset_group_dynamic_filter?: FilterGroup;
  asset_group_name: string;
  asset_group_tags?: string[];
}

export interface AssetGroupOutput {
  /** @uniqueItems true */
  asset_group_assets?: string[];
  asset_group_description?: string;
  /** Filter object to search within filterable attributes */
  asset_group_dynamic_filter?: FilterGroup;
  asset_group_id: string;
  asset_group_name: string;
  /** @uniqueItems true */
  asset_group_tags?: string[];
}

/** Full contract */
export interface AtomicInjectorContractOutput {
  convertedContent?: object;
  injector_contract_content: string;
  injector_contract_id: string;
  injector_contract_labels: Record<string, string>;
  injector_contract_payload?: PayloadSimple;
  injector_contract_platforms?: (
    | "Linux"
    | "Windows"
    | "MacOS"
    | "Container"
    | "Service"
    | "Generic"
    | "Internal"
    | "Unknown"
  )[];
}

export interface AtomicTestingInput {
  inject_all_teams?: boolean;
  inject_asset_groups?: string[];
  inject_assets?: string[];
  inject_content?: object;
  inject_description?: string;
  inject_documents?: InjectDocumentInput[];
  inject_injector_contract?: string;
  inject_tags?: string[];
  inject_teams?: string[];
  inject_title?: string;
}

export interface AtomicTestingUpdateTagsInput {
  atomic_tags?: string[];
}

export interface AttackPattern {
  /** @format date-time */
  attack_pattern_created_at?: string;
  attack_pattern_description?: string;
  attack_pattern_external_id: string;
  attack_pattern_id: string;
  attack_pattern_kill_chain_phases?: string[];
  attack_pattern_name: string;
  attack_pattern_parent?: string;
  attack_pattern_permissions_required?: string[];
  attack_pattern_platforms?: string[];
  attack_pattern_stix_id: string;
  /** @format date-time */
  attack_pattern_updated_at?: string;
  listened?: boolean;
}

export interface AttackPatternCreateInput {
  attack_pattern_description?: string;
  attack_pattern_external_id: string;
  attack_pattern_kill_chain_phases?: string[];
  attack_pattern_name: string;
  attack_pattern_parent?: string;
  attack_pattern_permissions_required?: string[];
  attack_pattern_platforms?: string[];
  attack_pattern_stix_id?: string;
}

/** Attack pattern */
export interface AttackPatternSimple {
  attack_pattern_external_id: string;
  attack_pattern_id: string;
  attack_pattern_name: string;
}

export interface AttackPatternUpdateInput {
  attack_pattern_description?: string;
  attack_pattern_external_id: string;
  attack_pattern_kill_chain_phases?: string[];
  attack_pattern_name: string;
}

export interface AttackPatternUpsertInput {
  attack_patterns?: AttackPatternCreateInput[];
}

interface BasePayload {
  listened?: boolean;
  /** @format int32 */
  numberOfActions?: number;
  payload_arguments?: PayloadArgument[];
  payload_attack_patterns?: string[];
  payload_cleanup_command?: string;
  payload_cleanup_executor?: string;
  payload_collector?: string;
  payload_collector_type?: string;
  /** @format date-time */
  payload_created_at: string;
  payload_description?: string;
  payload_elevation_required?: boolean;
  payload_execution_arch: "x86_64" | "arm64" | "ALL_ARCHITECTURES";
  payload_external_id?: string;
  payload_id: string;
  payload_name: string;
  payload_platforms?: ("Linux" | "Windows" | "MacOS" | "Container" | "Service" | "Generic" | "Internal" | "Unknown")[];
  payload_prerequisites?: PayloadPrerequisite[];
  payload_source: "COMMUNITY" | "FILIGRAN" | "MANUAL";
  payload_status: "UNVERIFIED" | "VERIFIED" | "DEPRECATED";
  payload_tags?: string[];
  payload_type?: string;
  /** @format date-time */
  payload_updated_at: string;
  typeEnum?: "COMMAND" | "EXECUTABLE" | "FILE_DROP" | "DNS_RESOLUTION" | "NETWORK_TRAFFIC";
}

type BasePayloadPayloadTypeMapping<Key, Type> = {
  payload_type: Key;
} & Type;

export interface Challenge {
  challenge_category?: string;
  challenge_content?: string;
  /** @format date-time */
  challenge_created_at: string;
  challenge_documents?: string[];
  challenge_exercises?: string[];
  challenge_flags: ChallengeFlag[];
  challenge_id: string;
  /** @format int32 */
  challenge_max_attempts?: number;
  challenge_name: string;
  challenge_scenarios?: string[];
  /** @format double */
  challenge_score?: number;
  challenge_tags?: string[];
  /** @format date-time */
  challenge_updated_at: string;
  /** @format date-time */
  challenge_virtual_publication?: string;
  listened?: boolean;
}

export interface ChallengeFlag {
  flag_challenge?: string;
  /** @format date-time */
  flag_created_at?: string;
  flag_id?: string;
  flag_type?: "VALUE" | "VALUE_CASE" | "REGEXP";
  /** @format date-time */
  flag_updated_at?: string;
  flag_value?: string;
  listened?: boolean;
}

export interface ChallengeInformation {
  challenge_detail?: PublicChallenge;
  challenge_expectation?: InjectExpectation;
}

export interface ChallengeInput {
  challenge_category?: string;
  challenge_content?: string;
  challenge_documents?: string[];
  challenge_flags: FlagInput[];
  /** @format int32 */
  challenge_max_attempts?: number;
  challenge_name: string;
  /** @format double */
  challenge_score?: number;
  challenge_tags?: string[];
}

export interface ChallengeResult {
  result?: boolean;
}

export interface ChallengeTryInput {
  challenge_value?: string;
}

export interface ChallengesReader {
  exercise_challenges?: ChallengeInformation[];
  exercise_id?: string;
  exercise_information?: PublicExercise;
}

export interface ChangePasswordInput {
  /** The new password */
  password: string;
  /** The new password again to validate it's been typed well */
  password_validation: string;
}

export interface Channel {
  /** @format date-time */
  channel_created_at: string;
  channel_description?: string;
  channel_id: string;
  channel_logo_dark?: string;
  channel_logo_light?: string;
  channel_mode?: string;
  channel_name?: string;
  channel_primary_color_dark?: string;
  channel_primary_color_light?: string;
  channel_secondary_color_dark?: string;
  channel_secondary_color_light?: string;
  channel_type?: string;
  /** @format date-time */
  channel_updated_at: string;
  listened?: boolean;
  logos?: Document[];
}

export interface ChannelCreateInput {
  channel_description: string;
  channel_name: string;
  channel_type: string;
}

export interface ChannelReader {
  channel_articles?: Article[];
  channel_exercise?: Exercise;
  channel_id?: string;
  channel_information?: Channel;
  channel_scenario?: Scenario;
}

export interface ChannelUpdateInput {
  channel_description: string;
  channel_mode?: string;
  channel_name: string;
  channel_primary_color_dark?: string;
  channel_primary_color_light?: string;
  channel_secondary_color_dark?: string;
  channel_secondary_color_light?: string;
  channel_type: string;
}

export interface ChannelUpdateLogoInput {
  channel_logo_dark?: string;
  channel_logo_light?: string;
}

export interface CheckExerciseRulesInput {
  /** List of tag that will be applied to the simulation */
  new_tags?: string[];
}

export interface CheckExerciseRulesOutput {
  /** Are there rules that can be applied? */
  rules_found: boolean;
}

export interface CheckScenarioRulesInput {
  /** List of tag that will be applied to the scenario */
  new_tags?: string[];
}

export interface CheckScenarioRulesOutput {
  /** Are there rules that can be applied? */
  rules_found: boolean;
}

export interface Collector {
  /** @format date-time */
  collector_created_at: string;
  collector_external?: boolean;
  collector_id: string;
  /** @format date-time */
  collector_last_execution?: string;
  collector_name: string;
  /** @format int32 */
  collector_period?: number;
  collector_security_platform?: SecurityPlatform;
  collector_type: string;
  /** @format date-time */
  collector_updated_at: string;
  listened?: boolean;
}

export interface CollectorCreateInput {
  collector_id: string;
  collector_name: string;
  /** @format int32 */
  collector_period?: number;
  collector_security_platform?: string;
  collector_type: string;
}

export interface CollectorUpdateInput {
  /** @format date-time */
  collector_last_execution?: string;
}

export interface Comcheck {
  /** @format date-time */
  comcheck_end_date: string;
  comcheck_exercise?: string;
  comcheck_id: string;
  comcheck_message?: string;
  comcheck_name?: string;
  /** @format date-time */
  comcheck_start_date: string;
  comcheck_state?: "RUNNING" | "EXPIRED" | "FINISHED";
  comcheck_statuses?: string[];
  comcheck_subject?: string;
  /** @format int64 */
  comcheck_users_number?: number;
  listened?: boolean;
}

export interface ComcheckInput {
  /** @format date-time */
  comcheck_end_date?: string;
  comcheck_message?: string;
  comcheck_name: string;
  comcheck_subject?: string;
  comcheck_teams?: string[];
}

export interface ComcheckStatus {
  comcheckstatus_comcheck?: string;
  comcheckstatus_id?: string;
  /** @format date-time */
  comcheckstatus_receive_date?: string;
  /** @format date-time */
  comcheckstatus_sent_date?: string;
  /** @format int32 */
  comcheckstatus_sent_retry?: number;
  comcheckstatus_state?: "RUNNING" | "SUCCESS" | "FAILURE";
  comcheckstatus_user?: string;
  listened?: boolean;
}

export interface Command {
  command_content: string;
  command_executor: string;
  listened?: boolean;
  /** @format int32 */
  numberOfActions?: number;
  payload_arguments?: PayloadArgument[];
  payload_attack_patterns?: string[];
  payload_cleanup_command?: string;
  payload_cleanup_executor?: string;
  payload_collector?: string;
  payload_collector_type?: string;
  /** @format date-time */
  payload_created_at: string;
  payload_description?: string;
  payload_elevation_required?: boolean;
  payload_execution_arch: "x86_64" | "arm64" | "ALL_ARCHITECTURES";
  payload_external_id?: string;
  payload_id: string;
  payload_name: string;
  payload_platforms?: ("Linux" | "Windows" | "MacOS" | "Container" | "Service" | "Generic" | "Internal" | "Unknown")[];
  payload_prerequisites?: PayloadPrerequisite[];
  payload_source: "COMMUNITY" | "FILIGRAN" | "MANUAL";
  payload_status: "UNVERIFIED" | "VERIFIED" | "DEPRECATED";
  payload_tags?: string[];
  payload_type?: string;
  /** @format date-time */
  payload_updated_at: string;
  typeEnum?: "COMMAND" | "EXECUTABLE" | "FILE_DROP" | "DNS_RESOLUTION" | "NETWORK_TRAFFIC";
}

/** List of communications of this team */
export interface Communication {
  communication_ack?: boolean;
  communication_animation?: boolean;
  communication_attachments?: string[];
  communication_content?: string;
  communication_content_html?: string;
  communication_exercise?: string;
  communication_from: string;
  communication_id: string;
  communication_inject?: string;
  communication_message_id: string;
  /** @format date-time */
  communication_received_at: string;
  /** @format date-time */
  communication_sent_at: string;
  communication_subject?: string;
  communication_to: string;
  communication_users?: string[];
  listened?: boolean;
}

export interface Condition {
  key: string;
  operator: "eq";
  value?: boolean;
}

export interface CreateUserInput {
  /** True if the user is admin */
  user_admin?: boolean;
  /** The email of the user */
  user_email: string;
  /** First name of the user */
  user_firstname?: string;
  /** Last name of the user */
  user_lastname?: string;
  /** Organization of the user */
  user_organization?: string;
  /** Password of the user as plain text */
  user_plain_password?: string;
  /** Tags of the user */
  user_tags?: string[];
}

export interface DirectInjectInput {
  inject_content?: object;
  inject_description?: string;
  inject_documents?: InjectDocumentInput[];
  inject_injector_contract?: string;
  inject_title?: string;
  inject_users?: string[];
}

export interface DnsResolution {
  dns_resolution_hostname: string;
  listened?: boolean;
  /** @format int32 */
  numberOfActions?: number;
  payload_arguments?: PayloadArgument[];
  payload_attack_patterns?: string[];
  payload_cleanup_command?: string;
  payload_cleanup_executor?: string;
  payload_collector?: string;
  payload_collector_type?: string;
  /** @format date-time */
  payload_created_at: string;
  payload_description?: string;
  payload_elevation_required?: boolean;
  payload_execution_arch: "x86_64" | "arm64" | "ALL_ARCHITECTURES";
  payload_external_id?: string;
  payload_id: string;
  payload_name: string;
  payload_platforms?: ("Linux" | "Windows" | "MacOS" | "Container" | "Service" | "Generic" | "Internal" | "Unknown")[];
  payload_prerequisites?: PayloadPrerequisite[];
  payload_source: "COMMUNITY" | "FILIGRAN" | "MANUAL";
  payload_status: "UNVERIFIED" | "VERIFIED" | "DEPRECATED";
  payload_tags?: string[];
  payload_type?: string;
  /** @format date-time */
  payload_updated_at: string;
  typeEnum?: "COMMAND" | "EXECUTABLE" | "FILE_DROP" | "DNS_RESOLUTION" | "NETWORK_TRAFFIC";
}

export interface Document {
  document_description?: string;
  document_exercises?: string[];
  document_id: string;
  document_name: string;
  document_scenarios?: string[];
  document_tags?: string[];
  document_target?: string;
  document_type: string;
  listened?: boolean;
}

export interface DocumentCreateInput {
  document_description?: string;
  document_exercises?: string[];
  document_scenarios?: string[];
  document_tags?: string[];
}

export interface DocumentTagUpdateInput {
  tags?: string[];
}

export interface DocumentUpdateInput {
  document_description?: string;
  document_exercises?: string[];
  document_scenarios?: string[];
  document_tags?: string[];
}

export interface Endpoint {
  asset_agents?: Agent[];
  /** @format date-time */
  asset_cleared_at?: string;
  /** @format date-time */
  asset_created_at: string;
  asset_description?: string;
  asset_id: string;
  asset_name: string;
  asset_tags?: string[];
  asset_type?: string;
  /** @format date-time */
  asset_updated_at: string;
  endpoint_arch: "x86_64" | "arm64" | "Unknown";
  endpoint_hostname?: string;
  endpoint_ips: string[];
  endpoint_mac_addresses?: string[];
  endpoint_platform: "Linux" | "Windows" | "MacOS" | "Container" | "Service" | "Generic" | "Internal" | "Unknown";
  listened?: boolean;
}

export interface EndpointOutput {
  /**
   * List of agents
   * @uniqueItems true
   */
  asset_agents: AgentOutput[];
  /** Asset Id */
  asset_id: string;
  /** Asset name */
  asset_name: string;
  /**
   * Tags
   * @uniqueItems true
   */
  asset_tags?: string[];
  /** Asset type */
  asset_type?: string;
  /** Architecture */
  endpoint_arch: "x86_64" | "arm64" | "Unknown";
  /** Platform */
  endpoint_platform: "Linux" | "Windows" | "MacOS" | "Container" | "Service" | "Generic" | "Internal" | "Unknown";
}

export interface EndpointOverviewOutput {
  /**
   * List of agents
   * @uniqueItems true
   */
  asset_agents: AgentOutput[];
  /** Asset description */
  asset_description?: string;
  /** Asset Id */
  asset_id: string;
  /** Asset name */
  asset_name: string;
  /**
   * Tags
   * @uniqueItems true
   */
  asset_tags?: string[];
  /** Architecture */
  endpoint_arch?: "x86_64" | "arm64" | "Unknown";
  /** Hostname */
  endpoint_hostname?: string;
  /**
   * List IPs
   * @uniqueItems true
   */
  endpoint_ips?: string[];
  /**
   * List of MAC addresses
   * @uniqueItems true
   */
  endpoint_mac_addresses?: string[];
  /** Platform */
  endpoint_platform?: "Linux" | "Windows" | "MacOS" | "Container" | "Service" | "Generic" | "Internal" | "Unknown";
}

export interface EndpointRegisterInput {
  agent_executed_by_user?: string;
  agent_is_elevated?: boolean;
  agent_is_service?: boolean;
  asset_description?: string;
  asset_external_reference: string;
  /** @format date-time */
  asset_last_seen?: string | null;
  asset_name: string;
  asset_tags?: string[];
  endpoint_agent_version?: string;
  endpoint_arch: "x86_64" | "arm64" | "Unknown";
  endpoint_hostname?: string;
  /**
   * @maxItems 2147483647
   * @minItems 1
   */
  endpoint_ips: string[];
  endpoint_mac_addresses?: string[];
  endpoint_platform: "Linux" | "Windows" | "MacOS" | "Container" | "Service" | "Generic" | "Internal" | "Unknown";
}

export interface EndpointUpdateInput {
  asset_description?: string;
  asset_name: string;
  asset_tags?: string[];
}

export interface Evaluation {
  /** @format date-time */
  evaluation_created_at: string;
  evaluation_id: string;
  evaluation_objective: string;
  /** @format int64 */
  evaluation_score?: number;
  /** @format date-time */
  evaluation_updated_at: string;
  evaluation_user: string;
  listened?: boolean;
}

export interface EvaluationInput {
  /** @format int64 */
  evaluation_score?: number;
}

export interface Executable {
  executable_file?: string;
  listened?: boolean;
  /** @format int32 */
  numberOfActions?: number;
  payload_arguments?: PayloadArgument[];
  payload_attack_patterns?: string[];
  payload_cleanup_command?: string;
  payload_cleanup_executor?: string;
  payload_collector?: string;
  payload_collector_type?: string;
  /** @format date-time */
  payload_created_at: string;
  payload_description?: string;
  payload_elevation_required?: boolean;
  payload_execution_arch: "x86_64" | "arm64" | "ALL_ARCHITECTURES";
  payload_external_id?: string;
  payload_id: string;
  payload_name: string;
  payload_platforms?: ("Linux" | "Windows" | "MacOS" | "Container" | "Service" | "Generic" | "Internal" | "Unknown")[];
  payload_prerequisites?: PayloadPrerequisite[];
  payload_source: "COMMUNITY" | "FILIGRAN" | "MANUAL";
  payload_status: "UNVERIFIED" | "VERIFIED" | "DEPRECATED";
  payload_tags?: string[];
  payload_type?: string;
  /** @format date-time */
  payload_updated_at: string;
  typeEnum?: "COMMAND" | "EXECUTABLE" | "FILE_DROP" | "DNS_RESOLUTION" | "NETWORK_TRAFFIC";
}

export interface ExecutionTraces {
  agent?: string;
  execution_action?:
    | "START"
    | "PREREQUISITE_CHECK"
    | "PREREQUISITE_EXECUTION"
    | "EXECUTION"
    | "CLEANUP_EXECUTION"
    | "COMPLETE";
  execution_context_identifiers?: string[];
  /** @format date-time */
  execution_created_at: string;
  execution_message: string;
  execution_status?:
    | "SUCCESS"
    | "ERROR"
    | "MAYBE_PREVENTED"
    | "COMMAND_NOT_FOUND"
    | "COMMAND_CANNOT_BE_EXECUTED"
    | "WARNING"
    | "PARTIAL"
    | "MAYBE_PARTIAL_PREVENTED"
    | "ASSET_INACTIVE"
    | "INFO";
  /** @format date-time */
  execution_time?: string;
  execution_trace_id: string;
  /** @format date-time */
  execution_updated_at: string;
  injectStatus?: string;
  injectTestStatus?: string;
  listened?: boolean;
}

/** Represents a single execution trace detail */
export interface ExecutionTracesOutput {
  /**
   * The action that created this execution trace
   * @example "START, PREREQUISITE_CHECK, PREREQUISITE_EXECUTION, EXECUTION, CLEANUP_EXECUTION or COMPLETE"
   */
  execution_action:
    | "START"
    | "PREREQUISITE_CHECK"
    | "PREREQUISITE_EXECUTION"
    | "EXECUTION"
    | "CLEANUP_EXECUTION"
    | "COMPLETE";
  /** A detailed message describing the execution */
  execution_message: string;
  /**
   * The status of the execution trace
   * @example "SUCCESS, ERROR, COMMAND_NOT_FOUND, WARNING, COMMAND_CANNOT_BE_EXECUTED.."
   */
  execution_status:
    | "SUCCESS"
    | "ERROR"
    | "MAYBE_PREVENTED"
    | "COMMAND_NOT_FOUND"
    | "COMMAND_CANNOT_BE_EXECUTED"
    | "WARNING"
    | "PARTIAL"
    | "MAYBE_PARTIAL_PREVENTED"
    | "ASSET_INACTIVE"
    | "INFO";
  /** @format date-time */
  execution_time: string;
}

export interface Executor {
  /** @format date-time */
  executor_created_at: string;
  executor_doc?: string;
  executor_id: string;
  executor_name: string;
  executor_platforms?: string[];
  executor_type: string;
  /** @format date-time */
  executor_updated_at: string;
  listened?: boolean;
}

export interface ExecutorCreateInput {
  executor_id: string;
  executor_name: string;
  executor_platforms?: string[];
  executor_type: string;
}

/** Agent executor */
export interface ExecutorOutput {
  /** Agent executor id */
  executor_id?: string;
  /** Agent executor name */
  executor_name?: string;
  /** Agent executor type */
  executor_type?: string;
}

export interface ExecutorUpdateInput {
  /** @format date-time */
  executor_last_execution?: string;
}

export interface Exercise {
  /** @format int64 */
  exercise_all_users_number?: number;
  exercise_articles?: string[];
  exercise_category?: string;
  /** @format int64 */
  exercise_communications_number?: number;
  /** @format date-time */
  exercise_created_at: string;
  exercise_description?: string;
  exercise_documents?: string[];
  /** @format date-time */
  exercise_end_date?: string;
  exercise_id: string;
  exercise_injects?: string[];
  exercise_injects_statistics?: Record<string, number>;
  exercise_kill_chain_phases?: KillChainPhase[];
  exercise_lessons_anonymized?: boolean;
  /** @format int64 */
  exercise_lessons_answers_number?: number;
  exercise_lessons_categories?: string[];
  exercise_logo_dark?: string;
  exercise_logo_light?: string;
  /** @format int64 */
  exercise_logs_number?: number;
  exercise_mail_from: string;
  exercise_mails_reply_to?: string[];
  exercise_main_focus?: string;
  exercise_message_footer?: string;
  exercise_message_header?: string;
  exercise_name: string;
  /** @format date-time */
  exercise_next_inject_date?: string;
  exercise_next_possible_status?: ("SCHEDULED" | "CANCELED" | "RUNNING" | "PAUSED" | "FINISHED")[];
  exercise_observers?: string[];
  exercise_pauses?: string[];
  exercise_planners?: string[];
  exercise_platforms?: ("Linux" | "Windows" | "MacOS" | "Container" | "Service" | "Generic" | "Internal" | "Unknown")[];
  exercise_scenario?: string;
  /** @format double */
  exercise_score?: number;
  exercise_severity?: "low" | "medium" | "high" | "critical";
  /** @format date-time */
  exercise_start_date?: string;
  exercise_status: "SCHEDULED" | "CANCELED" | "RUNNING" | "PAUSED" | "FINISHED";
  exercise_subtitle?: string;
  exercise_tags?: string[];
  exercise_teams?: string[];
  exercise_teams_users?: ExerciseTeamUser[];
  /** @format date-time */
  exercise_updated_at: string;
  exercise_users?: string[];
  /** @format int64 */
  exercise_users_number?: number;
  exercise_variables?: string[];
  listened?: boolean;
}

export interface ExerciseDetails {
  /** @format int64 */
  exercise_all_users_number?: number;
  /** @uniqueItems true */
  exercise_articles?: string[];
  exercise_category?: string;
  /** @format int64 */
  exercise_communications_number?: number;
  /** @format date-time */
  exercise_created_at?: string;
  exercise_description?: string;
  /** @uniqueItems true */
  exercise_documents?: string[];
  /** @format date-time */
  exercise_end_date?: string;
  exercise_id: string;
  /** @uniqueItems true */
  exercise_injects?: string[];
  exercise_injects_statistics?: Record<string, number>;
  exercise_kill_chain_phases?: KillChainPhase[];
  exercise_lessons_anonymized?: boolean;
  /** @format int64 */
  exercise_lessons_answers_number?: number;
  /** @uniqueItems true */
  exercise_lessons_categories?: string[];
  /** @format int64 */
  exercise_logs_number?: number;
  exercise_mail_from?: string;
  exercise_mails_reply_to?: string[];
  exercise_main_focus?: string;
  exercise_message_footer?: string;
  exercise_message_header?: string;
  exercise_name: string;
  /** @format date-time */
  exercise_next_inject_date?: string;
  exercise_next_possible_status?: ("SCHEDULED" | "CANCELED" | "RUNNING" | "PAUSED" | "FINISHED")[];
  /** @uniqueItems true */
  exercise_observers?: string[];
  /** @uniqueItems true */
  exercise_pauses?: string[];
  /** @uniqueItems true */
  exercise_planners?: string[];
  exercise_platforms?: string[];
  exercise_scenario?: string;
  /** @format double */
  exercise_score?: number;
  exercise_severity?: string;
  /** @format date-time */
  exercise_start_date?: string;
  exercise_status?: "SCHEDULED" | "CANCELED" | "RUNNING" | "PAUSED" | "FINISHED";
  exercise_subtitle?: string;
  /** @uniqueItems true */
  exercise_tags?: string[];
  /** @uniqueItems true */
  exercise_teams?: string[];
  /** @uniqueItems true */
  exercise_teams_users?: ExerciseTeamUser[];
  /** @format date-time */
  exercise_updated_at?: string;
  /** @uniqueItems true */
  exercise_users?: string[];
  /** @format int64 */
  exercise_users_number?: number;
}

export interface ExerciseInput {
  exercise_category?: string;
  exercise_description?: string;
  exercise_mail_from?: string;
  exercise_mails_reply_to?: string[];
  exercise_main_focus?: string;
  exercise_message_footer?: string;
  exercise_message_header?: string;
  exercise_name: string;
  exercise_severity?: string;
  /** @format date-time */
  exercise_start_date?: string | null;
  exercise_subtitle?: string;
  exercise_tags?: string[];
}

export interface ExerciseSimple {
  exercise_category?: string;
  exercise_global_score: ExpectationResultsByType[];
  exercise_id: string;
  exercise_name: string;
  /** @format date-time */
  exercise_start_date?: string;
  exercise_status?: "SCHEDULED" | "CANCELED" | "RUNNING" | "PAUSED" | "FINISHED";
  exercise_subtitle?: string;
  /** @uniqueItems true */
  exercise_tags?: string[];
  exercise_targets?: TargetSimple[];
  /** @format date-time */
  exercise_updated_at?: string;
}

export interface ExerciseTeamPlayersEnableInput {
  exercise_team_players?: string[];
}

export interface ExerciseTeamUser {
  exercise_id?: string;
  team_id?: string;
  user_id?: string;
}

export interface ExerciseUpdateLogoInput {
  exercise_logo_dark?: string;
  exercise_logo_light?: string;
}

export interface ExerciseUpdateStartDateInput {
  /** @format date-time */
  exercise_start_date?: string;
}

export interface ExerciseUpdateStatusInput {
  exercise_status?: "SCHEDULED" | "CANCELED" | "RUNNING" | "PAUSED" | "FINISHED";
}

export interface ExerciseUpdateTagsInput {
  apply_tag_rule?: boolean;
  exercise_tags?: string[];
}

export interface ExerciseUpdateTeamsInput {
  exercise_teams?: string[];
}

export interface ExercisesGlobalScoresInput {
  exercise_ids: string[];
}

export interface ExercisesGlobalScoresOutput {
  global_scores_by_exercise_ids: Record<string, ExpectationResultsByType[]>;
}

export interface ExpectationResultsByType {
  avgResult: "FAILED" | "PENDING" | "PARTIAL" | "UNKNOWN" | "SUCCESS";
  distribution: ResultDistribution[];
  type: "DETECTION" | "HUMAN_RESPONSE" | "PREVENTION";
}

export interface ExpectationUpdateInput {
  /** @format double */
  expectation_score: number;
  source_id: string;
  source_name: string;
  source_type: string;
}

export interface ExportMapperInput {
  export_mapper_name?: string;
  ids_to_export: string[];
}

export interface FileDrop {
  file_drop_file?: string;
  listened?: boolean;
  /** @format int32 */
  numberOfActions?: number;
  payload_arguments?: PayloadArgument[];
  payload_attack_patterns?: string[];
  payload_cleanup_command?: string;
  payload_cleanup_executor?: string;
  payload_collector?: string;
  payload_collector_type?: string;
  /** @format date-time */
  payload_created_at: string;
  payload_description?: string;
  payload_elevation_required?: boolean;
  payload_execution_arch: "x86_64" | "arm64" | "ALL_ARCHITECTURES";
  payload_external_id?: string;
  payload_id: string;
  payload_name: string;
  payload_platforms?: ("Linux" | "Windows" | "MacOS" | "Container" | "Service" | "Generic" | "Internal" | "Unknown")[];
  payload_prerequisites?: PayloadPrerequisite[];
  payload_source: "COMMUNITY" | "FILIGRAN" | "MANUAL";
  payload_status: "UNVERIFIED" | "VERIFIED" | "DEPRECATED";
  payload_tags?: string[];
  payload_type?: string;
  /** @format date-time */
  payload_updated_at: string;
  typeEnum?: "COMMAND" | "EXECUTABLE" | "FILE_DROP" | "DNS_RESOLUTION" | "NETWORK_TRAFFIC";
}

export interface Filter {
  key: string;
  mode?: "and" | "or";
  operator?:
    | "eq"
    | "not_eq"
    | "contains"
    | "not_contains"
    | "starts_with"
    | "not_starts_with"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "empty"
    | "not_empty";
  values?: string[];
}

/** Filter object to search within filterable attributes */
export interface FilterGroup {
  filters?: Filter[];
  mode: "and" | "or";
}

export interface FlagInput {
  flag_type: string;
  flag_value: string;
}

export interface FullTextSearchCountResult {
  clazz: string;
  /** @format int64 */
  count: number;
}

export interface FullTextSearchResult {
  clazz: string;
  description?: string;
  id: string;
  name: string;
  /** @uniqueItems true */
  tags?: Tag[];
}

export interface GlobalScoreBySimulationEndDate {
  /** @format float */
  global_score_success_percentage: number;
  /** @format date-time */
  simulation_end_date: string;
}

export interface Grant {
  grant_exercise?: string;
  grant_group?: string;
  grant_id: string;
  grant_name: "OBSERVER" | "PLANNER";
  grant_scenario?: string;
  listened?: boolean;
}

export interface Group {
  group_default_exercise_assign?: ("OBSERVER" | "PLANNER")[];
  group_default_exercise_observer?: boolean;
  group_default_exercise_planner?: boolean;
  group_default_scenario_assign?: ("OBSERVER" | "PLANNER")[];
  group_default_scenario_observer?: boolean;
  group_default_scenario_planner?: boolean;
  group_default_user_assign?: boolean;
  group_description?: string;
  group_grants?: Grant[];
  group_id: string;
  group_name: string;
  group_organizations?: string[];
  group_users?: string[];
  listened?: boolean;
}

export interface GroupCreateInput {
  group_default_exercise_observer?: boolean;
  group_default_exercise_planner?: boolean;
  group_default_scenario_observer?: boolean;
  group_default_scenario_planner?: boolean;
  group_default_user_assign?: boolean;
  group_description?: string;
  group_name: string;
}

export interface GroupGrantInput {
  grant_exercise?: string;
  grant_name?: "OBSERVER" | "PLANNER";
  grant_scenario?: string;
}

export interface GroupUpdateUsersInput {
  group_users?: string[];
}

export interface ImportMapper {
  /** @format date-time */
  import_mapper_created_at?: string;
  import_mapper_id: string;
  import_mapper_inject_importers?: InjectImporter[];
  import_mapper_inject_type_column: string;
  import_mapper_name: string;
  /** @format date-time */
  import_mapper_updated_at?: string;
  listened?: boolean;
}

export interface ImportMapperAddInput {
  import_mapper_inject_importers: InjectImporterAddInput[];
  /** @pattern ^[A-Z]{1,2}$ */
  import_mapper_inject_type_column: string;
  import_mapper_name: string;
}

export interface ImportMapperUpdateInput {
  import_mapper_inject_importers: InjectImporterUpdateInput[];
  /** @pattern ^[A-Z]{1,2}$ */
  import_mapper_inject_type_column: string;
  import_mapper_name: string;
}

export interface ImportMessage {
  message_code?:
    | "NO_POTENTIAL_MATCH_FOUND"
    | "SEVERAL_MATCHES"
    | "ABSOLUTE_TIME_WITHOUT_START_DATE"
    | "DATE_SET_IN_PAST"
    | "DATE_SET_IN_FUTURE"
    | "NO_TEAM_FOUND"
    | "EXPECTATION_SCORE_UNDEFINED";
  message_level?: "CRITICAL" | "ERROR" | "WARN" | "INFO";
  message_params?: Record<string, string>;
}

export interface ImportPostSummary {
  available_sheets: string[];
  import_id: string;
}

export interface ImportTestSummary {
  import_message?: ImportMessage[];
  injects?: InjectOutput[];
  /** @format int32 */
  total_injects?: number;
}

export interface Inject {
  footer?: string;
  header?: string;
  inject_all_teams?: boolean;
  inject_asset_groups?: string[];
  inject_assets?: string[];
  inject_attack_patterns?: AttackPattern[];
  inject_city?: string;
  inject_communications?: string[];
  /** @format int64 */
  inject_communications_not_ack_number?: number;
  /** @format int64 */
  inject_communications_number?: number;
  inject_content?: object;
  inject_country?: string;
  /** @format date-time */
  inject_created_at: string;
  /** @format date-time */
  inject_date?: string;
  /**
   * @format int64
   * @min 0
   */
  inject_depends_duration: number;
  inject_depends_on?: InjectDependency[];
  inject_description?: string;
  inject_documents?: string[];
  inject_enabled?: boolean;
  inject_exercise?: string;
  inject_expectations?: string[];
  inject_id: string;
  inject_injector_contract?: InjectorContract;
  inject_kill_chain_phases?: KillChainPhase[];
  inject_ready?: boolean;
  inject_scenario?: string;
  /** @format date-time */
  inject_sent_at?: string;
  inject_status?: InjectStatus;
  inject_tags?: string[];
  inject_teams?: string[];
  inject_testable?: boolean;
  inject_title: string;
  /** @format date-time */
  inject_trigger_now_date?: string;
  inject_type?: string;
  /** @format date-time */
  inject_updated_at: string;
  inject_user?: string;
  /** @format int64 */
  inject_users_number?: number;
  listened?: boolean;
}

export interface InjectBulkProcessingInput {
  inject_ids_to_ignore?: string[];
  inject_ids_to_process?: string[];
  search_pagination_input?: SearchPaginationInput;
  simulation_or_scenario_id?: string;
}

export interface InjectBulkUpdateInputs {
  inject_ids_to_ignore?: string[];
  inject_ids_to_process?: string[];
  search_pagination_input?: SearchPaginationInput;
  simulation_or_scenario_id?: string;
  update_operations?: InjectBulkUpdateOperation[];
}

export interface InjectBulkUpdateOperation {
  field?: "assets" | "asset_groups" | "teams";
  operation?: "add" | "remove" | "replace";
  values?: string[];
}

export interface InjectDependency {
  dependency_condition?: InjectDependencyCondition;
  /** @format date-time */
  dependency_created_at?: string;
  dependency_relationship?: InjectDependencyId;
  /** @format date-time */
  dependency_updated_at?: string;
}

export interface InjectDependencyCondition {
  conditions?: Condition[];
  mode: "and" | "or";
}

export interface InjectDependencyId {
  inject_children_id?: string;
  inject_parent_id?: string;
}

export interface InjectDependencyIdInput {
  inject_children_id?: string;
  inject_parent_id?: string;
}

export interface InjectDependencyInput {
  dependency_condition?: InjectDependencyCondition;
  dependency_relationship?: InjectDependencyIdInput;
}

export interface InjectDocumentInput {
  document_attached?: boolean;
  document_id?: string;
}

export interface InjectExecutionInput {
  execution_action?:
    | "prerequisite_check"
    | "prerequisite_execution"
    | "cleanup_execution"
    | "command_execution"
    | "dns_resolution"
    | "file_execution"
    | "file_drop"
    | "complete";
  /** @format int32 */
  execution_duration?: number;
  execution_message: string;
  execution_status: string;
}

export interface InjectExpectation {
  inject_expectation_agent?: string;
  inject_expectation_article?: string;
  inject_expectation_asset?: string;
  inject_expectation_asset_group?: string;
  inject_expectation_challenge?: string;
  /** @format date-time */
  inject_expectation_created_at?: string;
  inject_expectation_description?: string;
  inject_expectation_exercise?: string;
  /** @format double */
  inject_expectation_expected_score: number;
  inject_expectation_group?: boolean;
  inject_expectation_id: string;
  inject_expectation_inject?: string;
  inject_expectation_name?: string;
  inject_expectation_results?: InjectExpectationResult[];
  /** @format double */
  inject_expectation_score?: number;
  inject_expectation_signatures?: InjectExpectationSignature[];
  inject_expectation_status?: "FAILED" | "PENDING" | "PARTIAL" | "UNKNOWN" | "SUCCESS";
  inject_expectation_team?: string;
  inject_expectation_type: "TEXT" | "DOCUMENT" | "ARTICLE" | "CHALLENGE" | "MANUAL" | "PREVENTION" | "DETECTION";
  /** @format date-time */
  inject_expectation_updated_at?: string;
  inject_expectation_user?: string;
  /** @format int64 */
  inject_expiration_time: number;
  listened?: boolean;
  target_id?: string;
}

export interface InjectExpectationResult {
  date?: string;
  metadata?: Record<string, string>;
  result: string;
  /** @format double */
  score?: number;
  sourceId?: string;
  sourceName?: string;
  sourceType?: string;
}

export interface InjectExpectationResultsByAttackPattern {
  inject_attack_pattern?: string;
  inject_expectation_results?: InjectExpectationResultsByType[];
}

export interface InjectExpectationResultsByType {
  inject_id?: string;
  inject_title?: string;
  results?: ExpectationResultsByType[];
}

export interface InjectExpectationSignature {
  type?: string;
  value?: string;
}

/** Expectations */
export interface InjectExpectationSimple {
  inject_expectation_id: string;
  inject_expectation_name?: string;
}

export interface InjectExpectationUpdateInput {
  collector_id: string;
  is_success: boolean;
  metadata?: Record<string, string>;
  result: string;
}

export interface InjectImporter {
  /** @format date-time */
  inject_importer_created_at?: string;
  inject_importer_id: string;
  inject_importer_injector_contract: string;
  inject_importer_rule_attributes?: RuleAttribute[];
  inject_importer_type_value: string;
  /** @format date-time */
  inject_importer_updated_at?: string;
  listened?: boolean;
}

export interface InjectImporterAddInput {
  inject_importer_injector_contract: string;
  inject_importer_rule_attributes?: RuleAttributeAddInput[];
  inject_importer_type_value: string;
}

export interface InjectImporterUpdateInput {
  inject_importer_id?: string;
  inject_importer_injector_contract: string;
  inject_importer_rule_attributes?: RuleAttributeUpdateInput[];
  inject_importer_type_value: string;
}

export interface InjectInput {
  inject_all_teams?: boolean;
  inject_asset_groups?: string[];
  inject_assets?: string[];
  inject_city?: string;
  inject_content?: object;
  inject_country?: string;
  /** @format int64 */
  inject_depends_duration?: number;
  inject_depends_on?: InjectDependencyInput[];
  inject_description?: string;
  inject_documents?: InjectDocumentInput[];
  inject_enabled?: boolean;
  inject_injector_contract?: string;
  inject_tags?: string[];
  inject_teams?: string[];
  inject_title?: string;
}

export interface InjectOutput {
  inject_asset_groups?: string[];
  inject_assets?: string[];
  inject_content?: object;
  /**
   * @format int64
   * @min 0
   */
  inject_depends_duration: number;
  inject_depends_on?: InjectDependency[];
  inject_enabled?: boolean;
  inject_exercise?: string;
  inject_id: string;
  inject_injector_contract?: InjectorContract;
  inject_ready?: boolean;
  inject_scenario?: string;
  /** @uniqueItems true */
  inject_tags?: string[];
  inject_teams?: string[];
  inject_testable?: boolean;
  inject_title: string;
  inject_type?: string;
}

export interface InjectReceptionInput {
  /** @format int32 */
  tracking_total_count?: number;
}

export interface InjectResultOutput {
  /** Result of expectations */
  inject_expectation_results: ExpectationResultsByType[];
  /** Id of inject */
  inject_id: string;
  /** Injector contract */
  inject_injector_contract?: InjectorContractSimple;
  /** Status */
  inject_status?: InjectStatusSimple;
  inject_targets?: TargetSimple[];
  /** Title of inject */
  inject_title: string;
  /** Type of inject */
  inject_type?: string;
  /**
   * Timestamp when the inject was last updated
   * @format date-time
   */
  inject_updated_at: string;
}

export interface InjectResultOverviewOutput {
  /** Attack pattern */
  inject_attack_patterns?: AttackPatternSimple[];
  inject_content?: object;
  /** Description of inject */
  inject_description?: string;
  /** Result of expectations */
  inject_expectation_results: ExpectationResultsByType[];
  /** Expectations */
  inject_expectations?: InjectExpectationSimple[];
  /** Id of inject */
  inject_id: string;
  /** Full contract */
  inject_injector_contract: AtomicInjectorContractOutput;
  /** Kill chain phases */
  inject_kill_chain_phases?: KillChainPhaseSimple[];
  /** Indicates whether the inject is ready for use */
  inject_ready?: boolean;
  /** status */
  inject_status?: InjectStatusOutput;
  /** Results of expectations for each target */
  inject_targets: InjectTargetWithResult[];
  /** Title of inject */
  inject_title: string;
  /** Type of inject */
  inject_type?: string;
  /**
   * Timestamp when the inject was last updated
   * @format date-time
   */
  inject_updated_at?: string;
  /** Documents */
  injects_documents?: string[];
  /** Tags */
  injects_tags?: string[];
}

export interface InjectStatus {
  listened?: boolean;
  status_id?: string;
  status_name:
    | "SUCCESS"
    | "ERROR"
    | "MAYBE_PREVENTED"
    | "PARTIAL"
    | "MAYBE_PARTIAL_PREVENTED"
    | "DRAFT"
    | "QUEUING"
    | "EXECUTING"
    | "PENDING";
  status_payload_output?: StatusPayload;
  status_traces?: ExecutionTraces[];
  /** @format date-time */
  tracking_end_date?: string;
  /** @format date-time */
  tracking_sent_date?: string;
}

/** status */
export interface InjectStatusOutput {
  status_id: string;
  status_main_traces?: ExecutionTracesOutput[];
  status_name?: string;
  status_traces_by_agent?: AgentStatusOutput[];
  /** @format date-time */
  tracking_end_date?: string;
  /** @format date-time */
  tracking_sent_date?: string;
}

/** Status */
export interface InjectStatusSimple {
  status_id: string;
  status_name?: string;
  /** @format date-time */
  tracking_sent_date?: string;
}

/** Results of expectations for each target */
export interface InjectTargetWithResult {
  children?: InjectTargetWithResult[];
  expectationResultsByTypes?: ExpectationResultsByType[];
  id: string;
  name?: string;
  platformType?: "Linux" | "Windows" | "MacOS" | "Container" | "Service" | "Generic" | "Internal" | "Unknown";
  targetType?: "AGENT" | "ASSETS" | "ASSETS_GROUPS" | "PLAYER" | "TEAMS";
}

export interface InjectTeamsInput {
  inject_teams?: string[];
}

export interface InjectTestStatusOutput {
  inject_id: string;
  inject_title: string;
  inject_type?: string;
  status_id: string;
  status_main_traces?: ExecutionTracesOutput[];
  status_name?: string;
  status_traces_by_agent?: AgentStatusOutput[];
  /** @format date-time */
  tracking_end_date?: string;
  /** @format date-time */
  tracking_sent_date?: string;
}

export interface InjectUpdateActivationInput {
  inject_enabled?: boolean;
}

export interface InjectUpdateStatusInput {
  message?: string;
  status?: string;
}

export interface Injector {
  injector_category?: string;
  /** @format date-time */
  injector_created_at: string;
  injector_custom_contracts?: boolean;
  injector_executor_clear_commands?: Record<string, string>;
  injector_executor_commands?: Record<string, string>;
  injector_external?: boolean;
  injector_id: string;
  injector_name: string;
  injector_payloads?: boolean;
  injector_type: string;
  /** @format date-time */
  injector_updated_at: string;
  listened?: boolean;
}

export interface InjectorConnection {
  host?: string;
  pass?: string;
  /** @format int32 */
  port?: number;
  use_ssl?: boolean;
  user?: string;
  vhost?: string;
}

export interface InjectorContract {
  convertedContent?: object;
  injector_contract_arch?: "x86_64" | "arm64" | "ALL_ARCHITECTURES";
  injector_contract_atomic_testing?: boolean;
  injector_contract_attack_patterns?: string[];
  injector_contract_content: string;
  /** @format date-time */
  injector_contract_created_at: string;
  injector_contract_custom?: boolean;
  injector_contract_id: string;
  injector_contract_import_available?: boolean;
  injector_contract_injector: string;
  injector_contract_injector_type?: string;
  injector_contract_labels?: Record<string, string>;
  injector_contract_manual?: boolean;
  injector_contract_needs_executor?: boolean;
  injector_contract_payload?: Payload;
  injector_contract_platforms?: (
    | "Linux"
    | "Windows"
    | "MacOS"
    | "Container"
    | "Service"
    | "Generic"
    | "Internal"
    | "Unknown"
  )[];
  /** @format date-time */
  injector_contract_updated_at: string;
  listened?: boolean;
}

export interface InjectorContractAddInput {
  atomicTesting?: boolean;
  contract_attack_patterns_external_ids?: string[];
  contract_attack_patterns_ids?: string[];
  contract_content: string;
  contract_id: string;
  contract_labels?: Record<string, string>;
  contract_manual?: boolean;
  contract_platforms?: string[];
  injector_id: string;
  is_atomic_testing?: boolean;
}

export interface InjectorContractInput {
  atomicTesting?: boolean;
  contract_attack_patterns_external_ids?: string[];
  contract_content: string;
  contract_id: string;
  contract_labels?: Record<string, string>;
  contract_manual?: boolean;
  contract_platforms?: ("Linux" | "Windows" | "MacOS" | "Container" | "Service" | "Generic" | "Internal" | "Unknown")[];
  is_atomic_testing?: boolean;
}

export interface InjectorContractOutput {
  injector_contract_arch?: "x86_64" | "arm64" | "ALL_ARCHITECTURES";
  /** Attack pattern Ids */
  injector_contract_attack_patterns?: string[];
  /** Content */
  injector_contract_content: string;
  /** Injector contract Id */
  injector_contract_id: string;
  /** Injector type */
  injector_contract_injector_type?: string;
  /** Labels */
  injector_contract_labels?: Record<string, string>;
  /** Payload type */
  injector_contract_payload_type?: string;
  /** Platforms */
  injector_contract_platforms?: (
    | "Linux"
    | "Windows"
    | "MacOS"
    | "Container"
    | "Service"
    | "Generic"
    | "Internal"
    | "Unknown"
  )[];
  /**
   * Timestamp when the injector contract was last updated
   * @format date-time
   */
  injector_contract_updated_at: string;
}

/** Injector contract */
export interface InjectorContractSimple {
  convertedContent?: object;
  injector_contract_content: string;
  injector_contract_id: string;
  injector_contract_labels: Record<string, string>;
  injector_contract_payload?: PayloadSimple;
  injector_contract_platforms?: (
    | "Linux"
    | "Windows"
    | "MacOS"
    | "Container"
    | "Service"
    | "Generic"
    | "Internal"
    | "Unknown"
  )[];
}

export interface InjectorContractUpdateInput {
  atomicTesting?: boolean;
  contract_attack_patterns_ids?: string[];
  contract_content: string;
  contract_labels?: Record<string, string>;
  contract_manual?: boolean;
  contract_platforms?: string[];
  is_atomic_testing?: boolean;
}

export interface InjectorContractUpdateMappingInput {
  contract_attack_patterns_ids?: string[];
}

export interface InjectorCreateInput {
  injector_category?: string;
  injector_contracts?: InjectorContractInput[];
  injector_custom_contracts?: boolean;
  injector_executor_clear_commands?: Record<string, string>;
  injector_executor_commands?: Record<string, string>;
  injector_id: string;
  injector_name: string;
  injector_payloads?: boolean;
  injector_type: string;
}

export interface InjectorRegistration {
  connection?: InjectorConnection;
  listen?: string;
}

export interface InjectorUpdateInput {
  injector_category?: string;
  injector_contracts?: InjectorContractInput[];
  injector_custom_contracts?: boolean;
  injector_executor_clear_commands?: Record<string, string>;
  injector_executor_commands?: Record<string, string>;
  injector_name: string;
  injector_payloads?: boolean;
}

export interface InjectsImportInput {
  import_mapper_id: string;
  /** @format date-time */
  launch_date?: string;
  sheet_name: string;
  /** @format int32 */
  timezone_offset: number;
}

export interface InjectsImportTestInput {
  import_mapper: ImportMapperAddInput;
  sheet_name: string;
  /** @format int32 */
  timezone_offset: number;
}

export type JsonNode = object;

export interface KillChainPhase {
  listened?: boolean;
  /** @format date-time */
  phase_created_at: string;
  phase_description?: string;
  phase_external_id: string;
  phase_id: string;
  phase_kill_chain_name: string;
  phase_name: string;
  /** @format int64 */
  phase_order?: number;
  phase_shortname: string;
  phase_stix_id?: string;
  /** @format date-time */
  phase_updated_at: string;
}

export interface KillChainPhaseCreateInput {
  phase_description?: string;
  phase_external_id?: string;
  phase_kill_chain_name: string;
  phase_name: string;
  /** @format int64 */
  phase_order?: number;
  phase_shortname: string;
  phase_stix_id?: string;
}

/** Kill chain phases */
export interface KillChainPhaseSimple {
  phase_id: string;
  phase_name?: string;
}

export interface KillChainPhaseUpdateInput {
  phase_kill_chain_name: string;
  phase_name: string;
  /** @format int64 */
  phase_order?: number;
}

export interface KillChainPhaseUpsertInput {
  kill_chain_phases?: KillChainPhaseCreateInput[];
}

export interface LessonsAnswer {
  /** @format date-time */
  lessons_answer_created_at: string;
  lessons_answer_exercise?: string;
  lessons_answer_negative?: string;
  lessons_answer_positive?: string;
  lessons_answer_question: string;
  /** @format int32 */
  lessons_answer_score: number;
  /** @format date-time */
  lessons_answer_updated_at: string;
  lessons_answer_user?: string;
  lessonsanswer_id: string;
  listened?: boolean;
}

export interface LessonsAnswerCreateInput {
  lessons_answer_negative?: string;
  lessons_answer_positive?: string;
  /** @format int32 */
  lessons_answer_score?: number;
}

export interface LessonsCategory {
  /** @format date-time */
  lessons_category_created_at: string;
  lessons_category_description?: string;
  lessons_category_exercise?: string;
  lessons_category_name: string;
  /** @format int32 */
  lessons_category_order?: number;
  lessons_category_questions?: string[];
  lessons_category_scenario?: string;
  lessons_category_teams?: string[];
  /** @format date-time */
  lessons_category_updated_at: string;
  lessons_category_users?: string[];
  lessonscategory_id: string;
  listened?: boolean;
}

export interface LessonsCategoryCreateInput {
  lessons_category_description?: string;
  lessons_category_name: string;
  /** @format int32 */
  lessons_category_order?: number;
}

export interface LessonsCategoryTeamsInput {
  lessons_category_teams?: string[];
}

export interface LessonsCategoryUpdateInput {
  lessons_category_description?: string;
  lessons_category_name: string;
  /** @format int32 */
  lessons_category_order?: number;
}

export interface LessonsInput {
  lessons_anonymized?: boolean;
}

export interface LessonsQuestion {
  lessons_question_answers?: string[];
  lessons_question_category: string;
  lessons_question_content: string;
  /** @format date-time */
  lessons_question_created_at: string;
  lessons_question_exercise?: string;
  lessons_question_explanation?: string;
  /** @format int32 */
  lessons_question_order?: number;
  lessons_question_scenario?: string;
  /** @format date-time */
  lessons_question_updated_at: string;
  lessonsquestion_id: string;
  listened?: boolean;
}

export interface LessonsQuestionCreateInput {
  lessons_question_content: string;
  lessons_question_explanation?: string;
  /** @format int32 */
  lessons_question_order?: number;
}

export interface LessonsQuestionUpdateInput {
  lessons_question_content: string;
  lessons_question_explanation?: string;
  /** @format int32 */
  lessons_question_order?: number;
}

export interface LessonsSendInput {
  body?: string;
  subject?: string;
}

export interface LessonsTemplate {
  /** @format date-time */
  lessons_template_created_at: string;
  lessons_template_description?: string;
  lessons_template_name: string;
  /** @format date-time */
  lessons_template_updated_at: string;
  lessonstemplate_id: string;
  listened?: boolean;
}

export interface LessonsTemplateCategory {
  /** @format date-time */
  lessons_template_category_created_at: string;
  lessons_template_category_description?: string;
  lessons_template_category_name: string;
  /** @format int32 */
  lessons_template_category_order: number;
  lessons_template_category_questions?: string[];
  lessons_template_category_template?: string;
  /** @format date-time */
  lessons_template_category_updated_at: string;
  lessonstemplatecategory_id: string;
  listened?: boolean;
}

export interface LessonsTemplateCategoryInput {
  lessons_template_category_description?: string;
  lessons_template_category_name: string;
  /** @format int32 */
  lessons_template_category_order: number;
}

export interface LessonsTemplateInput {
  lessons_template_description?: string;
  lessons_template_name: string;
}

export interface LessonsTemplateQuestion {
  lessons_template_question_category?: string;
  lessons_template_question_content: string;
  /** @format date-time */
  lessons_template_question_created_at: string;
  lessons_template_question_explanation?: string;
  /** @format int32 */
  lessons_template_question_order: number;
  /** @format date-time */
  lessons_template_question_updated_at: string;
  lessonstemplatequestion_id: string;
  listened?: boolean;
}

export interface LessonsTemplateQuestionInput {
  lessons_template_question_content: string;
  lessons_template_question_explanation?: string;
  /** @format int32 */
  lessons_template_question_order: number;
}

export interface Log {
  listened?: boolean;
  log_content: string;
  /** @format date-time */
  log_created_at: string;
  log_exercise?: string;
  log_id: string;
  log_tags?: string[];
  log_title: string;
  /** @format date-time */
  log_updated_at: string;
  log_user?: string;
}

export interface LogCreateInput {
  log_content?: string;
  log_tags?: string[];
  log_title?: string;
}

export interface LoginUserInput {
  /** The identifier of the user */
  login: string;
  /** The password of the user */
  password: string;
}

export interface Mitigation {
  listened?: boolean;
  mitigation_attack_patterns?: string[];
  /** @format date-time */
  mitigation_created_at: string;
  mitigation_description?: string;
  mitigation_external_id: string;
  mitigation_id: string;
  mitigation_log_sources?: string[];
  mitigation_name: string;
  mitigation_stix_id: string;
  mitigation_threat_hunting_techniques?: string;
  /** @format date-time */
  mitigation_updated_at: string;
}

export interface MitigationCreateInput {
  mitigation_attack_patterns?: string[];
  mitigation_description?: string;
  mitigation_external_id: string;
  mitigation_log_sources?: string[];
  mitigation_name: string;
  mitigation_stix_id?: string;
  mitigation_threat_hunting_techniques?: string;
}

export interface MitigationUpdateInput {
  mitigation_attack_patterns?: string[];
  mitigation_description?: string;
  mitigation_external_id: string;
  mitigation_name: string;
}

export interface MitigationUpsertInput {
  mitigations?: MitigationCreateInput[];
}

export interface NetworkTraffic {
  listened?: boolean;
  network_traffic_ip_dst: string;
  network_traffic_ip_src: string;
  /** @format int32 */
  network_traffic_port_dst: number;
  /** @format int32 */
  network_traffic_port_src: number;
  network_traffic_protocol: string;
  /** @format int32 */
  numberOfActions?: number;
  payload_arguments?: PayloadArgument[];
  payload_attack_patterns?: string[];
  payload_cleanup_command?: string;
  payload_cleanup_executor?: string;
  payload_collector?: string;
  payload_collector_type?: string;
  /** @format date-time */
  payload_created_at: string;
  payload_description?: string;
  payload_elevation_required?: boolean;
  payload_execution_arch: "x86_64" | "arm64" | "ALL_ARCHITECTURES";
  payload_external_id?: string;
  payload_id: string;
  payload_name: string;
  payload_platforms?: ("Linux" | "Windows" | "MacOS" | "Container" | "Service" | "Generic" | "Internal" | "Unknown")[];
  payload_prerequisites?: PayloadPrerequisite[];
  payload_source: "COMMUNITY" | "FILIGRAN" | "MANUAL";
  payload_status: "UNVERIFIED" | "VERIFIED" | "DEPRECATED";
  payload_tags?: string[];
  payload_type?: string;
  /** @format date-time */
  payload_updated_at: string;
  typeEnum?: "COMMAND" | "EXECUTABLE" | "FILE_DROP" | "DNS_RESOLUTION" | "NETWORK_TRAFFIC";
}

/** List of Saml2 providers */
export interface OAuthProvider {
  provider_login?: string;
  provider_name?: string;
  provider_uri?: string;
}

export interface Objective {
  listened?: boolean;
  /** @format date-time */
  objective_created_at: string;
  objective_description?: string;
  objective_evaluations?: string[];
  objective_exercise?: string;
  objective_id: string;
  /** @format int32 */
  objective_priority?: number;
  objective_scenario?: string;
  /** @format double */
  objective_score?: number;
  objective_title?: string;
  /** @format date-time */
  objective_updated_at: string;
}

export interface ObjectiveInput {
  objective_description?: string;
  /** @format int32 */
  objective_priority?: number;
  objective_title?: string;
}

export interface Option {
  id?: string;
  label?: string;
}

export interface Organization {
  listened?: boolean;
  /** @format date-time */
  organization_created_at: string;
  organization_description?: string;
  organization_id: string;
  organization_injects?: string[];
  /** @format int64 */
  organization_injects_number?: number;
  organization_name: string;
  organization_tags?: string[];
  /** @format date-time */
  organization_updated_at: string;
}

export interface OrganizationCreateInput {
  organization_description?: string;
  organization_name: string;
  organization_tags?: string[];
}

export interface OrganizationGrantInput {
  organization_id: string;
}

export interface OrganizationUpdateInput {
  organization_description?: string;
  organization_name: string;
  organization_tags?: string[];
}

export interface PageAssetGroupOutput {
  content?: AssetGroupOutput[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PageAttackPattern {
  content?: AttackPattern[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PageEndpointOutput {
  content?: EndpointOutput[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PageExerciseSimple {
  content?: ExerciseSimple[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PageFullTextSearchResult {
  content?: FullTextSearchResult[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PageGroup {
  content?: Group[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PageInjectResultOutput {
  content?: InjectResultOutput[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PageInjectTestStatusOutput {
  content?: InjectTestStatusOutput[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PageInjectorContractOutput {
  content?: InjectorContractOutput[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PageKillChainPhase {
  content?: KillChainPhase[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PageLessonsTemplate {
  content?: LessonsTemplate[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PageMitigation {
  content?: Mitigation[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PagePayload {
  content?: Payload[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PagePlayerOutput {
  content?: PlayerOutput[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PageRawPaginationDocument {
  content?: RawPaginationDocument[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PageRawPaginationImportMapper {
  content?: RawPaginationImportMapper[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PageRawPaginationScenario {
  content?: RawPaginationScenario[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PageSecurityPlatform {
  content?: SecurityPlatform[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PageTag {
  content?: Tag[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PageTagRuleOutput {
  content?: TagRuleOutput[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PageTeamOutput {
  content?: TeamOutput[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PageUserOutput {
  content?: UserOutput[];
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  /** @format int32 */
  number?: number;
  /** @format int32 */
  numberOfElements?: number;
  pageable?: PageableObject;
  /** @format int32 */
  size?: number;
  sort?: SortObject[];
  /** @format int64 */
  totalElements?: number;
  /** @format int32 */
  totalPages?: number;
}

export interface PageableObject {
  /** @format int64 */
  offset?: number;
  /** @format int32 */
  pageNumber?: number;
  /** @format int32 */
  pageSize?: number;
  paged?: boolean;
  sort?: SortObject[];
  unpaged?: boolean;
}

export type Payload = BasePayload &
  (
    | BasePayloadPayloadTypeMapping<"Command", Command>
    | BasePayloadPayloadTypeMapping<"Executable", Executable>
    | BasePayloadPayloadTypeMapping<"File", FileDrop>
    | BasePayloadPayloadTypeMapping<"Dns", DnsResolution>
    | BasePayloadPayloadTypeMapping<"Network", NetworkTraffic>
  );

export interface PayloadArgument {
  default_value: string;
  description?: string;
  key: string;
  type: string;
}

export interface PayloadCommandBlock {
  command_content?: string;
  command_executor?: string;
  payload_cleanup_command?: string[];
}

export interface PayloadCreateInput {
  command_content?: string | null;
  command_executor?: string | null;
  dns_resolution_hostname?: string;
  executable_file?: string;
  file_drop_file?: string;
  payload_arguments?: PayloadArgument[];
  payload_attack_patterns?: string[];
  payload_cleanup_command?: string | null;
  payload_cleanup_executor?: string | null;
  payload_description?: string;
  payload_execution_arch?: "x86_64" | "arm64" | "ALL_ARCHITECTURES";
  payload_name: string;
  payload_platforms: ("Linux" | "Windows" | "MacOS" | "Container" | "Service" | "Generic" | "Internal" | "Unknown")[];
  payload_prerequisites?: PayloadPrerequisite[];
  payload_source: "COMMUNITY" | "FILIGRAN" | "MANUAL";
  payload_status: "UNVERIFIED" | "VERIFIED" | "DEPRECATED";
  payload_tags?: string[];
  payload_type: string;
}

export interface PayloadPrerequisite {
  check_command?: string;
  description?: string;
  executor: string;
  get_command: string;
}

export interface PayloadSimple {
  payload_collector_type?: string;
  payload_id?: string;
  payload_type?: string;
}

export interface PayloadUpdateInput {
  command_content?: string | null;
  command_executor?: string | null;
  dns_resolution_hostname?: string;
  executable_file?: string;
  file_drop_file?: string;
  payload_arguments?: PayloadArgument[];
  payload_attack_patterns?: string[];
  payload_cleanup_command?: string | null;
  payload_cleanup_executor?: string | null;
  payload_description?: string;
  payload_execution_arch?: "x86_64" | "arm64" | "ALL_ARCHITECTURES";
  payload_name: string;
  payload_platforms?: ("Linux" | "Windows" | "MacOS" | "Container" | "Service" | "Generic" | "Internal" | "Unknown")[];
  payload_prerequisites?: PayloadPrerequisite[];
  payload_tags?: string[];
}

export interface PayloadUpsertInput {
  command_content?: string | null;
  command_executor?: string | null;
  dns_resolution_hostname?: string;
  executable_file?: string;
  file_drop_file?: string;
  payload_arguments?: PayloadArgument[];
  payload_attack_patterns?: string[];
  payload_cleanup_command?: string | null;
  payload_cleanup_executor?: string | null;
  payload_collector?: string;
  payload_description?: string;
  payload_elevation_required?: boolean;
  payload_execution_arch?: "x86_64" | "arm64" | "ALL_ARCHITECTURES";
  payload_external_id: string;
  payload_name: string;
  payload_platforms?: ("Linux" | "Windows" | "MacOS" | "Container" | "Service" | "Generic" | "Internal" | "Unknown")[];
  payload_prerequisites?: PayloadPrerequisite[];
  payload_source: "COMMUNITY" | "FILIGRAN" | "MANUAL";
  payload_status: "UNVERIFIED" | "VERIFIED" | "DEPRECATED";
  payload_tags?: string[];
  payload_type: string;
}

export interface PayloadsDeprecateInput {
  collector_id: string;
  payload_external_ids: string[];
}

export interface PlatformSettings {
  /** True if Saml2 is enabled */
  auth_saml2_enable?: boolean;
  /** List of Saml2 providers */
  platform_saml2_providers?: OAuthProvider[];
  /** True if local authentication is enabled */
  auth_local_enable?: boolean;
  /** True if OpenID is enabled */
  auth_openid_enable?: boolean;
  /** Sender mail to use by default for injects */
  default_mailer?: string;
  /** Reply to mail to use by default for injects */
  default_reply_to?: string;
  /** List of enabled dev features */
  enabled_dev_features?: "_RESERVED"[];
  /** True if the Caldera Executor is enabled */
  executor_caldera_enable?: boolean;
  /** Url of the Caldera Executor */
  executor_caldera_public_url?: string;
  /** True if the Tanium Executor is enabled */
  executor_tanium_enable?: boolean;
  /**
   * Time to wait before article time has expired
   * @format int64
   */
  expectation_article_expiration_time: number;
  /**
   * Time to wait before challenge time has expired
   * @format int64
   */
  expectation_challenge_expiration_time: number;
  /**
   * Time to wait before detection time has expired
   * @format int64
   */
  expectation_detection_expiration_time: number;
  /**
   * Default score for manuel expectation
   * @format int32
   */
  expectation_manual_default_score_value: number;
  /**
   * Time to wait before manual expectation time has expired
   * @format int64
   */
  expectation_manual_expiration_time: number;
  /**
   * Time to wait before prevention time has expired
   * @format int64
   */
  expectation_prevention_expiration_time: number;
  /** Current version of Java */
  java_version?: string;
  /** URL of the server containing the map tile with dark theme */
  map_tile_server_dark?: string;
  /** URL of the server containing the map tile with light theme */
  map_tile_server_light?: string;
  /** Agent URL of the platform */
  platform_agent_url?: string;
  /** True if AI is enabled for the platform */
  platform_ai_enabled?: boolean;
  /** True if we have an AI token */
  platform_ai_has_token?: boolean;
  /** Chosen model of AI */
  platform_ai_model?: string;
  /** Type of AI (mistralai or openai) */
  platform_ai_type?: string;
  /** Map of the messages to display on the screen by their level (the level available are DEBUG, INFO, WARN, ERROR, FATAL) */
  platform_banner_by_level?: Record<string, string[]>;
  /** Base URL of the platform */
  platform_base_url?: string;
  /** Definition of the dark theme */
  platform_dark_theme?: ThemeInput;
  /** 'true' if the platform has Enterprise Edition activated */
  platform_enterprise_edition?: string;
  /** Language of the platform */
  platform_lang?: string;
  /** Definition of the dark theme */
  platform_light_theme?: ThemeInput;
  /** Name of the platform */
  platform_name?: string;
  /** List of OpenID providers */
  platform_openid_providers?: OAuthProvider[];
  /** Policies of the platform */
  platform_policies?: PolicyInput;
  /** Theme of the platform */
  platform_theme?: string;
  /** Current version of the platform */
  platform_version?: string;
  /** 'true' if the platform has the whitemark activated */
  platform_whitemark?: string;
  /** Current version of the PostgreSQL */
  postgre_version?: string;
  /** Current version of RabbitMQ */
  rabbitmq_version?: string;
  /** True if connection with OpenCTI is enabled */
  xtm_opencti_enable?: boolean;
  /** Url of OpenCTI */
  xtm_opencti_url?: string;
}

export interface PlatformStatistic {
  asset_groups_count?: StatisticElement;
  assets_count?: StatisticElement;
  exercises_count?: StatisticElement;
  exercises_count_by_category?: Record<string, number>;
  exercises_count_by_week?: Record<string, number>;
  expectation_results?: ExpectationResultsByType[];
  inject_expectation_results?: InjectExpectationResultsByAttackPattern[];
  injects_count?: StatisticElement;
  injects_count_by_attack_pattern?: Record<string, number>;
  platform_id?: string;
  scenarios_count?: StatisticElement;
  teams_count?: StatisticElement;
  users_count?: StatisticElement;
}

export interface PlayerInput {
  /** @pattern ^\+[\d\s\-.()]+$ */
  user_phone2?: string;
  user_country?: string;
  user_email: string;
  user_firstname?: string;
  user_lastname?: string;
  user_organization?: string;
  user_pgp_key?: string;
  /** @pattern ^\+[\d\s\-.()]+$ */
  user_phone?: string;
  user_tags?: string[];
  user_teams?: string[];
}

export interface PlayerOutput {
  user_phone2?: string;
  user_country?: string;
  user_email: string;
  user_firstname?: string;
  user_id: string;
  user_lastname?: string;
  user_organization?: string;
  user_pgp_key?: string;
  user_phone?: string;
  /** @uniqueItems true */
  user_tags?: string[];
}

/** Policies of the platform */
export interface PolicyInput {
  /** Consent confirmation message */
  platform_consent_confirm_text?: string;
  /** Consent message to show at login */
  platform_consent_message?: string;
  /** Message to show at login */
  platform_login_message?: string;
}

export interface PropertySchemaDTO {
  schema_property_has_dynamic_value?: boolean;
  schema_property_name: string;
  schema_property_type: string;
  schema_property_type_array?: boolean;
  schema_property_values?: string[];
}

export interface PublicChallenge {
  challenge_category?: string;
  challenge_content?: string;
  challenge_documents?: string[];
  challenge_flags?: PublicChallengeFlag[];
  challenge_id?: string;
  /** @format int32 */
  challenge_max_attempts?: number;
  challenge_name?: string;
  /** @format double */
  challenge_score?: number;
  challenge_tags?: string[];
  /** @format date-time */
  challenge_virtual_publication?: string;
}

export interface PublicChallengeFlag {
  flag_challenge?: string;
  flag_id?: string;
  flag_type?: "VALUE" | "VALUE_CASE" | "REGEXP";
}

export interface PublicExercise {
  exercise_description?: string;
  exercise_id?: string;
  exercise_name?: string;
}

export interface RawAttackPattern {
  attack_pattern_created_at?: string;
  attack_pattern_description?: string;
  attack_pattern_external_id?: string;
  attack_pattern_id?: string;
  attack_pattern_kill_chain_phases?: string[];
  attack_pattern_name?: string;
  attack_pattern_parent?: string;
  attack_pattern_permissions_required?: string[];
  attack_pattern_platforms?: string[];
  attack_pattern_stix_id?: string;
  attack_pattern_updated_at?: string;
}

export interface RawDocument {
  document_description?: string;
  document_exercises?: string[];
  document_id?: string;
  document_name?: string;
  document_scenarios?: string[];
  document_tags?: string[];
  document_target?: string;
  document_type?: string;
}

export interface RawPaginationDocument {
  document_can_be_deleted?: boolean;
  document_description?: string;
  document_exercises?: string[];
  document_id?: string;
  document_name?: string;
  document_scenarios?: string[];
  document_tags?: string[];
  document_type?: string;
}

export interface RawPaginationImportMapper {
  /** @format date-time */
  import_mapper_created_at?: string;
  import_mapper_id: string;
  import_mapper_name?: string;
  /** @format date-time */
  import_mapper_updated_at?: string;
}

export interface RawPaginationScenario {
  scenario_category?: string;
  scenario_id?: string;
  scenario_name?: string;
  /** @uniqueItems true */
  scenario_platforms?: string[];
  scenario_recurrence?: string;
  scenario_severity?: "low" | "medium" | "high" | "critical";
  /** @uniqueItems true */
  scenario_tags?: string[];
  /** @format date-time */
  scenario_updated_at?: string;
}

export interface RawUser {
  user_email?: string;
  user_firstname?: string;
  user_gravatar?: string;
  user_groups?: string[];
  user_id?: string;
  user_lastname?: string;
  user_organization?: string;
  user_phone?: string;
  user_tags?: string[];
  user_teams?: string[];
}

export interface RenewTokenInput {
  token_id: string;
}

export interface Report {
  listened?: boolean;
  /** @format date-time */
  report_created_at: string;
  report_exercise?: string;
  report_global_observation?: string;
  report_id: string;
  report_informations?: ReportInformation[];
  report_injects_comments?: ReportInjectComment[];
  report_name: string;
  /** @format date-time */
  report_updated_at: string;
}

export interface ReportInformation {
  id: string;
  listened?: boolean;
  report: string;
  report_informations_display?: boolean;
  report_informations_type:
    | "MAIN_INFORMATION"
    | "SCORE_DETAILS"
    | "INJECT_RESULT"
    | "GLOBAL_OBSERVATION"
    | "PLAYER_SURVEYS"
    | "EXERCISE_DETAILS";
}

export interface ReportInformationInput {
  report_informations_display: boolean;
  report_informations_type:
    | "MAIN_INFORMATION"
    | "SCORE_DETAILS"
    | "INJECT_RESULT"
    | "GLOBAL_OBSERVATION"
    | "PLAYER_SURVEYS"
    | "EXERCISE_DETAILS";
}

export interface ReportInjectComment {
  inject_id?: string;
  report_id?: string;
  report_inject_comment?: string;
}

export interface ReportInjectCommentInput {
  inject_id: string;
  report_inject_comment?: string;
}

export interface ReportInput {
  report_global_observation?: string;
  report_informations?: ReportInformationInput[];
  report_name: string;
}

export interface ResetUserInput {
  lang?: string;
  login: string;
}

export interface ResultDistribution {
  id: string;
  label: string;
  /** @format int32 */
  value: number;
}

export interface RuleAttribute {
  listened?: boolean;
  rule_attribute_additional_config?: Record<string, string>;
  rule_attribute_columns?: string;
  /** @format date-time */
  rule_attribute_created_at?: string;
  rule_attribute_default_value?: string;
  rule_attribute_id: string;
  rule_attribute_name: string;
  /** @format date-time */
  rule_attribute_updated_at?: string;
}

export interface RuleAttributeAddInput {
  rule_attribute_additional_config?: Record<string, string>;
  rule_attribute_columns?: string | null;
  rule_attribute_default_value?: string;
  rule_attribute_name: string;
}

export interface RuleAttributeUpdateInput {
  rule_attribute_additional_config?: Record<string, string>;
  rule_attribute_columns?: string | null;
  rule_attribute_default_value?: string;
  rule_attribute_id?: string;
  rule_attribute_name: string;
}

export interface Scenario {
  listened?: boolean;
  /** @format int64 */
  scenario_all_users_number?: number;
  scenario_articles?: string[];
  scenario_category?: string;
  /** @format int64 */
  scenario_communications_number?: number;
  /** @format date-time */
  scenario_created_at: string;
  scenario_description?: string;
  scenario_documents?: string[];
  scenario_exercises?: string[];
  scenario_external_reference?: string;
  scenario_external_url?: string;
  scenario_id: string;
  scenario_injects?: string[];
  scenario_injects_statistics?: Record<string, number>;
  scenario_kill_chain_phases?: KillChainPhase[];
  scenario_lessons_anonymized?: boolean;
  scenario_lessons_categories?: string[];
  scenario_mail_from: string;
  scenario_mails_reply_to?: string[];
  scenario_main_focus?: string;
  scenario_message_footer?: string;
  scenario_message_header?: string;
  scenario_name: string;
  scenario_observers?: string[];
  scenario_planners?: string[];
  scenario_platforms?: ("Linux" | "Windows" | "MacOS" | "Container" | "Service" | "Generic" | "Internal" | "Unknown")[];
  scenario_recurrence?: string;
  /** @format date-time */
  scenario_recurrence_end?: string;
  /** @format date-time */
  scenario_recurrence_start?: string;
  scenario_severity?: "low" | "medium" | "high" | "critical";
  scenario_subtitle?: string;
  scenario_tags?: string[];
  scenario_teams?: string[];
  scenario_teams_users?: ScenarioTeamUser[];
  /** @format date-time */
  scenario_updated_at: string;
  scenario_users?: string[];
  /** @format int64 */
  scenario_users_number?: number;
}

export interface ScenarioInput {
  scenario_category?: string;
  scenario_description?: string;
  scenario_external_reference?: string;
  scenario_external_url?: string;
  scenario_mail_from?: string;
  scenario_mails_reply_to?: string[];
  scenario_main_focus?: string;
  scenario_message_footer?: string;
  scenario_message_header?: string;
  scenario_name: string;
  scenario_severity?: "low" | "medium" | "high" | "critical";
  scenario_subtitle?: string;
  scenario_tags?: string[];
}

export interface ScenarioRecurrenceInput {
  scenario_recurrence?: string;
  /** @format date-time */
  scenario_recurrence_end?: string;
  /** @format date-time */
  scenario_recurrence_start?: string;
}

export interface ScenarioSimple {
  scenario_id?: string;
  scenario_name?: string;
  scenario_subtitle?: string;
  scenario_tags?: string[];
}

export interface ScenarioStatistic {
  simulations_results_latest: SimulationsResultsLatest;
}

export interface ScenarioTeamPlayersEnableInput {
  scenario_team_players?: string[];
}

export interface ScenarioTeamUser {
  scenario_id?: string;
  team_id?: string;
  user_id?: string;
}

export interface ScenarioUpdateTagsInput {
  apply_tag_rule?: boolean;
  scenario_tags?: string[];
}

export interface ScenarioUpdateTeamsInput {
  scenario_teams?: string[];
}

export interface SearchPaginationInput {
  /** Filter object to search within filterable attributes */
  filterGroup?: FilterGroup;
  /**
   * Page number to get
   * @format int32
   * @min 0
   */
  page: number;
  /**
   * Element number by page
   * @format int32
   * @max 1000
   */
  size: number;
  /** List of sort fields : a field is composed of a property (for instance "label" and an optional direction ("asc" is assumed if no direction is specified) : ("desc", "asc") */
  sorts?: SortField[];
  /** Text to search within searchable attributes */
  textSearch?: string;
}

export interface SearchTerm {
  searchTerm?: string;
}

export interface SecurityPlatform {
  /** @format date-time */
  asset_cleared_at?: string;
  /** @format date-time */
  asset_created_at: string;
  asset_description?: string;
  asset_external_reference?: string;
  asset_id: string;
  asset_name: string;
  asset_tags?: string[];
  asset_type?: string;
  /** @format date-time */
  asset_updated_at: string;
  listened?: boolean;
  security_platform_logo_dark?: string;
  security_platform_logo_light?: string;
  security_platform_type: "EDR" | "XDR" | "SIEM" | "SOAR" | "NDR" | "ISPM";
}

export interface SecurityPlatformInput {
  asset_description?: string;
  asset_name: string;
  asset_tags?: string[];
  security_platform_logo_dark?: string;
  security_platform_logo_light?: string;
  security_platform_type: "EDR" | "XDR" | "SIEM" | "SOAR" | "NDR" | "ISPM";
}

export interface SecurityPlatformUpsertInput {
  asset_description?: string;
  asset_external_reference?: string;
  asset_name: string;
  asset_tags?: string[];
  security_platform_logo_dark?: string;
  security_platform_logo_light?: string;
  security_platform_type: "EDR" | "XDR" | "SIEM" | "SOAR" | "NDR" | "ISPM";
}

export interface SettingsEnterpriseEditionUpdateInput {
  /** 'true' if enterprise edition is activated */
  platform_enterprise_edition: string;
}

export interface SettingsPlatformWhitemarkUpdateInput {
  /** The whitemark of the platform */
  platform_whitemark: string;
}

export interface SettingsUpdateInput {
  /** Language of the platform */
  platform_lang: string;
  /** Name of the platform */
  platform_name: string;
  /** Theme of the platform */
  platform_theme: string;
}

export interface SimulationsResultsLatest {
  global_scores_by_expectation_type: Record<string, GlobalScoreBySimulationEndDate[]>;
}

/** List of sort fields : a field is composed of a property (for instance "label" and an optional direction ("asc" is assumed if no direction is specified) : ("desc", "asc") */
export interface SortField {
  direction?: string;
  property?: string;
}

export interface SortObject {
  ascending?: boolean;
  direction?: string;
  ignoreCase?: boolean;
  nullHandling?: string;
  property?: string;
}

export interface StatisticElement {
  /** @format int64 */
  global_count?: number;
  /** @format int64 */
  progression_count?: number;
}

export interface StatusPayload {
  dns_resolution_hostname?: string;
  executable_file?: StatusPayloadDocument;
  file_drop_file?: StatusPayloadDocument;
  network_traffic_ip_dst: string;
  network_traffic_ip_src: string;
  /** @format int32 */
  network_traffic_port_dst: number;
  /** @format int32 */
  network_traffic_port_src: number;
  network_traffic_protocol: string;
  payload_arguments?: PayloadArgument[];
  payload_cleanup_executor?: string;
  payload_command_blocks?: PayloadCommandBlock[];
  payload_description?: string;
  payload_external_id?: string;
  payload_name?: string;
  payload_prerequisites?: PayloadPrerequisite[];
  payload_type?: string;
}

export interface StatusPayloadDocument {
  document_id: string;
  document_name: string;
}

export interface StatusPayloadOutput {
  dns_resolution_hostname?: string;
  executable_arch?: "x86_64" | "arm64" | "ALL_ARCHITECTURES";
  executable_file?: StatusPayloadDocument;
  file_drop_file?: StatusPayloadDocument;
  network_traffic_ip_dst: string;
  network_traffic_ip_src: string;
  /** @format int32 */
  network_traffic_port_dst: number;
  /** @format int32 */
  network_traffic_port_src: number;
  network_traffic_protocol: string;
  payload_arguments?: PayloadArgument[];
  payload_attack_patterns?: AttackPatternSimple[];
  payload_cleanup_executor?: string;
  payload_collector_type?: string;
  payload_command_blocks?: PayloadCommandBlock[];
  payload_description?: string;
  payload_external_id?: string;
  payload_name?: string;
  payload_obfuscator?: string;
  payload_platforms?: ("Linux" | "Windows" | "MacOS" | "Container" | "Service" | "Generic" | "Internal" | "Unknown")[];
  payload_prerequisites?: PayloadPrerequisite[];
  /** @uniqueItems true */
  payload_tags?: string[];
  payload_type?: string;
}

export interface Tag {
  listened?: boolean;
  /** Color of the tag */
  tag_color?: string;
  /** ID of the tag */
  tag_id: string;
  /** Name of the tag */
  tag_name: string;
}

export interface TagCreateInput {
  /** Color of the tag */
  tag_color: string;
  /** Name of the tag */
  tag_name: string;
}

export interface TagRuleInput {
  /** Asset groups of the tag rule */
  asset_groups?: string[];
  /** Name of the tag */
  tag_name: string;
}

export interface TagRuleOutput {
  /** Asset groups of the tag rule */
  asset_groups?: Record<string, string>;
  /** Name of the tag associated with the tag rule */
  tag_name: string;
  /** ID of the tag rule */
  tag_rule_id: string;
}

export interface TagUpdateInput {
  /** Color of the tag */
  tag_color: string;
  /** Name of the tag */
  tag_name: string;
}

export interface TargetSimple {
  target_id: string;
  target_name?: string;
  target_type?: "AGENT" | "ASSETS" | "ASSETS_GROUPS" | "PLAYER" | "TEAMS";
}

export interface Team {
  listened?: boolean;
  /** List of communications of this team */
  team_communications?: Communication[];
  /** True if the team is contextual (exists only in the scenario/simulation it is linked to) */
  team_contextual?: boolean;
  /**
   * Creation date of the team
   * @format date-time
   */
  team_created_at: string;
  /** Description of the team */
  team_description?: string;
  team_exercise_injects?: string[];
  /**
   * Number of injects of all simulations of the team
   * @format int64
   */
  team_exercise_injects_number?: number;
  team_exercises?: string[];
  team_exercises_users?: string[];
  /** ID of the team */
  team_id: string;
  team_inject_expectations?: string[];
  /**
   * Number of expectations linked to this team
   * @format int64
   */
  team_injects_expectations_number?: number;
  /**
   * Total expected score of expectations linked to this team
   * @format double
   */
  team_injects_expectations_total_expected_score: number;
  /** Total expected score of expectations by simulation linked to this team */
  team_injects_expectations_total_expected_score_by_exercise: Record<string, number>;
  /**
   * Total score of expectations linked to this team
   * @format double
   */
  team_injects_expectations_total_score: number;
  /** Total score of expectations by simulation linked to this team */
  team_injects_expectations_total_score_by_exercise: Record<string, number>;
  /** Name of the team */
  team_name: string;
  /** Organization of the team */
  team_organization?: string;
  team_scenario_injects?: string[];
  /**
   * Number of injects of all scenarios of the team
   * @format int64
   */
  team_scenario_injects_number?: number;
  team_scenarios?: string[];
  team_tags?: string[];
  /**
   * Update date of the team
   * @format date-time
   */
  team_updated_at: string;
  team_users?: string[];
  /**
   * Number of users of the team
   * @format int64
   */
  team_users_number?: number;
}

export interface TeamCreateInput {
  /** True if the team is contextual (exists only in the scenario/simulation it is linked to) */
  team_contextual?: boolean;
  /** Description of the team */
  team_description?: string;
  /** Id of the simulations linked to the team */
  team_exercises?: string[];
  /** Name of the team */
  team_name: string;
  /** ID of the organization of the team */
  team_organization?: string;
  /** Id of the scenarios linked to the team */
  team_scenarios?: string[];
  /** IDs of the tags of the team */
  team_tags?: string[];
}

export interface TeamOutput {
  /** True if the team is contextual (exists only in the scenario/simulation it is linked to) */
  team_contextual?: boolean;
  /** Description of the team */
  team_description?: string;
  /**
   * Simulation ids linked to this team
   * @uniqueItems true
   */
  team_exercises: string[];
  /** ID of the team */
  team_id: string;
  /** Name of the team */
  team_name: string;
  /** Organization of the team */
  team_organization?: string;
  /**
   * Scenario ids linked to this team
   * @uniqueItems true
   */
  team_scenarios: string[];
  /**
   * List of tags of the team
   * @uniqueItems true
   */
  team_tags?: string[];
  /**
   * Update date of the team
   * @format date-time
   */
  team_updated_at: string;
  /**
   * User ids of the team
   * @uniqueItems true
   */
  team_users?: string[];
  /**
   * Number of users of the team
   * @format int64
   */
  team_users_number?: number;
}

export interface TeamUpdateInput {
  /** Description of the team */
  team_description?: string;
  /** Name of the team */
  team_name: string;
  /** ID of the organization of the team */
  team_organization?: string;
  /** IDs of the tags of the team */
  team_tags?: string[];
}

/** Definition of the dark theme */
export interface ThemeInput {
  /** Accent color of the theme */
  accent_color?: string;
  /** Background color of the theme */
  background_color?: string;
  /** Url of the login logo */
  logo_login_url?: string;
  /** Url of the logo */
  logo_url?: string;
  /** 'true' if the logo needs to be collapsed */
  logo_url_collapsed?: string;
  /** Navigation color of the theme */
  navigation_color?: string;
  /** Paper color of the theme */
  paper_color?: string;
  /** Primary color of the theme */
  primary_color?: string;
  /** Secondary color of the theme */
  secondary_color?: string;
}

export interface Token {
  listened?: boolean;
  /** @format date-time */
  token_created_at: string;
  token_id: string;
  token_user?: string;
  token_value: string;
}

export interface UpdateAssetsOnAssetGroupInput {
  asset_group_assets?: string[];
}

export interface UpdateExerciseInput {
  apply_tag_rule?: boolean;
  exercise_category?: string;
  exercise_description?: string;
  exercise_mail_from?: string;
  exercise_mails_reply_to?: string[];
  exercise_main_focus?: string;
  exercise_message_footer?: string;
  exercise_message_header?: string;
  exercise_name: string;
  exercise_severity?: string;
  /** @format date-time */
  exercise_start_date?: string | null;
  exercise_subtitle?: string;
  exercise_tags?: string[];
}

export interface UpdateMePasswordInput {
  user_current_password: string;
  user_plain_password: string;
}

export interface UpdateProfileInput {
  user_country?: string;
  user_email?: string;
  user_firstname: string;
  user_lang?: string;
  user_lastname: string;
  user_organization?: string;
  user_theme?: string;
}

export interface UpdateScenarioInput {
  apply_tag_rule?: boolean;
  scenario_category?: string;
  scenario_description?: string;
  scenario_external_reference?: string;
  scenario_external_url?: string;
  scenario_mail_from?: string;
  scenario_mails_reply_to?: string[];
  scenario_main_focus?: string;
  scenario_message_footer?: string;
  scenario_message_header?: string;
  scenario_name: string;
  scenario_severity?: "low" | "medium" | "high" | "critical";
  scenario_subtitle?: string;
  scenario_tags?: string[];
}

export interface UpdateUserInfoInput {
  user_phone2?: string;
  user_pgp_key?: string;
  user_phone?: string;
}

export interface UpdateUserInput {
  /**
   * Secondary phone of the user
   * @pattern ^\+[\d\s\-.()]+$
   */
  user_phone2?: string;
  /** True if the user is admin */
  user_admin?: boolean;
  /** The email of the user */
  user_email?: string;
  /** First name of the user */
  user_firstname?: string;
  /** Last name of the user */
  user_lastname?: string;
  /** Organization of the user */
  user_organization?: string;
  /** PGP key of the user */
  user_pgp_key?: string;
  /**
   * Phone of the user
   * @pattern ^\+[\d\s\-.()]+$
   */
  user_phone?: string;
  /** Tags of the user */
  user_tags?: string[];
}

export interface UpdateUsersTeamInput {
  /** The list of users the team contains */
  team_users?: string[];
}

export interface User {
  /** Secondary phone number of the user */
  user_phone2?: string;
  listened?: boolean;
  /** True if the user is admin */
  user_admin?: boolean;
  /** City of the user */
  user_city?: string;
  user_communications?: string[];
  /** Country of the user */
  user_country?: string;
  /**
   * Creation date of the user
   * @format date-time
   */
  user_created_at: string;
  /** Email of the user */
  user_email: string;
  /** First name of the user */
  user_firstname?: string;
  /** Gravatar of the user */
  user_gravatar?: string;
  user_groups?: string[];
  /** User ID */
  user_id: string;
  /** True if the user is external */
  user_is_external?: boolean;
  /** True if the user is manager */
  user_is_manager?: boolean;
  /** True if the user is observer */
  user_is_observer?: boolean;
  /** True if the user is only a player */
  user_is_only_player?: boolean;
  /** True if the user is planner */
  user_is_planner?: boolean;
  /** True if the user is player */
  user_is_player?: boolean;
  /** Language of the user */
  user_lang?: string;
  /**
   * Last communication date of the user
   * @format date-time
   */
  user_last_comcheck?: string;
  /** Last name of the user */
  user_lastname?: string;
  /** Organization ID of the user */
  user_organization?: string;
  /** PGP key of the user */
  user_pgp_key?: string;
  /** Phone number of the user */
  user_phone?: string;
  /**
   * Status of the user
   * @format int32
   */
  user_status: number;
  user_tags?: string[];
  user_teams?: string[];
  /** Theme of the user */
  user_theme?: string;
  /**
   * Update date of the user
   * @format date-time
   */
  user_updated_at: string;
}

export interface UserOutput {
  /** True if the user is admin */
  user_admin?: boolean;
  /** Email of the user */
  user_email: string;
  /** First name of the user */
  user_firstname?: string;
  /** User ID */
  user_id: string;
  /** Last name of the user */
  user_lastname?: string;
  /** Organization of the user */
  user_organization_name?: string;
  /**
   * Tags of the user
   * @uniqueItems true
   */
  user_tags?: string[];
}

/** Map of errors by input */
export interface ValidationContent {
  /** A list of errors */
  errors?: string[];
}

/** Errors raised */
export interface ValidationError {
  /** Map of errors by input */
  children?: Record<string, ValidationContent>;
}

export interface ValidationErrorBag {
  /**
   * Return code
   * @format int32
   */
  code?: number;
  /** Errors raised */
  errors?: ValidationError;
  /** Return message */
  message?: string;
}

export interface Variable {
  listened?: boolean;
  /** @format date-time */
  variable_created_at: string;
  variable_description?: string;
  variable_exercise?: string;
  variable_id: string;
  /** @pattern ^[a-z_]+$ */
  variable_key: string;
  variable_scenario?: string;
  variable_type: "String" | "Object";
  /** @format date-time */
  variable_updated_at: string;
  variable_value?: string;
}

export interface VariableInput {
  variable_description?: string;
  /** @pattern ^[a-z_]+$ */
  variable_key: string;
  variable_value?: string;
}

export interface ViolationErrorBag {
  /** The error */
  error?: string;
  /** The message of the error */
  message?: string;
  /** The type of error */
  type?: string;
}
