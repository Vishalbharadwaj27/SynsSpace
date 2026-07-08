import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Input, Modal, Form, message, Tag, Space, Typography, Checkbox } from 'antd';
import { PlusOutlined, SearchOutlined, TeamOutlined, LockOutlined, CopyOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getRooms, createRoom, joinRoom, joinRoomById } from '../redux/slices/roomSlice';

const { Search } = Input;
const { TextArea } = Input;
const { Title } = Typography;

const Rooms = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { rooms } = useSelector((state) => state.rooms);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isPrivateCodeModalOpen, setIsPrivateCodeModalOpen] = useState(false);
  const [pendingPrivateRoom, setPendingPrivateRoom] = useState(null);
  const [createdRoom, setCreatedRoom] = useState(null);
  const [form] = Form.useForm();
  const [joinForm] = Form.useForm();
  const [privateCodeForm] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(getRooms({ search: searchTerm }));
  }, [dispatch, searchTerm]);

  const handleCreateRoom = async (values) => {
    try {
      const room = await dispatch(createRoom(values)).unwrap();
      setCreatedRoom(room);
      setIsCreateModalOpen(false);
      form.resetFields();
      setIsCodeModalOpen(true);
      dispatch(getRooms());
    } catch (error) {
      message.error(error);
    }
  };

  const copyRoomCode = () => {
    if (createdRoom?.room_code) {
      navigator.clipboard.writeText(createdRoom.room_code);
      message.success('Room code copied!');
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

  const handleViewRoom = async (room) => {
    if (room.is_private) {
      setPendingPrivateRoom(room);
      privateCodeForm.resetFields();
      setIsPrivateCodeModalOpen(true);
      return;
    }
    try {
      await dispatch(joinRoomById({ roomId: room.id })).unwrap();
      navigate(`/rooms/${room.id}`);
    } catch (error) {
      if (error === 'Already a member of this room') {
        navigate(`/rooms/${room.id}`);
      } else {
        message.error(error);
      }
    }
  };

  const handlePrivateRoomJoin = async (values) => {
    if (!pendingPrivateRoom) return;
    try {
      await dispatch(joinRoomById({ roomId: pendingPrivateRoom.id, room_code: values.room_code })).unwrap();
      setIsPrivateCodeModalOpen(false);
      setPendingPrivateRoom(null);
      privateCodeForm.resetFields();
      navigate(`/rooms/${pendingPrivateRoom.id}`);
    } catch (error) {
      message.error(error);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight m-0">Study Rooms</h2>
        <Space className="w-full sm:w-auto justify-end">
          <Button 
            icon={<PlusOutlined />} 
            onClick={() => setIsJoinModalOpen(true)}
            className="border-slate-200 hover:border-indigo-500 hover:text-indigo-600 rounded-lg font-semibold transition-all duration-200 h-9"
          >
            Join with Code
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold shadow-sm transition-all duration-200 h-9 flex items-center gap-1"
          >
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
        className="mb-8 rounded-xl shadow-sm border-slate-100 hover:border-indigo-300 focus:border-indigo-500 transition-all duration-200"
      />

      <Row gutter={[16, 16]}>
        {rooms.map((room) => (
          <Col xs={24} sm={12} lg={8} key={room.id}>
            <Card
              hoverable
              title={
                <Space className="font-bold text-slate-800">
                  {room.is_private && <LockOutlined className="text-amber-500" />}
                  {room.name}
                </Space>
              }
              extra={<Tag color="indigo" className="rounded-full px-2.5 py-0.5 border-indigo-100 font-semibold">{room.member_count} members</Tag>}
              className="rounded-2xl border border-slate-100/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
              actions={[
                <Button 
                  type="primary" 
                  onClick={() => handleViewRoom(room)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm hover:shadow h-9 border-none transition-all duration-200 px-6 active:scale-95"
                >
                  {room.is_private ? 'Join Room' : 'View Room'}
                </Button>,
              ]}
            >
              <p className="text-slate-500 text-sm mb-4 line-clamp-2 h-10">
                {room.description || 'No description provided.'}
              </p>
              <div className="flex items-center text-slate-400 text-xs mt-3">
                <TeamOutlined className="mr-1.5 text-slate-400" />
                <span>Created by <strong className="text-slate-600 font-medium">{room.creator_name}</strong></span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title={<span className="font-extrabold text-slate-800 text-lg">Create Study Room</span>}
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
        className="rounded-2xl overflow-hidden"
      >
        <Form form={form} onFinish={handleCreateRoom} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label={<span className="font-semibold text-slate-600">Room Name</span>}
            rules={[{ required: true, message: 'Please enter room name' }]}
          >
            <Input placeholder="Enter room name" />
          </Form.Item>
          <Form.Item name="description" label={<span className="font-semibold text-slate-600">Description</span>}>
            <TextArea rows={3} placeholder="Enter room description" className="rounded-lg" />
          </Form.Item>
          <Form.Item name="is_private" valuePropName="checked">
            <Checkbox className="text-slate-600 font-medium">Private Room (requires code to join)</Checkbox>
          </Form.Item>
          <Form.Item name="max_members" label={<span className="font-semibold text-slate-600">Max Members</span>}>
            <Input type="number" placeholder="50" defaultValue={50} />
          </Form.Item>
          <Form.Item className="mb-0">
            <Button 
              type="primary" 
              htmlType="submit" 
              block
              className="h-10 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold shadow-md active:scale-[0.98] transition-all duration-200"
            >
              Create Room
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span className="font-extrabold text-slate-800 text-lg">Join Room with Code</span>}
        open={isJoinModalOpen}
        onCancel={() => setIsJoinModalOpen(false)}
        footer={null}
      >
        <Form form={joinForm} onFinish={handleJoinRoom} layout="vertical" className="mt-4">
          <Form.Item
            name="room_code"
            label={<span className="font-semibold text-slate-600">Room Code</span>}
            rules={[{ required: true, message: 'Please enter room code' }]}
          >
            <Input placeholder="Enter 6-digit room code" className="uppercase font-semibold tracking-wider text-center" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Button 
              type="primary" 
              htmlType="submit" 
              block
              className="h-10 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold shadow-md active:scale-[0.98] transition-all duration-200"
            >
              Join Room
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span className="font-extrabold text-slate-800 text-lg">{`Join "${pendingPrivateRoom?.name || ''}"`}</span>}
        open={isPrivateCodeModalOpen}
        onCancel={() => { setIsPrivateCodeModalOpen(false); setPendingPrivateRoom(null); }}
        footer={null}
      >
        <p className="text-slate-500 text-sm mb-4">This room is private. Enter the room code to join.</p>
        <Form form={privateCodeForm} onFinish={handlePrivateRoomJoin} layout="vertical">
          <Form.Item
            name="room_code"
            label={<span className="font-semibold text-slate-600">Room Code</span>}
            rules={[{ required: true, message: 'Please enter the room code' }]}
          >
            <Input placeholder="Enter room code" className="uppercase font-semibold tracking-wider text-center" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Button 
              type="primary" 
              htmlType="submit" 
              block
              className="h-10 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold shadow-md active:scale-[0.98] transition-all duration-200"
            >
              Join Room
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span className="font-extrabold text-slate-800 text-lg">Room Created!</span>}
        open={isCodeModalOpen}
        onCancel={() => setIsCodeModalOpen(false)}
        footer={[
          <Button 
            key="close" 
            onClick={() => setIsCodeModalOpen(false)}
            className="border-slate-200 hover:border-slate-300 hover:text-slate-800 rounded-lg font-semibold transition-all duration-200 h-9"
          >
            Close
          </Button>,
          <Button 
            key="view" 
            type="primary" 
            onClick={() => {
              setIsCodeModalOpen(false);
              navigate(`/rooms/${createdRoom?.id}`);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold shadow-sm transition-all duration-200 h-9 active:scale-95"
          >
            Go to Room
          </Button>,
        ]}
      >
        <div className="text-center py-6">
          <Title level={4} className="font-extrabold text-slate-800 mb-2">Share this code with friends</Title>
          <div
            className="text-3xl font-extrabold tracking-widest py-4 px-6 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/60 my-6 cursor-pointer select-all transition-colors duration-200 inline-block mx-auto"
            onClick={copyRoomCode}
          >
            {createdRoom?.room_code}
          </div>
          <div>
            <Button 
              icon={<CopyOutlined />} 
              onClick={copyRoomCode}
              className="border-slate-200 hover:border-indigo-500 hover:text-indigo-600 rounded-lg font-semibold transition-all duration-200 h-9"
            >
              Copy Code
            </Button>
          </div>
          <div className="mt-6 text-slate-400 text-sm">
            {createdRoom?.is_private
              ? 'This room is private. Members need this code to join.'
              : 'This room is public, but you can still share this code for quick access.'}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Rooms;
