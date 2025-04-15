import React from "react";
import { Link } from "react-router-dom";
import TypeWriter from "../components/TypeWriter";

const Home: React.FC = () => {
  return (
    <div className="home-page">
      <div className="gradient-bg-title">
        <h2>知识上链，成就永恒</h2>
        <p>
          <TypeWriter 
            text="ChainLearn-X是一个区块链学习平台，通过AI出题和链上证书，让你的每一步学习成果都被永久记录，构建可信的能力档案。" 
            delay={100}
          />
        </p>
      </div>
      <div className="navigation-links">
        <Link to="/about" className="nav-link">
          关于我们
        </Link>
        <Link to="/courses" className="nav-link">
          课程列表
        </Link>
        <Link to="/dashboard" className="nav-link">
          个人中心
        </Link>
        <Link to="/wallet" className="nav-link">
          我的钱包
        </Link>
      </div>
    </div>
  );
};

export default Home;
