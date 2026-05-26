import React, { useState } from 'react';
import { Form, Input, Button, message, Typography, Alert } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../utils/api';

const { Text } = Typography;

const ForgotPassword = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [email, setEmail] = useState('');

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: values.email });
      const data = response.data;
      setResetToken(data.data?.resetToken);
      setEmail(values.email);
      message.success(data.message);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Form
        form={form}
        name="forgotPassword"
        onFinish={onFinish}
        layout="vertical"
        size="large"
      >
        <p style={{ color: '#666', marginBottom: 24 }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="Email" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Send Reset Link
          </Button>
        </Form.Item>

        {resetToken && (
          <Alert
            type="success"
            message="Reset Link Generated"
            description={
              <div>
                <Text>Since no email service is configured, use this token to reset your password:</Text>
                <div
                  style={{
                    background: '#f5f5f5',
                    padding: '8px 12px',
                    borderRadius: 4,
                    marginTop: 8,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    wordBreak: 'break-all',
                    userSelect: 'all',
                  }}
                >
                  {resetToken}
                </div>
                <Button
                  type="primary"
                  size="small"
                  style={{ marginTop: 8 }}
                  onClick={() => navigate(`/reset-password?token=${resetToken}`)}
                >
                  Click here to reset password
                </Button>
              </div>
            }
            style={{ marginBottom: 16 }}
          />
        )}

        <div style={{ textAlign: 'center' }}>
          <Button type="link" onClick={() => navigate('/login')} style={{ padding: 0 }}>
            Back to Login
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ForgotPassword;
