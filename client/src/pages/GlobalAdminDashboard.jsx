import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Drawer, Row, Col, Statistic, Select, Popconfirm, List, Typography, Space, message, Divider } from 'antd';
import { TeamOutlined, ProfileOutlined, FileTextOutlined, FileOutlined, MessageOutlined, DeleteOutlined, UserOutlined, CrownOutlined, SafetyCertificateOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { Text, Title } = Typography;

const GlobalAdminDashboard = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected Workspace detail inspection
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/workspaces');
      if (res.data.success) {
        setWorkspaces(res.data.data.workspaces);
      }
    } catch (err) {
      console.error(err);
      message.error('Failed to fetch workspaces directory');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaceDetails = async (roomId) => {
    try {
      setLoadingDetails(true);
      const res = await api.get(`/admin/workspaces/${roomId}`);
      if (res.data.success) {
        setSelectedDetails(res.data.data);
      }
    } catch (err) {
      console.error(err);
      message.error('Failed to load workspace details');
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleInspect = (roomId) => {
    setSelectedRoomId(roomId);
    setSelectedDetails(null);
    setDrawerVisible(true);
    fetchWorkspaceDetails(roomId);
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      const res = await api.put(`/admin/workspaces/${selectedRoomId}/members/${targetUserId}/role`, { role: newRole });
      if (res.data.success) {
        message.success('Member role updated successfully');
        fetchWorkspaceDetails(selectedRoomId);
        fetchWorkspaces();
      }
    } catch (err) {
      message.error('Failed to update member role');
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    try {
      const res = await api.delete(`/admin/workspaces/${selectedRoomId}/members/${targetUserId}`);
      if (res.data.success) {
        message.success('Member removed from workspace');
        fetchWorkspaceDetails(selectedRoomId);
        fetchWorkspaces();
      }
    } catch (err) {
      message.error('Failed to remove member');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const res = await api.delete(`/admin/messages/${messageId}`);
      if (res.data.success) {
        message.success('Message deleted successfully');
        fetchWorkspaceDetails(selectedRoomId);
      }
    } catch (err) {
      message.error('Failed to delete message');
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      const res = await api.delete(`/admin/files/${fileId}`);
      if (res.data.success) {
        message.success('File deleted successfully');
        fetchWorkspaceDetails(selectedRoomId);
      }
    } catch (err) {
      message.error('Failed to delete file');
    }
  };

  const renderRoleTag = (role) => {
    switch (role) {
      case 'owner':
        return <Tag color="gold" icon={<CrownOutlined />}>Owner</Tag>;
      case 'admin':
        return <Tag color="blue" icon={<SafetyCertificateOutlined />}>Admin</Tag>;
      default:
        return <Tag color="gray" icon={<UserOutlined />}>Member</Tag>;
    }
  };

  const workspacesColumns = [
    {
      title: 'Workspace Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text style={{ fontWeight: 600 }}>{text}</Text>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Creator',
      dataIndex: 'creator_name',
      key: 'creator_name',
    },
    {
      title: 'Members Count',
      dataIndex: 'member_count',
      key: 'member_count',
      sorter: (a, b) => a.member_count - b.member_count,
    },
    {
      title: 'Type',
      dataIndex: 'is_private',
      key: 'is_private',
      render: (is_private) => (
        <Tag color={is_private ? 'red' : 'green'}>{is_private ? 'Private' : 'Public'}</Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => handleInspect(record.id)}>
          Inspect
        </Button>
      )
    }
  ];

  const memberColumns = [
    {
      title: 'Name',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role, record) => (
        <Select
          value={role}
          onChange={(value) => handleRoleChange(record.user_id, value)}
          style={{ width: 110 }}
          size="small"
        >
          <Select.Option value="member">Member</Select.Option>
          <Select.Option value="admin">Admin</Select.Option>
          <Select.Option value="owner">Owner</Select.Option>
        </Select>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Popconfirm
          title="Remove member from workspace?"
          onConfirm={() => handleRemoveMember(record.user_id)}
          okText="Remove"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <Button type="link" danger size="small">Remove</Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginBottom: 24 }}>Global Workspaces Directory (Platform Admin)</Title>
      
      <Card bordered={false} className="shadow-sm">
        <Table
          dataSource={workspaces}
          columns={workspacesColumns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Workspace Inspector Drawer */}
      <Drawer
        title={`Workspace Inspector: ${selectedDetails?.workspace?.name || 'Loading...'}`}
        width={750}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        destroyOnClose
      >
        {selectedDetails ? (
          <div className="space-y-6">
            {/* Stats Overview */}
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card size="small" bordered={false} className="bg-slate-50">
                  <Statistic title="Members" value={selectedDetails.stats.totalMembers} prefix={<TeamOutlined style={{ color: '#1890ff' }} />} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" bordered={false} className="bg-slate-50">
                  <Statistic title="Tasks" value={selectedDetails.stats.totalTasks} prefix={<ProfileOutlined style={{ color: '#52c41a' }} />} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" bordered={false} className="bg-slate-50">
                  <Statistic title="Notes" value={selectedDetails.stats.totalNotes} prefix={<FileTextOutlined style={{ color: '#faad14' }} />} />
                </Card>
              </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Card size="small" bordered={false} className="bg-slate-50">
                  <Statistic title="Shared Files" value={selectedDetails.stats.totalFiles} prefix={<FileOutlined style={{ color: '#ff4d4f' }} />} />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" bordered={false} className="bg-slate-50">
                  <Statistic title="Messages" value={selectedDetails.stats.totalMessages} prefix={<MessageOutlined style={{ color: '#722ed1' }} />} />
                </Card>
              </Col>
            </Row>

            <Divider />

            {/* Member list */}
            <Title level={5}>Workspace Members Management</Title>
            <Table
              dataSource={selectedDetails.members}
              columns={memberColumns}
              rowKey="user_id"
              size="small"
              pagination={{ pageSize: 5 }}
            />

            <Divider />

            {/* Moderation Controls */}
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Title level={5}>Messages Moderation</Title>
                <div style={{ maxHeight: 250, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 4, padding: 8 }}>
                  <List
                    dataSource={selectedDetails.messages}
                    renderItem={(msg) => (
                      <List.Item
                        actions={[
                          <Popconfirm
                            title="Delete message?"
                            onConfirm={() => handleDeleteMessage(msg.id)}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                          >
                            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                          </Popconfirm>
                        ]}
                      >
                        <List.Item.Meta
                          title={<Text style={{ fontWeight: 600, fontSize: 12 }}>{msg.full_name}</Text>}
                          description={<span style={{ fontSize: 12 }}>{msg.content}</span>}
                        />
                      </List.Item>
                    )}
                  />
                </div>
              </Col>
              <Col span={12}>
                <Title level={5}>Shared Files Moderation</Title>
                <div style={{ maxHeight: 250, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 4, padding: 8 }}>
                  <List
                    dataSource={selectedDetails.files}
                    renderItem={(file) => (
                      <List.Item
                        actions={[
                          <Popconfirm
                            title="Delete file?"
                            onConfirm={() => handleDeleteFile(file.id)}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                          >
                            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                          </Popconfirm>
                        ]}
                      >
                        <List.Item.Meta
                          title={<Text style={{ fontWeight: 600, fontSize: 12 }}>{file.file_name}</Text>}
                        />
                      </List.Item>
                    )}
                  />
                </div>
              </Col>
            </Row>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>Loading details...</div>
        )}
      </Drawer>
    </div>
  );
};

export default GlobalAdminDashboard;
