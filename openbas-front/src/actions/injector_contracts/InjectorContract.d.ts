import type { InjectorContract } from '../../utils/api-types';

export type ContractType = 'text' | 'number' | 'tuple' | 'checkbox' | 'textarea' | 'select' | 'article' | 'challenge' | 'dependency-select' | 'attachment' | 'team' | 'expectation' | 'asset' | 'asset-group' | 'payload';

interface LinkedFieldModel {
  key: string;
  type: string;
}
export type FieldValue = string | number | boolean | string[] | AttackPattern[]
  | Option[] | object | { key: string; value: string; type?: string }
  | { key: string; value: string; type?: string }[];

export interface ContractElement {
  key: string;
  mandatory: boolean;
  type: ContractType;
  label: string;
  readOnly: boolean;
  mandatoryGroups?: string[];
  mandatoryConditionField?: string;
  linkedFields?: LinkedFieldModel[];
  linkedValues?: string[];
  cardinality: '1' | 'n';
  defaultValue: string | string[];
  richText?: boolean;
  tupleFilePrefix?: string;
}

export type InjectorContractConverted = Omit<InjectorContract, 'convertedContent'> & {
  convertedContent: {
    fields: ContractElement[];
    contract_id: string;
    config: { type: string };
    label: string;
  };
};
