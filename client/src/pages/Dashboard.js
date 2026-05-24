import React, { useEffect } from 'react';
import { Row, Col, Card, Statistic, Button, List, Typography } from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getUserRooms } from '../redux/slices/roomSlice';
import { getUserStats } from '../redux/slices/pomodoroSlice';

const { Title, Text } = Typography;

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { userRooms } = useSelector((state) => state.rooms);
  const { totalStudyHours, completedSessions, roomsJoined } = useSelector(
    (state) => state.pomodoro
  );

  useEffect(() => {
    dispatch(getUserRooms());
    dispatch(getUserStats());
  }, [dispatch]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Welcome back, {user?.full_name}!</Title>
        <Text type="secondary">Ready to collaborate and study together?</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Rooms Joined"
              value={roomsJoined || userRooms.length}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Study Hours"
              value={totalStudyHours || 0}
              precision={1}
              suffix="h"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completed Sessions"
              value={completedSessions || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Tasks"
              value={0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="My Study Rooms"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/rooms')}
              >
                Browse Rooms
              </Button>
            }
          >
            {userRooms.length > 0 ? (
              <List
                dataSource={userRooms}
                renderItem={(room) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        onClick={() => navigate(`/rooms/${room.id}`)}
                      >
                        Join Room
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={room.name}
                      description={room.description || 'No description'}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Text type="secondary">You haven't joined any rooms yet</Text>
                <div style={{ marginTop: 16 }}>
                  <Button type="primary" onClick={() => navigate('/rooms')}>
                    Explore Rooms
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Quick Actions">
            <Button
              type="primary"
              block
              icon={<PlusOutlined />}
              style={{ marginBottom: 12 }}
              onClick={() => navigate('/rooms')}
            >
              Create Room
            </Button>
            <Button
              block
              icon={<TeamOutlined />}
              style={{ marginBottom: 12 }}
              onClick={() => navigate('/rooms')}
            >
              Join Room
            </Button>
            <Button
              block
              icon={<TeamOutlined />}
              onClick={() => navigate('/profile')}
            >
              View Profile
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
