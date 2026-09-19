import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Input, Button, List, Avatar, Tag, message, Row, Col, Card, Modal, Form, Select, DatePicker, Drawer, Dropdown, Space, Popconfirm, Typography, Radio } from 'antd';
import { SendOutlined, UserOutlined, FileTextOutlined, CopyOutlined, MoreOutlined, DeleteOutlined, CodeOutlined, PlusOutlined, PlayCircleOutlined, PauseCircleOutlined, StopOutlined, LogoutOutlined, FilePdfOutlined, FileWordOutlined, FileOutlined, DownloadOutlined, EyeOutlined, LockOutlined, UnlockOutlined, UploadOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { getRoomById, leaveRoom } from '../redux/slices/roomSlice';
import { getMessages, sendMessage } from '../redux/slices/messageSlice';
import { getTasks, createTask, updateTask, deleteTask } from '../redux/slices/taskSlice';
import { getNotes, createNote, updateNote, deleteNote } from '../redux/slices/noteSlice';
import { startSession, endSession, getSessions } from '../redux/slices/pomodoroSlice';
import { getFiles, uploadFile, updateFilePermission, deleteFile } from '../redux/slices/fileSlice';
import socket from '../utils/socket';
import api from '../utils/api';
import WorkspaceAdminPanel from './WorkspaceAdminPanel';
import dayjs from 'dayjs';
import { useCreateBlockNote, BlockNoteViewRaw } from '@blocknote/react';
import '@blocknote/react/style.css';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

const statusColors = { todo: '#999', in_progress: '#1890ff', review: '#faad14', done: '#52c41a' };
const priorityColors = { low: 'green', medium: 'blue', high: 'orange', urgent: 'red' };

const NoteBlockEditor = React.forwardRef(({ content, onTitleChange, title }, ref) => {
  const initialContent = (() => {
    try {
      if (!content || content === '[]') return undefined;
      const parsed = JSON.parse(content);
      return parsed && parsed.length > 0 ? parsed : undefined;
    } catch {
      return undefined;
    }
  })();
  const editor = useCreateBlockNote({ initialContent });
  React.useImperativeHandle(ref, () => ({ getContent: () => JSON.stringify(editor.document || []) }), [editor]);
  return (
    <div className="animate-fade-in">
      <Input 
        value={title} 
        onChange={e => onTitleChange(e.target.value)} 
        placeholder="Note title" 
        className="text-2xl font-extrabold border-none shadow-none focus:shadow-none focus:ring-0 focus:border-none focus:outline-none mb-4 pl-0 hover:bg-transparent placeholder-slate-400" 
      />
      <div className="min-h-[400px] border border-slate-100/80 rounded-xl p-4 bg-slate-50/10 shadow-inner">
        <BlockNoteViewRaw editor={editor} theme="light" />
      </div>
    </div>
  );
});

const RoomDetail = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { currentRoom, currentMembers } = useSelector((state) => state.rooms);
  const { messages } = useSelector((state) => state.messages);
  const { tasks } = useSelector((state) => state.tasks);
  const { notes } = useSelector((state) => state.notes);
  const { sessions } = useSelector((state) => state.pomodoro);
  const { files } = useSelector((state) => state.files);
  const [messageInput, setMessageInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef(null);

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [taskForm] = Form.useForm();
  const [editTaskForm] = Form.useForm();

  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');

  const [pomodoroDuration, setPomodoroDuration] = useState(25);
  const [pomodoroType, setPomodoroType] = useState('work');
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const timerRef = useRef(null);

  const isOwner = currentMembers?.some(m => m.user_id === user?.id && m.role === 'owner');
  const isWorkspaceAdmin = currentMembers?.some(m => m.user_id === user?.id && (m.role === 'owner' || m.role === 'admin'));

  const [noteKey, setNoteKey] = useState(0);
  const noteEditorRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [uploadPermission, setUploadPermission] = useState('view');
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    dispatch(getRoomById(roomId));
    dispatch(getMessages(roomId));
    dispatch(getTasks({ roomId }));
    dispatch(getNotes(roomId));
    dispatch(getSessions(roomId));
    dispatch(getFiles(roomId));

    if (!socket.connected) {
      socket.connect();
    }

    const onReceiveMessage = (message) => {
      dispatch({ type: 'messages/addMessage', payload: message });
    };
    const onNoteUpdated = (note) => {
      dispatch({ type: 'notes/updateNote/fulfilled', payload: note });
    };

    socket.emit('join_room', { roomId, userId: user?.id });
    socket.on('receive_message', onReceiveMessage);
    socket.on('note_updated', onNoteUpdated);

    return () => {
      socket.emit('leave_room', { roomId, userId: user?.id });
      socket.off('receive_message', onReceiveMessage);
      socket.off('note_updated', onNoteUpdated);
    };
  }, [roomId, dispatch, user?.id]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            setTimerActive(false);
            if (currentSessionId) dispatch(endSession(currentSessionId));
            message.success('Session completed!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning, currentSessionId, dispatch]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    try {
      await dispatch(sendMessage({ roomId, content: messageInput })).unwrap();
      setMessageInput('');
    } catch (error) { message.error(error); }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const copyRoomCode = () => {
    if (currentRoom?.room_code) {
      navigator.clipboard.writeText(currentRoom.room_code);
      message.success('Room code copied!');
    }
  };

  const handleCreateTask = async (values) => {
    try {
      await dispatch(createTask({ roomId, taskData: { ...values, due_date: values.due_date ? values.due_date.toISOString() : null } })).unwrap();
      message.success('Task created');
      setIsCreateTaskOpen(false);
      taskForm.resetFields();
    } catch (error) { message.error(error); }
  };

  const openTaskDetail = (task) => {
    setSelectedTask(task);
    editTaskForm.setFieldsValue({ ...task, due_date: task.due_date ? dayjs(task.due_date) : null });
    setIsDetailDrawerOpen(true);
  };

  const handleUpdateTask = async (values) => {
    if (!selectedTask) return;
    try {
      await dispatch(updateTask({ taskId: selectedTask.id, taskData: { ...values, due_date: values.due_date ? values.due_date.toISOString() : null } })).unwrap();
      message.success('Task updated');
      setIsDetailDrawerOpen(false);
      setSelectedTask(null);
    } catch (error) { message.error(error); }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await dispatch(deleteTask(taskId)).unwrap();
      message.success('Task deleted');
      if (selectedTask?.id === taskId) { setIsDetailDrawerOpen(false); setSelectedTask(null); }
    } catch (error) { message.error(error); }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await dispatch(updateTask({ taskId: task.id, taskData: { ...task, status: newStatus } })).unwrap();
    } catch (error) { message.error(error); }
  };

  const handleStartPomodoro = async () => {
    try {
      const session = await dispatch(startSession({ roomId, durationMinutes: pomodoroDuration, sessionType: pomodoroType })).unwrap();
      setCurrentSessionId(session.id);
      setTimerSeconds(pomodoroDuration * 60);
      setTimerActive(true);
      setTimerRunning(true);
      socket.emit('pomodoro_start', { roomId, session });
    } catch (error) { message.error(error); }
  };

  const handlePauseResume = () => setTimerRunning(prev => !prev);

  const handleEndPomodoro = async () => {
    clearInterval(timerRef.current);
    setTimerRunning(false);
    setTimerActive(false);
    if (currentSessionId) {
      await dispatch(endSession(currentSessionId));
      socket.emit('pomodoro_end', { roomId, sessionId: currentSessionId });
    }
    setCurrentSessionId(null);
    setTimerSeconds(pomodoroDuration * 60);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleCreateNote = async () => {
    setIsCreateNoteOpen(true);
    setNoteTitle('');
  };

  const handleSubmitNote = async () => {
    if (!noteTitle.trim()) { message.error('Note title is required'); return; }
    try {
      await dispatch(createNote({ roomId, noteData: { title: noteTitle, content: '' } })).unwrap();
      message.success('Note created');
      setIsCreateNoteOpen(false);
      setNoteTitle('');
    } catch (error) { message.error(error); }
  };

  const openNoteEditor = (note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteKey(prev => prev + 1);
    setIsNoteEditorOpen(true);
  };

  const handleSaveNote = async () => {
    if (!editingNote) return;
    const content = noteEditorRef.current?.getContent() || '[]';
    try {
      await dispatch(updateNote({ noteId: editingNote.id, noteData: { title: noteTitle, content } })).unwrap();
      socket.emit('note_update', { roomId, note: { ...editingNote, title: noteTitle, content } });
      message.success('Note saved');
      setIsNoteEditorOpen(false);
      setEditingNote(null);
    } catch (error) { message.error(error); }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await dispatch(deleteNote(noteId)).unwrap();
      message.success('Note deleted');
    } catch (error) { message.error(error); }
  };

  const handleLeaveRoom = async () => {
    try {
      await dispatch(leaveRoom(roomId)).unwrap();
      message.success('Left room successfully');
      navigate('/rooms');
    } catch (error) { message.error(error); }
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      message.error('File size exceeds 8MB limit');
      return;
    }

    const isPdf = file.type === 'application/pdf';
    const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx');
    if (!isPdf && !isDocx) {
      message.error('Only PDF and DOCX files are allowed');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sharing_permission', uploadPermission);

    setUploading(true);
    try {
      await dispatch(uploadFile({ roomId, formData })).unwrap();
      message.success('File uploaded successfully');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      message.error(error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      const response = await api.get(`/files/download/${file.id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.file_name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      message.success('File download started');
    } catch (error) {
      message.error('Failed to download file: Permission denied or file not found');
    }
  };

  const handleViewFile = async (file) => {
    try {
      const response = await api.get(`/files/view/${file.id}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: file.file_type });
      const url = window.URL.createObjectURL(blob);
      setPreviewFile(file);
      setPreviewUrl(url);
      setIsPreviewOpen(true);
    } catch (error) {
      message.error('Failed to load file preview');
    }
  };

  const handleTogglePermission = async (file, newPermission) => {
    try {
      await dispatch(updateFilePermission({ fileId: file.id, sharing_permission: newPermission })).unwrap();
      message.success('File permission updated');
    } catch (error) {
      message.error(error || 'Failed to update permission');
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await dispatch(deleteFile(fileId)).unwrap();
      message.success('File deleted successfully');
    } catch (error) {
      message.error(error || 'Failed to delete file');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Button onClick={() => navigate('/rooms')}>← Back to Rooms</Button>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>{currentRoom?.name}</h2>
            {currentRoom?.room_code && (
              <Tag icon={<CodeOutlined />} color="blue" style={{ cursor: 'pointer', fontSize: 14, padding: '4px 12px' }} onClick={copyRoomCode}>
                Code: {currentRoom.room_code} <CopyOutlined />
              </Tag>
            )}
          </div>
          <p style={{ color: '#666' }}>{currentRoom?.description}</p>
        </div>
        {isOwner && (
          <Popconfirm title="Leave this room? Ownership will be transferred." onConfirm={handleLeaveRoom} okText="Leave" cancelText="Cancel">
            <Button danger icon={<LogoutOutlined />}>Leave Room</Button>
          </Popconfirm>
        )}
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Chat" key="chat">
          <Card style={{ height: 'calc(100vh - 300px)', display: 'flex', flexDirection: 'column' }} bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#f5f5f5', borderRadius: 8, marginBottom: 16 }}>
              {messages.map((msg) => {
                const isOwn = msg.user_id === user?.id;
                return (
                  <div key={msg.id} className={`chat-message ${isOwn ? 'own' : 'other'}`} style={{ marginBottom: 16 }}>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: isOwn ? 'row-reverse' : 'row', 
                      alignItems: 'flex-start', 
                      gap: 8,
                      justifyContent: isOwn ? 'flex-start' : 'flex-start'
                    }}>
                      <Avatar src={msg.profile_photo} icon={<UserOutlined />} size={32} />
                      <div style={{ textAlign: isOwn ? 'right' : 'left' }}>
                        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
                          {msg.full_name} • {new Date(msg.created_at).toLocaleTimeString()}
                        </div>
                        <div className={`message-bubble ${isOwn ? 'own' : 'other'}`} style={{ 
                          padding: '8px 12px', 
                          borderRadius: 8, 
                          background: isOwn ? '#1890ff' : '#fff', 
                          color: isOwn ? '#fff' : '#333',
                          textAlign: 'left',
                          display: 'inline-block'
                        }}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <TextArea value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type a message..." autoSize={{ minRows: 1, maxRows: 4 }} />
              <Button type="primary" icon={<SendOutlined />} onClick={handleSendMessage}>Send</Button>
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
                <Card title={status.replace('_', ' ').toUpperCase()} headStyle={{ background: statusColors[status], color: '#fff' }} style={{ minHeight: 400 }}>
                  {tasks.filter((task) => task.status === status).map((task) => (
                    <Card key={task.id} size="small" style={{ marginBottom: 12, cursor: 'pointer' }} onClick={() => openTaskDetail(task)}
                      actions={[
                        <Dropdown menu={{ items: ['todo', 'in_progress', 'review', 'done'].filter((s) => s !== task.status).map((s) => ({ key: s, label: `Move to ${s.replace('_', ' ')}`, onClick: (e) => { e.domEvent.stopPropagation(); handleStatusChange(task, s); } })) }} trigger={['click']}>
                          <MoreOutlined key="more" onClick={(e) => e.stopPropagation()} />
                        </Dropdown>,
                        <Popconfirm key="delete" title="Delete this task?" onConfirm={(e) => { e?.stopPropagation(); handleDeleteTask(task.id); }} okText="Delete" cancelText="Cancel">
                          <DeleteOutlined onClick={(e) => e.stopPropagation()} style={{ color: '#ff4d4f' }} />
                        </Popconfirm>,
                      ]}>
                      <div style={{ fontWeight: 500 }}>{task.title}</div>
                      <Tag color={priorityColors[task.priority]} style={{ marginTop: 8 }}>{task.priority}</Tag>
                      {task.assigned_name && <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}><UserOutlined /> {task.assigned_name}</div>}
                    </Card>
                  ))}
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>

        <TabPane tab="Notes" key="notes">
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateNote}>Create Note</Button>
          </div>
          <Row gutter={[16, 16]}>
            {notes.map((note) => (
              <Col xs={24} sm={12} lg={8} key={note.id}>
                <Card title={note.title} extra={<FileTextOutlined />} hoverable onClick={() => openNoteEditor(note)}
                  actions={[
                    <Popconfirm key="delete" title="Delete this note?" onConfirm={() => handleDeleteNote(note.id)} okText="Delete" cancelText="Cancel">
                      <DeleteOutlined onClick={(e) => e.stopPropagation()} style={{ color: '#ff4d4f' }} />
                    </Popconfirm>,
                  ]}>
                  <p style={{ color: '#666' }}>{note.content ? 'Block note' : 'No content'}...</p>
                  <div style={{ fontSize: 12, color: '#999' }}>Last edited: {new Date(note.updated_at).toLocaleDateString()}</div>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>

        <TabPane tab="Members" key="members">
          <List dataSource={currentMembers} renderItem={(member) => (
            <List.Item>
              <List.Item.Meta avatar={<Avatar src={member.profile_photo} icon={<UserOutlined />} />} title={member.full_name} description={<Tag color={member.role === 'owner' ? 'gold' : 'blue'}>{member.role}</Tag>} />
            </List.Item>
          )} />
        </TabPane>

        {isWorkspaceAdmin && (
          <TabPane tab="Admin Panel" key="admin">
            <WorkspaceAdminPanel 
              roomId={roomId} 
              currentUserId={user?.id}
              onRefreshMembers={() => dispatch(getRoomById(roomId))}
              onRefreshMessages={() => dispatch(getMessages(roomId))}
              onRefreshFiles={() => dispatch(getFiles(roomId))}
              messages={messages}
              files={files}
            />
          </TabPane>
        )}


        <TabPane tab="Files" key="files">
          <Card 
            title="Shared Files" 
            extra={
              <Space size="middle" align="center" style={{ flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 13, color: '#666' }}>Upload Permission for Next File:</Text>
                <Radio.Group 
                  value={uploadPermission} 
                  onChange={(e) => setUploadPermission(e.target.value)}
                  size="small"
                  buttonStyle="solid"
                >
                  <Radio.Button value="view"><LockOutlined /> View Only</Radio.Button>
                  <Radio.Button value="download"><UnlockOutlined /> Downloadable</Radio.Button>
                </Radio.Group>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleUploadFile} 
                  style={{ display: 'none' }} 
                  accept=".pdf,.docx" 
                />
                <Button 
                  type="primary" 
                  icon={<UploadOutlined />} 
                  loading={uploading} 
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload File (.pdf, .docx, max 8MB)
                </Button>
              </Space>
            }
          >
            <List
              loading={uploading}
              itemLayout="horizontal"
              dataSource={files}
              renderItem={(file) => {
                const isPdf = file.file_type && file.file_type.includes('pdf');
                const isDocx = file.file_type && (file.file_type.includes('word') || file.file_type.includes('officedocument') || file.file_name.endsWith('.docx'));
                const fileIcon = isPdf ? (
                  <FilePdfOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />
                ) : isDocx ? (
                  <FileWordOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                ) : (
                  <FileOutlined style={{ fontSize: 32, color: '#8c8c8c' }} />
                );

                const sizeMB = (file.file_size / (1024 * 1024)).toFixed(2);
                const isUploader = file.uploaded_by === user?.id;
                const isRoomOwnerOrAdmin = currentMembers?.some(m => m.user_id === user?.id && (m.role === 'owner' || m.role === 'admin'));
                const canManageFile = isUploader || isRoomOwnerOrAdmin;
                const canDownload = file.sharing_permission === 'download' || canManageFile;

                return (
                  <List.Item
                    actions={[
                      <Button 
                        type="text" 
                        icon={<EyeOutlined />} 
                        onClick={() => handleViewFile(file)}
                      >
                        View
                      </Button>,
                      <Button 
                        type="text" 
                        icon={<DownloadOutlined />} 
                        disabled={!canDownload}
                        onClick={() => handleDownloadFile(file)}
                      >
                        Download
                      </Button>,
                      canManageFile ? (
                        <Select
                          value={file.sharing_permission}
                          onChange={(val) => handleTogglePermission(file, val)}
                          size="small"
                          style={{ width: 120 }}
                        >
                          <Option value="view">View Only</Option>
                          <Option value="download">Downloadable</Option>
                        </Select>
                      ) : (
                        file.sharing_permission === 'view' ? (
                          <Tag color="orange" icon={<LockOutlined />}>View Only</Tag>
                        ) : (
                          <Tag color="green" icon={<UnlockOutlined />}>Downloadable</Tag>
                        )
                      ),
                      canManageFile && (
                        <Popconfirm
                          title="Delete this file?"
                          onConfirm={() => handleDeleteFile(file.id)}
                          okText="Delete"
                          cancelText="Cancel"
                        >
                          <Button type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      )
                    ].filter(Boolean)}
                  >
                    <List.Item.Meta
                      avatar={fileIcon}
                      title={
                        <Space>
                          <span style={{ fontWeight: 600 }}>{file.file_name}</span>
                          <span style={{ color: '#bfbfbf', fontSize: 12 }}>({sizeMB} MB)</span>
                        </Space>
                      }
                      description={
                        <Space size="middle" style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                          <span>Shared by: {file.uploader_name}</span>
                          <span>Uploaded: {new Date(file.created_at).toLocaleDateString()} at {new Date(file.created_at).toLocaleTimeString()}</span>
                        </Space>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Pomodoro" key="pomodoro">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card>
                <div className="text-center py-6">
                  <Title level={3} className="font-extrabold text-slate-800 tracking-tight">{pomodoroType === 'work' ? 'Study Timer' : 'Break Timer'}</Title>
                  <div className={`text-6xl font-extrabold my-8 font-mono tracking-wider transition-colors duration-300 ${
                    timerRunning ? 'text-indigo-600 animate-pulse-subtle' : timerActive ? 'text-amber-500' : 'text-slate-700'
                  }`}>{formatTime(timerSeconds)}</div>
                  <Space size="large" className="mb-6">
                    <Select value={pomodoroDuration} onChange={v => { setPomodoroDuration(v); if (!timerActive) setTimerSeconds(v * 60); }} style={{ width: 100 }} disabled={timerActive}>
                      {[5, 10, 15, 20, 25, 30, 45, 60].map(m => <Option key={m} value={m}>{m} min</Option>)}
                    </Select>
                    <Select value={pomodoroType} onChange={v => setPomodoroType(v)} style={{ width: 100 }} disabled={timerActive}>
                      <Option value="work">Work</Option>
                      <Option value="break">Break</Option>
                    </Select>
                  </Space>
                  <div>
                    {!timerActive ? (
                      <Button 
                        type="primary" 
                        size="large" 
                        icon={<PlayCircleOutlined />} 
                        onClick={handleStartPomodoro}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-md active:scale-95 h-11 px-8 transition-all duration-200"
                      >
                        Start Session
                      </Button>
                    ) : (
                      <Space>
                        {timerRunning ? (
                          <Button 
                            icon={<PauseCircleOutlined />} 
                            size="large" 
                            onClick={handlePauseResume}
                            className="border-slate-200 hover:border-slate-300 hover:text-slate-800 rounded-lg h-11 px-6 transition-all duration-200"
                          >
                            Pause
                          </Button>
                        ) : (
                          <Button 
                            type="primary" 
                            icon={<PlayCircleOutlined />} 
                            size="large" 
                            onClick={handlePauseResume}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-md h-11 px-6 transition-all duration-200"
                          >
                            Resume
                          </Button>
                        )}
                        <Button 
                          danger 
                          icon={<StopOutlined />} 
                          size="large" 
                          onClick={handleEndPomodoro}
                          className="h-11 px-6 rounded-lg font-semibold shadow-sm hover:shadow active:scale-95 transition-all duration-200"
                        >
                          End
                        </Button>
                      </Space>
                    )}
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Session History">
                {sessions.slice(0, 20).map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <Space><Avatar src={s.profile_photo} icon={<UserOutlined />} size={24} /><Text>{s.full_name}</Text></Space>
                    <Text type="secondary">{s.duration_minutes}min {s.session_type} {s.completed ? '✓' : '...'}</Text>
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      <Modal title="Create Task" open={isCreateTaskOpen} onCancel={() => { setIsCreateTaskOpen(false); taskForm.resetFields(); }} footer={null}>
        <Form form={taskForm} onFinish={handleCreateTask} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please enter task title' }]}><Input placeholder="Task title" /></Form.Item>
          <Form.Item name="description" label="Description"><TextArea rows={3} placeholder="Task description" /></Form.Item>
          <Form.Item name="priority" label="Priority" initialValue="medium"><Select>{['low', 'medium', 'high', 'urgent'].map(p => <Option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</Option>)}</Select></Form.Item>
          <Form.Item name="assigned_to" label="Assign To"><Select placeholder="Select member" allowClear>{currentMembers.map(m => <Option key={m.user_id} value={m.user_id}>{m.full_name}</Option>)}</Select></Form.Item>
          <Form.Item name="due_date" label="Due Date"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" block>Create Task</Button></Form.Item>
        </Form>
      </Modal>

      <Drawer title={<Space><span>Task Details</span>{selectedTask && <Tag color={priorityColors[selectedTask.priority]}>{selectedTask.priority}</Tag>}</Space>} open={isDetailDrawerOpen} onClose={() => { setIsDetailDrawerOpen(false); setSelectedTask(null); }} width={400}
        footer={selectedTask && <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteTask(selectedTask.id)}>Delete</Button>}>
        {selectedTask && (
          <Form form={editTaskForm} onFinish={handleUpdateTask} layout="vertical">
            <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="description" label="Description"><TextArea rows={3} /></Form.Item>
            <Form.Item name="status" label="Status"><Select>{['todo', 'in_progress', 'review', 'done'].map(s => <Option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Option>)}</Select></Form.Item>
            <Form.Item name="priority" label="Priority"><Select>{['low', 'medium', 'high', 'urgent'].map(p => <Option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</Option>)}</Select></Form.Item>
            <Form.Item name="assigned_to" label="Assign To"><Select placeholder="Select member" allowClear>{currentMembers.map(m => <Option key={m.user_id} value={m.user_id}>{m.full_name}</Option>)}</Select></Form.Item>
            <Form.Item name="due_date" label="Due Date"><DatePicker style={{ width: '100%' }} /></Form.Item>
            <Form.Item><Button type="primary" htmlType="submit" block>Save Changes</Button></Form.Item>
          </Form>
        )}
      </Drawer>

      <Modal title="Create Note" open={isCreateNoteOpen} onCancel={() => setIsCreateNoteOpen(false)} onOk={handleSubmitNote} okText="Create">
        <Form layout="vertical">
          <Form.Item label="Title" required><Input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="Note title" /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Note Editor" open={isNoteEditorOpen} onCancel={() => { setIsNoteEditorOpen(false); setEditingNote(null); }} width={900} footer={[
        <Button key="cancel" onClick={() => { setIsNoteEditorOpen(false); setEditingNote(null); }}>Cancel</Button>,
        <Button key="delete" danger onClick={() => { if (editingNote) handleDeleteNote(editingNote.id); setIsNoteEditorOpen(false); setEditingNote(null); }}>Delete</Button>,
        <Button key="save" type="primary" onClick={handleSaveNote}>Save</Button>,
      ]}>
        {editingNote && <NoteBlockEditor key={noteKey} ref={noteEditorRef} content={editingNote.content} title={noteTitle} onTitleChange={setNoteTitle} />}
      </Modal>

      {/* File Preview Modal */}
      <Modal
        title={`File Preview: ${previewFile ? previewFile.file_name : ''}`}
        open={isPreviewOpen}
        onCancel={() => {
          setIsPreviewOpen(false);
          if (previewUrl) {
            window.URL.revokeObjectURL(previewUrl);
          }
          setPreviewUrl(null);
          setPreviewFile(null);
        }}
        width={1000}
        footer={[
          <Button key="close" onClick={() => {
            setIsPreviewOpen(false);
            if (previewUrl) window.URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            setPreviewFile(null);
          }}>
            Close
          </Button>
        ]}
      >
        {previewFile && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 600 }}>
            {previewFile.file_type && previewFile.file_type.includes('pdf') ? (
              <iframe
                src={previewUrl}
                title={previewFile.file_name}
                style={{ width: '100%', height: '700px', border: 'none', borderRadius: 8 }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 80, background: '#f5f5f5', borderRadius: 8, width: '100%' }}>
                <FileWordOutlined style={{ fontSize: 80, color: '#1890ff', marginBottom: 20 }} />
                <h3>DOCX Preview Supported</h3>
                <p style={{ color: '#666', maxWidth: 450, margin: '0 auto 20px auto' }}>
                  This DOCX document ({previewFile.file_name}) is shared as <strong>{previewFile.sharing_permission === 'view' ? 'View Only' : 'Downloadable'}</strong>.
                </p>
                {previewFile.sharing_permission === 'view' ? (
                  <Tag color="orange" icon={<LockOutlined />} style={{ padding: '8px 16px', fontSize: 14 }}>
                    Downloading is restricted. View permission granted.
                  </Tag>
                ) : (
                  <Button type="primary" icon={<DownloadOutlined />} onClick={() => handleDownloadFile(previewFile)}>
                    Download Document
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RoomDetail;