import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Input, Modal, Form, message, Tag, Space } from 'antd';
import { PlusOutlined, SearchOutlined, TeamOutlined, LockOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getRooms, createRoom, joinRoom } from '../redux/slices/roomSlice';

const { Search } = Input;
const { TextArea } = Input;

const Rooms = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { rooms } = useSelector((state) => state.rooms);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [joinForm] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(getRooms({ search: searchTerm }));
  }, [dispatch, searchTerm]);

  const handleCreateRoom = async (values) => {
    try {
      await dispatch(createRoom(values)).unwrap();
      message.success('Room created successfully');
      setIsCreateModalOpen(false);
      form.resetFields();
      dispatch(getRooms());
    } catch (error) {
      message.error(error);
    }
  };

  const handleJoinRoom = async (values) => {
    try {
      const room = await dispatch(joinRoom(values.room_code)).unwrap();
      message.success('Joined room successfully');
      setIsJoinModalOpen(false);
      joinForm.resetFields();
      navigate(`/rooms/${room.id}`);
    } catch (error) {
      message.error(error);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Study Rooms</h2>
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => setIsJoinModalOpen(true)}>
            Join with Code
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
            Create Room
          </Button>
        </Space>
      </div>

      <Search
        placeholder="Search rooms..."
        allowClear
        enterButton={<SearchOutlined />}
        size="large"
        onSearch={handleSearch}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]}>
        {rooms.map((room) => (
          <Col xs={24} sm={12} lg={8} key={room.id}>
            <Card
              hoverable
              title={
                <Space>
                  {room.is_private && <LockOutlined />}
                  {room.name}
                </Space>
              }
              extra={<Tag color="blue">{room.member_count} members</Tag>}
              actions={[
                <Button type="primary" onClick={() => navigate(`/rooms/${room.id}`)}>
                  View Room
                </Button>,
              ]}
            >
              <p style={{ color: '#666', marginBottom: 12 }}>
                {room.description || 'No description'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', color: '#999' }}>
                <TeamOutlined style={{ marginRight: 8 }} />
                <span>Created by {room.creator_name}</span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title="Create Study Room"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleCreateRoom} layout="vertical">
          <Form.Item
            name="name"
            label="Room Name"
            rules={[{ required: true, message: 'Please enter room name' }]}
          >
            <Input placeholder="Enter room name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Enter room description" />
          </Form.Item>
          <Form.Item name="is_private" valuePropName="checked">
            <input type="checkbox" /> Private Room (requires code to join)
          </Form.Item>
          <Form.Item name="max_members" label="Max Members">
            <Input type="number" placeholder="50" defaultValue={50} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Room
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Join Room with Code"
        open={isJoinModalOpen}
        onCancel={() => setIsJoinModalOpen(false)}
        footer={null}
      >
        <Form form={joinForm} onFinish={handleJoinRoom} layout="vertical">
          <Form.Item
            name="room_code"
            label="Room Code"
            rules={[{ required: true, message: 'Please enter room code' }]}
          >
            <Input placeholder="Enter 6-digit room code" style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Join Room
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Rooms;
