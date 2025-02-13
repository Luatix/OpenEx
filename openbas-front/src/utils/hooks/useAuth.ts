import { createContext, useContext } from 'react';

import { type PlatformSettings } from '../api-types';

export interface User {
  id?: string | null;
}

export interface UserContextType {
  me: User;
  settings: PlatformSettings | undefined;
}

const defaultContext = {
  me: {},
  settings: undefined,
};
export const UserContext = createContext<UserContextType>(defaultContext);

const useAuth = () => {
  const { me, settings } = useContext(UserContext);
  if (!me || !settings) {
    throw new Error('Invalid user context !');
  }
  return { me, settings };
};

export default useAuth;
