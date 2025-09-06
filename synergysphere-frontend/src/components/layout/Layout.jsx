import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Navbar />
      <div className="layout-body">
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
