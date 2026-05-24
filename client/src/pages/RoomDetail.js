import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Input, Button, List, Avatar, Tag, message, Row, Col, Card } from 'antd';
import { SendOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { getRoomById } from '../redux/slices/roomSlice';
import { getMessages, sendMessage } from '../redux/slices/messageSlice';
import { getTasks } from '../redux/slices/taskSlice';
import { getNotes } from '../redux/slices/noteSlice';
import socket from '../utils/socket';

const { TabPane } = Tabs;
const { TextArea } = Input;

const RoomDetail = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { currentRoom, currentMembers } = useSelector((state) => state.rooms);
  const { messages } = useSelector((state) => state.messages);
  const { tasks } = useSelector((state) => state.tasks);
  const { notes } = useSelector((state) => state.notes);
  const [messageInput, setMessageInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    dispatch(getRoomById(roomId));
    dispatch(getMessages(roomId));
    dispatch(getTasks({ roomId }));
    dispatch(getNotes(roomId));

    socket.connect();
    socket.emit('join_room', { roomId, userId: user?.id });

    socket.on('receive_message', (message) => {
      dispatch({ type: 'messages/addMessage', payload: message });
    });

    socket.on('user_joined', (data) => {
      console.log('User joined:', data);
    });

    return () => {
      socket.emit('leave_room', { roomId, userId: user?.id });
      socket.disconnect();
    };
  }, [roomId, dispatch, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    try {
      await dispatch(sendMessage({ roomId, content: messageInput })).unwrap();
      setMessageInput('');
    } catch (error) {
      message.error(error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button onClick={() => navigate('/rooms')}>← Back to Rooms</Button>
        <h2 style={{ marginTop: 16 }}>{currentRoom?.name}</h2>
        <p style={{ color: '#666' }}>{currentRoom?.description}</p>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Chat" key="chat">
          <Card
            style={{ height: 'calc(100vh - 300px)', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 16,
                background: '#f5f5f5',
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.user_id === user?.id ? 'own' : 'other'}`}
                  style={{ marginBottom: 16 }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <Avatar
                      src={msg.profile_photo}
                      icon={<UserOutlined />}
                      size={32}
                    />
                    <div>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
                        {msg.full_name} • {new Date(msg.created_at).toLocaleTimeString()}
                      </div>
                      <div
                        className={`message-bubble ${msg.user_id === user?.id ? 'own' : 'other'}`}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 8,
                          background: msg.user_id === user?.id ? '#1890ff' : '#fff',
                          color: msg.user_id === user?.id ? '#fff' : '#333',
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <TextArea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                autoSize={{ minRows: 1, maxRows: 4 }}
              />
              <Button type="primary" icon={<SendOutlined />} onClick={handleSendMessage}>
                Send
              </Button>
            </div>
          </Card>
        </TabPane>

        <TabPane tab="Tasks" key="tasks">
          <div style={{ marginBottom: 16 }}>
            <Button type="primary">+ Add Task</Button>
          </div>
          <Row gutter={[16, 16]}>
            {['todo', 'in_progress', 'review', 'done'].map((status) => (
              <Col xs={24} sm={12} lg={6} key={status}>
                <Card
                  title={status.replace('_', ' ').toUpperCase()}
                  style={{ minHeight: 400 }}
                >
                  {tasks
                    .filter((task) => task.status === status)
                    .map((task) => (
                      <Card
                        key={task.id}
                        size="small"
                        style={{ marginBottom: 12, cursor: 'pointer' }}
                      >
                        <div style={{ fontWeight: 500 }}>{task.title}</div>
                        <Tag color={task.priority === 'high' ? 'red' : 'blue'} style={{ marginTop: 8 }}>
                          {task.priority}
                        </Tag>
                      </Card>
                    ))}
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>

        <TabPane tab="Notes" key="notes">
          <div style={{ marginBottom: 16 }}>
            <Button type="primary">+ Create Note</Button>
          </div>
          <Row gutter={[16, 16]}>
            {notes.map((note) => (
              <Col xs={24} sm={12} lg={8} key={note.id}>
                <Card
                  title={note.title}
                  extra={<FileTextOutlined />}
                  hoverable
                  onClick={() => console.log('Open note:', note.id)}
                >
                  <p style={{ color: '#666' }}>
                    {note.content?.substring(0, 100)}...
                  </p>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    Last edited: {new Date(note.updated_at).toLocaleDateString()}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>

        <TabPane tab="Members" key="members">
          <List
            dataSource={currentMembers}
            renderItem={(member) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar src={member.profile_photo} icon={<UserOutlined />} />}
                  title={member.full_name}
                  description={
                    <div>
                      <Tag color={member.role === 'owner' ? 'gold' : 'blue'}>
                        {member.role}
                      </Tag>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </TabPane>

        <TabPane tab="Files" key="files">
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#666' }}>File sharing feature coming soon</p>
          </div>
        </TabPane>

        <TabPane tab="Pomodoro" key="pomodoro">
          <Card>
            <div style={{ textAlign: 'center', padding: 40 }}>
              <h3>Study Timer</h3>
              <div style={{ fontSize: 48, fontWeight: 'bold', margin: '24px 0' }}>
                25:00
              </div>
              <Button type="primary" size="large">
                Start Session
              </Button>
            </div>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default RoomDetail;
