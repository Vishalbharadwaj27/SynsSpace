import React, { useState } from 'react';
import { Form, Input, Button, message, Steps } from 'antd';
import { MailOutlined, LockOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { forgotPassword, directResetPassword } from '../../redux/slices/authSlice';


const ForgotPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');

  const handleCheckEmail = async (values) => {
    setLoading(true);
    try {
      const result = await dispatch(forgotPassword(values.email)).unwrap();
      if (result.data?.exists) {
        setEmail(values.email);
        setStep(1);
        message.success('Email verified');
      } else {
        message.error('Email not found in our records');
      }
    } catch (error) {
      message.error(error || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values) => {
    if (values.new_password !== values.confirm_password) {
      message.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await dispatch(directResetPassword({ email, new_password: values.new_password, confirm_password: values.confirm_password })).unwrap();
      message.success('Password reset successful! You can now login.');
      navigate('/login');
    } catch (error) {
      message.error(error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Steps current={step} size="small" className="mb-6">
        <Steps.Step title="Verify Email" icon={<MailOutlined />} />
        <Steps.Step title="New Password" icon={<LockOutlined />} />
      </Steps>

      {step === 0 ? (
        <Form onFinish={handleCheckEmail} layout="vertical" size="large">
          <p className="text-slate-500 text-sm mb-6">
            Enter your registered email to reset your password.
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
          <Form.Item className="mb-4">
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
              className="h-11 rounded-lg text-base font-semibold shadow-md hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all duration-200"
            >
              Verify Email
            </Button>
          </Form.Item>
        </Form>
      ) : (
        <Form onFinish={handleResetPassword} layout="vertical" size="large">
          <p className="text-slate-500 text-sm mb-6">
            Enter your new password for <strong>{email}</strong>
          </p>
          <Form.Item
            name="new_password"
            rules={[
              { required: true, message: 'Please enter a new password!' },
              { min: 6, message: 'Password must be at least 6 characters!' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="New Password" />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            rules={[
              { required: true, message: 'Please confirm your password!' },
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
            <Input.Password prefix={<CheckOutlined />} placeholder="Confirm Password" />
          </Form.Item>
          <Form.Item className="mb-4">
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
              className="h-11 rounded-lg text-base font-semibold shadow-md hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all duration-200"
            >
              Reset Password
            </Button>
          </Form.Item>
        </Form>
      )}

      <div className="text-center mt-6">
        <Button 
          type="link" 
          onClick={() => step === 1 ? setStep(0) : navigate('/login')} 
          className="p-0 text-indigo-600 hover:text-indigo-500 font-semibold transition-colors duration-200"
        >
          {step === 1 ? '← Back to email verification' : 'Back to Login'}
        </Button>
      </div>
    </div>
  );
};

export default ForgotPassword;