import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { register } from '../../redux/slices/authSlice';

const Register = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const onFinish = async (values) => {
    try {
      await dispatch(register(values)).unwrap();
      message.success('Registration successful');
      navigate('/');
    } catch (error) {
      message.error(error);
    }
  };

  return (
    <Form
      form={form}
      name="register"
      onFinish={onFinish}
      layout="vertical"
      size="large"
    >
      <Form.Item
        name="full_name"
        rules={[{ required: true, message: 'Please input your full name!' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Full Name" />
      </Form.Item>

      <Form.Item
        name="email"
        rules={[
          { required: true, message: 'Please input your email!' },
          { type: 'email', message: 'Please enter a valid email!' },
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="Email" />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: 'Please input your password!' },
          { min: 6, message: 'Password must be at least 6 characters!' },
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
      </Form.Item>

      <Form.Item
        name="confirm"
        dependencies={['password']}
        rules={[
          { required: true, message: 'Please confirm your password!' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Passwords do not match!'));
            },
          }),
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
      </Form.Item>

      <Form.Item
        name="bio"
      >
        <Input.TextArea placeholder="Bio (optional)" rows={3} />
      </Form.Item>

      <Form.Item
        name="study_interests"
      >
        <Input placeholder="Study interests (optional)" />
      </Form.Item>

      <Form.Item className="mb-4">
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={loading} 
          block
          className="h-11 rounded-lg text-base font-semibold shadow-md hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all duration-200"
        >
          Register
        </Button>
      </Form.Item>

      <div className="text-center text-slate-500 text-sm mt-6">
        <span>Already have an account? </span>
        <Button 
          type="link" 
          onClick={() => navigate('/login')} 
          className="p-0 text-indigo-600 hover:text-indigo-500 font-semibold transition-colors duration-200"
        >
          Login
        </Button>
      </div>
    </Form>
  );
};

export default Register;
