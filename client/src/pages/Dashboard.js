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
    <div className="animate-fade-in-up">
      <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 rounded-2xl border border-indigo-100/30 shadow-sm">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Welcome back, {user?.full_name}!
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Ready to collaborate and study together?
        </p>
      </div>

      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border border-slate-100/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 shadow-sm">
            <Statistic
              title={<span className="font-semibold text-slate-500 text-sm">Rooms Joined</span>}
              value={roomsJoined || userRooms.length}
              prefix={<TeamOutlined className="text-indigo-500 mr-1" />}
              valueStyle={{ color: '#6366f1', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border border-slate-100/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 shadow-sm">
            <Statistic
              title={<span className="font-semibold text-slate-500 text-sm">Study Hours</span>}
              value={totalStudyHours || 0}
              precision={1}
              suffix="h"
              prefix={<ClockCircleOutlined className="text-emerald-500 mr-1" />}
              valueStyle={{ color: '#10b981', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border border-slate-100/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 shadow-sm">
            <Statistic
              title={<span className="font-semibold text-slate-500 text-sm">Completed Sessions</span>}
              value={completedSessions || 0}
              prefix={<CheckCircleOutlined className="text-amber-500 mr-1" />}
              valueStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border border-slate-100/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 shadow-sm">
            <Statistic
              title={<span className="font-semibold text-slate-500 text-sm">Active Tasks</span>}
              value={0}
              prefix={<CheckCircleOutlined className="text-violet-500 mr-1" />}
              valueStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={<span className="font-extrabold text-slate-800">My Study Rooms</span>}
            className="rounded-2xl border border-slate-100/80 shadow-sm overflow-hidden"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/rooms')}
                className="bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1.5 shadow-sm transition-all duration-200 text-sm font-semibold h-9"
              >
                Browse Rooms
              </Button>
            }
          >
            {userRooms.length > 0 ? (
              <List
                dataSource={userRooms}
                className="divide-y divide-slate-100"
                renderItem={(room) => (
                  <List.Item
                    className="hover:bg-slate-50/50 px-4 rounded-xl transition-colors duration-200"
                    actions={[
                      <Button
                        type="link"
                        onClick={() => navigate(`/rooms/${room.id}`)}
                        className="text-indigo-600 hover:text-indigo-500 font-semibold transition-colors duration-200"
                      >
                        Join Room
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={<span className="font-bold text-slate-800">{room.name}</span>}
                      description={<span className="text-slate-500 text-sm">{room.description || 'No description'}</span>}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div className="text-center py-12">
                <Text type="secondary" className="text-slate-400 font-medium">You haven't joined any rooms yet</Text>
                <div className="mt-4">
                  <Button 
                    type="primary" 
                    onClick={() => navigate('/rooms')}
                    className="bg-indigo-600 hover:bg-indigo-500 h-10 rounded-lg text-sm font-semibold shadow-md active:scale-95 transition-all duration-200"
                  >
                    Explore Rooms
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title={<span className="font-extrabold text-slate-800">Quick Actions</span>}
            className="rounded-2xl border border-slate-100/80 shadow-sm"
          >
            <Button
              type="primary"
              block
              icon={<PlusOutlined />}
              onClick={() => navigate('/rooms')}
              className="mb-3 h-10 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold shadow-sm hover:shadow active:scale-[0.98] transition-all duration-200"
            >
              Create Room
            </Button>
            <Button
              block
              icon={<TeamOutlined />}
              onClick={() => navigate('/rooms')}
              className="mb-3 h-10 border-slate-200 hover:border-indigo-500 hover:text-indigo-600 rounded-lg text-sm font-semibold hover:bg-slate-50 active:scale-[0.98] transition-all duration-200"
            >
              Join Room
            </Button>
            <Button
              block
              icon={<TeamOutlined />}
              onClick={() => navigate('/profile')}
              className="h-10 border-slate-200 hover:border-indigo-500 hover:text-indigo-600 rounded-lg text-sm font-semibold hover:bg-slate-50 active:scale-[0.98] transition-all duration-200"
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
