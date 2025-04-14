import React from 'react';
import { Link } from 'react-router-dom';
const Home: React.FC = () => {
  return (
    <div className="home-page">
      <h1>学习区块链</h1>
      <p>欢迎来到LearnChain-X平台，这里提供区块链技术学习资源</p>
      <div className="navigation-links">
        <Link to="/about" className="nav-link">关于我们</Link>
        <Link to="/courses" className="nav-link">课程列表</Link>
        <Link to="/dashboard" className="nav-link">个人中心</Link>
      </div>
    </div>
  );
};

export default Home; 