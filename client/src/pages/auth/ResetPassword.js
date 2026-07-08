import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';

const ResetPassword = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const onFinish = async (values) => {
    if (!token) {
      message.error('Invalid or missing reset token');
      return;
    }

    try {
      await api.patch('/auth/reset-password', {
        token,
        new_password: values.new_password,
      });
      message.success('Password reset successful! Please login with your new password.');
      navigate('/login');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-500 font-medium mb-4">Invalid or missing reset token.</p>
        <Button 
          type="link" 
          onClick={() => navigate('/forgot-password')}
          className="text-indigo-600 hover:text-indigo-500 font-semibold transition-colors duration-200"
        >
          Request a new reset link
        </Button>
      </div>
    );
  }

  return (
    <Form
      form={form}
      name="resetPassword"
      onFinish={onFinish}
      layout="vertical"
      size="large"
    >
      <p className="text-slate-500 text-sm mb-6">
        Enter your new password.
      </p>

      <Form.Item
        name="new_password"
        rules={[
          { required: true, message: 'Please input your new password!' },
          { min: 6, message: 'Password must be at least 6 characters!' },
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="New Password" />
      </Form.Item>

      <Form.Item
        name="confirm_password"
        dependencies={['new_password']}
        rules={[
          { required: true, message: 'Please confirm your new password!' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('new_password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Passwords do not match!'));
            },
          }),
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Confirm New Password" />
      </Form.Item>

      <Form.Item className="mb-4">
        <Button 
          type="primary" 
          htmlType="submit" 
          block
          className="h-11 rounded-lg text-base font-semibold shadow-md hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all duration-200"
        >
          Reset Password
        </Button>
      </Form.Item>

      <div className="text-center mt-6">
        <Button 
          type="link" 
          onClick={() => navigate('/login')} 
          className="p-0 text-indigo-600 hover:text-indigo-500 font-semibold transition-colors duration-200"
        >
          Back to Login
        </Button>
      </div>
    </Form>
  );
};

export default ResetPassword;
