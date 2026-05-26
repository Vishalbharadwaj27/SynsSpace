import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../../redux/slices/authSlice';

const Login = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const onFinish = async (values) => {
    try {
      await dispatch(login(values)).unwrap();
      message.success('Login successful');
      navigate('/');
    } catch (error) {
      message.error(error);
    }
  };

  return (
    <Form
      form={form}
      name="login"
      onFinish={onFinish}
      layout="vertical"
      size="large"
    >
      <Form.Item
        name="email"
        rules={[
          { required: true, message: 'Please input your email!' },
          { type: 'email', message: 'Please enter a valid email!' },
        ]}
      >
        <Input prefix={<UserOutlined />} placeholder="Email" />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Please input your password!' }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
      </Form.Item>

      <div style={{ textAlign: 'right', marginBottom: 16 }}>
        <Button type="link" onClick={() => navigate('/forgot-password')} style={{ padding: 0 }}>
          Forgot Password?
        </Button>
      </div>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Login
        </Button>
      </Form.Item>

      <div style={{ textAlign: 'center' }}>
        <span style={{ color: '#666' }}>Don't have an account? </span>
        <Button type="link" onClick={() => navigate('/register')} style={{ padding: 0 }}>
          Register
        </Button>
      </div>
    </Form>
  );
};

export default Login;
