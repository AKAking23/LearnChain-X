import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <Link to="/">LearnChain-X</Link>
        </div>
        <nav className="main-nav">
          <ul>
            <li><Link to="/">首页</Link></li>
            <li><Link to="/courses">课程</Link></li>
            <li><Link to="/about">关于</Link></li>
            <li><Link to="/dashboard">个人中心</Link></li>
          </ul>
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} LearnChain-X. 保留所有权利。</p>
      </footer>
    </div>
  );
};

const changelang = () => {
  // const lang = localStorage.setItem('lang', 'en');
  const lang = localStorage.setItem('lang', 'zhcn');
  console.log(lang);
}
changelang();
export default Layout; 