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
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#ff4d4f' }}>Invalid or missing reset token.</p>
        <Button type="link" onClick={() => navigate('/forgot-password')}>
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
      <p style={{ color: '#666', marginBottom: 24 }}>
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

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Reset Password
        </Button>
      </Form.Item>

      <div style={{ textAlign: 'center' }}>
        <Button type="link" onClick={() => navigate('/login')} style={{ padding: 0 }}>
          Back to Login
        </Button>
      </div>
    </Form>
  );
};

export default ResetPassword;
