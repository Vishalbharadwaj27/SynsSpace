import React, { useEffect } from 'react';
import { Card, Form, Input, Button, Avatar, Upload, message, Row, Col, Statistic } from 'antd';
import { UserOutlined, MailOutlined, UploadOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../redux/slices/authSlice';
import { getUserStats } from '../redux/slices/pomodoroSlice';

const { TextArea } = Input;

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { totalStudyHours, completedSessions, roomsJoined } = useSelector(
    (state) => state.pomodoro
  );
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      full_name: user?.full_name,
      email: user?.email,
      bio: user?.bio,
      study_interests: user?.study_interests,
    });
    dispatch(getUserStats());
  }, [user, form, dispatch]);

  const handleUpdateProfile = async (values) => {
    try {
      await dispatch(updateProfile(values)).unwrap();
      message.success('Profile updated successfully');
    } catch (error) {
      message.error(error);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card className="rounded-2xl border border-slate-100/80 shadow-sm overflow-hidden">
            <div className="text-center py-6">
              <Avatar
                src={user?.profile_photo}
                icon={<UserOutlined />}
                size={120}
                className="border-4 border-indigo-50 shadow-lg mx-auto mb-4 bg-indigo-50 text-indigo-500"
              />
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{user?.full_name}</h2>
              <p className="text-slate-500 text-sm mb-6">{user?.email}</p>
              <Upload showUploadList={false}>
                <Button 
                  icon={<UploadOutlined />}
                  className="border-slate-200 hover:border-indigo-500 hover:text-indigo-600 rounded-lg shadow-sm transition-all duration-200 font-semibold"
                >
                  Change Photo
                </Button>
              </Upload>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card 
            title={<span className="font-extrabold text-slate-800">Edit Profile</span>}
            className="rounded-2xl border border-slate-100/80 shadow-sm"
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
            >
              <Form.Item
                name="full_name"
                label={<span className="font-semibold text-slate-600">Full Name</span>}
                rules={[{ required: true, message: 'Please enter your full name' }]}
              >
                <Input prefix={<UserOutlined className="text-slate-400" />} />
              </Form.Item>

              <Form.Item
                name="email"
                label={<span className="font-semibold text-slate-600">Email</span>}
                rules={[{ required: true, message: 'Please enter your email' }]}
              >
                <Input prefix={<MailOutlined className="text-slate-400" />} disabled />
              </Form.Item>

              <Form.Item name="bio" label={<span className="font-semibold text-slate-600">Bio</span>}>
                <TextArea rows={4} placeholder="Tell us about yourself" className="rounded-lg" />
              </Form.Item>

              <Form.Item name="study_interests" label={<span className="font-semibold text-slate-600">Study Interests</span>}>
                <Input placeholder="e.g., Mathematics, Physics, Computer Science" />
              </Form.Item>

              <Form.Item className="mb-0">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  block
                  className="h-10 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold shadow-sm hover:shadow active:scale-[0.98] transition-all duration-200"
                >
                  Update Profile
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Row gutter={[16, 16]} className="mt-4">
            <Col xs={24} sm={8}>
              <Card className="rounded-2xl border border-slate-100/80 shadow-sm hover:shadow-md transition-shadow duration-300">
                <Statistic
                  title={<span className="font-semibold text-slate-500 text-sm">Study Hours</span>}
                  value={totalStudyHours || 0}
                  precision={1}
                  suffix="h"
                  valueStyle={{ color: '#10b981', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="rounded-2xl border border-slate-100/80 shadow-sm hover:shadow-md transition-shadow duration-300">
                <Statistic
                  title={<span className="font-semibold text-slate-500 text-sm">Completed Sessions</span>}
                  value={completedSessions || 0}
                  valueStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="rounded-2xl border border-slate-100/80 shadow-sm hover:shadow-md transition-shadow duration-300">
                <Statistic
                  title={<span className="font-semibold text-slate-500 text-sm">Rooms Joined</span>}
                  value={roomsJoined || 0}
                  valueStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
