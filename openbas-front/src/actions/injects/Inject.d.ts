import { type Inject, type InjectOutput } from '../../utils/api-types';

export type InjectStore = Omit<Inject, 'inject_content' | 'inject_injector_contract'> & {
  inject_content: { expectationScore: number; challenges: string[] | undefined };
  inject_injector_contract: {
    // as we don't know the type of the content of a contract we need to put any here
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    injector_contract_content_parsed: any;
    convertedContent: {
      label: Record<string, string>;
      config: {
        expose: boolean;
      };
    };
  } & Inject['inject_injector_contract'];
};

export type InjectorContractConvertedContent = {
  label: Record<string, string>;
  config: {
    expose: boolean;
  };
};

export type InjectOutputType = InjectOutput & {
  inject_injector_contract: {
    // as we don't know the type of the content of a contract we need to put any here
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    injector_contract_content_parsed: any;
    convertedContent: InjectorContractConvertedContent;
  } & Inject['inject_injector_contract'];
};

export interface ConditionElement {
  name: string;
  value: boolean;
  key: string;
  index: number;
}

export interface ConditionType {
  parentId?: string;
  childrenId?: string;
  mode?: string;
  conditionElement?: ConditionElement[];
}

export interface Dependency {
  inject?: InjectOutputType;
  index: number;
}

export interface Content {
  expectations: {
    expectation_type: string;
    expectation_name: string;
  }[];
}

export interface ConvertedContentType {
  fields: {
    key: string;
    value: string;
    predefinedExpectations: {
      expectation_type: string;
      expectation_name: string;
    }[];
  }[];
}
