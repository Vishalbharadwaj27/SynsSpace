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
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar
                src={user?.profile_photo}
                icon={<UserOutlined />}
                size={120}
                style={{ marginBottom: 16 }}
              />
              <h2>{user?.full_name}</h2>
              <p style={{ color: '#666' }}>{user?.email}</p>
              <Upload showUploadList={false}>
                <Button icon={<UploadOutlined />}>Change Photo</Button>
              </Upload>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="Edit Profile">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
            >
              <Form.Item
                name="full_name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter your full name' }]}
              >
                <Input prefix={<UserOutlined />} />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, message: 'Please enter your email' }]}
              >
                <Input prefix={<MailOutlined />} disabled />
              </Form.Item>

              <Form.Item name="bio" label="Bio">
                <TextArea rows={4} placeholder="Tell us about yourself" />
              </Form.Item>

              <Form.Item name="study_interests" label="Study Interests">
                <Input placeholder="e.g., Mathematics, Physics, Computer Science" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Update Profile
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Study Hours"
                  value={totalStudyHours || 0}
                  precision={1}
                  suffix="h"
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Completed Sessions"
                  value={completedSessions || 0}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Rooms Joined"
                  value={roomsJoined || 0}
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
