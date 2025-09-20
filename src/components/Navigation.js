import React from 'react';
import { Layout, Menu, Typography, Space } from 'antd';
import {
  HomeOutlined,
  SettingOutlined,
  RocketOutlined,
  FileTextOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const { Header } = Layout;
const { Title } = Typography;

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: 'Tool Hub'
    },
    {
      key: '/release-creator',
      icon: <RocketOutlined />,
      label: 'Release Creator'
    },
    {
      key: '/ticket-creator', 
      icon: <FileTextOutlined />,
      label: 'Ticket Creator'
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings'
    }
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <Header 
      className="navigation-header"
      style={{ 
        background: '#fff', 
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Space size="large">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ToolOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: 8 }} />
            <Title level={4} style={{ margin: 0, color: '#262626' }}>
              Jira Tool Suite
            </Title>
          </div>
          
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ 
              border: 'none',
              background: 'transparent',
              minWidth: 400
            }}
          />
        </Space>
      </div>
    </Header>
  );
};

export default Navigation;