import React, { createContext, useContext, useState } from 'react';

const InviteModalContext = createContext();

export const useInviteModal = () => {
  const context = useContext(InviteModalContext);
  if (!context) {
    throw new Error('useInviteModal must be used within an InviteModalProvider');
  }
  return context;
};

export const InviteModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [projectId, setProjectId] = useState(null);

  const openInviteModal = (specificProjectId = null) => {
    setProjectId(specificProjectId);
    setIsOpen(true);
  };

  const closeInviteModal = () => {
    setIsOpen(false);
    setProjectId(null);
  };

  return (
    <InviteModalContext.Provider value={{
      isOpen,
      projectId,
      openInviteModal,
      closeInviteModal
    }}>
      {children}
    </InviteModalContext.Provider>
  );
};
