import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  // 模拟用户数据
  const user = {
    name: '张三',
    email: 'zhangsan@example.com',
    enrolledCourses: [
      { id: '1', title: '区块链基础入门', progress: 75 },
      { id: '2', title: '以太坊与智能合约开发', progress: 30 },
    ],
    certificates: [
      { id: '1', name: '区块链基础认证', date: '2023-12-15' }
    ]
  };

  return (
    <div className="dashboard-page">
      <h1>个人中心</h1>
      
      <div className="user-info">
        <h2>用户信息</h2>
        <p><strong>姓名:</strong> {user.name}</p>
        <p><strong>邮箱:</strong> {user.email}</p>
      </div>
      
      <div className="enrolled-courses">
        <h2>我的课程</h2>
        {user.enrolledCourses.map(course => (
          <div key={course.id} className="course-item">
            <h3>{course.title}</h3>
            <div className="progress-bar">
              <div 
                className="progress" 
                style={{ width: `${course.progress}%` }}
              ></div>
            </div>
            <span>{course.progress}% 完成</span>
            <Link to={`/course/${course.id}`}>继续学习</Link>
          </div>
        ))}
      </div>
      
      <div className="certificates">
        <h2>我的证书</h2>
        {user.certificates.map(cert => (
          <div key={cert.id} className="certificate-item">
            <h3>{cert.name}</h3>
            <p>获得日期: {cert.date}</p>
          </div>
        ))}
      </div>
      
      <div className="back-link">
        <Link to="/">返回首页</Link>
      </div>
    </div>
  );
};

export default Dashboard; 