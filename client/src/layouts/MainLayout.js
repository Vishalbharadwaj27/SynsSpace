import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Drawer } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notifications);

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/rooms',
      icon: <TeamOutlined />,
      label: 'Study Rooms',
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
  ];

  if (user?.role === 'admin') {
    menuItems.push({
      key: '/admin',
      icon: <SafetyCertificateOutlined />,
      label: 'Admin Portal',
    });
  }


  const handleMenuClick = ({ key }) => {
    navigate(key);
    setMobileDrawerOpen(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const siderContent = (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={256}
      className="border-r border-slate-800 bg-slate-950"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <div
        className={`h-16 flex items-center justify-center bg-slate-900/60 border-b border-slate-800/80 text-white font-extrabold tracking-wider transition-all duration-300 ${
          collapsed ? 'text-base' : 'text-xl'
        }`}
      >
        {collapsed ? 'SS' : 'SyncSpace'}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        className="bg-slate-950 border-none pt-2"
      />
    </Sider>
  );

  return (
    <Layout className="min-h-screen bg-slate-50/50">
      {siderContent}
      <Layout style={{ marginLeft: collapsed ? 80 : 256, transition: 'all 0.2s' }}>
        <Header className="px-6 bg-white flex justify-between items-center border-b border-slate-100/80 shadow-sm sticky top-0 z-10 h-16">
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="desktop-menu-trigger hidden hover:bg-slate-50 rounded-lg transition-colors duration-200"
          />
          <div className="flex items-center gap-4 ml-auto">
            <Badge count={unreadCount} size="small" offset={[-2, 2]}>
              <Button
                type="text"
                icon={<BellOutlined />}
                onClick={() => navigate('/notifications')}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all duration-200"
              />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="cursor-pointer flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all duration-200">
                <Avatar 
                  src={user?.profile_photo} 
                  icon={<UserOutlined />} 
                  className="bg-indigo-100 text-indigo-600 border border-indigo-200"
                />
                <span className="font-semibold text-slate-700 text-sm hidden sm:inline">
                  {user?.full_name}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="m-6 p-6 bg-white rounded-2xl shadow-sm border border-slate-100/60 min-h-[280px] animate-fade-in-up">
          <Outlet />
        </Content>
      </Layout>

      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        className="hidden"
      >
        <Menu
          mode="vertical"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Drawer>

      <style>{`
        @media (max-width: 768px) {
          .desktop-menu-trigger {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
          .ant-layout-sider {
            display: none !important;
          }
          .ant-layout {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </Layout>
  );
};

export default MainLayout;
