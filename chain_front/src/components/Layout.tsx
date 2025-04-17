import React from "react";
import { Link, Outlet } from "react-router-dom";
import { ConnectButton } from "@mysten/dapp-kit";
import BackgroundBall from "@/components/BackgroundBall";

// 将Layout组件拆分为外层和内层组件
const InnerLayout: React.FC = () => {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <Link to="/">LearnChain-X</Link>
        </div>
        <nav className="main-nav">
          <ConnectButton style={{ color: "#fff" }} />
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
        <BackgroundBall />
      </main>
    </div>
  );
};

const Layout: React.FC = () => {
  return <InnerLayout />;
};

const changelang = () => {
  const lang = localStorage.setItem("lang", "zhcn");
  console.log(lang);
};
changelang();
export default Layout;
