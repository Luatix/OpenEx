import { type InjectorContract } from '../../utils/api-types';

export type ContractType = 'text' | 'number' | 'tuple' | 'checkbox' | 'textarea' | 'select' | 'article' | 'challenge' | 'dependency-select' | 'attachment' | 'team' | 'expectation' | 'asset' | 'asset-group' | 'payload';

export interface ContractElement {
  key: string;
  mandatory: boolean;
  type: ContractType;
}

export type InjectorContractConverted = Omit<InjectorContract, 'convertedContent'> & {
  convertedContent: {
    fields: ContractElement[];
  };
};
