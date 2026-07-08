import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';

const { Content } = Layout;

const AuthLayout = () => {
  return (
    <Layout className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50 flex justify-center items-center p-4">
      <Content className="flex justify-center items-center w-full">
        <div className="w-full max-w-md bg-white border border-slate-100/80 p-8 sm:p-10 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 animate-fade-in-up">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 mb-2">
              SyncSpace
            </h1>
            <p className="text-slate-500 text-sm font-medium">Realtime Collaboration Platform</p>
          </div>
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
};

export default AuthLayout;
