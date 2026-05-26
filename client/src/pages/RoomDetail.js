import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Input, Button, List, Avatar, Tag, message, Row, Col, Card, Modal, Form, Select, DatePicker, Drawer, Dropdown, Space } from 'antd';
import { SendOutlined, UserOutlined, FileTextOutlined, CopyOutlined, MoreOutlined, DeleteOutlined, CodeOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { getRoomById } from '../redux/slices/roomSlice';
import { getMessages, sendMessage } from '../redux/slices/messageSlice';
import { getTasks, createTask, updateTask, deleteTask } from '../redux/slices/taskSlice';
import { getNotes } from '../redux/slices/noteSlice';
import socket from '../utils/socket';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

const statusColors = {
  todo: '#999',
  in_progress: '#1890ff',
  review: '#faad14',
  done: '#52c41a',
};

const priorityColors = {
  low: 'green',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};

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

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [taskForm] = Form.useForm();
  const [editTaskForm] = Form.useForm();

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

  const copyRoomCode = () => {
    if (currentRoom?.room_code) {
      navigator.clipboard.writeText(currentRoom.room_code);
      message.success('Room code copied!');
    }
  };

  const handleCreateTask = async (values) => {
    try {
      await dispatch(createTask({
        roomId,
        taskData: {
          ...values,
          due_date: values.due_date ? values.due_date.toISOString() : null,
        },
      })).unwrap();
      message.success('Task created');
      setIsCreateTaskOpen(false);
      taskForm.resetFields();
    } catch (error) {
      message.error(error);
    }
  };

  const openTaskDetail = (task) => {
    setSelectedTask(task);
    editTaskForm.setFieldsValue({
      ...task,
      due_date: task.due_date ? dayjs(task.due_date) : null,
    });
    setIsDetailDrawerOpen(true);
  };

  const handleUpdateTask = async (values) => {
    if (!selectedTask) return;
    try {
      await dispatch(updateTask({
        taskId: selectedTask.id,
        taskData: {
          ...values,
          due_date: values.due_date ? values.due_date.toISOString() : null,
        },
      })).unwrap();
      message.success('Task updated');
      setIsDetailDrawerOpen(false);
      setSelectedTask(null);
    } catch (error) {
      message.error(error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    Modal.confirm({
      title: 'Delete Task',
      content: 'Are you sure you want to delete this task?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await dispatch(deleteTask(taskId)).unwrap();
          message.success('Task deleted');
          setIsDetailDrawerOpen(false);
          setSelectedTask(null);
        } catch (error) {
          message.error(error);
        }
      },
    });
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await dispatch(updateTask({
        taskId: task.id,
        taskData: { ...task, status: newStatus },
      })).unwrap();
    } catch (error) {
      message.error(error);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button onClick={() => navigate('/rooms')}>← Back to Rooms</Button>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>{currentRoom?.name}</h2>
          {currentRoom?.room_code && (
            <Tag
              icon={<CodeOutlined />}
              color="blue"
              style={{ cursor: 'pointer', fontSize: 14, padding: '4px 12px' }}
              onClick={copyRoomCode}
            >
              Code: {currentRoom.room_code} <CopyOutlined />
            </Tag>
          )}
        </div>
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
            <Button type="primary" onClick={() => setIsCreateTaskOpen(true)}>+ Add Task</Button>
          </div>
          <Row gutter={[16, 16]}>
            {['todo', 'in_progress', 'review', 'done'].map((status) => (
              <Col xs={24} sm={12} lg={6} key={status}>
                <Card
                  title={status.replace('_', ' ').toUpperCase()}
                  headStyle={{ background: statusColors[status], color: '#fff' }}
                  style={{ minHeight: 400 }}
                >
                  {tasks
                    .filter((task) => task.status === status)
                    .map((task) => (
                      <Card
                        key={task.id}
                        size="small"
                        style={{ marginBottom: 12, cursor: 'pointer' }}
                        onClick={() => openTaskDetail(task)}
                        actions={[
                          <Dropdown
                            menu={{
                              items: ['todo', 'in_progress', 'review', 'done']
                                .filter((s) => s !== task.status)
                                .map((s) => ({
                                  key: s,
                                  label: `Move to ${s.replace('_', ' ')}`,
                                  onClick: (e) => {
                                    e.domEvent.stopPropagation();
                                    handleStatusChange(task, s);
                                  },
                                })),
                            }}
                            trigger={['click']}
                          >
                            <MoreOutlined key="more" onClick={(e) => e.stopPropagation()} />
                          </Dropdown>,
                        ]}
                      >
                        <div style={{ fontWeight: 500 }}>{task.title}</div>
                        <Tag color={priorityColors[task.priority]} style={{ marginTop: 8 }}>
                          {task.priority}
                        </Tag>
                        {task.assigned_name && (
                          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                            <UserOutlined /> {task.assigned_name}
                          </div>
                        )}
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

      <Modal
        title="Create Task"
        open={isCreateTaskOpen}
        onCancel={() => {
          setIsCreateTaskOpen(false);
          taskForm.resetFields();
        }}
        footer={null}
      >
        <Form form={taskForm} onFinish={handleCreateTask} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please enter task title' }]}>
            <Input placeholder="Task title" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Task description" />
          </Form.Item>
          <Form.Item name="priority" label="Priority" initialValue="medium">
            <Select>
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
              <Option value="urgent">Urgent</Option>
            </Select>
          </Form.Item>
          <Form.Item name="assigned_to" label="Assign To">
            <Select placeholder="Select member" allowClear>
              {currentMembers.map((member) => (
                <Option key={member.user_id} value={member.user_id}>
                  {member.full_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="due_date" label="Due Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Task
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={
          <Space>
            <span>Task Details</span>
            {selectedTask && <Tag color={priorityColors[selectedTask.priority]}>{selectedTask.priority}</Tag>}
          </Space>
        }
        open={isDetailDrawerOpen}
        onClose={() => {
          setIsDetailDrawerOpen(false);
          setSelectedTask(null);
        }}
        width={400}
        footer={
          selectedTask && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteTask(selectedTask.id)}
              >
                Delete
              </Button>
            </div>
          )
        }
      >
        {selectedTask && (
          <Form form={editTaskForm} onFinish={handleUpdateTask} layout="vertical">
            <Form.Item name="title" label="Title" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <TextArea rows={3} />
            </Form.Item>
            <Form.Item name="status" label="Status">
              <Select>
                <Option value="todo">To Do</Option>
                <Option value="in_progress">In Progress</Option>
                <Option value="review">Review</Option>
                <Option value="done">Done</Option>
              </Select>
            </Form.Item>
            <Form.Item name="priority" label="Priority">
              <Select>
                <Option value="low">Low</Option>
                <Option value="medium">Medium</Option>
                <Option value="high">High</Option>
                <Option value="urgent">Urgent</Option>
              </Select>
            </Form.Item>
            <Form.Item name="assigned_to" label="Assign To">
              <Select placeholder="Select member" allowClear>
                {currentMembers.map((member) => (
                  <Option key={member.user_id} value={member.user_id}>
                    {member.full_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="due_date" label="Due Date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Save Changes
              </Button>
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </div>
  );
};

export default RoomDetail;
