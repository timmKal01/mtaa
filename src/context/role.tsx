import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';

export type Role = 'customer' | 'provider';

const RoleContext = createContext<{
  role: Role;
  setRole: (role: Role) => void;
}>({
  role: 'customer',
  setRole: () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>('customer');

  useEffect(() => {
    SecureStore.getItemAsync('mtaa_role').then((value) => {
      if (value === 'customer' || value === 'provider') setRoleState(value);
    });
  }, []);

  const setRole = (next: Role) => {
    setRoleState(next);
    SecureStore.setItemAsync('mtaa_role', next);
  };

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
