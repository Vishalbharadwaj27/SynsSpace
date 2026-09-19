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

      <div className="text-right mb-4">
        <Button 
          type="link" 
          onClick={() => navigate('/forgot-password')} 
          className="p-0 text-indigo-600 hover:text-indigo-500 font-medium text-sm transition-colors duration-200"
        >
          Forgot Password?
        </Button>
      </div>

      <Form.Item className="mb-4">
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={loading} 
          block
          className="h-11 rounded-lg text-base font-semibold shadow-md hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all duration-200"
        >
          Login
        </Button>
      </Form.Item>

      <div className="text-center text-slate-500 text-sm mt-6">
        <span>Don't have an account? </span>
        <Button 
          type="link" 
          onClick={() => navigate('/register')} 
          className="p-0 text-indigo-600 hover:text-indigo-500 font-semibold transition-colors duration-200"
        >
          Register
        </Button>
      </div>
    </Form>
  );
};

export default Login;
