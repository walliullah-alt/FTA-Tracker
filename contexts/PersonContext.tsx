"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface PersonContextType {
  personName: string | null;
  setPersonName: (name: string) => void;
  clearPerson: () => void;
}

const PersonContext = createContext<PersonContextType>({
  personName: null,
  setPersonName: () => {},
  clearPerson: () => {},
});

const STORAGE_KEY = "fta_person_name";

export function PersonProvider({ children }: { children: ReactNode }) {
  const [personName, setPersonNameState] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setPersonNameState(stored);
  }, []);

  const setPersonName = (name: string) => {
    localStorage.setItem(STORAGE_KEY, name);
    setPersonNameState(name);
  };

  const clearPerson = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPersonNameState(null);
  };

  return (
    <PersonContext.Provider value={{ personName, setPersonName, clearPerson }}>
      {children}
    </PersonContext.Provider>
  );
}

export const usePerson = () => useContext(PersonContext);
